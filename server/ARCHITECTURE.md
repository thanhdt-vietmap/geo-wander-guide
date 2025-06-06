# Server Architecture

This server has been refactored into a clean, modular architecture following Express.js best practices.

## Project Structure

```
src/
├── index.ts                 # Main server entry point
├── config/
│   └── constants.ts         # Configuration constants and API keys
├── middleware/
│   ├── index.ts            # Middleware exports
│   ├── common.ts           # Common middleware setup (CORS, helmet, etc.)
│   ├── security.ts         # HMAC validation middleware
│   └── rateLimiter.ts      # Rate limiting middleware
├── controllers/
│   ├── index.ts            # Controller exports
│   ├── apiController.ts    # Basic API endpoints (/health, /users)
│   └── proxyController.ts  # VietMap API proxy endpoints
├── routes/
│   ├── api.ts              # API routes (/api/*)
│   └── proxy.ts            # Proxy routes (/proxy/*)
└── services/
    ├── apiService.ts       # HTTP client service
    └── serverHMACServices.ts # HMAC verification service
```

## Key Components

### Middleware
- **Common**: Sets up CORS, Helmet, body parsing, and CSP headers
- **Security**: HMAC signature validation for secure API calls
- **Rate Limiter**: IP-based rate limiting to prevent abuse

### Controllers
- **API Controller**: Handles basic health checks and user endpoints
- **Proxy Controller**: Handles VietMap API proxy requests (autocomplete, place, route, reverse geocoding)

### Routes
- **API Routes**: `/api/*` endpoints for application APIs
- **Proxy Routes**: `/proxy/*` endpoints for external API proxying with security validation

### Configuration
- Centralized configuration for API keys, rate limits, and security settings
- Easy to modify without touching multiple files

## Security Features

1. **HMAC Validation**: All proxy requests require valid HMAC signatures
2. **Rate Limiting**: 15 requests per 15-second window per IP
3. **Timestamp Validation**: Requests must be within 30-second window
4. **Content Security Policy**: Strict CSP headers for client security

## Usage

The refactored server maintains the same API endpoints but with improved:
- Code organization and maintainability
- Error handling and logging
- Security and performance
- Testability and modularity

All existing client code will continue to work without any changes.
