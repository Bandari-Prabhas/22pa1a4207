const express = require('express');
const shortid = require('shortid');
const validUrl = require('valid-url');
const logMessage = require('../../logging-middleware/src');
const cors = require('cors'); // Import cors

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); // Use cors middleware

const PORT = 5000;

const urlStore = {};

function generateShortCode() {
    let code;
    do {
        code = shortid.generate();
    } while (urlStore[code]);
    return code;
}

app.use((req, res, next) => {
    logMessage('backend', 'info', 'middleware', `Request: ${req.method} ${req.url}`);
    next();
});

app.post('/shorturls', (req, res) => {
    const { url, validity, shortcode } = req.body;

    if (!url || !validUrl.isUri(url)) {
        logMessage('backend', 'error', 'handler', `Invalid URL: ${url}`);
        return res.status(400).json({ error: 'Invalid original URL' });
    }

    let finalShortcode = shortcode;
    if (finalShortcode) {
        if (!/^[a-zA-Z0-9]+$/.test(finalShortcode) || finalShortcode.length > 10) {
            logMessage('backend', 'error', 'handler', `Invalid custom shortcode: ${shortcode}`);
            return res.status(400).json({ error: 'Custom shortcode must be alphanumeric and up to 10 characters long' });
        }
        if (urlStore[finalShortcode]) {
            logMessage('backend', 'warn', 'handler', `Custom shortcode exists: ${shortcode}`);
            return res.status(409).json({ error: 'Custom shortcode already exists' });
        }
    } else {
        finalShortcode = generateShortCode();
        logMessage('backend', 'info', 'service', `Generated shortcode: ${finalShortcode}`);
    }

    const creationTime = new Date();
    const expirationTime = new Date(creationTime.getTime() + (validity || 30) * 60 * 1000);

    urlStore[finalShortcode] = {
        originalUrl: url,
        creationTime: creationTime.toISOString(),
        expirationTime: expirationTime.toISOString(),
        clicks: []
    };

    const shortLink = `http://localhost:${PORT}/${finalShortcode}`;
    logMessage('backend', 'info', 'handler', `Short URL created: ${shortLink}`);
    res.status(201).json({ shortLink, expiry: expirationTime.toISOString() });
});

app.get('/:shortcode', (req, res) => {
    const { shortcode } = req.params;
    const urlEntry = urlStore[shortcode];

    if (!urlEntry) {
        logMessage('backend', 'warn', 'handler', `Shortcode not found: ${shortcode}`);
        return res.status(404).json({ error: 'Short URL not found' });
    }

    if (new Date() > new Date(urlEntry.expirationTime)) {
        logMessage('backend', 'warn', 'handler', `Expired shortcode: ${shortcode}`);
        delete urlStore[shortcode];
        return res.status(410).json({ error: 'Short URL has expired' });
    }

    const clickData = {
        timestamp: new Date().toISOString(),
        referrer: req.get('Referrer') || 'N/A',
        ip: req.ip
    };
    urlEntry.clicks.push(clickData);
    logMessage('backend', 'info', 'service', `Click tracked for: ${shortcode}`);

    res.redirect(urlEntry.originalUrl);
});

app.get('/shorturls/:shortcode', (req, res) => {
    const { shortcode } = req.params;
    const urlEntry = urlStore[shortcode];

    if (!urlEntry) {
        logMessage('backend', 'warn', 'handler', `Stats for non-existent shortcode: ${shortcode}`);
        return res.status(404).json({ error: 'Short URL not found' });
    }

    logMessage('backend', 'info', 'handler', `Stats retrieved for: ${shortcode}`);
    res.status(200).json({
        shortcode,
        originalUrl: urlEntry.originalUrl,
        createdAt: urlEntry.creationTime,
        expiryAt: urlEntry.expirationTime,
        totalClicks: urlEntry.clicks.length,
        detailedClicks: urlEntry.clicks
    });
});

app.listen(PORT, () => {
    logMessage('backend', 'info', 'config', `Backend running on port ${PORT}`);
});
