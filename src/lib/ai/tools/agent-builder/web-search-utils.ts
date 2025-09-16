import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getAgentBuilderModel } from './generation';
import type { OrchestratorConfig } from './steps/orchestrator';

/**
 * Web Search Integration for Agent Builder
 * Provides standardized web search functionality across all agent building steps
 */

export interface WebSearchResult {
  success: boolean;
  data?: any;
  error?: string;
  searchQuery?: string;
  foundPackages?: NpmPackage[];
  foundPatterns?: PrismaPattern[];
  foundDocumentation?: DocumentationLink[];
}

export interface NpmPackage {
  name: string;
  version: string;
  description: string;
  npmUrl: string;
  githubUrl?: string;
  weeklyDownloads?: number;
  lastUpdated?: string;
  tags: string[];
  useCase: string;
  integrationNotes?: string;
  // Documentation for API keys and environment variables
  envVarDocumentation?: {
    title: string;
    url: string;
    description: string;
    keyType: 'api_key' | 'oauth' | 'token' | 'credentials' | 'config';
  }[];
}

export interface PrismaPattern {
  name: string;
  description: string;
  code: string;
  useCase: string;
  source: string;
  tags: string[];
}

export interface DocumentationLink {
  title: string;
  url: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
  type: 'api-docs' | 'tutorial' | 'example' | 'reference';
}

/**
 * Search for relevant npm packages for a specific use case
 */
export async function searchNpmPackages(
  searchQuery: string,
  useCase: string,
  config: OrchestratorConfig
): Promise<WebSearchResult> {
  if (!config.enableWebSearch) {
    return { success: false, error: 'Web search not enabled' };
  }

  // Check if OpenAI API key is available for web search
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not available for web search, falling back to disabled state');
    return { success: false, error: 'OpenAI API key required for web search' };
  }

  try {
    console.log(`🔍 Searching for npm packages: ${searchQuery} (${useCase})`);
    
    // Use OpenAI Responses API model with web search tools
    const result = await generateText({
      model: openai.responses('gpt-4o'),
      prompt: `Find the best npm packages for: ${searchQuery}
        
Use case: ${useCase}

I need to find:
1. Popular, well-maintained npm packages
2. Package names, versions, and descriptions  
3. Weekly download counts and last updated dates
4. GitHub URLs and documentation links
5. Integration notes and best practices
6. **CRITICAL**: API key/environment variable documentation

Focus on packages that are:
- Actively maintained (updated within 6 months)
- Well documented
- Have good TypeScript support
- Compatible with Next.js and Prisma
- Have high weekly downloads (>10k preferred)

For each package, especially API/service packages, find:
- How to obtain API keys/credentials
- Environment variable setup documentation
- Authentication setup guides
- Getting started/setup documentation

Return results in this format for each package:
- Name: package-name
- Version: latest version
- Description: brief description
- Weekly Downloads: number
- Last Updated: date
- GitHub: URL
- Use Case: specific use case
- Integration Notes: how to integrate with Next.js/Prisma
- API Key Documentation: URLs and descriptions for getting API keys/credentials
- Environment Setup: Links to env var setup guides`,
      tools: {
        web_search_preview: openai.tools.webSearchPreview({
          searchContextSize: config.webSearchConfig?.searchContextSize || 'high',
          userLocation: config.webSearchConfig?.userLocation,
        })
      },
      toolChoice: { type: 'tool', toolName: 'web_search_preview' },
      temperature: 0.1,
    });

    // Parse the web search results to extract npm packages
    const foundPackages = parseNpmPackagesFromSearch(result.text, useCase);
    
    console.log(`✅ Found ${foundPackages.length} npm packages for ${searchQuery}`);
    
    return {
      success: true,
      data: result,
      searchQuery,
      foundPackages
    };
    
  } catch (error) {
    console.error(`❌ NPM package search failed for ${searchQuery}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      searchQuery
    };
  }
}

/**
 * Search for Prisma schema patterns and best practices
 */
export async function searchPrismaPatterns(
  schemaContext: string,
  domainType: string,
  config: OrchestratorConfig
): Promise<WebSearchResult> {
  if (!config.enableWebSearch) {
    return { success: false, error: 'Web search not enabled' };
  }

  // Check if OpenAI API key is available for web search
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not available for web search, falling back to disabled state');
    return { success: false, error: 'OpenAI API key required for web search' };
  }

  try {
    console.log(`🔍 Searching for Prisma patterns: ${schemaContext} (${domainType})`);
    
    const result = await generateText({
      model: openai.responses('gpt-4o'),
      prompt: `Find Prisma schema patterns and best practices for: ${schemaContext}
      
Domain: ${domainType}

I need to find:
1. Common Prisma schema patterns for this domain
2. Best practices for field definitions and relationships
3. Index strategies and performance optimizations
4. Enum definitions and validation patterns
5. Migration strategies and database design patterns

Focus on:
- Production-ready patterns
- Performance optimized schemas
- Proper relationship modeling
- Field validation and constraints
- Index optimization
- Best practices from official Prisma docs

Return practical schema patterns with explanations.`,
      tools: {
        web_search_preview: openai.tools.webSearchPreview({
          searchContextSize: config.webSearchConfig?.searchContextSize || 'high',
          userLocation: config.webSearchConfig?.userLocation,
        })
      },
      toolChoice: { type: 'tool', toolName: 'web_search_preview' },
      temperature: 0.1,
    });

    const foundPatterns = parsePrismaPatternsFromSearch(result.text, domainType);
    
    console.log(`✅ Found ${foundPatterns.length} Prisma patterns for ${schemaContext}`);
    
    return {
      success: true,
      data: result,
      searchQuery: schemaContext,
      foundPatterns
    };
    
  } catch (error) {
    console.error(`❌ Prisma pattern search failed for ${schemaContext}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      searchQuery: schemaContext
    };
  }
}

/**
 * Search for API documentation and integration guides
 */
export async function searchApiDocumentation(
  apiProvider: string,
  integrationContext: string,
  config: OrchestratorConfig
): Promise<WebSearchResult> {
  if (!config.enableWebSearch) {
    return { success: false, error: 'Web search not enabled' };
  }

  // Check if OpenAI API key is available for web search
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not available for web search, falling back to disabled state');
    return { success: false, error: 'OpenAI API key required for web search' };
  }

  try {
    console.log(`🔍 Searching for API documentation: ${apiProvider} (${integrationContext})`);
    
    const result = await generateText({
      model: openai.responses('gpt-4o'),
      prompt: `Find API documentation and integration guides for: ${apiProvider}
      
Integration context: ${integrationContext}

I need to find:
1. Official API documentation
2. Authentication methods and requirements
3. Rate limits and best practices
4. TypeScript/Node.js integration examples
5. Error handling patterns
6. Webhook setup guides
7. Testing and development resources

Focus on:
- Official documentation
- Up-to-date integration guides
- TypeScript examples
- Next.js compatibility
- Production deployment considerations

Return comprehensive documentation links and integration notes.`,
      tools: {
        web_search_preview: openai.tools.webSearchPreview({
          searchContextSize: config.webSearchConfig?.searchContextSize || 'high',
          userLocation: config.webSearchConfig?.userLocation,
        })
      },
      toolChoice: { type: 'tool', toolName: 'web_search_preview' },
      temperature: 0.1,
    });

    const foundDocumentation = parseDocumentationFromSearch(result.text, apiProvider);
    
    console.log(`✅ Found ${foundDocumentation.length} documentation links for ${apiProvider}`);
    
    return {
      success: true,
      data: result,
      searchQuery: apiProvider,
      foundDocumentation
    };
    
  } catch (error) {
    console.error(`❌ API documentation search failed for ${apiProvider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      searchQuery: apiProvider
    };
  }
}

/**
 * Parse npm packages from web search results
 */
function parseNpmPackagesFromSearch(searchText: string, useCase: string): NpmPackage[] {
  const packages: NpmPackage[] = [];
  
  try {
    // Extract package information using regex patterns
    const packageRegex = /(?:Name|Package):\s*([a-z0-9-@\/]+)/gi;
    const versionRegex = /Version:\s*([\d\.]+)/gi;
    const descriptionRegex = /Description:\s*([^\n]+)/gi;
    const downloadsRegex = /(?:Weekly\s+)?Downloads?:\s*([\d,k]+)/gi;
    
    let match: RegExpExecArray | null;
    const packageNames: string[] = [];
    
    while ((match = packageRegex.exec(searchText)) !== null) {
      packageNames.push(match[1]);
    }
    
    // Extract API key/environment documentation URLs
    const extractEnvVarDocumentation = (text: string, packageName: string) => {
      const envVarDocs: NpmPackage['envVarDocumentation'] = [];
      
      // Look for API key documentation patterns
      const apiKeyPatterns = [
        /API\s+Key\s+Documentation:\s*(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi,
        /Environment\s+Setup:\s*(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi,
        /Getting\s+Started:\s*(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi,
        /Authentication:\s*(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi,
        /Setup\s+Guide:\s*(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi,
        /API\s+Keys?:\s*(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi,
        /Credentials:\s*(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
      ];
      
      // Extract URLs from common documentation patterns
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
      const urls = text.match(urlRegex) || [];
      
      urls.forEach(url => {
        // Check if URL looks like documentation for API keys/setup
        if (
          url.includes('api') || 
          url.includes('auth') || 
          url.includes('setup') || 
          url.includes('getting-started') || 
          url.includes('quickstart') || 
          url.includes('credentials') ||
          url.includes('keys') ||
          url.includes('token') ||
          url.includes('docs')
        ) {
          let keyType: 'api_key' | 'oauth' | 'token' | 'credentials' | 'config' = 'api_key';
          let title = 'API Documentation';
          let description = `Documentation for ${packageName} API setup`;
          
          // Determine the type of documentation
          if (url.includes('oauth')) {
            keyType = 'oauth';
            title = 'OAuth Setup Guide';
            description = `OAuth authentication setup for ${packageName}`;
          } else if (url.includes('token')) {
            keyType = 'token';
            title = 'Token Configuration';
            description = `Token setup guide for ${packageName}`;
          } else if (url.includes('credentials')) {
            keyType = 'credentials';
            title = 'Credentials Setup';
            description = `Credentials configuration for ${packageName}`;
          } else if (url.includes('setup') || url.includes('getting-started')) {
            keyType = 'config';
            title = 'Setup Guide';
            description = `Getting started guide for ${packageName}`;
          }
          
          // Avoid duplicates
          if (!envVarDocs.find(doc => doc.url === url)) {
            envVarDocs.push({
              title,
              url,
              description,
              keyType
            });
          }
        }
      });
      
      return envVarDocs.length > 0 ? envVarDocs : undefined;
    };
    
    // For each package name, try to extract additional details
    packageNames.forEach((name, index) => {
      const envVarDocumentation = extractEnvVarDocumentation(searchText, name);
      
      packages.push({
        name,
        version: 'latest', // Default to latest
        description: `Package for ${useCase}`,
        npmUrl: `https://www.npmjs.com/package/${name}`,
        tags: [useCase.toLowerCase()],
        useCase,
        weeklyDownloads: 0,
        lastUpdated: new Date().toISOString(),
        envVarDocumentation
      });
    });
    
    // If no packages found via regex, extract from common patterns
    if (packages.length === 0) {
      const commonPackagePatterns = [
        /npm\s+install\s+([a-z0-9-@\/]+)/gi,
        /yarn\s+add\s+([a-z0-9-@\/]+)/gi,
        /import.*from\s+['"]([a-z0-9-@\/]+)['"]/gi
      ];
      
      commonPackagePatterns.forEach(pattern => {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(searchText)) !== null) {
          if (match && !packages.find(p => p.name === match![1])) {
            const envVarDocumentation = extractEnvVarDocumentation(searchText, match[1]);
            
            packages.push({
              name: match[1],
              version: 'latest',
              description: `Package for ${useCase}`,
              npmUrl: `https://www.npmjs.com/package/${match[1]}`,
              tags: [useCase.toLowerCase()],
              useCase,
              weeklyDownloads: 0,
              lastUpdated: new Date().toISOString(),
              envVarDocumentation
            });
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error parsing npm packages from search:', error);
  }
  
  return packages.slice(0, 10); // Limit to top 10 packages
}

/**
 * Parse Prisma patterns from web search results
 */
function parsePrismaPatternsFromSearch(searchText: string, domainType: string): PrismaPattern[] {
  const patterns: PrismaPattern[] = [];
  
  try {
    // Extract code blocks that look like Prisma schema
    const codeBlockRegex = /```(?:prisma)?\s*([\s\S]*?)```/gi;
    let match;
    let index = 0;
    
    while ((match = codeBlockRegex.exec(searchText)) !== null && index < 5) {
      const code = match[1].trim();
      if (code.includes('model ') || code.includes('enum ') || code.includes('@@')) {
        patterns.push({
          name: `${domainType} Pattern ${index + 1}`,
          description: `Prisma schema pattern for ${domainType}`,
          code,
          useCase: domainType,
          source: 'Web Search',
          tags: [domainType.toLowerCase(), 'prisma', 'schema']
        });
        index++;
      }
    }
    
  } catch (error) {
    console.error('Error parsing Prisma patterns from search:', error);
  }
  
  return patterns;
}

/**
 * Parse documentation links from web search results
 */
function parseDocumentationFromSearch(searchText: string, apiProvider: string): DocumentationLink[] {
  const documentation: DocumentationLink[] = [];
  
  try {
    // Extract URLs that look like documentation
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    let match;
    const foundUrls = new Set<string>();
    
    while ((match = urlRegex.exec(searchText)) !== null) {
      const url = match[0];
      if (!foundUrls.has(url) && (
        url.includes('docs') || 
        url.includes('api') || 
        url.includes('developer') ||
        url.includes(apiProvider.toLowerCase())
      )) {
        foundUrls.add(url);
        
        // Determine documentation type
        let type: DocumentationLink['type'] = 'reference';
        if (url.includes('tutorial')) type = 'tutorial';
        else if (url.includes('example')) type = 'example';
        else if (url.includes('api')) type = 'api-docs';
        
        documentation.push({
          title: `${apiProvider} Documentation`,
          url,
          description: `Documentation for ${apiProvider} integration`,
          relevance: url.includes(apiProvider.toLowerCase()) ? 'high' : 'medium',
          type
        });
      }
    }
    
  } catch (error) {
    console.error('Error parsing documentation from search:', error);
  }
  
  return documentation.slice(0, 8); // Limit to top 8 links
}

/**
 * Combine multiple search results into actionable insights
 */
export async function combineSearchResults(
  packageResults: WebSearchResult[],
  patternResults: WebSearchResult[],
  docResults: WebSearchResult[]
): Promise<{
  recommendedPackages: NpmPackage[];
  suggestedPatterns: PrismaPattern[];
  relevantDocs: DocumentationLink[];
  integrationNotes: string[];
}> {
  const recommendedPackages: NpmPackage[] = [];
  const suggestedPatterns: PrismaPattern[] = [];
  const relevantDocs: DocumentationLink[] = [];
  const integrationNotes: string[] = [];
  
  // Combine and deduplicate packages
  packageResults.forEach(result => {
    if (result.foundPackages) {
      result.foundPackages.forEach(pkg => {
        if (!recommendedPackages.find(p => p.name === pkg.name)) {
          recommendedPackages.push(pkg);
        }
      });
    }
  });
  
  // Combine patterns
  patternResults.forEach(result => {
    if (result.foundPatterns) {
      suggestedPatterns.push(...result.foundPatterns);
    }
  });
  
  // Combine documentation
  docResults.forEach(result => {
    if (result.foundDocumentation) {
      relevantDocs.push(...result.foundDocumentation);
    }
  });
  
  // Generate integration notes
  if (recommendedPackages.length > 0) {
    integrationNotes.push(`Found ${recommendedPackages.length} recommended npm packages for enhanced functionality`);
  }
  
  if (suggestedPatterns.length > 0) {
    integrationNotes.push(`Discovered ${suggestedPatterns.length} Prisma schema patterns for optimal database design`);
  }
  
  if (relevantDocs.length > 0) {
    integrationNotes.push(`Located ${relevantDocs.length} documentation resources for integration guidance`);
  }
  
  return {
    recommendedPackages: recommendedPackages.slice(0, 15), // Top 15 packages
    suggestedPatterns: suggestedPatterns.slice(0, 8), // Top 8 patterns
    relevantDocs: relevantDocs.slice(0, 12), // Top 12 docs
    integrationNotes
  };
} 