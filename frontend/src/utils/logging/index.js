// Logging utility for frontend (browser-compatible)
const LOG_API_URL = 'http://20.244.56.144/evaluation-service/logs';
const AUTH_API_URL = 'http://20.244.56.144/evaluation-service/auth';

const CLIENT_ID = 'd9cbb699-6a27-44a5-8059-8b1befa816da';
const CLIENT_SECRET = 'tVJaaaRB5eXcRXEM';
const ACCESS_CODE = 'xgAsNC';
const EMAIL = '22pa1a4207@vishnu.edu.in';
const NAME = 'bandari prabhas';
const ROLL_NO = '22pa1a4207';

let currentAuthToken = null;

const packageConstraints = {
    backend: ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'],
    frontend: ['api', 'component', 'hook', 'page', 'state', 'style'],
    both: ['auth', 'config', 'middleware', 'utils']
};

async function fetchNewAuthToken() {
    try {
        const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: EMAIL,
                name: NAME,
                rollNo: ROLL_NO,
                accessCode: ACCESS_CODE,
                clientID: CLIENT_ID,
                clientSecret: CLIENT_SECRET
            })
        });
        const data = await response.json();
        currentAuthToken = data.access_token;
        return currentAuthToken;
    } catch (error) {
        throw new Error('Authentication failed');
    }
}

async function logMessage(stack, level, packageName, message, retries = 3) {
    if (!['backend', 'frontend'].includes(stack)) return;
    if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(level)) return;
    const isValidPackage = (stack === 'backend' && packageConstraints.backend.includes(packageName)) ||
        (stack === 'frontend' && packageConstraints.frontend.includes(packageName)) ||
        packageConstraints.both.includes(packageName);
    if (!isValidPackage) return;
    try {
        if (!currentAuthToken) {
            await fetchNewAuthToken();
        }
        await fetch(LOG_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentAuthToken}`
            },
            body: JSON.stringify({
                stack,
                level,
                package: packageName,
                message
            })
        });
    } catch (error) {
        if (retries > 0) {
            currentAuthToken = null;
            return logMessage(stack, level, packageName, message, retries - 1);
        }
    }
}

export default logMessage;
