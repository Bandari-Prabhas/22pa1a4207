# Logging Middleware

This package provides a reusable logging utility for both backend and frontend applications. It sends log messages to a centralized evaluation service API with authentication and retry logic.

## Installation

```bash
npm install logging-middleware
```

## Usage

```javascript
const Log = require("logging-middleware");

// Log from backend
Log("backend", "info", "service", "User created successfully");

// Log from frontend
Log("frontend", "error", "component", "Failed to load data");
```

## API Specifications

- **Method**: POST
- **URL**: `http://20.244.56.144/evaluation-service/logs`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:

```json
{
  "stack": "backend|frontend",
  "level": "debug|info|warn|error|fatal",
  "package": "<package_name>",
  "message": "descriptive message"
}
```

## Package Constraints

The `packageName` parameter must adhere to the following constraints:

- **Backend only**: `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`
- **Frontend only**: `api`, `component`, `hook`, `page`, `state`, `style`
- **Both**: `auth`, `config`, `middleware`, `utils`

## Authentication

The middleware handles token management internally, including refreshing the token when it expires.
