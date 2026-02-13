/**
 * Adobe DocuBot - Main Action Handler
 * 
 * This action receives Slack slash commands, scrapes relevant documentation,
 * uses AI to generate helpful answers, and returns formatted responses.
 */

const { Core } = require('@adobe/aio-sdk');
const axios = require('axios');
const { scrapeDocs } = require('../../utils/docScraper');
const { getAIResponse } = require('../../utils/aiClient');
const { calculateCost, isCostQuestion } = require('../../utils/costCalculator');
const { checkRateLimit, validateInput, maskParams } = require('../../utils/security');

/**
 * Main action handler
 * @param {object} params - Action parameters from Slack
 * @returns {object} Slack Block Kit formatted response
 */
async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });
  const startTime = Date.now();
  
  // Set environment variables from params for utility modules
  if (params.GROQ_API_KEY) process.env.GROQ_API_KEY = params.GROQ_API_KEY;
  if (params.DOCS_BASE_URL) process.env.DOCS_BASE_URL = params.DOCS_BASE_URL;
  if (params.DOCS_NAME) process.env.DOCS_NAME = params.DOCS_NAME;
  if (params.SLACK_BOT_TOKEN) process.env.SLACK_BOT_TOKEN = params.SLACK_BOT_TOKEN;
  if (params.SLACK_SIGNING_SECRET) process.env.SLACK_SIGNING_SECRET = params.SLACK_SIGNING_SECRET;
  
  try {
    // Log request with masked sensitive data
    logger.info('Adobe DocuBot received request', maskParams(params));
    
    // Extract user info for rate limiting
    const userId = params.user_id || 'anonymous';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return formatSlackResponse(
        '🤖 *Adobe DocuBot*\n\n⚠️ Rate limit exceeded',
        `Please wait ${rateLimitResult.resetIn} seconds before asking another question. You can ask up to 10 questions per minute.`,
        null
      );
    }
    
    // Extract and validate question
    let question = params.text || params.question || '';
    const responseUrl = params.response_url;
    
    const validation = validateInput(question);
    if (!validation.valid) {
      return formatSlackResponse(
        '🤖 *Adobe DocuBot*\n\n❌ Invalid question',
        validation.error,
        null
      );
    }
    
    // Use sanitized input
    const sanitizedQuestion = validation.sanitized;
    
    logger.info(`Question (sanitized): ${sanitizedQuestion}`);
    logger.info(`Rate limit remaining: ${rateLimitResult.remaining} requests`);
    
    // For quick responses (cost calculations), respond immediately
    if (isCostQuestion(sanitizedQuestion)) {
      logger.info('Detected cost calculation question');
      const costResult = calculateCost(sanitizedQuestion);
      return formatSlackResponse(costResult.answer, costResult.proTip, costResult.learnMoreUrl);
    }
    
    // For AI responses that take time, acknowledge immediately and respond async
    // Send immediate response to Slack
    setTimeout(() => {
      processAndRespond(sanitizedQuestion, responseUrl, logger, params).catch(err => {
        logger.error('Error in async processing:', err.message);
      });
    }, 0);
    
    // Return immediate acknowledgment
    return {
      statusCode: 200,
      body: {
        response_type: 'in_channel',
        text: '🤖 *Adobe DocuBot is thinking...* 🔍'
      }
    };
    
  } catch (error) {
    logger.error(`Error in main action: ${error.message}`);
    logger.error(error.stack);
    
    // Return user-friendly error message
    return formatSlackResponse(
      '🤖 *Adobe DocuBot*\n\n❌ Oops! I encountered an error processing your question.',
      'This might be a temporary issue. Please try again in a moment.',
      null
    );
  }
}

/**
 * Process the question and send response to Slack asynchronously
 */
async function processAndRespond(question, responseUrl, logger, params) {
  try {
    // Set environment variables for utility modules
    if (params.GROQ_API_KEY) process.env.GROQ_API_KEY = params.GROQ_API_KEY;
    if (params.DOCS_BASE_URL) process.env.DOCS_BASE_URL = params.DOCS_BASE_URL;
    if (params.DOCS_NAME) process.env.DOCS_NAME = params.DOCS_NAME;
    
    // Scrape relevant documentation
    logger.info('Scraping documentation...');
    const docContent = await scrapeDocs(question);
    
    if (!docContent) {
      await sendToSlack(responseUrl, formatSlackResponse(
        '🤖 *Adobe DocuBot*\n\nI couldn\'t find relevant documentation for your question. Could you try rephrasing it?',
        'Try asking about deployment, configuration, or development topics.',
        'https://developer.adobe.com/app-builder/docs/'
      ));
      return;
    }
    
    // Get AI response (only Groq now)
    logger.info('Getting AI response...');
    const aiResponse = await getAIResponse(question, docContent, params.GROQ_API_KEY);
    
    // Send to Slack
    await sendToSlack(responseUrl, aiResponse);
    
    logger.info('Response sent successfully');
    
  } catch (error) {
    logger.error('Error processing question:', error);
    await sendToSlack(responseUrl, formatSlackResponse(
      '🤖 *Adobe DocuBot*\n\n❌ Oops! I encountered an error processing your question.',
      'This might be a temporary issue. Please try again in a moment.',
      null
    ));
  }
}

/**
 * Send response to Slack using response_url
 */
async function sendToSlack(responseUrl, response) {
  if (!responseUrl) {
    console.error('No response_url provided');
    return;
  }
  
  await axios.post(responseUrl, response.body, {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Format response in Slack Block Kit format
 * @param {string} answer - Main answer text
 * @param {string} proTip - Optional pro tip
 * @param {string} learnMoreUrl - Optional documentation URL
 * @returns {object} Slack formatted response
 */
function formatSlackResponse(answer, proTip, learnMoreUrl) {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: answer
      }
    }
  ];
  
  // Add pro tip if provided
  if (proTip) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `💡 *Pro tip:* ${proTip}`
        }
      ]
    });
  }
  
  // Add learn more link if provided
  if (learnMoreUrl) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📖 <${learnMoreUrl}|Learn more>`
        }
      ]
    });
  }
  
  return {
    statusCode: 200,
    body: {
      response_type: 'in_channel',
      blocks: blocks
    }
  };
}

exports.main = main;
