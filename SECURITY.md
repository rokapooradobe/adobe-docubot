# Security Features

## Overview

Adobe DocuBot now includes security features to protect against abuse and ensure safe operation.

## Features Implemented

### 1. Rate Limiting

**Protection**: Prevents users from spamming the bot and burning through API credits.

**Limits**:
- **10 requests per user per minute**
- Automatically resets after 1 minute
- Per-user tracking (not per-channel)

**User Experience**:
```
User exceeds limit → Bot responds:
"⚠️ Rate limit exceeded
Please wait X seconds before asking another question."
```

**How it works**:
```javascript
// Tracks requests per user ID
const requestCounts = new Map();
// user_123 → { count: 5, windowStart: timestamp }
```

### 2. Input Validation

**Protection**: Prevents malicious input and injection attacks.

**Validations**:
- ✅ Max length: 500 characters
- ✅ Removes HTML tags (`<`, `>`)
- ✅ Removes template literals (`$`, `{`, `}`)
- ✅ Removes backticks (replaced with single quotes)
- ✅ Removes backslashes
- ✅ Checks for empty/null input

**Example**:
```javascript
Input:  "How do I deploy ${process.env.SECRET}?"
Output: "How do I deploy process.env.SECRET?"
```

### 3. API Key Masking

**Protection**: Prevents API keys and sensitive tokens from appearing in logs.

**Fully Masked (no partial reveal)**:
- Slack verification token (`token`)
- Slack trigger ID (`trigger_id`)
- Slack response URLs (`response_url`)

**Partially Masked (first/last 4 chars shown for debugging)**:
- Groq API keys (`gsk_...`)
- Anthropic keys (`sk-ant-...`)
- OpenAI keys (`sk-...`)
- Slack bot tokens (`xoxb-...`)
- Slack signing secrets
- Adobe runtime auth

**Why two levels of masking?**
- **Full masking**: Single-use tokens and webhook URLs are completely hidden
- **Partial masking**: API keys show first/last 4 chars to help debug which key is being used

**Example Log Output**:
```javascript
// Fully masked (most secure)
token: '***MASKED***'
trigger_id: '***MASKED***'
response_url: '***MASKED***'

// Partially masked (debugging-friendly)
GROQ_API_KEY: 'gsk_***MASKED***Lijh'
SLACK_BOT_TOKEN: 'xoxb***MASKED***QS3p'
```

**Masked in**:
- Console logs
- Error messages
- Debug output
- API error responses
- All param logging

### 4. Simplified AI Provider (Groq Only)

**Security benefit**: Reduced attack surface by removing unused dependencies.

**Changes**:
- ❌ Removed `@anthropic-ai/sdk` dependency
- ❌ Removed `openai` dependency
- ✅ Only uses Groq via REST API (axios)
- ✅ Fewer packages = fewer vulnerabilities

## Security Best Practices

### What We Do

✅ **Validate all user input**
✅ **Rate limit requests**
✅ **Mask sensitive data in logs**
✅ **Use environment variables for secrets**
✅ **Sanitize input before AI calls**
✅ **Provide user-friendly error messages (no system details)**

### What You Should Do

✅ **Set Groq spending limits** in Groq console
✅ **Monitor logs regularly** with `aio app logs`
✅ **Rotate API keys** periodically
✅ **Use separate dev/prod keys**
✅ **Restrict Slack workspace access**
✅ **Review usage patterns** monthly

## Configuration

### Environment Variables

```bash
# Required
GROQ_API_KEY=gsk_your_key_here
SLACK_BOT_TOKEN=xoxb_your_token_here
SLACK_SIGNING_SECRET=your_secret_here

# Optional (with defaults)
DOCS_BASE_URL=https://developer.adobe.com/app-builder/docs/
DOCS_NAME=App Builder
```

### Rate Limit Settings

To change rate limits, edit `utils/security.js`:

```javascript
const RATE_LIMIT_WINDOW = 60000; // 1 minute (in ms)
const RATE_LIMIT_MAX = 10; // Max requests per window

// Increase for production:
const RATE_LIMIT_MAX = 30; // 30 requests/minute
```

### Input Validation Settings

To change validation rules, edit `utils/security.js`:

```javascript
// Current max length
if (trimmed.length > 500) { ... }

// Increase for longer questions:
if (trimmed.length > 1000) { ... }
```

## Testing Security Features

### Test Rate Limiting

```bash
# In Slack, run quickly:
/ab test 1
/ab test 2
/ab test 3
... (repeat 10+ times)

# Should get rate limit message after 10th request
```

### Test Input Validation

```bash
# Test max length (> 500 chars)
/ab [paste very long text]
→ "Question is too long (max 500 characters)"

# Test empty input
/ab
→ "Please ask me a question!"

# Test dangerous characters
/ab How do I use <script>alert('xss')</script>
→ Automatically sanitized before processing
```

### Test Key Masking

```bash
# Check logs
aio app logs

# Should see FULLY masked:
token: '***MASKED***'
trigger_id: '***MASKED***'
response_url: '***MASKED***'

# Should see PARTIALLY masked (debugging-friendly):
GROQ_API_KEY: 'gsk_***MASKED***Lijh'
SLACK_BOT_TOKEN: 'xoxb***MASKED***QS3p'

# Should NEVER see:
GROQ_API_KEY: 'gsk_1234567890abcdefghij'  ❌
token: 'oLE9pS3HcaSWkMUBjH8Y6WkW'  ❌
```

## Security Limitations

### What This Does NOT Protect Against

❌ **Slack workspace compromise** - If workspace is compromised, bot can be abused
❌ **API key theft** - If someone gets your .env file, they have access
❌ **DDoS attacks** - Multiple users can still overwhelm the system
❌ **Content filtering** - Bot doesn't filter offensive questions
❌ **Data exfiltration** - Bot could be tricked into revealing doc content

### Production Recommendations

For production deployment, also add:

1. **User authentication** - Verify user is authorized
2. **Audit logging** - Track all requests to database
3. **Content filtering** - Block offensive/dangerous questions
4. **Secret rotation** - Automatically rotate API keys
5. **Monitoring alerts** - Alert on suspicious patterns
6. **Per-channel limits** - Limit entire channels, not just users
7. **IP blocking** - Block abusive IPs
8. **Cost alerts** - Alert when API spending exceeds threshold

## Incident Response

### If Rate Limit is Hit Too Often

```bash
# Check logs for user IDs
aio app logs | grep "Rate limit"

# Identify abusive users
# Contact Slack admin to warn/ban user
```

### If API Key is Compromised

```bash
# 1. Immediately revoke key in Groq console
# 2. Generate new key
# 3. Update .env file
# 4. Redeploy
aio app deploy

# 5. Check Groq usage for unauthorized calls
# 6. Review logs for breach timing
```

### If Costs Spike Unexpectedly

```bash
# 1. Check Groq usage dashboard
# 2. Review logs for request volume
aio app logs --limit 1000

# 3. Temporarily disable bot
aio app undeploy

# 4. Investigate cause
# 5. Add stricter rate limits
# 6. Redeploy with fixes
```

## Compliance

### Data Handling

- ✅ User questions are logged (for debugging)
- ✅ No PII is stored permanently
- ✅ Logs auto-expire (Adobe I/O Runtime retention policy)
- ✅ API keys are masked in logs
- ❌ No encryption at rest (uses Adobe's default)

### GDPR Considerations

If deploying in EU:
- Add privacy notice to bot responses
- Allow users to request data deletion
- Document data retention policy
- Add opt-out mechanism

## Updates

**Last updated**: 2026-02-12  
**Security enhancements**:
- ✅ Added full masking for Slack tokens (`token`, `trigger_id`, `response_url`)
- ✅ Maintained partial masking for API keys (debugging-friendly)
- ✅ Two-tier masking strategy (full vs. partial)

**Security review**: Pending (recommended before production)

## Contact

For security concerns, contact: [your-email@adobe.com]
