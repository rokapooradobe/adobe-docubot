/**
 * Documentation Scraper Utility
 * 
 * Configurable scraper that can point to any public documentation.
 * Fetches relevant pages based on user questions and extracts clean text.
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Read documentation configuration from environment variables
const DOCS_CONFIG = {
  baseUrl: process.env.DOCS_BASE_URL || 'https://developer.adobe.com/app-builder/docs/',
  name: process.env.DOCS_NAME || 'App Builder',
};

/**
 * Scrape relevant documentation based on user question
 * @param {string} question - User's question
 * @returns {Promise<string>} Relevant documentation content
 */
async function scrapeDocs(question) {
  try {
    // Build search URLs based on keywords
    const urls = buildSearchUrls(question);
    
    // Fetch and parse documentation
    const docContents = await Promise.all(
      urls.map(url => fetchAndParseDocs(url))
    );
    
    // Combine and limit content (max 3000 tokens ~= 12000 chars)
    const combinedContent = docContents
      .filter(content => content)
      .join('\n\n---\n\n')
      .substring(0, 15000); // Increased to 15000 to accommodate multiple pages
    
    return combinedContent;
    
  } catch (error) {
    console.error('Error scraping docs:', error.message);
    return null;
  }
}

/**
 * Build search URLs based on question keywords
 * For App Builder, scrape entire sections to catch all related docs
 * @param {string} question - User's question
 * @returns {Array<string>} Array of URLs to scrape
 */
function buildSearchUrls(question) {
  const lowerQuestion = question.toLowerCase();
  const urls = [];
  
  // For App Builder, use the comprehensive guides path
  const guidesBase = 'https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/';
  
  // Scrape ENTIRE sections based on topic area
  
  // Deployment section (deployment, CI/CD, credential rotation, github actions)
  if (lowerQuestion.match(/\b(deploy|deployment|undeploy|ci\/?cd|pipeline|credential|rotation|rotate|github|cicd)\b/)) {
    urls.push(
      guidesBase + 'deployment/deployment',
      guidesBase + 'deployment/ci_cd',
      guidesBase + 'deployment/credential-rotation'
    );
  }
  
  // Configuration section (app.config.yaml, .env, hooks, manifest)
  if (lowerQuestion.match(/\b(config|configuration|app\.config|manifest|\.env|environment|variable|hook)\b/)) {
    urls.push(
      guidesBase + 'configuration/configuration',
      guidesBase + 'configuration/app-hooks'
    );
  }
  
  // Storage section (database, state, key-value, files)
  if (lowerQuestion.match(/\b(database|storage|db|mongodb|persist|state|key-value|aio-lib-db|collection|document)\b/)) {
    urls.push(
      guidesBase + 'storage',
      guidesBase + 'storage/database'
    );
  }
  
  // Logging & Debugging section
  if (lowerQuestion.match(/\b(log|logging|debug|monitor|troubleshoot|trace)\b/)) {
    urls.push(
      guidesBase + 'application_logging'
    );
  }
  
  // Events section (webhooks, triggers, I/O Events)
  if (lowerQuestion.match(/\b(event|webhook|trigger|adobe\s+i\/o\s+event)\b/)) {
    urls.push(
      'https://developer.adobe.com/app-builder/docs/guides/events/'
    );
  }
  
  // Security & Authentication section
  if (lowerQuestion.match(/\b(security|secure|auth|authentication|credential|token|ims|oauth)\b/)) {
    urls.push(
      'https://developer.adobe.com/app-builder/docs/guides/security/',
      'https://developer.adobe.com/app-builder/docs/guides/security/authentication/'
    );
  }
  
  // Actions & Runtime section
  if (lowerQuestion.match(/\b(action|function|runtime|invoke|serverless|limit|timeout|memory)\b/)) {
    urls.push(
      'https://developer.adobe.com/app-builder/docs/guides/actions/',
      'https://developer.adobe.com/runtime/docs/guides/'
    );
  }
  
  // Extensions section
  if (lowerQuestion.match(/\b(extension|excshell|experience\s+cloud|spa)\b/)) {
    urls.push(
      'https://developer.adobe.com/app-builder/docs/guides/extensions/'
    );
  }
  
  // Overview & Getting Started
  if (lowerQuestion.match(/\b(what\s+is|overview|introduction|start|begin|getting\s+started|first\s+app)\b/)) {
    urls.push(
      DOCS_CONFIG.baseUrl + 'overview/',
      DOCS_CONFIG.baseUrl + 'getting_started/'
    );
  }
  
  // If no specific matches, use main guides
  if (urls.length === 0) {
    urls.push(DOCS_CONFIG.baseUrl + 'guides/');
  }
  
  // Remove duplicates and limit to 3 URLs (since we're getting more comprehensive coverage)
  return [...new Set(urls)].slice(0, 3);
}

/**
 * Fetch and parse documentation from a URL
 * @param {string} url - Documentation URL
 * @returns {Promise<string>} Parsed documentation content
 */
async function fetchAndParseDocs(url) {
  try {
    console.log(`Fetching docs from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5, // Follow redirects
      headers: {
        'User-Agent': 'Adobe-DocuBot/1.0'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements (navigation, footer, ads, sidebar)
    $('nav, footer, .ad, .sidebar, .navigation, header, .header').remove();
    
    // Extract main content (try common selectors)
    let content = '';
    if ($('main').length) {
      content = $('main').text();
    } else if ($('.main-content').length) {
      content = $('.main-content').text();
    } else if ($('article').length) {
      content = $('article').text();
    } else {
      content = $('body').text();
    }
    
    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    // Add source URL
    content = `Source: ${url}\n\n${content}`;
    
    return content.substring(0, 6000); // Limit per URL
    
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

module.exports = {
  scrapeDocs,
  buildSearchUrls,
  fetchAndParseDocs,
  DOCS_CONFIG
};
