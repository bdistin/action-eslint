import { join } from 'path';
import { ChecksUpdateParamsOutputAnnotations, ChecksCreateParams } from '@octokit/rest';
import { GitHub, context } from '@actions/github';
import { getInput, setFailed, debug } from '@actions/core';

const { GITHUB_TOKEN, GITHUB_SHA, GITHUB_WORKSPACE, GITHUB_ACTION } = process.env;

async function lint() {
	const { CLIEngine } = await import(join(process.cwd(), 'node_modules/eslint')) as typeof import('eslint');
	const cli = new CLIEngine({
		extensions: ['.ts', '.js'],
		ignorePath: '.gitignore'
	});
	const report = cli.executeOnFiles(['src']);
	const { results, errorCount, warningCount } = report;
	const levels: ChecksUpdateParamsOutputAnnotations['annotation_level'][] = ['notice', 'warning', 'failure'];
	const annotations: ChecksUpdateParamsOutputAnnotations[] = [];
	for (const res of results) {
		const { filePath, messages } = res;
		const path = filePath.substring(GITHUB_WORKSPACE!.length + 1);
		for (const msg of messages) {
			const { line, endLine, column, endColumn, severity, ruleId, message } = msg;
			const annotationLevel = levels[severity];
			const annotation = {
				path,
				start_line: line,
				end_line: endLine || line,
				start_column: column,
				end_column: endColumn || column,
				annotation_level: annotationLevel,
				title: ruleId || 'ESLint',
				message
			};
			annotations.push(annotation);
			console.log(annotation);
		}
	}

	return {
		conclusion: errorCount > 0 ? 'failure' : 'success' as ChecksCreateParams['conclusion'],
		output: {
			title: GITHUB_ACTION,
			summary: `${errorCount} error(s), ${warningCount} warning(s) found`,
			annotations
		}
	};
}

async function run() {
	const octokit = new GitHub(GITHUB_TOKEN!);
	let id;
	const jobName = getInput('job-name');
	if (jobName) {
		const checks = await octokit.checks.listForRef({
			...context.repo,
			status: 'in_progress',
			ref: GITHUB_SHA!
		});
		const check = checks.data.check_runs.find(({ name }) => name === jobName);
		if (check) id = check.id;
	}
	if (!id) {
		id = (await octokit.checks.create({
			...context.repo,
			name: GITHUB_ACTION!,
			head_sha: GITHUB_SHA!,
			status: 'in_progress',
			started_at: new Date().toISOString()
		})).data.id;
	}

	try {
		const { conclusion, output } = await lint();
		await octokit.checks.update({
			...context.repo,
			check_run_id: id,
			completed_at: new Date().toISOString(),
			conclusion,
			output
		});
		debug(output.summary);
		if (conclusion === 'failure') setFailed('ESLint found some errors');
	} catch (error) {
		await octokit.checks.update({
			...context.repo,
			check_run_id: id,
			conclusion: 'failure',
			completed_at: new Date().toISOString()
		});
		setFailed(error.message);
	}
}

run();
