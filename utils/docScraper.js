/**
 * Documentation Scraper Utility
 * 
 * Primary mode: Matches user questions against a local docs index
 * using keyword scoring, then fetches the best-matching pages.
 * Fallback: Simple keyword-to-URL mapping for known topics.
 */

const axios = require('axios');
const cheerio = require('cheerio');

const DOCS_CONFIG = {
  baseUrl: process.env.DOCS_BASE_URL || 'https://developer.adobe.com/app-builder/docs/',
  name: process.env.DOCS_NAME || 'App Builder',
};

const BASE_DOMAIN = 'https://developer.adobe.com';

const DOCS_INDEX = [
  { title: 'What is App Builder', path: '/app-builder/docs/intro_and_overview/what-is-app-builder' },
  { title: 'App Builder Overview', path: '/app-builder/docs/intro_and_overview/app_builder_overview' },
  { title: 'Architecture Overview', path: '/app-builder/docs/guides/app_builder_guides/architecture_overview/architecture-overview' },
  { title: 'Storage Options State Files Database', path: '/app-builder/docs/guides/app_builder_guides/storage/' },
  { title: 'State Key-Value Store AIO State aio-lib-state TTL', path: '/app-builder/docs/guides/app_builder_guides/storage/application-state' },
  { title: 'Database Storage MongoDB DocumentDB aio-lib-db', path: '/app-builder/docs/guides/app_builder_guides/storage/database' },
  { title: 'Deployment Deploy Undeploy aio app deploy', path: '/app-builder/docs/guides/app_builder_guides/deployment/deployment' },
  { title: 'CI CD Pipeline GitHub Actions', path: '/app-builder/docs/guides/app_builder_guides/deployment/cicd-for-app-builder-apps' },
  { title: 'Credential Rotation Rotate Credentials', path: '/app-builder/docs/guides/app_builder_guides/deployment/credential-rotation' },
  { title: 'Configuration app.config.yaml Environment Variables', path: '/app-builder/docs/guides/app_builder_guides/configuration/configuration' },
  { title: 'Webpack Configuration Bundling', path: '/app-builder/docs/guides/app_builder_guides/configuration/webpack-configuration' },
  { title: 'App Hooks Pre Post Build Deploy', path: '/app-builder/docs/guides/app_builder_guides/configuration/app-hooks' },
  { title: 'Application Logging Logs Debug Monitor aio app logs', path: '/app-builder/docs/guides/app_builder_guides/application_logging/' },
  { title: 'Logging SDK Library aio-lib-core-logging', path: '/app-builder/docs/guides/app_builder_guides/application_logging/logging' },
  { title: 'Security Authentication OAuth IMS Token', path: '/app-builder/docs/guides/app_builder_guides/security/understanding-authentication' },
  { title: 'Events Webhooks Triggers Adobe I/O Events', path: '/app-builder/docs/guides/app_builder_guides/events/' },
  { title: 'Extensions Experience Cloud SPA UI', path: '/app-builder/docs/guides/app_builder_guides/exc_app/migrate-app-to-exp-cloud-spa' },
  { title: 'Actions Runtime Serverless Functions Invoke Timeout Memory Limits', path: '/app-builder/docs/guides/app_builder_guides/actions/' },
  { title: 'Getting Started First App Tutorial', path: '/app-builder/docs/get_started/' },
  { title: 'AI Development Tools AI Use Cases', path: '/app-builder/docs/get_started/app_builder_get_started/ai-development-tools' },
  { title: 'AI Use Cases Skills MCP Agents', path: '/app-builder/docs/resources/ai-use-cases' },
  { title: 'Files SDK Cloud Storage aio-lib-files Blob', path: '/app-builder/docs/guides/app_builder_guides/storage/application-state' },
  { title: 'SDK Libraries aio-sdk Analytics Target Campaign', path: '/app-builder/docs/guides/' },
  { title: 'CLI Command Line aio commands', path: '/app-builder/docs/guides/' },
  { title: 'Guides Index Overview', path: '/app-builder/docs/guides/' },
];

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'in', 'on', 'of', 'to', 'for', 'and',
  'or', 'but', 'not', 'with', 'this', 'that', 'from', 'by', 'as', 'at',
  'be', 'are', 'was', 'were', 'do', 'does', 'did', 'has', 'have', 'had',
  'can', 'could', 'will', 'would', 'should', 'may', 'might', 'what',
  'how', 'why', 'when', 'where', 'which', 'who', 'whom', 'me', 'my', 'i'
]);

async function scrapeDocs(question) {
  try {
    const matchedUrls = matchQuestionToPages(question);
    
    if (matchedUrls.length > 0) {
      console.log(`Index match found: ${matchedUrls.length} pages`);
      const docContents = await Promise.all(
        matchedUrls.map(url => fetchAndParseDocs(url))
      );
      
      const content = docContents
        .filter(c => c)
        .join('\n\n---\n\n')
        .substring(0, 15000);
      
      if (content.length > 200) return content;
    }
    
    console.log('Falling back to keyword-based URL matching');
    const fallbackUrls = identifyRelevantUrls(question);
    const fallbackContents = await Promise.all(
      fallbackUrls.map(url => fetchAndParseDocs(url))
    );
    
    const fallbackContent = fallbackContents
      .filter(c => c)
      .join('\n\n---\n\n')
      .substring(0, 12000);
    
    return fallbackContent || null;
    
  } catch (error) {
    console.error('Error scraping docs:', error.message);
    return null;
  }
}

function matchQuestionToPages(question) {
  const queryWords = question.toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  
  const scored = DOCS_INDEX.map(page => {
    const titleLower = page.title.toLowerCase();
    let score = 0;
    
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 1;
      }
      if (titleLower.includes(word) && word.length > 3) {
        score += 0.5;
      }
    }
    
    const phrase = queryWords.join(' ');
    if (titleLower.includes(phrase)) {
      score += 3;
    }
    
    for (let i = 0; i < queryWords.length - 1; i++) {
      const twoWord = queryWords[i] + ' ' + queryWords[i + 1];
      if (titleLower.includes(twoWord)) {
        score += 2;
      }
    }
    
    return { ...page, score };
  });
  
  const matches = scored
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  return matches.map(m => {
    const url = m.path.startsWith('http') ? m.path : BASE_DOMAIN + m.path;
    console.log(`  Matched: "${m.title}" (score: ${m.score}) → ${url}`);
    return url;
  });
}

// Fallback: original keyword-to-URL mapping
const APP_BUILDER_URLS = {
  overview: 'https://developer.adobe.com/app-builder/docs/overview/',
  gettingStarted: 'https://developer.adobe.com/app-builder/docs/getting_started/',
  guides: 'https://developer.adobe.com/app-builder/docs/guides/',
  deployment: 'https://developer.adobe.com/app-builder/docs/guides/deployment/',
  runtime: 'https://developer.adobe.com/runtime/docs/guides/',
  actions: 'https://developer.adobe.com/app-builder/docs/guides/actions/',
};

function identifyRelevantUrls(question) {
  const lowerQuestion = question.toLowerCase();
  const urls = [];
  
  if (lowerQuestion.includes('deploy') || lowerQuestion.includes('deployment')) {
    urls.push(APP_BUILDER_URLS.deployment);
  }
  
  if (lowerQuestion.includes('start') || lowerQuestion.includes('begin') || lowerQuestion.includes('getting started')) {
    urls.push(APP_BUILDER_URLS.gettingStarted);
  }
  
  if (lowerQuestion.includes('action') || lowerQuestion.includes('function') || lowerQuestion.includes('runtime')) {
    urls.push(APP_BUILDER_URLS.actions);
    urls.push(APP_BUILDER_URLS.runtime);
  }
  
  if (lowerQuestion.includes('overview') || lowerQuestion.includes('what is') || lowerQuestion.includes('introduction')) {
    urls.push(APP_BUILDER_URLS.overview);
  }
  
  if (lowerQuestion.includes('guide') || urls.length === 0) {
    urls.push(APP_BUILDER_URLS.guides);
  }
  
  return urls.slice(0, 2);
}

async function fetchAndParseDocs(url) {
  try {
    console.log(`Fetching docs from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 5,
      headers: { 'User-Agent': 'Adobe-DocuBot/1.0' }
    });
    
    const $ = cheerio.load(response.data);
    
    $('nav, footer, .ad, .sidebar, .navigation, header, .header, script, style').remove();
    
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
    
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    content = `Source: ${url}\n\n${content}`;
    
    return content.substring(0, 6000);
    
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

module.exports = {
  scrapeDocs,
  identifyRelevantUrls,
  matchQuestionToPages,
  fetchAndParseDocs,
  DOCS_CONFIG,
  DOCS_INDEX
};
