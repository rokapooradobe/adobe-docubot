/**
 * AI Client Utility
 * 
 * Wrapper for Groq AI API to generate helpful responses
 * based on documentation and user questions.
 */

const axios = require('axios');
const { maskSensitive } = require('./security');

// Read configuration from environment
const DOCS_NAME = process.env.DOCS_NAME || 'App Builder';
const DOCS_BASE_URL = process.env.DOCS_BASE_URL || 'https://developer.adobe.com/app-builder/docs/';

/**
 * Get AI response for a question based on documentation
 * @param {string} question - User's question
 * @param {string} docContent - Relevant documentation content
 * @param {string} groqKey - Groq API key
 * @returns {Promise<object>} Formatted Slack response
 */
async function getAIResponse(question, docContent, groqKey) {
  try {
    const DOCS_NAME = process.env.DOCS_NAME || 'App Builder';
    const DOCS_BASE_URL = process.env.DOCS_BASE_URL || 'https://developer.adobe.com/app-builder/docs/';
    
    // Validate API key
    if (!groqKey) {
      throw new Error('No AI API key configured. Set GROQ_API_KEY in .env');
    }
    
    // Build user prompt
    const userPrompt = `Based on this documentation from ${DOCS_BASE_URL}:

${docContent}

Answer this question: ${question}

Format your response for Slack:
- Start with 🤖 *Adobe DocuBot*
- Use *bold* for emphasis
- Use \`code\` for commands
- Use \`\`\` for code blocks
- Mention ${DOCS_NAME} naturally in your answer
- Include a practical pro tip if relevant
- End with a source URL if you have one`;

    console.log('Using Groq AI (Llama 3.3 70B)...');
    const responseText = await getGroqResponse(groqKey, userPrompt, DOCS_NAME);
    
    // Parse response and format for Slack
    return parseAIResponse(responseText);
    
  } catch (error) {
    // Mask any sensitive data in error messages
    const maskedError = maskSensitive(error.message);
    console.error('Error getting AI response:', maskedError);
    throw new Error(maskedError);
  }
}

/**
 * Get response from Groq AI using REST API
 * @param {string} apiKey - Groq API key
 * @param {string} prompt - User prompt
 * @param {string} docsName - Documentation name
 * @returns {Promise<string>} AI response text
 */
async function getGroqResponse(apiKey, prompt, docsName) {
  const SYSTEM_PROMPT = `You are Adobe DocuBot, a friendly AI assistant for developers.

You specialize in ${docsName} documentation.

Your job is to help developers by answering questions about ${docsName} clearly and concisely.

Guidelines:
- Be friendly and helpful (like a coworker)
- Use emoji sparingly (1-2 per response max)
- Include code examples when relevant
- Keep answers concise (2-4 paragraphs)
- Add a "Pro tip" with practical advice when applicable
- Always cite the source URL when available
- Mention "${docsName}" in your response so users know the source
- Format responses in Slack mrkdwn (markdown)
- Use *bold* for emphasis, \`code\` for commands, \`\`\` for code blocks

If you don't know the answer from the provided docs, say so honestly and suggest where to look.`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    // Log error without exposing API key
    console.error('Groq API error status:', error.response?.status);
    console.error('Groq API error:', maskSensitive(JSON.stringify(error.response?.data)));
    
    // Provide user-friendly error messages
    if (error.response?.status === 429) {
      throw new Error('AI API rate limit reached. Please try again in a moment.');
    } else if (error.response?.status === 401) {
      throw new Error('AI API authentication failed. Please check your API key configuration.');
    } else if (error.response?.status === 400) {
      const errorData = error.response?.data;
      if (errorData?.error?.message?.includes('credit')) {
        throw new Error('AI API credit balance is low. Please add credits to your Groq account.');
      }
      throw new Error('Invalid request to AI API. Please try rephrasing your question.');
    } else {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
  }
}

/**
 * Parse AI response and format for Slack Block Kit
 * @param {string} responseText - Raw AI response
 * @returns {object} Slack formatted response
 */
function parseAIResponse(responseText) {
  // Extract pro tip if present
  const proTipMatch = responseText.match(/💡.*?[Pp]ro [Tt]ip:?\s*(.+?)(?=\n|$)/);
  const proTip = proTipMatch ? proTipMatch[1].trim() : null;
  
  // Extract learn more URL if present
  const urlMatch = responseText.match(/📖.*?<?(https?:\/\/[^\s>]+)>?/);
  const learnMoreUrl = urlMatch ? urlMatch[1] : DOCS_BASE_URL;
  
  // Remove pro tip and learn more from main text
  let mainText = responseText
    .replace(/💡.*?[Pp]ro [Tt]ip:?\s*.+?(?=\n|$)/g, '')
    .replace(/📖.*?<?(https?:\/\/[^\s>]+)>?/g, '')
    .trim();
  
  // Build Slack blocks
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: mainText
      }
    }
  ];
  
  // Add pro tip if found
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
  
  // Add learn more link
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `📖 <${learnMoreUrl}|Learn more>`
      }
    ]
  });
  
  return {
    statusCode: 200,
    body: {
      response_type: 'in_channel',
      blocks: blocks
    }
  };
}

module.exports = {
  getAIResponse,
  parseAIResponse
};
