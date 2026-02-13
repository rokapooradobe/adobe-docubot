# Adobe DocuBot 🤖

> AI-powered Slack bot for instant documentation answers

An AI-powered Slack bot that answers questions by intelligently scraping ANY public documentation and using AI to provide helpful, contextual answers with code examples and source links. **Add it to any Slack channel or use it via direct message.**

**Built with**: Adobe App Builder + Groq AI + Slack  
**Default Configuration**: Scrapes App Builder documentation (developer.adobe.com/app-builder/docs/)  
**Key Feature**: Easily reconfigure to work with ANY documentation site  
**Pricing**: Available at developer.adobe.com/app-builder/docs/overview/

---

## Why App Builder for a Slack Bot?

Building DocuBot on Adobe App Builder provides enterprise-grade advantages:

### 🚀 **Speed & Simplicity**
- **Deploy in seconds**: One command (`aio app deploy`) from code to production
- **No infrastructure management**: No servers, containers, or Kubernetes to configure
- **Auto-scaling**: Handles 1 user or 10,000 users automatically
- **Global deployment**: Adobe manages worldwide infrastructure

### 🔒 **Enterprise Security**
- **Isolated execution**: Each request runs in a secure container
- **Encrypted credentials**: API keys stored securely, never in code
- **Built-in authentication**: Enterprise-grade identity management
- **Audit logging**: Track all bot interactions for compliance

### 💰 **Cost Efficiency**
- **Pay-per-use**: Only pay for actual bot usage (GB-seconds)
- **No idle costs**: No charges when bot is not answering questions
- **Free tier available**: Generous credits for prototyping and small teams
- **Predictable scaling**: Costs scale linearly with usage

### 🔌 **Integration Ready**
- **Adobe APIs**: Native access to Analytics, AEM, Campaign, Experience Platform
- **Slack integration**: Built-in webhook support, rich message formatting
- **AI services**: Easy integration with Groq, OpenAI, Claude, or custom models
- **Any API**: Connect to internal systems, databases, or third-party services

**Perfect for**: Team documentation bots, internal knowledge bases, customer support assistants, developer tools

---

## What It Does

Type `/ab <your question>` in any Slack channel (or direct message) and get instant, intelligent answers from any documentation you configure.

**By default, DocuBot answers questions about Adobe App Builder.** Change two environment variables to point it at any other documentation source.

### Comprehensive App Builder Coverage

**DocuBot scrapes entire documentation sections**, not just individual pages. When you ask a question, it:

1. **Identifies the topic** (deployment, configuration, storage, security, etc.)
2. **Scrapes ALL related pages** in that section (e.g., deployment section includes main deployment docs, CI/CD, credential rotation, GitHub Actions)
3. **Passes comprehensive context** to AI for accurate answers
4. **Includes specific sub-topics** like credential rotation, app hooks, database provisioning, etc.

**Covered Topics:**
- ✅ Deployment (including CI/CD, credential rotation, GitHub Actions)
- ✅ Configuration (app.config.yaml, .env, hooks)
- ✅ Storage (database, state SDK, key-value)
- ✅ Security (authentication, credentials, IMS)
- ✅ Logging (application logging, debugging, monitoring)
- ✅ Events (webhooks, triggers, Adobe I/O Events)
- ✅ Actions (runtime, limits, timeouts, memory)
- ✅ Extensions (Experience Cloud Shell, SPAs)

**Example Coverage:**
```
Question: "How do I rotate credentials?"
DocuBot scrapes:
  - deployment/deployment
  - deployment/ci_cd
  - deployment/credential-rotation ← Finds this specific page!
```

### Default: App Builder Docs

**Out of the box**, DocuBot scrapes and answers questions from [Adobe App Builder documentation](https://developer.adobe.com/app-builder/docs/).
```
You: /ab How do I deploy my app?

DocuBot: 🤖 To deploy your app, use:
       
       aio app deploy
       
       This will build your actions and deploy to Adobe I/O Runtime
       
       💡 Pro tip: Use --no-build if you've already built locally
       📖 Learn more: developer.adobe.com/app-builder/docs/...
```

### Reconfigure for AEM (or ANY docs)
```bash
# Change environment variables:
DOCS_BASE_URL=https://experienceleague.adobe.com/en/docs/experience-manager/
DOCS_NAME=Adobe Experience Manager

# Redeploy (30 seconds):
aio app deploy

# Now ask AEM questions:
You: /ab How do I create content fragments?
DocuBot: [Returns AEM-specific answer with code examples]
```

### Works With ANY Documentation

**Adobe Products:**
- ✅ App Builder (developer.adobe.com/app-builder/docs/)
- ✅ Adobe Experience Manager (experienceleague.adobe.com/en/docs/experience-manager/)
- ✅ Adobe Experience Platform (experienceleague.adobe.com/en/docs/experience-platform/)

**Public Documentation:**
- ✅ Kubernetes (kubernetes.io/docs/)
- ✅ React (react.dev/)
- ✅ Docker (docs.docker.com/)
- ✅ Angular, Vue, Next.js, and more

**Other Sources:**
- ✅ Internal company documentation
- ✅ API documentation (Stripe, Twilio, AWS)
- ✅ ANY publicly accessible docs

---

## Quick Start

### Prerequisites
1. **Adobe Developer Account** with App Builder access (sign up at developer.adobe.com)
2. **Slack workspace** with admin access
3. **AI API key** - Choose one:
   - **Groq** (free tier: 14,400 requests/day at console.groq.com) - Recommended
   - **Claude** (if you have API credits at console.anthropic.com)

### Setup Steps

#### Step 1: Install Adobe I/O CLI
```bash
npm install -g @adobe/aio-cli
```

#### Step 2: Login to Adobe
```bash
aio login
```
Follow the prompts to authenticate with your Adobe account.

#### Step 3: Create App Builder Project

**Option A: Via Adobe Developer Console (Recommended)**
1. Go to [Adobe Developer Console](https://developer.adobe.com/console)
2. Click "Create project from template" → Select "App Builder"
3. Enter Project Title and App Name
4. Keep "Include Runtime with each workspace" checked
5. Save to generate the project

**Option B: Via CLI (Select existing project)**
```bash
# Initialize and select your existing Console project
aio app init adobe-docubot

# When prompted, select:
# - Organization: (select your org)
# - Project: (select the project you created in Console)
# - Workspace: Stage (recommended for development)
# - Template: Select "All Actions" or "Generic"
```

**Note:** Projects must be created in Adobe Developer Console first. The CLI is used to select and configure existing projects locally.

📚 **Documentation:** [Create your First App Builder Application](https://developer.adobe.com/app-builder/docs/getting_started/first_app/)

This creates the project structure and connects it to Adobe I/O Runtime.

#### Step 4: Copy Code from GitHub Repository
```bash
# Navigate to your new project
cd adobe-docubot

# Clone the DocuBot code (use a temporary directory)
git clone https://github.com/robbiekapoor/adobe-docubot.git temp-docubot

# Copy the required files from the cloned repo
cp -r temp-docubot/actions/* ./actions/
cp -r temp-docubot/utils ./
cp temp-docubot/package.json ./package.json
cp temp-docubot/app.config.yaml ./app.config.yaml
cp temp-docubot/.env.example ./.env.example
cp temp-docubot/.gitignore ./.gitignore

# Remove temporary directory
rm -rf temp-docubot
```

#### Step 5: Configure Environment Variables
```bash
# Copy the example and edit with your credentials
cp .env.example .env

# Edit .env with your API keys:
# - SLACK_BOT_TOKEN (from api.slack.com/apps)
# - SLACK_SIGNING_SECRET (from api.slack.com/apps)
# - GROQ_API_KEY (from console.groq.com)
# - DOCS_BASE_URL (documentation source)
# - DOCS_NAME (documentation name)
```

See the [Environment Variables](#environment-variables) section below for detailed configuration.

#### Step 6: Install Dependencies
```bash
npm install
```

#### Step 7: Deploy to App Builder
```bash
aio app deploy
```

This will:
- Build your action
- Deploy to Adobe I/O Runtime
- Provide your action URL (use this for Slack webhook)

#### Step 8: Configure Slack App
1. Go to api.slack.com/apps
2. Create new app → From scratch
3. Add Slash Command:
   - Command: `/ab`
   - Request URL: (your action URL from step 7)
   - Description: "Ask DocuBot anything"
4. Install app to workspace
5. Copy Bot Token and Signing Secret to `.env`
6. Redeploy: `aio app deploy`

#### Step 9: Test It!
```bash
# In Slack, type:
/ab How do I deploy my app?

# Or test directly via CLI:
aio runtime action invoke adobe-docubot/ask --param text "How do I deploy?" --result
```

---

## Quick Start (Alternative: Manual Clone)

If you prefer to clone the repo directly and initialize afterwards:

```bash
# Clone the repository
git clone https://github.com/robbiekapoor/adobe-docubot.git
cd adobe-docubot

# Initialize App Builder (this connects to Adobe I/O Runtime)
aio login
aio console project select

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Install and deploy
npm install
aio app deploy
```

**Note:** This approach requires manually connecting to an Adobe Developer Console project.

---

## Architecture

### High-Level Flow with App Builder Internals

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER IN SLACK                              │
│                     Types: /ab How do I deploy?                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS POST Request (Slack Webhook)
                                 │ Headers: Signature, Timestamp
                                 ▼
╔═════════════════════════════════════════════════════════════════════════╗
║                         ADOBE APP BUILDER                               ║
║                         (Adobe I/O Runtime)                             ║
║ ┌─────────────────────────────────────────────────────────────────────┐ ║
║ │                      RUNTIME INFRASTRUCTURE                         │ ║
║ │  • Global Load Balancer (Auto-routes to nearest region)            │ ║
║ │  • API Gateway (developer.adobe.com, adobeioruntime.net)           │ ║
║ │  • Request Authentication & Authorization                           │ ║
║ └───────────────────────────────┬─────────────────────────────────────┘ ║
║                                 │                                       ║
║                                 │ Invokes Action                        ║
║                                 ▼                                       ║
║ ┌─────────────────────────────────────────────────────────────────────┐ ║
║ │                  CONTAINER ORCHESTRATION LAYER                      │ ║
║ │                    (Adobe I/O Runtime Controller)                   │ ║
║ │                                                                     │ ║
║ │  Decision: Warm Container Available?                               │ ║
║ │  ├─ YES → Reuse existing container (0ms cold start)                │ ║
║ │  └─ NO  → Provision new container (200-500ms)                      │ ║
║ └───────────────────────────────┬─────────────────────────────────────┘ ║
║                                 │                                       ║
║                                 │ Container Ready                       ║
║                                 ▼                                       ║
║ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║
║ ┃              ISOLATED DOCKER CONTAINER (Per Request)             ┃ ║
║ ┃                     Node.js 18 Runtime                           ┃ ║
║ ┃                     Memory: 512MB                                ┃ ║
║ ┃                     Timeout: 30 seconds                          ┃ ║
║ ┃                     Network: Restricted                          ┃ ║
║ ┃ ┌───────────────────────────────────────────────────────────────┐ ┃ ║
║ ┃ │              CREDENTIAL INJECTION (Secure)                    │ ┃ ║
║ ┃ │  Adobe I/O injects secrets as environment variables:         │ ┃ ║
║ ┃ │  - GROQ_API_KEY (encrypted at rest)                          │ ┃ ║
║ ┃ │  - SLACK_BOT_TOKEN (encrypted at rest)                       │ ┃ ║
║ ┃ │  - SLACK_SIGNING_SECRET (encrypted at rest)                  │ ┃ ║
║ ┃ │  - DOCS_BASE_URL, DOCS_NAME (configuration)                  │ ┃ ║
║ ┃ │  ✓ Never stored in code or logs                              │ ┃ ║
║ ┃ └───────────────────────────────────────────────────────────────┘ ┃ ║
║ ┃                              ↓                                    ┃ ║
║ ┃ ┌───────────────────────────────────────────────────────────────┐ ┃ ║
║ ┃ │            DocuBot Action Code (actions/ask/index.js)         │ ┃ ║
║ ┃ │                                                               │ ┃ ║
║ ┃ │  ┌─────────────────────────────────────────────────────────┐ │ ┃ ║
║ ┃ │  │ Step 1: Security Layer                                  │ │ ┃ ║
║ ┃ │  │  - Verify Slack signature                               │ │ ┃ ║
║ ┃ │  │  - Rate limit check (10 req/min per user)               │ │ ┃ ║
║ ┃ │  │  - Input validation (max 500 chars)                     │ │ ┃ ║
║ ┃ │  │  - Sanitize input (remove HTML, scripts)                │ │ ┃ ║
║ ┃ │  │  - Mask API keys in logs                                │ │ ┃ ║
║ ┃ │  └─────────────────────────────────────────────────────────┘ │ ┃ ║
║ ┃ │                           ↓                                   │ ┃ ║
║ ┃ │  ┌─────────────────────────────────────────────────────────┐ │ ┃ ║
║ ┃ │  │ Step 2: Documentation Scraper (utils/docScraper.js)     │ │ ┃ ║
║ ┃ │  │  - Read DOCS_BASE_URL from environment                  │ │ ┃ ║
║ ┃ │  │  - HTTP GET to docs site (axios)                        │ │ ┃ ║
║ ┃ │  │  - Parse HTML (Cheerio library)                         │ │ ┃ ║
║ ┃ │  │  - Extract text, remove nav/footer                      │ │ ┃ ║
║ ┃ │  │  - Return relevant sections (~2-3K tokens)              │ │ ┃ ║
║ ┃ │  └─────────────────────────────────────────────────────────┘ │ ┃ ║
║ ┃ │                           ↓                                   │ ┃ ║
║ ┃ │  ┌─────────────────────────────────────────────────────────┐ │ ┃ ║
║ ┃ │  │ Step 3: AI Processing (utils/aiClient.js)      ─────────┼─┼─┼─┐
║ ┃ │  │  - Build system prompt                             │    │ │ ┃ ║
║ ┃ │  │  - Add documentation context                       │    │ │ ┃ ║
║ ┃ │  │  - Add user question                               │    │ │ ┃ ║
║ ┃ │  │  - HTTPS POST to Groq API ─────────────────────────┼────┼─┼─┼─┐
║ ┃ │  │  - Parse JSON response                             │    │ │ ┃ ║│
║ ┃ │  │  - Extract answer text                             │    │ │ ┃ ║│
║ ┃ │  └─────────────────────────────────────────────────────────┘ │ ┃ ║│
║ ┃ │                           ↓                                   │ ┃ ║│
║ ┃ │  ┌─────────────────────────────────────────────────────────┐ │ ┃ ║│
║ ┃ │  │ Step 4: Response Formatter                              │ │ ┃ ║│
║ ┃ │  │  - Parse AI response for structure                      │ │ ┃ ║│
║ ┃ │  │  - Extract pro tips, links, code blocks                 │ │ ┃ ║│
║ ┃ │  │  - Format as Slack Block Kit JSON                       │ │ ┃ ║│
║ ┃ │  │  - Add emojis (🤖, 💡, 📖)                              │ │ ┃ ║│
║ ┃ │  └─────────────────────────────────────────────────────────┘ │ ┃ ║│
║ ┃ └───────────────────────────────────────────────────────────────┘ ┃ ║│
║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║│
║                                 │                                       ║│
║                                 │ Return Response                       ║│
║                                 ▼                                       ║│
║ ┌─────────────────────────────────────────────────────────────────────┐ ║│
║ │                      RUNTIME POST-PROCESSING                        │ ║│
║ │  • Log metrics (duration, memory used, status code)                 │ ║│
║ │  • Bill compute time (GB-seconds)                                   │ ║│
║ │  • Keep container warm for 10 minutes (optimization)                │ ║│
║ │  • Destroy container after timeout or error                         │ ║│
║ └───────────────────────────────┬─────────────────────────────────────┘ ║│
╚═════════════════════════════════╪═════════════════════════════════════╝│
                                  │                HTTPS Request          │
                     HTTPS Response│                (API call)             │
                                  │                                       │
                                  ▼                                       ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│          SLACK WORKSPACE             │  │      GROQ AI API             │
│                                      │  │  (Llama 3.3 70B Model)       │
│  User sees formatted response:       │  │                              │
│  ──────────────────────────────────  │  │  Cloud Infrastructure:       │
│  🤖 *Adobe DocuBot*                  │  │  - Load-balanced endpoints   │
│                                      │  │  - Model inference servers   │
│  To deploy your app, use:            │  │  - GPU clusters              │
│                                      │  │                              │
│  `aio app deploy`                    │  │  Processing:                 │
│                                      │  │  - Tokenize prompt           │
│  This will build and deploy to       │  │  - Run through 70B model    │
│  Adobe I/O Runtime.                  │  │  - Generate response tokens  │
│                                      │  │  - Return JSON               │
│  💡 *Pro tip:* Use --skip-build      │  │                              │
│  if you've already built locally.    │  │  Free tier:                  │
│                                      │  │  14,400 requests/day         │
│  📖 Learn more: [documentation URL]  │  │  ~3-5 second response time   │
└──────────────────────────────────────┘  └──────────────────────────────┘
                                                      ▲
                                                      │
                                         Fetches docs from configured URL
                                         (HTTP GET request from container)
                                                      │
                                                      ▼
                                          ┌───────────────────────────┐
                                          │  DOCUMENTATION SOURCE     │
                                          │  (Configurable via env)   │
                                          │                           │
                                          │  Default:                 │
                                          │  developer.adobe.com/     │
                                          │  app-builder/docs/        │
                                          │                           │
                                          │  Can be ANY public docs:  │
                                          │  ✓ Adobe (AEM, Analytics) │
                                          │  ✓ Kubernetes, React      │
                                          │  ✓ Docker, Angular        │
                                          │  ✓ Your internal docs     │
                                          │                           │
                                          │  CDN-backed, globally     │
                                          │  distributed HTML pages   │
                                          └───────────────────────────┘
```

### App Builder Runtime Details

#### Container Lifecycle
1. **Cold Start** (200-500ms): New container provisioned
   - Pull Docker image (Node.js 18)
   - Initialize Node.js runtime
   - Load action code
   - Inject credentials
   
2. **Warm Execution** (0ms overhead): Reuse existing container
   - Container kept alive for 10 minutes after last use
   - Subsequent requests use same container
   - Much faster response time

3. **Container Isolation**
   - Each action runs in isolated Docker container
   - Dedicated memory allocation (512MB for DocuBot)
   - Network restrictions (only HTTPS outbound)
   - No container sharing between users/requests

#### Auto-Scaling
- **0 to 1000+ concurrent containers** automatically
- Adobe manages all infrastructure
- No configuration needed
- Scales based on demand
- Transparent to developer

#### Security Layers
1. **API Gateway**: Request authentication, rate limiting
2. **Container Isolation**: Process-level separation
3. **Credential Management**: Encrypted secrets injection
4. **Network Security**: Restricted egress, no direct container access
5. **Application Security**: Custom rate limiting, input validation

### Data Flow

1. **User Action**: Types `/ab <question>` in Slack
2. **Slack Webhook**: Sends HTTPS POST to App Builder action URL
3. **Security Check**: Rate limiting (10/min), input validation, sanitization
4. **Doc Scraping**: Fetches relevant pages from `DOCS_BASE_URL` (configurable)
5. **AI Request**: Sends documentation context + question to Groq API
6. **AI Response**: Llama 3.3 70B generates contextual answer with examples
7. **Format Response**: Converts to Slack Block Kit format (markdown, emojis, links)
8. **Return to User**: Displays formatted answer in Slack channel

### Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Adobe I/O Runtime | Serverless execution, auto-scaling |
| **Action Handler** | Node.js 18 | Orchestrates entire flow |
| **AI Service** | Groq API (Llama 3.3 70B) | Natural language understanding & generation |
| **Web Scraper** | Cheerio (HTML parser) | Extracts clean text from documentation |
| **Chat Interface** | Slack Block Kit | Rich message formatting |
| **Security** | Custom middleware | Rate limiting, input validation, key masking |
| **Configuration** | Environment variables | Point at ANY documentation source |

### Configuration Magic

```bash
# Change these two variables:
DOCS_BASE_URL=https://developer.adobe.com/app-builder/docs/
DOCS_NAME=App Builder

# Redeploy (30 seconds):
aio app deploy

# Now the SAME code answers questions from different docs!
# Works with: Adobe products, Kubernetes, React, Docker, your internal docs
```

**Tech Stack:**
- Runtime: Adobe I/O Runtime (Node.js 18)
- AI: Groq (Llama 3.3 70B)
- Scraping: Cheerio (HTML parsing)
- Slack: Block Kit for rich formatting
- Memory: 512MB
- Timeout: 30 seconds
- **Configuration**: Environment variables (no code changes!)
- **Security**: Rate limiting, input validation, API key masking

---

## Technical Specifications

### Runtime (App Builder)
- Memory: 512 MB per action
- Duration: ~5 seconds per question
- Runtime: Adobe I/O Runtime (Node.js 18)
- Deployment: One command (`aio app deploy`)
- **Security**: Isolated container execution
- **Scalability**: Auto-scales with demand
- **Authentication**: Built-in credential management

### Why App Builder?
App Builder provides enterprise-grade benefits:
- 🔒 **Secure by default**: Isolated execution, encrypted credentials
- ⚡ **Auto-scaling compute**: Handles 1 or 10,000 requests seamlessly
- 🛡️ **Built-in authentication**: Adobe IMS integration for enterprise identity
- 🌐 **Extend Adobe Products**: Native functionality extensions without core customization
- 🔌 **Third-party integration**: Connect to any external service or API
- 📦 **Managed platform**: Adobe handles compute, storage, and CDN provisioning
- 🔄 **Simplified upgrades**: No core product changes, lower cost of ownership

### AI Integration
- Groq API with Llama 3.3 70B model
- ~3-5 second response time (includes scraping + AI)
- Handles concurrent requests
- Free tier: 14,400 requests/day

### Pricing Information
For App Builder pricing and feature details, visit:
- [App Builder Overview](https://developer.adobe.com/app-builder/docs/overview/)
- [Security & Compliance](https://developer.adobe.com/app-builder/docs/guides/security/)
- [Runtime Documentation](https://developer.adobe.com/runtime/docs/)

For Groq API:
- [Groq Console](https://console.groq.com/) - Free tier available

---

## Environment Variables

```bash
# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# AI
GROQ_API_KEY=gsk-...

# Documentation Configuration (THIS IS THE MAGIC!)
DOCS_BASE_URL=https://developer.adobe.com/app-builder/docs/
DOCS_NAME=App Builder

# Examples of other docs you can point to:

# Adobe Experience Manager:
# DOCS_BASE_URL=https://experienceleague.adobe.com/en/docs/experience-manager/
# DOCS_NAME=Adobe Experience Manager

# Adobe Experience Platform:
# DOCS_BASE_URL=https://experienceleague.adobe.com/en/docs/experience-platform/
# DOCS_NAME=Adobe Experience Platform

# Public Documentation:
# DOCS_BASE_URL=https://kubernetes.io/docs/
# DOCS_NAME=Kubernetes

# DOCS_BASE_URL=https://react.dev/
# DOCS_NAME=React

# DOCS_BASE_URL=https://docs.docker.com/
# DOCS_NAME=Docker

# Internal company docs:
# DOCS_BASE_URL=https://docs.yourcompany.com/platform/
# DOCS_NAME=Internal Platform

# Adobe (auto-populated by aio CLI)
AIO_runtime_auth=...
AIO_runtime_namespace=...
```

### Reconfigure for Different Docs

**No code changes needed!** Just update environment variables:

```bash
# 1. Edit .env file
# Switch to Experience Platform:
DOCS_BASE_URL=https://experienceleague.adobe.com/en/docs/experience-platform/
DOCS_NAME=Adobe Experience Platform

# Or switch to Kubernetes:
DOCS_BASE_URL=https://kubernetes.io/docs/
DOCS_NAME=Kubernetes

# 2. Redeploy (30 seconds)
aio app deploy

# 3. Done! DocuBot now answers questions from new docs
```

---

## Development Commands

```bash
# Initialize project
aio app init adobe-docubot --standalone-app

# Run locally (hot reload)
aio app dev

# Deploy to production
aio app deploy

# View logs
aio app logs

# Test action directly
curl -X POST https://your-namespace.adobeioruntime.net/.../ask \
  -H "Content-Type: application/json" \
  -d '{"text": "How do I deploy?"}'
```

---

## File Structure

```
adobe-docubot/
├── actions/
│   └── ask/
│       └── index.js          # Main AI handler
├── utils/
│   ├── docScraper.js         # Scrapes documentation
│   ├── aiClient.js           # Groq AI API wrapper
│   ├── costCalculator.js     # Cost calculation logic
│   └── security.js           # Rate limiting, input validation
├── app.config.yaml           # Action configuration
├── package.json              # Dependencies
├── .env                      # Environment variables (not committed)
├── .env.example              # Environment variables template
├── SECURITY.md               # Security features documentation
└── README.md                 # This file
```

---

## Dependencies

```json
{
  "dependencies": {
    "@adobe/aio-sdk": "^6.0.0",
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12"
  }
}
```

**Note**: Groq API is accessed via REST API (no SDK dependency needed)

---

## Security Features

DocuBot includes built-in security:
- ✅ **Rate Limiting**: 10 requests per user per minute
- ✅ **Input Validation**: Max 500 characters, sanitized input
- ✅ **API Key Masking**: Keys never appear in logs
- ✅ **User-Friendly Errors**: No system details exposed

See `SECURITY.md` for detailed documentation.

---

## Extension Ideas (Post-Demo)

Once deployed, you could extend DocuBot with:

### Multi-Documentation Support

**Currently:** DocuBot searches ONE documentation source at a time (configured via `DOCS_BASE_URL`).

**Enhancement:** Query multiple documentation sources with a single command!

#### Option 1: Prefix Commands (Recommended - Easy to Implement)

Allow users to specify which docs to search:

```bash
# Adobe Products
/ab How do I deploy?                    # Uses default (App Builder)
/ab aem How do I create content fragments?  # Searches AEM docs
/ab aep How do I ingest data?           # Searches Experience Platform docs

# Public Documentation
/ab k8s How do I create a pod?          # Searches Kubernetes docs
/ab react How do I use hooks?           # Searches React docs
/ab docker How do I create a container? # Searches Docker docs
```

**Implementation:** Modify `actions/ask/index.js`:

```javascript
// Add after line that extracts question
let docsUrl = process.env.DOCS_BASE_URL;
let docsName = process.env.DOCS_NAME;

// Detect source prefix - Adobe Products
if (question.startsWith('aem ')) {
  docsUrl = 'https://experienceleague.adobe.com/en/docs/experience-manager/';
  docsName = 'Adobe Experience Manager';
  question = question.replace('aem ', '');
} else if (question.startsWith('aep ')) {
  docsUrl = 'https://experienceleague.adobe.com/en/docs/experience-platform/';
  docsName = 'Adobe Experience Platform';
  question = question.replace('aep ', '');
}
// Detect source prefix - Public Docs
else if (question.startsWith('k8s ') || question.startsWith('kubernetes ')) {
  docsUrl = 'https://kubernetes.io/docs/';
  docsName = 'Kubernetes';
  question = question.replace(/^(k8s|kubernetes) /, '');
} else if (question.startsWith('react ')) {
  docsUrl = 'https://react.dev/';
  docsName = 'React';
  question = question.replace('react ', '');
} else if (question.startsWith('docker ')) {
  docsUrl = 'https://docs.docker.com/';
  docsName = 'Docker';
  question = question.replace('docker ', '');
}

// Pass docsUrl and docsName to docScraper instead of reading from env
```

Then update `utils/docScraper.js` to accept these as parameters:

```javascript
async function scrapeDocs(question, docsUrl, docsName) {
  // Use passed parameters instead of process.env
  const baseUrl = docsUrl || process.env.DOCS_BASE_URL;
  // ... rest of scraping logic
}
```

#### Option 2: Smart Detection (AI-Based)

Let AI figure out which docs based on keywords:

```javascript
function detectDocSource(question) {
  const lowerQ = question.toLowerCase();
  
  // Adobe Products
  if (lowerQ.includes('aem') || lowerQ.includes('experience manager') || lowerQ.includes('content fragment')) {
    return {
      url: 'https://experienceleague.adobe.com/en/docs/experience-manager/',
      name: 'Adobe Experience Manager'
    };
  }
  
  if (lowerQ.includes('experience platform') || lowerQ.includes('aep') || lowerQ.includes('data lake') || lowerQ.includes('schema')) {
    return {
      url: 'https://experienceleague.adobe.com/en/docs/experience-platform/',
      name: 'Adobe Experience Platform'
    };
  }
  
  // Public Documentation
  if (lowerQ.includes('kubernetes') || lowerQ.includes('k8s') || lowerQ.includes('pod') || lowerQ.includes('deployment')) {
    return {
      url: 'https://kubernetes.io/docs/',
      name: 'Kubernetes'
    };
  }
  
  if (lowerQ.includes('react') || lowerQ.includes('hook') || lowerQ.includes('jsx') || lowerQ.includes('component')) {
    return {
      url: 'https://react.dev/',
      name: 'React'
    };
  }
  
  if (lowerQ.includes('docker') || lowerQ.includes('container') || lowerQ.includes('dockerfile') || lowerQ.includes('image')) {
    return {
      url: 'https://docs.docker.com/',
      name: 'Docker'
    };
  }
  
  // Add more as needed...
  // Angular: https://angular.dev/
  // Vue: https://vuejs.org/guide/
  // Next.js: https://nextjs.org/docs
  
  // Default to App Builder
  return {
    url: process.env.DOCS_BASE_URL,
    name: process.env.DOCS_NAME
  };
}
```

#### Option 3: Multi-Source Search (Most Powerful)

Search ALL configured sources and let AI pick the best answer:

```javascript
const DOC_SOURCES = [
  // Adobe Products
  { url: 'https://developer.adobe.com/app-builder/docs/', name: 'App Builder' },
  { url: 'https://experienceleague.adobe.com/en/docs/experience-manager/', name: 'Adobe Experience Manager' },
  { url: 'https://experienceleague.adobe.com/en/docs/experience-platform/', name: 'Adobe Experience Platform' },
  
  // Open Source / Public Docs
  { url: 'https://kubernetes.io/docs/', name: 'Kubernetes' },
  { url: 'https://react.dev/', name: 'React' },
  { url: 'https://docs.docker.com/', name: 'Docker' }
];

async function searchAllSources(question) {
  const results = await Promise.all(
    DOC_SOURCES.map(source => scrapeDocs(question, source.url, source.name))
  );
  
  // Combine all results and let AI pick most relevant
  const combinedContext = results
    .filter(r => r.content)
    .map(r => `From ${r.name}:\n${r.content}`)
    .join('\n\n');
  
  return combinedContext;
}
```

**Supported Documentation Sources:**
All three options support Adobe products (AEM, Experience Platform) AND public docs (Kubernetes, React, Docker, and more). Add any documentation source by following the patterns above.

**Trade-offs:**
- **Option 1**: Fastest, most control, users know exactly what they're searching (best for many sources)
- **Option 2**: More user-friendly, but might guess wrong (best for 3-5 common sources)
- **Option 3**: Most comprehensive, searches everything, but slower and uses more AI tokens (best for broad questions)

### Intelligence Features
6. **Conversational Memory**: Remember previous questions in thread
7. **Code Generation**: "Generate an action that calls Adobe Analytics"
8. **Troubleshooting**: Analyze error logs and suggest fixes
9. **CLI Integration**: Execute `aio` commands directly from Slack

### Team Features
10. **Proactive Tips**: Post daily tips from configured docs to channel
11. **Team Learning**: Track common questions, identify doc gaps
12. **Custom Docs**: Point at company's internal documentation
13. **Multi-source**: Search GitHub issues, Stack Overflow
14. **Interactive Tutorials**: Step-by-step guides with checkpoints

---

## Success Metrics

After deploying, track:
- 📊 Questions asked per day
- ⏱️ Average response time
- 👍 Answer quality (thumbs up/down)
- 💰 Actual costs vs. estimates
- 📈 Team productivity gains
- 🎯 Most common questions (identify doc gaps)

---

## Resources

- [App Builder Documentation](https://developer.adobe.com/app-builder/docs/)
- [Groq Console](https://console.groq.com/)
- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder/)
- [Cheerio Documentation](https://cheerio.js.org/)

---

## License

MIT License - Feel free to use, modify, and deploy for your own needs.

---

## Support

For issues or questions:
1. Check `SECURITY.md` for security-related questions
2. Review App Builder documentation for platform questions
3. Open an issue in this repository

---

**Ready to build DocuBot? Let's go! 🚀**
