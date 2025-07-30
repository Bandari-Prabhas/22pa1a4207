
const axios = require('axios');

const LOG_API_URL = 'http://20.244.56.144/evaluation-service/logs';
const AUTH_API_URL = 'http://20.244.56.144/evaluation-service/auth';

const CLIENT_ID = '51afdfc4-6b13-452e-832c-3cfe5be7d907';
const CLIENT_SECRET = 'yZhNTCHXxNZCXAjg';
const ACCESS_CODE = 'qxRMwq';
const EMAIL = '22pa1a12f3@vishnu.edu.in';
const NAME = 'ramichitti bhavyasri';
const ROLL_NO = '22pa1a12f3';

let currentAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMnBhMWExMmYzQHZpc2hudS5lZHUuaW4iLCJleHAiOjE3NTM4NTk0NDQsImlhdCI6MTc1Mzg1ODU0NCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjFiNjdiYTk2LWYyZTQtNGNlMi1hYTFkLTJjNjEzZGFlNzNkMCIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJhbWljaGl0dGkgYmhhdnlhc3JpIiwic3ViIjoiNTFhZmRmYzQtNmIxMy00NTJlLTgzMmMtM2NmZTViZTdkOTA3In0sImVtYWlsIjoiMjJwYTFhMTJmM0B2aXNobnUuZWR1LmluIiwibmFtZSI6InJhbWljaGl0dGkgYmhhdnlhc3JpIiwicm9sbE5vIjoiMjJwYTFhMTJmMyIsImFjY2Vzc0NvZGUiOiJxeFJNd3EiLCJjbGllbnRJRCI6IjUxYWZkZmM0LTZiMTMtNDUyZS04MzJjLTNjZmU1YmU3ZDkwNyIsImNsaWVudFNlY3JldCI6InlaaE5UQ0hYeE5aQ1hBamcifQ.bfJFhH6KgxrVF7Ga4AZHldmeKsxUr0vSQtI9NVNMFkg';

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

async function logMessage(stack, level, packageName, message) {
    if (!['backend', 'frontend'].includes(stack)) {
        console.error('Invalid stack provided.');
        return;
    }
    if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(level)) {
        console.error('Invalid log level provided.');
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
        console.error(`Failed to send log:`, error.message);
    }
}

module.exports = logMessage;
