# Web Search Integration for Agent Builder

The Agent Builder now supports web search integration to automatically discover relevant npm packages, Prisma schema patterns, and API documentation during agent generation.

## 🚀 Features

### 1. **Automatic NPM Package Discovery**
- Finds popular, well-maintained packages for your specific use case
- Searches for domain-specific libraries and utilities
- Discovers external API SDK packages and integrations
- Automatically includes discovered packages in `package.json`

### 2. **Prisma Schema Pattern Search**
- Discovers best practices for database schema design
- Finds production-ready patterns for your domain
- Searches for performance optimization techniques
- Integrates industry-standard schema patterns

### 3. **API Documentation Lookup**
- Finds official documentation for external APIs
- Discovers integration guides and examples
- Locates TypeScript/Node.js specific resources
- Provides up-to-date authentication methods
- **NEW**: Extracts API key/environment variable setup documentation

## 🔧 How to Enable

### Method 1: Enable in Orchestrator Configuration

```typescript
import { executeAgentGeneration } from './steps/orchestrator';

const result = await executeAgentGeneration({
  userRequest: "Create a social media management agent",
  enableWebSearch: true,
  webSearchConfig: {
    searchContextSize: 'high',
    userLocation: {
      type: 'approximate',
      city: 'San Francisco',
      region: 'California'
    }
  }
});
```

### Method 2: Environment Configuration

Set environment variables to enable web search by default:

```bash
ENABLE_WEB_SEARCH=true
WEB_SEARCH_CONTEXT_SIZE=high
```

## 📋 Configuration Options

### `enableWebSearch: boolean`
- **Default**: `false`
- **Description**: Master switch to enable/disable web search functionality

### `webSearchConfig.searchContextSize`
- **Options**: `'low' | 'medium' | 'high'`
- **Default**: `'high'`
- **Description**: Controls the depth and breadth of search results

### `webSearchConfig.userLocation`
- **Description**: Provides location context for more relevant results
- **Structure**:
  ```typescript
  {
    type: 'approximate',
    city: string,
    region: string
  }
  ```

## 🎯 What Gets Enhanced

### Step 1: Database Generation
- **Searches for**: Prisma schema patterns, database design best practices
- **Result**: Enhanced schema with industry-standard patterns
- **Output**: `step1Result.webSearchResults.foundPatterns`

### Step 2: Action Generation  
- **Searches for**: Domain-specific npm packages, external API SDKs, utility libraries
- **Result**: Recommended packages automatically added to `package.json`
- **Output**: `step2Result.webSearchResults.recommendedPackages`

### Step 4: Deployment
- **Integration**: Discovered packages included in generated `package.json`
- **Result**: Production-ready deployment with enhanced dependencies
- **NEW**: Environment variable setup documentation accessible via UI help icons

## 📦 Example: Enhanced Package.json

**Without Web Search:**
```json
{
  "dependencies": {
    "next": "14.0.4",
    "react": "^18",
    "prisma": "^6.11.0"
  }
}
```

**With Web Search (e-commerce agent):**
```json
{
  "dependencies": {
    "next": "14.0.4",
    "react": "^18", 
    "prisma": "^6.11.0",
    "stripe": "^14.0.0",
    "shopify-api-node": "^3.12.0",
    "nodemailer": "^6.9.0",
    "zod": "^3.23.8",
    "date-fns": "^2.30.0"
  }
}
```

## 🔍 Search Process

### 1. Context Analysis
- Analyzes user request and domain type
- Identifies external APIs from Step 0 analysis
- Determines business context and requirements

### 2. Parallel Search Execution
- **Package Search**: Domain-specific packages, API SDKs, utilities
- **Pattern Search**: Prisma schema patterns and best practices  
- **Documentation Search**: Official API docs and integration guides

### 3. Result Integration
- Filters and deduplicates discovered packages
- Validates package compatibility with Next.js/Prisma
- Integrates patterns into schema generation
- Adds packages to deployment configuration

## 📊 Search Results Structure

### NPM Packages
```typescript
interface NpmPackage {
  name: string;           // Package name
  version: string;        // Latest/recommended version
  description: string;    // Package description
  npmUrl: string;         // NPM registry URL
  githubUrl?: string;     // GitHub repository
  weeklyDownloads?: number; // Popularity metric
  tags: string[];         // Categorization tags
  useCase: string;        // Specific use case
  integrationNotes?: string; // Integration guidance
  // NEW: API key/environment variable documentation
  envVarDocumentation?: {
    title: string;        // Documentation title
    url: string;          // Documentation URL
    description: string;  // Setup description
    keyType: 'api_key' | 'oauth' | 'token' | 'credentials' | 'config';
  }[];
}
```

### Prisma Patterns
```typescript
interface PrismaPattern {
  name: string;           // Pattern name
  description: string;    // Pattern description  
  code: string;          // Schema code example
  useCase: string;       // Domain/use case
  source: string;        // Source (Web Search)
  tags: string[];        // Pattern tags
}
```

## ⚠️ Important Notes

### Requirements
- Web search requires OpenAI GPT-4 or compatible model with web search tools
- Model must support `tools.webSearch()` functionality
- Internet connection required for real-time search

### Rate Limits
- Web search adds ~2-5 seconds to generation time
- Searches are parallelized to minimize delay
- Failed searches don't block agent generation

### Fallback Behavior
- If web search fails, generation continues with standard patterns
- Error messages logged but don't interrupt process
- Graceful degradation ensures reliability

## 🔧 Environment Variable Documentation

### Automatic Documentation Discovery
When web search finds npm packages, it also searches for:
- API key setup guides
- OAuth configuration documentation
- Token generation instructions
- Credentials setup tutorials
- Environment variable configuration guides

### UI Integration
In the deployment modal, environment variables now show:
- **Question mark (?) icons** next to variables with available documentation
- **Hover tooltips** showing documentation previews
- **Click-to-open** functionality for accessing full documentation
- **Smart matching** between env var names and relevant documentation

### Example Flow
1. **Web Search**: Finds `stripe` package and its API key documentation
2. **Documentation Extraction**: Captures setup guides and key generation URLs
3. **UI Enhancement**: Shows (?) icon next to `STRIPE_API_KEY` environment variable
4. **User Experience**: User hovers to see preview, clicks to open Stripe's API key setup guide

### Supported Documentation Types
- `api_key`: API key generation and setup
- `oauth`: OAuth flow configuration
- `token`: Token-based authentication
- `credentials`: General credential setup
- `config`: Configuration and setup guides

## 🚀 Best Practices

### 1. **Use High Context Size**
```typescript
webSearchConfig: {
  searchContextSize: 'high' // Better results, slightly slower
}
```

### 2. **Provide Location Context**
```typescript
webSearchConfig: {
  userLocation: {
    type: 'approximate',
    city: 'New York',
    region: 'New York'
  }
}
```

### 3. **Review Generated Packages**
- Check `package.json` for discovered dependencies
- Verify compatibility with your stack
- Remove unnecessary packages if needed

### 4. **Monitor Search Results**
- Check console logs for search success/failure
- Review `webSearchResults` in step outputs
- Use integration notes for implementation guidance

## 🔧 Troubleshooting

### Web Search Not Working?
1. Verify `enableWebSearch: true` in config
2. Check model supports web search tools
3. Ensure internet connectivity
4. Check console for error messages

### Too Many/Wrong Packages?
1. Lower `searchContextSize` to 'medium' or 'low'
2. Review and manually filter `package.json`
3. Provide more specific user requests
4. Check package compatibility before deployment

### Search Taking Too Long?
1. Reduce `searchContextSize` to 'medium'
2. Limit external APIs in Step 0 analysis
3. Consider disabling for faster iteration

## 📈 Future Enhancements

- **Package Filtering**: Smart filtering based on project requirements
- **Version Management**: Automatic latest stable version detection  
- **Compatibility Checking**: Automated compatibility validation
- **Custom Search Queries**: User-defined search parameters
- **Caching**: Search result caching for faster subsequent generations 