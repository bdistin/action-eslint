"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const github_1 = require("@actions/github");
const core_1 = require("@actions/core");
const { GITHUB_TOKEN, GITHUB_SHA, GITHUB_WORKSPACE, GITHUB_ACTION } = process.env;
async function lint() {
    const { CLIEngine } = await Promise.resolve().then(() => require(path_1.join(process.cwd(), 'node_modules/eslint')));
    const cli = new CLIEngine({
        extensions: ['.ts', '.js'],
        ignorePath: '.gitignore'
    });
    const report = cli.executeOnFiles(['src']);
    const { results, errorCount, warningCount } = report;
    const levels = ['notice', 'warning', 'failure'];
    const annotations = [];
    for (const res of results) {
        const { filePath, messages } = res;
        const path = filePath.substring(GITHUB_WORKSPACE.length + 1);
        for (const msg of messages) {
            const { line, endLine, column, endColumn, severity, ruleId, message } = msg;
            const annotationLevel = levels[severity];
            annotations.push({
                path,
                start_line: line,
                end_line: endLine || line,
                start_column: column,
                end_column: endColumn || column,
                annotation_level: annotationLevel,
                title: ruleId || 'ESLint',
                message
            });
        }
    }
    return {
        conclusion: errorCount > 0 ? 'failure' : 'success',
        output: {
            title: GITHUB_ACTION,
            summary: `${errorCount} error(s), ${warningCount} warning(s) found`,
            annotations
        }
    };
}
async function run() {
    const octokit = new github_1.GitHub(GITHUB_TOKEN);
    let id;
    const jobName = core_1.getInput('job-name');
    if (jobName) {
        const checks = await octokit.checks.listForRef({
            ...github_1.context.repo,
            status: 'in_progress',
            ref: GITHUB_SHA
        });
        const check = checks.data.check_runs.find(({ name }) => name === jobName);
        if (check)
            id = check.id;
    }
    if (!id) {
        id = (await octokit.checks.create({
            ...github_1.context.repo,
            name: GITHUB_ACTION,
            head_sha: GITHUB_SHA,
            status: 'in_progress',
            started_at: new Date().toISOString()
        })).data.id;
    }
    try {
        const { conclusion, output } = await lint();
        await octokit.checks.update({
            ...github_1.context.repo,
            check_run_id: id,
            completed_at: new Date().toISOString(),
            conclusion,
            output
        });
        core_1.debug(output.summary);
        if (conclusion === 'failure')
            core_1.setFailed('ESLint found some errors');
    }
    catch (error) {
        await octokit.checks.update({
            ...github_1.context.repo,
            check_run_id: id,
            conclusion: 'failure',
            completed_at: new Date().toISOString()
        });
        core_1.setFailed(error.message);
    }
}
run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiJzcmMvIiwic291cmNlcyI6WyJtYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQTRCO0FBRTVCLDRDQUFrRDtBQUNsRCx3Q0FBMkQ7QUFFM0QsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUVsRixLQUFLLFVBQVUsSUFBSTtJQUNsQixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsMkNBQWEsV0FBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxFQUE0QixDQUFDO0lBQzFHLE1BQU0sR0FBRyxHQUFHLElBQUksU0FBUyxDQUFDO1FBQ3pCLFVBQVUsRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7UUFDMUIsVUFBVSxFQUFFLFlBQVk7S0FDeEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDM0MsTUFBTSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEdBQUcsTUFBTSxDQUFDO0lBQ3JELE1BQU0sTUFBTSxHQUE4RCxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDM0csTUFBTSxXQUFXLEdBQTBDLEVBQUUsQ0FBQztJQUM5RCxLQUFLLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRTtRQUMxQixNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQztRQUNuQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLGdCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM5RCxLQUFLLE1BQU0sR0FBRyxJQUFJLFFBQVEsRUFBRTtZQUMzQixNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8s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QUFFO1NBQ3RDLENBQUMsQ0FBQztRQUNILGdCQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3pCO0FBQ0YsQ0FBQztBQUVELEdBQUcsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQ2hlY2tzVXBkYXRlUGFyYW1zT3V0cHV0QW5ub3RhdGlvbnMsIENoZWNrc0NyZWF0ZVBhcmFtcyB9IGZyb20gJ0BvY3Rva2l0L3Jlc3QnO1xuaW1wb3J0IHsgR2l0SHViLCBjb250ZXh0IH0gZnJvbSAnQGFjdGlvbnMvZ2l0aHViJztcbmltcG9ydCB7IGdldElucHV0LCBzZXRGYWlsZWQsIGRlYnVnIH0gZnJvbSAnQGFjdGlvbnMvY29yZSc7XG5cbmNvbnN0IHsgR0lUSFVCX1RPS0VOLCBHSVRIVUJfU0hBLCBHSVRIVUJfV09SS1NQQUNFLCBHSVRIVUJfQUNUSU9OIH0gPSBwcm9jZXNzLmVudjtcblxuYXN5bmMgZnVuY3Rpb24gbGludCgpIHtcblx0Y29uc3QgeyBDTElFbmdpbmUgfSA9IGF3YWl0IGltcG9ydChqb2luKHByb2Nlc3MuY3dkKCksICdub2RlX21vZHVsZXMvZXNsaW50JykpIGFzIHR5cGVvZiBpbXBvcnQoJ2VzbGludCcpO1xuXHRjb25zdCBjbGkgPSBuZXcgQ0xJRW5naW5lKHtcblx0XHRleHRlbnNpb25zOiBbJy50cycsICcuanMnXSxcblx0XHRpZ25vcmVQYXRoOiAnLmdpdGlnbm9yZSdcblx0fSk7XG5cdGNvbnN0IHJlcG9ydCA9IGNsaS5leGVjdXRlT25GaWxlcyhbJ3NyYyddKTtcblx0Y29uc3QgeyByZXN1bHRzLCBlcnJvckNvdW50LCB3YXJuaW5nQ291bnQgfSA9IHJlcG9ydDtcblx0Y29uc3QgbGV2ZWxzOiBDaGVja3NVcGRhdGVQYXJhbXNPdXRwdXRBbm5vdGF0aW9uc1snYW5ub3RhdGlvbl9sZXZlbCddW10gPSBbJ25vdGljZScsICd3YXJuaW5nJywgJ2ZhaWx1cmUnXTtcblx0Y29uc3QgYW5ub3RhdGlvbnM6IENoZWNrc1VwZGF0ZVBhcmFtc091dHB1dEFubm90YXRpb25zW10gPSBbXTtcblx0Zm9yIChjb25zdCByZXMgb2YgcmVzdWx0cykge1xuXHRcdGNvbnN0IHsgZmlsZVBhdGgsIG1lc3NhZ2VzIH0gPSByZXM7XG5cdFx0Y29uc3QgcGF0aCA9IGZpbGVQYXRoLnN1YnN0cmluZyhHSVRIVUJfV09SS1NQQUNFIS5sZW5ndGggKyAxKTtcblx0XHRmb3IgKGNvbnN0IG1zZyBvZiBtZXNzYWdlcykge1xuXHRcdFx0Y29uc3QgeyBsaW5lLCBlbmRMaW5lLCBjb2x1bW4sIGVuZENvbHVtbiwgc2V2ZXJpdHksIHJ1bGVJZCwgbWVzc2FnZSB9ID0gbXNnO1xuXHRcdFx0Y29uc3QgYW5ub3RhdGlvbkxldmVsID0gbGV2ZWxzW3NldmVyaXR5XTtcblx0XHRcdGFubm90YXRpb25zLnB1c2goe1xuXHRcdFx0XHRwYXRoLFxuXHRcdFx0XHRzdGFydF9saW5lOiBsaW5lLFxuXHRcdFx0XHRlbmRfbGluZTogZW5kTGluZSB8fCBsaW5lLFxuXHRcdFx0XHRzdGFydF9jb2x1bW46IGNvbHVtbixcblx0XHRcdFx0ZW5kX2NvbHVtbjogZW5kQ29sdW1uIHx8IGNvbHVtbixcblx0XHRcdFx0YW5ub3RhdGlvbl9sZXZlbDogYW5ub3RhdGlvbkxldmVsLFxuXHRcdFx0XHR0aXRsZTogcnVsZUlkIHx8ICdFU0xpbnQnLFxuXHRcdFx0XHRtZXNzYWdlXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGNvbmNsdXNpb246IGVycm9yQ291bnQgPiAwID8gJ2ZhaWx1cmUnIDogJ3N1Y2Nlc3MnIGFzIENoZWNrc0NyZWF0ZVBhcmFtc1snY29uY2x1c2lvbiddLFxuXHRcdG91dHB1dDoge1xuXHRcdFx0dGl0bGU6IEdJVEhVQl9BQ1RJT04sXG5cdFx0XHRzdW1tYXJ5OiBgJHtlcnJvckNvdW50fSBlcnJvcihzKSwgJHt3YXJuaW5nQ291bnR9IHdhcm5pbmcocykgZm91bmRgLFxuXHRcdFx0YW5ub3RhdGlvbnNcblx0XHR9XG5cdH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bigpIHtcblx0Y29uc3Qgb2N0b2tpdCA9IG5ldyBHaXRIdWIoR0lUSFVCX1RPS0VOISk7XG5cdGxldCBpZDtcblx0Y29uc3Qgam9iTmFtZSA9IGdldElucHV0KCdqb2ItbmFtZScpO1xuXHRpZiAoam9iTmFtZSkge1xuXHRcdGNvbnN0IGNoZWNrcyA9IGF3YWl0IG9jdG9raXQuY2hlY2tzLmxpc3RGb3JSZWYoe1xuXHRcdFx0Li4uY29udGV4dC5yZXBvLFxuXHRcdFx0c3RhdHVzOiAnaW5fcHJvZ3Jlc3MnLFxuXHRcdFx0cmVmOiBHSVRIVUJfU0hBIVxuXHRcdH0pO1xuXHRcdGNvbnN0IGNoZWNrID0gY2hlY2tzLmRhdGEuY2hlY2tfcnVucy5maW5kKCh7IG5hbWUgfSkgPT4gbmFtZSA9PT0gam9iTmFtZSk7XG5cdFx0aWYgKGNoZWNrKSBpZCA9IGNoZWNrLmlkO1xuXHR9XG5cdGlmICghaWQpIHtcblx0XHRpZCA9IChhd2FpdCBvY3Rva2l0LmNoZWNrcy5jcmVhdGUoe1xuXHRcdFx0Li4uY29udGV4dC5yZXBvLFxuXHRcdFx0bmFtZTogR0lUSFVCX0FDVElPTiEsXG5cdFx0XHRoZWFkX3NoYTogR0lUSFVCX1NIQSEsXG5cdFx0XHRzdGF0dXM6ICdpbl9wcm9ncmVzcycsXG5cdFx0XHRzdGFydGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcblx0XHR9KSkuZGF0YS5pZDtcblx0fVxuXG5cdHRyeSB7XG5cdFx0Y29uc3QgeyBjb25jbHVzaW9uLCBvdXRwdXQgfSA9IGF3YWl0IGxpbnQoKTtcblx0XHRhd2FpdCBvY3Rva2l0LmNoZWNrcy51cGRhdGUoe1xuXHRcdFx0Li4uY29udGV4dC5yZXBvLFxuXHRcdFx0Y2hlY2tfcnVuX2lkOiBpZCxcblx0XHRcdGNvbXBsZXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuXHRcdFx0Y29uY2x1c2lvbixcblx0XHRcdG91dHB1dFxuXHRcdH0pO1xuXHRcdGRlYnVnKG91dHB1dC5zdW1tYXJ5KTtcblx0XHRpZiAoY29uY2x1c2lvbiA9PT0gJ2ZhaWx1cmUnKSBzZXRGYWlsZWQoJ0VTTGludCBmb3VuZCBzb21lIGVycm9ycycpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGF3YWl0IG9jdG9raXQuY2hlY2tzLnVwZGF0ZSh7XG5cdFx0XHQuLi5jb250ZXh0LnJlcG8sXG5cdFx0XHRjaGVja19ydW5faWQ6IGlkLFxuXHRcdFx0Y29uY2x1c2lvbjogJ2ZhaWx1cmUnLFxuXHRcdFx0Y29tcGxldGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcblx0XHR9KTtcblx0XHRzZXRGYWlsZWQoZXJyb3IubWVzc2FnZSk7XG5cdH1cbn1cblxucnVuKCk7XG4iXX0=