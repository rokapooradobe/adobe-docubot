/**
 * Security Utility
 * 
 * Provides rate limiting, input validation, and key masking
 */

// Rate limiting: Track requests per user
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // Max requests per window

/**
 * Check if user has exceeded rate limit
 * @param {string} userId - Slack user ID
 * @returns {object} { allowed: boolean, remaining: number }
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userKey = `user_${userId}`;
  
  // Get or initialize user's request data
  let userData = requestCounts.get(userKey) || { count: 0, windowStart: now };
  
  // Reset window if expired
  if (now - userData.windowStart > RATE_LIMIT_WINDOW) {
    userData = { count: 0, windowStart: now };
  }
  
  // Check if over limit
  if (userData.count >= RATE_LIMIT_MAX) {
    const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - userData.windowStart)) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn: timeLeft
    };
  }
  
  // Increment count
  userData.count++;
  requestCounts.set(userKey, userData);
  
  // Auto-cleanup after window
  setTimeout(() => requestCounts.delete(userKey), RATE_LIMIT_WINDOW);
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - userData.count,
    resetIn: null
  };
}

/**
 * Validate and sanitize user input
 * @param {string} text - User input text
 * @returns {object} { valid: boolean, sanitized: string, error: string }
 */
function validateInput(text) {
  // Check if empty
  if (!text || typeof text !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: 'Question cannot be empty'
    };
  }
  
  const trimmed = text.trim();
  
  // Check length
  if (trimmed.length === 0) {
    return {
      valid: false,
      sanitized: '',
      error: 'Question cannot be empty'
    };
  }
  
  if (trimmed.length > 500) {
    return {
      valid: false,
      sanitized: '',
      error: 'Question is too long (max 500 characters)'
    };
  }
  
  // Remove potentially dangerous characters
  const sanitized = trimmed
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[\$\{\}]/g, '') // Remove template literal syntax
    .replace(/[`]/g, "'") // Replace backticks with single quotes
    .replace(/\\/g, ''); // Remove backslashes
  
  return {
    valid: true,
    sanitized: sanitized,
    error: null
  };
}

/**
 * Mask sensitive data in logs
 * @param {string} text - Text that might contain sensitive data
 * @returns {string} Masked text
 */
function maskSensitive(text) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Mask API keys
    .replace(/sk-ant-[a-zA-Z0-9-_]+/g, 'sk-ant-***MASKED***')
    .replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-***MASKED***')
    .replace(/gsk_[a-zA-Z0-9]{20,}/g, 'gsk_***MASKED***')
    .replace(/xoxb-[a-zA-Z0-9-]+/g, 'xoxb-***MASKED***')
    // Mask bearer tokens
    .replace(/Bearer\s+[a-zA-Z0-9-_.]+/gi, 'Bearer ***MASKED***')
    // Mask basic auth
    .replace(/Authorization:\s*Basic\s+[a-zA-Z0-9+/=]+/gi, 'Authorization: Basic ***MASKED***');
}

/**
 * Mask API keys in params object for logging
 * @param {object} params - Parameters object
 * @returns {object} Params with masked keys
 */
function maskParams(params) {
  const masked = { ...params };
  
  const keysToMask = [
    'GROQ_API_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'SLACK_BOT_TOKEN',
    'SLACK_SIGNING_SECRET',
    'AIO_runtime_auth',
    'token',              // Slack verification token
    'trigger_id',         // Slack trigger ID
    'response_url'        // Slack response URL (contains sensitive webhook)
  ];
  
  // Keys to fully mask (no partial reveal)
  const keysToFullyMask = ['token', 'trigger_id', 'response_url'];
  
  keysToMask.forEach(key => {
    if (masked[key]) {
      const value = masked[key];
      
      // Fully mask Slack tokens and URLs
      if (keysToFullyMask.includes(key)) {
        masked[key] = '***MASKED***';
      } else {
        // Partially mask API keys (show first/last 4 chars)
        if (typeof value === 'string' && value.length > 8) {
          masked[key] = value.substring(0, 4) + '***MASKED***' + value.substring(value.length - 4);
        } else {
          masked[key] = '***MASKED***';
        }
      }
    }
  });
  
  // Mask x-slack-signature in __ow_headers
  if (masked.__ow_headers && masked.__ow_headers['x-slack-signature']) {
    masked.__ow_headers = { ...masked.__ow_headers };
    masked.__ow_headers['x-slack-signature'] = '***MASKED***';
  }
  
  return masked;
}

module.exports = {
  checkRateLimit,
  validateInput,
  maskSensitive,
  maskParams
};
