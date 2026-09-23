const {spawnSync} = require('node:child_process');

const waitForFile = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const runWithRetry = async (command, args, {spawn = spawnSync, wait = waitForFile} = {}) => {
    for (let attempt = 1; attempt <= 4; attempt++) {
        const result = spawn(command, args, {stdio: 'inherit'});
        if (result.error) throw result.error;
        if (result.status === 0) return;
        if (attempt === 4) throw new Error(`${command} exited with code ${result.status}`);
        console.warn(
            `${command} exited with code ${result.status}; retrying after file access settles (${attempt}/3).`
        );
        await wait(attempt * 1000);
    }
};

module.exports = {runWithRetry};
