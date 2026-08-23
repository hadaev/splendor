const { spawn } = require('child_process');

const processes = [
    spawn(process.execPath, ['index.js'], { stdio: 'inherit' }),
    spawn(process.execPath, ['wsServer.js'], { stdio: 'inherit' })
];

function stopChildren() {
    processes.forEach((child) => {
        if (!child.killed) child.kill();
    });
}

process.on('SIGINT', stopChildren);
process.on('SIGTERM', stopChildren);

processes.forEach((child) => {
    child.on('exit', (code) => {
        if (code && !process.exitCode) {
            process.exitCode = code;
            stopChildren();
        }
    });
});
