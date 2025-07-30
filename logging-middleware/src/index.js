const axios = require('axios');

const LOG_API_URL = 'http://20.244.56.144/evaluation-service/logs';
const AUTH_API_URL = 'http://20.244.56.144/evaluation-service/auth';

const CLIENT_ID = 'f06df2c6-89c8-4950-8a6d-6de85bc7f4a1';
const CLIENT_SECRET = 'EVqnjTShVWvjnCBS';
const ACCESS_CODE = 'qxRMwq';
const EMAIL = '22pa1a4207@vishnu.edu.in';
const NAME = 'bandari prabhas';
const ROLL_NO = '22pa1a4207';

let currentAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMnBhMWE0MjA3QHZpc2hudS5lZHUuaW4iLCJleHAiOjE3NTM4NTkzMjQsImlhdCI6MTc1Mzg1ODQyNCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjliOWRkZTc0LTkzYTAtNDdiNy05NDcxLTk5YjAzODZkMjdjZiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImJhbmRhcmkgcHJhYmhhcyIsInN1YiI6ImYwNmRmMmM2LTg5YzgtNDk1MC04YTZkLTZkZTg1YmM3ZjRhMSJ9LCJlbWFpbCI6IjIycGExYTQyMDdAdmlzbmh1LmVkdS5pbiIsIm5hbWUiOiJiYW5kYXJpIHByYWJoYXMiLCJyb2xsTm8iOiIyMnBhMWE0MjA3IiwiYWNjZXNzQ29kZSI6InF4Uk13cSIsImNsaWVudElEIjoiZjA2ZGYyYzYtODljOC00OTUwLThhNmQtNmRlODViYzdmNGExIiwiY2xpZW50U2VjcmV0IjoiRVZxbmpUU2hWV3ZqbkNCUyJ9.dN8kfn6yk1r8eQ8xDmb4s_cEQ9lbQ1FYMnaGt4HKcSw';

const packageConstraints = {
    backend: ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'],
    frontend: ['api', 'component', 'hook', 'page', 'state', 'style'],
    both: ['auth', 'config', 'middleware', 'utils']
};

async function fetchNewAuthToken() {
    try {
        const response = await axios.post(AUTH_API_URL, {
            email: EMAIL,
            name: NAME,
            rollNo: ROLL_NO,
            accessCode: ACCESS_CODE,
            clientID: CLIENT_ID,
            clientSecret: CLIENT_SECRET
        });
        currentAuthToken = response.data.access_token;
        return currentAuthToken;
    } catch (error) {
        console.error('Authentication token retrieval failed:', error.message);
        throw new Error('Authentication failed');
    }
}

async function logMessage(stack, level, packageName, message, retries = 3) {
    if (!['backend', 'frontend'].includes(stack)) {
        console.error('Invalid stack provided.');
        return;
    }
    if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(level)) {
        console.error('Invalid log level provided.');
        return;
    }

    const isValidPackage = (stack === 'backend' && packageConstraints.backend.includes(packageName)) ||
                           (stack === 'frontend' && packageConstraints.frontend.includes(packageName)) ||
                           packageConstraints.both.includes(packageName);

    if (!isValidPackage) {
        console.error(`Invalid package name "${packageName}" for stack "${stack}".`);
        return;
    }

    try {
        if (!currentAuthToken) {
            await fetchNewAuthToken();
        }

        await axios.post(LOG_API_URL, {
            stack,
            level,
            package: packageName,
            message
        }, {
            headers: {
                'Authorization': `Bearer ${currentAuthToken}`
            }
        });
    } catch (error) {
        if (retries > 0 && error.response && error.response.status === 401) {
            console.warn('Log API call unauthorized. Attempting token refresh and retry.');
            currentAuthToken = null;
            return logMessage(stack, level, packageName, message, retries - 1);
        }
        console.error(`Failed to send log after ${3 - retries} retries:`, error.message);
        console.error(`FALLBACK LOG: [${stack}][${level}][${packageName}] ${message}`);
    }
}

module.exports = logMessage;
