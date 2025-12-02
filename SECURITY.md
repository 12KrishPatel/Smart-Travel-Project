# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by:
1. Opening a GitHub issue with the `security` label
2. Or contacting the maintainer directly at [linkedin.com/in/12krishpatel](https://linkedin.com/in/12krishpatel)

Please do **not** publicly disclose the vulnerability until it has been addressed.

---

## Security Features

### 1. CORS (Cross-Origin Resource Sharing) Protection

**Implementation**: `backend/main.py` lines 12-23

The backend enforces strict CORS policies to prevent unauthorized domains from accessing the API.

- **Configuration**: Set via `ALLOWED_ORIGINS` environment variable
- **Default**: `http://localhost:5173` (development)
- **Production**: Must be updated to your actual frontend domain(s)

```env
# Single origin
ALLOWED_ORIGINS=https://yourdomain.com

# Multiple origins (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Why this matters**: Without CORS protection, any website could make requests to your backend and potentially abuse your Google Maps API quota.

---

### 2. API Key Protection

**Implementation**: `backend/main.py` lines 50-52

The Google Maps API key used for route calculations is stored server-side and never exposed to clients.

**Security measures**:
- API key is loaded from environment variables only
- No endpoint exposes the backend API key
- All Directions API calls are proxied through the backend

**Frontend API Key**: The frontend does use a Google Maps API key for Places Autocomplete. This is necessary because autocomplete must run client-side. To secure this:
1. Use a **separate API key** for frontend (different from backend)
2. Configure **HTTP referrer restrictions** in Google Cloud Console
3. Limit to **Places API only**

---

### 3. Input Validation

**Backend Implementation**: `backend/main.py` lines 25-37

All user inputs are validated using Pydantic models with custom validators:

**Validated fields**:
- `origin` and `destination`: Non-empty, max 500 characters
- `mode`: Restricted to valid values only (`"driving"`, `"walking"`, `"bicycling"`, `"transit"`)

**Frontend Implementation**:
- `MapPage.jsx` lines 179-193: Validates locations before API calls
- `SavingsPage.jsx` lines 27-43: Validates distance input

**Protection against**:
- Empty/null inputs
- Excessively long strings (DoS attacks)
- Invalid transportation modes
- SQL injection (not applicable, but good practice)
- XSS attacks through input sanitization

---

### 4. Error Handling

**Implementation**: `backend/main.py` lines 62-120

Comprehensive error handling prevents:
- **Information leakage**: Error messages are user-friendly without exposing system details
- **Crashes**: All API calls are wrapped in try-catch blocks
- **Hanging requests**: 10-second timeout on Google Maps API calls

**Error types handled**:
- Request timeouts
- Network errors
- Invalid API responses
- Missing data in API responses
- Google Maps API errors (with specific messages for each status)

**Frontend error handling**: `MapPage.jsx` lines 216-236
- Distinguishes between backend errors, network errors, and timeouts
- Provides helpful error messages to users
- 15-second timeout on frontend requests

---

### 5. Request Timeouts

**Backend**: 10-second timeout on Google Maps API requests
**Frontend**: 15-second timeout on backend API requests

Prevents:
- Resource exhaustion from hanging connections
- Denial of service attacks
- Poor user experience from indefinite loading

---

### 6. Environment Variable Management

**Implementation**:
- Backend: `.env` file with `GOOGLE_MAPS_API_KEY` and `ALLOWED_ORIGINS`
- Frontend: `.env` file with `VITE_GOOGLE_MAPS_API_KEY` and `VITE_API_URL`
- Both have `.env.example` templates

**Security checklist**:
- ✅ `.env` files are in `.gitignore`
- ✅ `.env.example` templates provided (without actual secrets)
- ✅ All API keys loaded from environment variables
- ✅ No hardcoded secrets in source code

---

## Google Cloud Console Configuration

### Backend API Key Setup

1. **Create a separate API key** for backend use (server-side)
2. **Set Application Restrictions**:
   - Select "IP addresses"
   - Add your server's IP address(es)
   - For localhost testing: `127.0.0.1/32`
   - For production: Your server's public IP

3. **Set API Restrictions**:
   - Select "Restrict key"
   - Enable only:
     - ✅ Directions API
     - ✅ Geocoding API (optional)

4. **Set Quotas** (recommended):
   - Go to "Quotas & System Limits"
   - Set daily request limits to prevent unexpected charges
   - Example: 1,000 requests/day for development

### Frontend API Key Setup

1. **Create a separate API key** for frontend use (client-side)
2. **Set Application Restrictions**:
   - Select "HTTP referrers (web sites)"
   - Add your domain(s):
     - Development: `localhost:5173/*`, `127.0.0.1:5173/*`
     - Production: `yourdomain.com/*`, `*.yourdomain.com/*`

3. **Set API Restrictions**:
   - Select "Restrict key"
   - Enable only:
     - ✅ Places API
     - ✅ Maps JavaScript API

**Why two keys?** Separate keys allow you to:
- Apply different restrictions (IP vs HTTP referrer)
- Monitor usage separately
- Revoke one key without affecting the other
- Apply different quotas

---

## Known Security Limitations

### 1. Frontend API Key Exposure

**Issue**: The frontend API key is embedded in the JavaScript bundle and visible to users.

**Mitigation**:
- ✅ Restrict key to specific HTTP referrers in Google Cloud Console
- ✅ Limit key to Places API only (no Directions API access)
- ✅ Set daily quotas to limit abuse
- ✅ Monitor usage regularly

**Why this is acceptable**: Places Autocomplete requires client-side execution. The key is restricted to your domain and specific APIs, minimizing risk.

### 2. Rate Limiting

**Current state**: No rate limiting implemented

**Risk**: Malicious users could make many requests to exhaust API quotas

**Planned mitigation**:
- Implement rate limiting middleware in FastAPI
- Limit requests per IP address (e.g., 100 requests/hour)
- Consider implementing API authentication for production

### 3. Authentication

**Current state**: No user authentication

**Risk**: Anyone with access to the frontend can use the service

**For consideration**:
- If this is a public demo/portfolio project: acceptable
- If deploying for production use: consider adding authentication

---

## Production Deployment Checklist

Before deploying to production, ensure:

### Backend
- [ ] `ALLOWED_ORIGINS` set to production frontend URL(s)
- [ ] Backend API key restricted by IP address in Google Cloud Console
- [ ] Backend API key limited to Directions API only
- [ ] HTTPS enabled (required for production)
- [ ] Remove debug/console.log statements
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure daily API quotas
- [ ] Review and test all error scenarios

### Frontend
- [ ] `VITE_API_URL` set to production backend URL
- [ ] Frontend API key restricted by HTTP referrer in Google Cloud Console
- [ ] Frontend API key limited to Places API only
- [ ] HTTPS enabled (required for Google Maps API)
- [ ] Remove debug/console.log statements
- [ ] Test on multiple browsers
- [ ] Configure Content Security Policy headers

### Infrastructure
- [ ] Enable HTTPS/TLS for all traffic
- [ ] Configure firewall rules
- [ ] Set up automated backups (if using database in future)
- [ ] Configure monitoring and alerting
- [ ] Test disaster recovery procedures

---

## Security Best Practices

1. **Never commit secrets to version control**
   - Always use `.env` files
   - Double-check before committing

2. **Rotate API keys regularly**
   - Recommended: Every 90 days
   - Immediately if compromised

3. **Monitor API usage**
   - Check Google Cloud Console weekly
   - Set up billing alerts
   - Investigate unusual spikes

4. **Keep dependencies updated**
   - Run `npm audit` and `pip list --outdated` regularly
   - Update packages with known vulnerabilities
   - Test thoroughly after updates

5. **Use HTTPS everywhere**
   - Required for Google Maps API in production
   - Protects API keys in transit
   - Use Let's Encrypt for free SSL certificates

6. **Log security events**
   - Failed validation attempts
   - Rate limit violations
   - Unusual error patterns

---

## Compliance Notes

- **GDPR**: This application does not collect or store personal data
- **API Terms of Service**: Ensure usage complies with [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)
- **Geolocation**: User location is requested but not stored or transmitted to backend

---

## Security Updates

This document was last updated: **December 2, 2025**

Major security improvements implemented:
- ✅ CORS restriction
- ✅ API key protection (server-side)
- ✅ Input validation
- ✅ Comprehensive error handling
- ✅ Request timeouts
- ✅ Environment variable management

---

## Contact

For security concerns, contact:
- **Author**: Krish Patel
- **LinkedIn**: [linkedin.com/in/12krishpatel](https://linkedin.com/in/12krishpatel)
- **GitHub Issues**: Use the `security` label
