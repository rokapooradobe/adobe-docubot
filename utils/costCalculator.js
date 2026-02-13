/**
 * Cost Calculator Utility
 * 
 * Handles cost-related questions about Adobe I/O Runtime pricing.
 * Performs calculations and provides optimization tips.
 */

/**
 * Adobe I/O Runtime Pricing (as of 2024)
 * Source: https://developer.adobe.com/app-builder/docs/overview/
 */
const PRICING = {
  memoryGBPerSecond: 0.00001667, // $0.00001667 per GB-second
  executions: 0.0000002,          // $0.0000002 per execution
  freeGBSeconds: 400000,          // Free tier: 400K GB-seconds per month
  freeExecutions: 1000000,        // Free tier: 1M executions per month
};

/**
 * Check if question is asking about costs
 * @param {string} question - User's question
 * @returns {boolean} True if cost-related question
 */
function isCostQuestion(question) {
  const lowerQuestion = question.toLowerCase();
  return lowerQuestion.includes('cost') || 
         lowerQuestion.includes('price') || 
         lowerQuestion.includes('pricing') ||
         lowerQuestion.includes('calculate') ||
         (lowerQuestion.includes('how much') && lowerQuestion.includes('$'));
}

/**
 * Calculate costs for App Builder runtime
 * @param {string} question - User's question with parameters
 * @returns {object} Formatted response with calculation
 */
function calculateCost(question) {
  try {
    // Parse parameters from question
    const params = parseParameters(question);
    
    if (!params.memory || !params.duration || !params.executions) {
      return {
        answer: `🤖 *Adobe DocuBot - Cost Calculator*\n\nTo calculate costs, I need:\n• Memory (MB): e.g., 512MB\n• Duration (seconds): e.g., 5s\n• Executions per month: e.g., 100\n\nExample: "Calculate costs for 512MB running 5s, 100 times daily"`,
        proTip: 'Lower memory allocation = lower costs. Start with 256-512 MB and scale up only if needed.',
        learnMoreUrl: 'https://developer.adobe.com/app-builder/docs/overview/'
      };
    }
    
    // Calculate costs
    const memoryGB = params.memory / 1024;
    const gbSeconds = memoryGB * params.duration * params.executions;
    const memoryCost = Math.max(0, gbSeconds - PRICING.freeGBSeconds) * PRICING.memoryGBPerSecond;
    const executionCost = Math.max(0, params.executions - PRICING.freeExecutions) * PRICING.executions;
    const totalCost = memoryCost + executionCost;
    
    // Format response
    const answer = `🤖 *Adobe DocuBot - Cost Calculator*\n\n` +
      `**Configuration:**\n` +
      `• Memory: ${params.memory} MB (${memoryGB.toFixed(2)} GB)\n` +
      `• Duration: ${params.duration}s per execution\n` +
      `• Executions: ${params.executions.toLocaleString()} per month\n\n` +
      `**Calculations:**\n` +
      `• GB-seconds: ${gbSeconds.toLocaleString()} (Free tier: ${PRICING.freeGBSeconds.toLocaleString()})\n` +
      `• Memory cost: $${memoryCost.toFixed(4)}\n` +
      `• Execution cost: $${executionCost.toFixed(4)}\n\n` +
      `**Total: $${totalCost.toFixed(2)}/month**`;
    
    const proTip = totalCost === 0 
      ? 'Your usage fits within the free tier! 🎉'
      : `To reduce costs: Lower memory allocation, optimize execution time, or cache results to reduce executions.`;
    
    return {
      answer,
      proTip,
      learnMoreUrl: 'https://developer.adobe.com/app-builder/docs/overview/'
    };
    
  } catch (error) {
    console.error('Error calculating costs:', error.message);
    return {
      answer: `🤖 *Adobe DocuBot*\n\nI had trouble parsing your cost question. Try this format:\n"Calculate costs for 512MB running 5s, 100 times daily"`,
      proTip: 'Include memory (MB), duration (seconds), and number of executions.',
      learnMoreUrl: 'https://developer.adobe.com/app-builder/docs/overview/'
    };
  }
}

/**
 * Parse parameters from cost question
 * @param {string} question - User's question
 * @returns {object} Parsed parameters
 */
function parseParameters(question) {
  const params = {};
  
  // Extract memory (MB)
  const memoryMatch = question.match(/(\d+)\s*MB/i);
  if (memoryMatch) {
    params.memory = parseInt(memoryMatch[1]);
  }
  
  // Extract duration (seconds)
  const durationMatch = question.match(/(\d+)\s*s(?:ec(?:ond)?s?)?/i);
  if (durationMatch) {
    params.duration = parseInt(durationMatch[1]);
  }
  
  // Extract executions
  const executionsMatch = question.match(/(\d+)\s*(?:times?|executions?)/i);
  if (executionsMatch) {
    let executions = parseInt(executionsMatch[1]);
    
    // Check if it's daily (multiply by 30)
    if (question.match(/daily|per\s+day|each\s+day/i)) {
      executions *= 30;
    }
    
    params.executions = executions;
  }
  
  return params;
}

module.exports = {
  isCostQuestion,
  calculateCost,
  parseParameters,
  PRICING
};
