# Backend Microservice

This is the backend microservice for the URL Shortener application. It provides APIs for creating short URLs, redirecting short URLs, and retrieving statistics.

## Features

- Create short URLs with optional custom shortcodes and validity periods.
- Redirect short URLs to their original long URLs.
- Track click analytics for each short URL.
- Uses in-memory storage for simplicity (can be extended to a database).
- Integrates with the custom `logging-middleware` for all logging.

## Installation

1. Navigate to the `backend` directory:
   ```bash
   cd 22pa1a4207/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   This will install `express`, `shortid`, `valid-url`, and the local `logging-middleware` package.

## Running the Application

```bash
node src/app.js
```

The server will start on `http://localhost:5000` (or the port specified in `src/app.js`).

## API Endpoints

### 1. Create Short URL

- **Method**: `POST`
- **Route**: `/shorturls`
- **Request Body**:

```json
{
  "url": "https://example.com/very-long-url",
  "validity": 30,
  "shortcode": "abcd1"
}
```

- **Response** (201 Created):

```json
{
  "shortLink": "http://localhost:5000/abcd1",
  "expiry": "2025-01-01T00:30:00Z"
}
```

### 2. Redirect Short URL

- **Method**: `GET`
- **Route**: `/:shortcode`
- **Functionality**: Redirects to the original URL and tracks click metadata.

### 3. Get Statistics

- **Method**: `GET`
- **Route**: `/shorturls/:shortcode`
- **Response** (200 OK):

```json
{
  "shortcode": "abcd1",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2025-01-01T00:00:00Z",
  "expiryAt": "2025-01-01T00:30:00Z",
  "totalClicks": 5,
  "detailedClicks": [
    {
      "timestamp": "2025-01-01T00:05:00Z",
      "referrer": "https://google.com",
      "ip": "192.168.1.1"
    }
  ]
}
```

## Error Handling

- `400 Bad Request`: Invalid URL or shortcode format.
- `409 Conflict`: Custom shortcode already exists.
- `404 Not Found`: Short URL not found.
- `410 Gone`: Short URL has expired.
