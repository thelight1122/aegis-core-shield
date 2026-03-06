const http = require('http');

const data = JSON.stringify({
    agentId: 'monitoring-test-agent',
    sessionId: 'session-xyz',
    requestId: 'request-xyz',
    prompt: 'Testing the monitoring UI with a simulated event'
});

const options = {
    hostname: 'localhost',
    port: 8787,
    path: '/openclaw/event',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
