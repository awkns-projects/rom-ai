import { TemplateGenerator, MobileAppTemplateOptions, escapeJSString } from '../base/MobileAppTemplateBase';

export class UtilityGenerator implements TemplateGenerator {
  generate(options: MobileAppTemplateOptions): Record<string, string> {
    const files: Record<string, string> = {
      'src/lib/prisma.ts': this.generatePrismaClient(),
      'src/lib/api.ts': this.generateApiClient(),
      'src/lib/theme.ts': this.generateThemeSystem(),
      'src/contexts/AgentContext.tsx': this.generateAgentContext(options),
      'src/hooks/useApi.ts': this.generateApiHook(),
      'src/hooks/useMobile.ts': this.generateMobileHook(),
      'prisma/seed.ts': this.generateSeedFile(options),
      'src/app/globals.css': this.generateGlobalStyles(),
      'README.md': this.generateReadme(options)
    };

    // Use the provided Prisma schema directly
    files['prisma/schema.prisma'] = options.prismaSchema;

    // Note: Unicorn assets are now pre-uploaded to blob storage during deployment

    return files;
  }

  private generatePrismaClient(): string {
    return `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with PostgreSQL connection configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma`;
  }

  private generateApiClient(): string {
    return `// API client for mobile app - Fully Local Architecture
// All configuration (UI elements and functional data) is embedded locally

class ApiClient {

  async request(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
    }

    return response.json();
  }

  async getStats() {
    return this.request('/api/stats');
  }

  // ========== MODEL CRUD OPERATIONS (Direct PostgreSQL/Prisma) ==========
  
  // Get all records for a model with optional pagination and search
  async getModelRecords(modelName: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
    
    const queryString = params.toString();
    const endpoint = \`/api/models/\${modelName}\${queryString ? \`?\${queryString}\` : ''}\`;
    
    const response = await this.request(endpoint);
    
    // Handle both direct array response and wrapped response
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [response.data];
    } else if (Array.isArray(response)) {
      return response;
    } else if (response.data) {
      return Array.isArray(response.data) ? response.data : [response.data];
    }
    
    return [];
  }

  // Get a single record by ID  
  async getModelRecord(modelName: string, id: string) {
    return this.request(\`/api/models/\${modelName}/\${id}\`);
  }

  // Create a new record
  async createModelRecord(modelName: string, data: any) {
    return this.request(\`/api/models/\${modelName}\`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an existing record
  async updateModelRecord(modelName: string, id: string, data: any) {
    return this.request(\`/api/models/\${modelName}/\${id}\`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete a record
  async deleteModelRecord(modelName: string, id: string) {
    return this.request(\`/api/models/\${modelName}/\${id}\`, {
      method: 'DELETE',
    });
  }

  // Bulk operations for models
  async bulkCreateModelRecords(modelName: string, records: any[]) {
    // Note: This would require a separate endpoint for bulk operations
    // For now, we'll create records one by one
    const results = await Promise.allSettled(
      records.map(record => this.createModelRecord(modelName, record))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return {
      success: true,
      created: successful,
      failed: failed,
      results: results
    };
  }

  async executeAction(actionName: string, input: any) {
    // Execute action locally using the embedded action endpoint
    return this.request(\`/api/actions/\${actionName}\`, {
      method: 'POST',
      body: JSON.stringify({ 
        parameters: input // Use parameters key expected by static action endpoints
      }),
    });
  }

  async executeActionWithTracking(actionName: string, input: any) {
    // Execute action with Redis tracking - same as executeAction but with different name for clarity
    return this.request(\`/api/actions/\${actionName}\`, {
      method: 'POST',
      body: JSON.stringify({ 
        parameters: input
      }),
    });
  }

  async getHealth() {
    return this.request('/api/health');
  }

  // Execute schedule locally using embedded cron endpoint (for manual testing)
  async executeSchedule(scheduleName: string, secret?: string) {
    const headers: Record<string, string> = {};
    if (secret) {
      headers['x-cron-secret'] = secret;
    }
    
    return this.request(\`/api/cron/\${scheduleName}\`, {
      method: 'POST',
      headers
    });
  }

  // Get schedule execution status and results
  async getScheduleResults(scheduleName: string) {
    try {
      const response = await this.request(\`/api/cron/\${scheduleName}\`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Error getting schedule results:', error);
      return null;
    }
  }
}

const api = new ApiClient();
export default api;`;
  }

  private generateThemeSystem(): string {
    return `export const themes = {
  green: {
    name: 'Matrix',
    primary: 'green',
    gradient: 'from-green-400/20 via-green-500/15 to-emerald-400/20',
    border: 'border-green-400/30',
    accent: 'text-green-400',
    light: 'text-green-200',
    dim: 'text-green-300/70',
    bg: 'bg-green-500/15',
    bgHover: 'hover:bg-green-500/25',
    borderActive: 'border-green-400/50',
    bgActive: 'bg-green-500/25'
  },
  blue: {
    name: 'Ocean',
    primary: 'blue',
    gradient: 'from-blue-400/20 via-sky-500/15 to-cyan-400/20',
    border: 'border-blue-400/30',
    accent: 'text-blue-400',
    light: 'text-blue-200',
    dim: 'text-blue-300/70',
    bg: 'bg-blue-500/15',
    bgHover: 'hover:bg-blue-500/25',
    borderActive: 'border-blue-400/50',
    bgActive: 'bg-blue-500/25'
  },
  purple: {
    name: 'Royal',
    primary: 'purple',
    gradient: 'from-purple-400/20 via-violet-500/15 to-indigo-400/20',
    border: 'border-purple-400/30',
    accent: 'text-purple-400',
    light: 'text-purple-200',
    dim: 'text-purple-300/70',
    bg: 'bg-purple-500/15',
    bgHover: 'hover:bg-purple-500/25',
    borderActive: 'border-purple-400/50',
    bgActive: 'bg-purple-500/25'
  },
  cyan: {
    name: 'Cyber',
    primary: 'cyan',
    gradient: 'from-cyan-300/20 via-teal-400/15 to-emerald-300/20',
    border: 'border-cyan-400/30',
    accent: 'text-cyan-300',
    light: 'text-cyan-100',
    dim: 'text-cyan-200/70',
    bg: 'bg-cyan-500/15',
    bgHover: 'hover:bg-cyan-500/25',
    borderActive: 'border-cyan-400/50',
    bgActive: 'bg-cyan-500/25'
  },
  orange: {
    name: 'Sunset',
    primary: 'orange',
    gradient: 'from-orange-400/20 via-amber-500/15 to-yellow-400/20',
    border: 'border-orange-400/30',
    accent: 'text-orange-300',
    light: 'text-orange-100',
    dim: 'text-orange-200/70',
    bg: 'bg-orange-500/15',
    bgHover: 'hover:bg-orange-500/25',
    borderActive: 'border-orange-400/50',
    bgActive: 'bg-orange-500/25'
  },
  pink: {
    name: 'Neon',
    primary: 'pink',
    gradient: 'from-pink-400/20 via-rose-500/15 to-fuchsia-400/20',
    border: 'border-pink-400/30',
    accent: 'text-pink-300',
    light: 'text-pink-100',
    dim: 'text-pink-200/70',
    bg: 'bg-pink-500/15',
    bgHover: 'hover:bg-pink-500/25',
    borderActive: 'border-pink-400/50',
    bgActive: 'bg-pink-500/25'
  },
  yellow: {
    name: 'Golden',
    primary: 'yellow',
    gradient: 'from-yellow-300/20 via-amber-400/15 to-orange-300/20',
    border: 'border-yellow-400/30',
    accent: 'text-yellow-300',
    light: 'text-yellow-100',
    dim: 'text-yellow-200/70',
    bg: 'bg-yellow-500/15',
    bgHover: 'hover:bg-yellow-500/25',
    borderActive: 'border-yellow-400/50',
    bgActive: 'bg-yellow-500/25'
  },
  red: {
    name: 'Fire',
    primary: 'red',
    gradient: 'from-red-400/20 via-rose-500/15 to-pink-400/20',
    border: 'border-red-400/30',
    accent: 'text-red-300',
    light: 'text-red-100',
    dim: 'text-red-200/70',
    bg: 'bg-red-500/15',
    bgHover: 'hover:bg-red-500/25',
    borderActive: 'border-red-400/50',
    bgActive: 'bg-red-500/25'
  },
  indigo: {
    name: 'Deep',
    primary: 'indigo',
    gradient: 'from-indigo-400/20 via-blue-600/15 to-slate-400/20',
    border: 'border-indigo-400/30',
    accent: 'text-indigo-300',
    light: 'text-indigo-100',
    dim: 'text-indigo-200/70',
    bg: 'bg-indigo-500/15',
    bgHover: 'hover:bg-indigo-500/25',
    borderActive: 'border-indigo-400/50',
    bgActive: 'bg-indigo-500/25'
  },
  emerald: {
    name: 'Emerald',
    primary: 'emerald',
    gradient: 'from-emerald-400/20 via-green-600/15 to-teal-400/20',
    border: 'border-emerald-400/30',
    accent: 'text-emerald-300',
    light: 'text-emerald-100',
    dim: 'text-emerald-200/70',
    bg: 'bg-emerald-500/15',
    bgHover: 'hover:bg-emerald-500/25',
    borderActive: 'border-emerald-400/50',
    bgActive: 'bg-emerald-500/25'
  },
  teal: {
    name: 'Teal',
    primary: 'teal',
    gradient: 'from-teal-400/20 via-cyan-600/15 to-blue-400/20',
    border: 'border-teal-400/30',
    accent: 'text-teal-300',
    light: 'text-teal-100',
    dim: 'text-teal-200/70',
    bg: 'bg-teal-500/15',
    bgHover: 'hover:bg-teal-500/25',
    borderActive: 'border-teal-400/50',
    bgActive: 'bg-teal-500/25'
  },
  rose: {
    name: 'Rose',
    primary: 'rose',
    gradient: 'from-rose-400/20 via-pink-600/15 to-red-400/20',
    border: 'border-rose-400/30',
    accent: 'text-rose-300',
    light: 'text-rose-100',
    dim: 'text-rose-200/70',
    bg: 'bg-rose-500/15',
    bgHover: 'hover:bg-rose-500/25',
    borderActive: 'border-rose-400/50',
    bgActive: 'bg-rose-500/25'
  }
};

export type ThemeKey = keyof typeof themes;
export type Theme = typeof themes.green;`;
  }

  private generateAgentContext(options: MobileAppTemplateOptions): string {
    return `'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AgentConfig {
  name: string;
  description: string;
  theme: string;
  avatar: any;
  domain?: string;
  personality?: string;
  characterNames?: string;
  models: any[];
  actions: any[];
  schedules: any[];
}

interface AgentContextType {
  config: AgentConfig | null;
  loading: boolean;
  error: string | null;
  refetchConfig: () => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

interface AgentProviderProps {
  children: ReactNode;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 AgentProvider: Fetching hybrid config from sub-agent API (avoids CORS)...');
      
      // Call sub-agent's own config endpoint (which will fetch UI data from main app server-side)
      const response = await fetch('/api/agent/config');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch config: \${response.status}\`);
      }
      
      const data = await response.json();
      console.log('🔧 AgentProvider: Config response:', {
        success: data.success,
        source: data.source,
        hasConfig: !!data.config
      });
      
      if (data.success && data.config) {
        console.log('✅ AgentProvider: Setting hybrid config:', {
          name: data.config.name,
          theme: data.config.theme,
          hasAvatar: !!data.config.avatar,
          avatarType: data.config.avatar?.type,
          hasDescription: !!data.config.description,
          source: data.source,
          modelsCount: data.config.models?.length || 0,
          actionsCount: data.config.actions?.length || 0,
          schedulesCount: data.config.schedules?.length || 0
        });
        setConfig(data.config);
      } else {
        console.error('❌ AgentProvider: Invalid config response:', data);
        throw new Error('Invalid config response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ AgentProvider: Error fetching config:', errorMessage);
      setError(errorMessage);
      
      // Set fallback config with embedded data
      const fallbackConfig: AgentConfig = {
        name: '${options.projectName}',
        description: 'Self-contained AI agent application',
        theme: 'green',
        avatar: null,
        personality: '${escapeJSString(options.agentConfig?.personality || '')}',
        characterNames: '${escapeJSString(options.agentConfig?.characterNames || '')}',
        models: ${JSON.stringify(options.models)},
        actions: ${JSON.stringify(options.actions)},
        schedules: ${JSON.stringify(options.schedules)}
      };
      console.log('🔄 Using fallback config with embedded functional data');
      setConfig(fallbackConfig);
    } finally {
      setLoading(false);
    }
  };

  const refetchConfig = async () => {
    await fetchConfig();
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const value: AgentContextType = {
    config,
    loading,
    error,
    refetchConfig
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};`;
  }

  private generateApiHook(): string {
    return `'use client'
import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  return { ...state, execute };
}

export default useApi;`;
  }

  private generateMobileHook(): string {
    return `'use client'
import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initial size
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
}

export default useMobile;`;
  }

  private generateSeedFile(options: MobileAppTemplateOptions): string {
    return this.generateSeedScript(options);
  }

  private generateGlobalStyles(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

/* Mobile-first responsive design utilities */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}`;
  }

  private generateReadme(options: MobileAppTemplateOptions): string {
    return `# ${options.projectName}

A **fully self-contained** mobile-first AI agent application with embedded actions, schedules, and real AI chat functionality powered by Vercel's AI SDK.

## ✨ Key Features

- **🤖 AI-Powered Chat**: Real conversational AI using OpenAI GPT-4 or Anthropic Claude－ 
- **📱 Mobile-First Design**: Bottom navigation, touch-friendly interface
- **🗃️ Data Management**: Interactive data models with CRUD operations
- **⚡ Smart Actions**: Execute embedded agent actions locally with real-time feedback
- **⏰ Task Scheduling**: Automated cron jobs with embedded code
- **🏠 Self-Contained**: Embedded actions, schedules & models + live UI config from main app
- **🚀 Vercel Deployment**: Optimized for Vercel platform with zero-config deployment

## 🏗️ Hybrid Architecture

This sub-agent uses a **hybrid architecture** for optimal performance and user experience:

### ☁️ **UI Elements from Main App (Dynamic)**
- **Name**: Agent name updates in real-time
- **Description**: Agent description stays synchronized
- **Theme**: UI theme changes reflect immediately  
- **Avatar**: Profile image updates automatically
- **Domain**: Custom domain configuration

### 🏠 **Functional Data Embedded (Static)**
- **Models**: Data model definitions embedded for fast access
- **Actions**: All action code embedded and executes locally
- **Schedules**: Schedule definitions embedded, execute locally via Vercel cron
- **Database**: PostgreSQL operations happen locally with embedded schema

This ensures **real-time UI updates** from the main app while maintaining **fast performance** with embedded functional data and **complete independence** for execution.

## ⏰ How Schedules Work

Schedules are **action sequences** that run automatically on a cron schedule:

1. **Action Steps**: Each schedule contains multiple actions that run sequentially
2. **Embedded Execution**: Actions execute locally using embedded code
3. **Error Handling**: Configurable error handling (continue or stop on failure)
4. **Timing Control**: Optional delays between action steps
5. **Vercel Cron**: Automatic execution via Vercel's cron system

### Schedule Structure:
\`\`\`json
{
  "name": "daily-report",
  "interval": { "pattern": "0 9 * * *" },
  "steps": [
    { "actionId": "fetch-data", "input": {...} },
    { "actionId": "generate-report", "input": {...} },
    { "actionId": "send-email", "input": {...} }
  ]
}
\`\`\`

## 🤖 AI Chat Capabilities

The chat feature uses Vercel's AI SDK and provides:

- **Contextual Responses**: AI knows about your specific models, actions, and schedules
- **Tool Integration**: AI can fetch system info, list models, actions, and schedules
- **Streaming Responses**: Real-time message streaming for better UX
- **Error Handling**: Graceful fallbacks when AI services are unavailable
- **Multi-Provider**: Switch between OpenAI and Anthropic models

### Example Chat Interactions:
- "Show me my data models" → AI lists all models with descriptions
- "What actions can I run?" → AI explains available smart actions
- "Check system status" → AI provides real-time health information
- "How many schedules are active?" → AI counts and reports active tasks

## 🗄️ Database Configuration

This app uses **PostgreSQL** with **Prisma ORM** and is optimized for both local development and Vercel serverless deployment:

### Database Setup
- **Local Development**: PostgreSQL database on your local machine
- **Production**: Neon PostgreSQL (recommended) or other PostgreSQL provider
- **Schema Management**: Prisma handles table creation and migrations

### Database Features
- **Schema Push**: Tables created automatically from Prisma schema
- **CRUD Operations**: Full Create, Read, Update, Delete via REST API endpoints
- **Error Handling**: Graceful handling when database is not ready
- **Connection Pooling**: Optimized for serverless function lifecycle

### Setup Instructions

#### For Local Development:
1. Install PostgreSQL locally
2. Create a database: \`createdb ${options.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}\`
3. Update \`DATABASE_URL\` in \`.env.local\`
4. Run \`npm run db:setup\` to create tables

#### For Production (Neon):
1. Create a Neon database at https://neon.tech
2. Copy the connection string to \`DATABASE_URL\` in Vercel environment variables
3. Deploy - tables will be created automatically

### Troubleshooting Database Issues
If you encounter "table does not exist" errors:

1. **Check DATABASE_URL**: Ensure it points to a valid PostgreSQL database
2. **Run Setup**: Execute \`npm run db:setup\` to create tables
3. **Verify Connection**: Check that the PostgreSQL database exists and is accessible
4. **Production**: Ensure Neon database is created and connection string is correct

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- **OpenAI API Key** or **Anthropic API Key**
- Vercel account (for deployment)

### 1. Setup Environment Variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

Add your AI provider credentials and Redis URL:
\`\`\`env
# For OpenAI (recommended)
OPENAI_API_KEY=sk-your-openai-key-here
AI_MODEL_PROVIDER=openai
AI_MODEL_NAME=gpt-4o-mini

# OR for Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
AI_MODEL_PROVIDER=anthropic
AI_MODEL_NAME=claude-3-haiku-20240307

# Redis for execution logging (recommended)
REDIS_URL=redis://default:password@host:port
\`\`\`

### 2. Install and Run
\`\`\`bash
npm install
npm run dev
\`\`\`

The app will be available at \`http://localhost:3000\` with a fully functional AI chat and your custom avatar!

### 3. Optional: Redis Setup (Recommended)
For execution logging and monitoring:
\`\`\`bash
# Option 1: Redis Cloud (recommended for production)
# Sign up at https://redis.com/redis-enterprise-cloud/
# Get connection string and add to REDIS_URL

# Option 2: Local Redis (for development)
# Install Redis locally and use: redis://localhost:6379

# Option 3: Upstash Redis (Vercel-friendly)
# Sign up at https://upstash.com/
# Create Redis database and use connection string
\`\`\`

**Redis Benefits:**
- 🔄 Real-time action execution tracking
- 📊 Step-by-step execution monitoring  
- 🐛 Advanced debugging with input/output logs
- ⏱️ Performance monitoring and timing
- 📈 Execution history and analytics

## 📊 Your Agent Data

### Data Models (${options.models.length})
${options.models.map(m => `- **${m.title || m.name}**: ${m.description || 'Data model'}`).join('\n')}

### Smart Actions (${options.actions.length})
${options.actions.map(a => `- **${a.title || a.name}**: ${a.description || 'Action'}`).join('\n')}

### Scheduled Tasks (${options.schedules.length})
${options.schedules.map(s => `- **${s.title || s.name}**: ${s.description || 'Scheduled task'} (\`${s.trigger?.pattern || '* * * * *'}\`) - ${s.steps?.length || 0} steps`).join('\n')}

## 🛠️ Configuration

### AI Model Options

**OpenAI Models:**
- \`gpt-4o-mini\` (default, fast & cost-effective)
- \`gpt-4o\` (most capable)
- \`gpt-3.5-turbo\` (budget option)

**Anthropic Models:**
- \`claude-3-haiku-20240307\` (fast)
- \`claude-3-sonnet-20240229\` (balanced)
- \`claude-3-opus-20240229\` (most capable)

### Environment Variables
\`\`\`env
# Required: AI Provider
OPENAI_API_KEY=your-key
# OR
ANTHROPIC_API_KEY=your-key

# Optional: Model Configuration
AI_MODEL_PROVIDER=openai  # openai, anthropic
AI_MODEL_NAME=gpt-4o-mini

# Database
DATABASE_URL=file:./dev.db

# Security
NEXTAUTH_SECRET=your-secret
CRON_SECRET=your-cron-secret
\`\`\`

## 📱 Mobile Features

- **Touch-Optimized**: 44px minimum touch targets
- **Bottom Navigation**: Thumb-friendly navigation
- **Responsive Chat**: Full-screen chat interface on mobile
- **Offline-First**: Works without network for local features
- **PWA-Ready**: Can be installed as a mobile app

## 🔧 API Endpoints

### Chat API
- \`POST /api/chat\` - AI chat with streaming responses

### System APIs
- \`GET /api/health\` - System health check
- \`GET /api/stats\` - Application statistics
- \`GET /api/models/[modelName]\` - Model data

### Action APIs
${options.actions.map(a => `- \`POST /api/actions/${a.name}\` - ${a.description || 'Execute action'}`).join('\n')}

### Cron APIs
${options.schedules.map(s => `- \`POST /api/cron/${s.name}\` - ${s.description || 'Scheduled task'}`).join('\n')}

## 🎨 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI Integration**: Vercel AI SDK with OpenAI/Anthropic
- **Database**: SQLite (development), easily upgradeable to cloud databases
- **Mobile UI**: Custom responsive components optimized for touch
- **Deployment**: Vercel with automatic builds and cron functions

## 🚀 Deployment

Deploy to Vercel with one click:

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - \`OPENAI_API_KEY\` or \`ANTHROPIC_API_KEY\`
   - \`AI_MODEL_PROVIDER\`
   - \`AI_MODEL_NAME\`
4. Deploy!

The chat will work immediately with your AI provider.

## 🔒 Security

- API keys are server-side only
- Rate limiting on AI endpoints
- Input validation and sanitization
- Secure cron job endpoints

---

**Built with Vercel AI SDK** 🤖 | **Mobile-First Design** 📱 | **Production Ready** 🚀`;
  }

  private generateSeedScript(options: MobileAppTemplateOptions): string {
    const { models, enums, projectName, agentConfig, prismaSchema } = options;
    const agentName = agentConfig?.name || projectName;
    const agentDescription = agentConfig?.description || 'Smart agent powered by AI';
    
    return `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AI-Powered Database Seeding Script
 * 
 * This script generates realistic seed data for the ${agentName} agent
 * using AI to create contextually appropriate sample records.
 */

// AI Prompt Template for generating seed data using Prisma schema
const generateSeedDataPrompt = (modelName: string, prismaSchema: string, agentContext: string, recordCount: number = 5) => \`
You are a Prisma database seeding expert. Generate \${recordCount} realistic sample records for the "\${modelName}" model.

CONTEXT: \${agentContext}

FULL PRISMA SCHEMA:
\${prismaSchema}

🚨 CRITICAL RULES:
1. Look at the Prisma schema above to understand the EXACT field structure for \${modelName}
2. ONLY generate scalar fields (String, Int, Float, Boolean, DateTime) - NOT relation fields
3. Skip the 'id' field - Prisma auto-generates it with @id @default(cuid())
4. Skip relation fields (fields that don't have primitive types)
5. For DateTime fields, use ISO string format: "2023-10-15T10:30:00.000Z"
6. Return ONLY a JSON array of objects, no markdown or extra text

FIELD IDENTIFICATION:
- ✅ INCLUDE: Fields with types String, Int, Float, Boolean, DateTime, Json
- ❌ SKIP: Fields with model names as types (these are relations)
- ❌ SKIP: Fields with arrays [] (these are relation arrays)
- ❌ SKIP: The 'id' field (auto-generated)

For the \${modelName} model, generate realistic data that makes sense in the context of: \${agentContext}

Return format: [{"field1": "value1", "field2": "value2"}, ...]

Generate the JSON array now:
\`;

// Available AI providers for seed generation
const AI_PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: (apiKey: string) => ({
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json',
    }),
    body: (prompt: string) => ({
      model: process.env.AI_MODEL_NAME || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a database seeding expert. Generate realistic, contextually appropriate sample data. Always return valid JSON arrays only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }),
    extractContent: (response: any) => response.choices[0]?.message?.content
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey: string) => ({
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }),
    body: (prompt: string) => ({
      model: process.env.AI_MODEL_NAME || 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: \`You are a database seeding expert. Generate realistic, contextually appropriate sample data. Always return valid JSON arrays only.\\n\\n\${prompt}\`
        }
      ]
    }),
    extractContent: (response: any) => response.content[0]?.text
  }
};

// Generate seed data using AI
async function generateSeedDataWithAI(modelName: string, prismaSchema: string, agentContext: string, recordCount: number = 5): Promise<any[]> {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn(\`⚠️ No API key found for \${provider}. Using fallback seed data for \${modelName}\`);
    return generateFallbackSeedData(modelName, recordCount);
  }

  try {
    const prompt = generateSeedDataPrompt(modelName, prismaSchema, agentContext, recordCount);
    const aiProvider = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
    
    console.log(\`🤖 Generating \${recordCount} seed records for \${modelName} using \${provider}...\`);
    
    const response = await fetch(aiProvider.url, {
      method: 'POST',
      headers: aiProvider.headers(apiKey),
      body: JSON.stringify(aiProvider.body(prompt))
    });

    if (!response.ok) {
      throw new Error(\`AI API request failed: \${response.status} \${response.statusText}\`);
    }

    const data = await response.json();
    const content = aiProvider.extractContent(data);
    
    if (!content) {
      throw new Error('No content received from AI provider');
    }

    // Parse the AI response as JSON
    let seedData;
    try {
      // Clean the response in case AI added markdown formatting
      const cleanContent = content.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
      seedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.warn(\`⚠️ Failed to parse AI response as JSON for \${modelName}. Using fallback data.\`);
      return generateFallbackSeedData(modelName, recordCount);
    }

    if (!Array.isArray(seedData)) {
      console.warn(\`⚠️ AI response is not an array for \${modelName}. Using fallback data.\`);
      return generateFallbackSeedData(modelName, recordCount);
    }

    console.log(\`✅ Generated \${seedData.length} AI-powered seed records for \${modelName}\`);
    return seedData.slice(0, recordCount); // Ensure we don't exceed requested count
    
  } catch (error) {
    console.warn(\`⚠️ AI seed generation failed for \${modelName}: \${error}. Using fallback data.\`);
    return generateFallbackSeedData(modelName, fields, recordCount, enums);
  }
}

// Fallback seed data generator
function generateFallbackSeedData(modelName: string, recordCount: number = 5): any[] {
  console.log(\`🔄 Generating simple fallback seed data for \${modelName}\`);
  
  const records = [];
  
  for (let i = 0; i < recordCount; i++) {
    const record: any = {
      name: \`Sample \${modelName} \${i + 1}\`,
      description: \`Fallback description for \${modelName} record \${i + 1}\`
    };
    
    records.push(record);
  }
  
  return records;
}

// Model definitions for seeding
const models = ${JSON.stringify(models, null, 2)};

// Enum definitions for seeding
const enums = ${JSON.stringify(enums || [], null, 2)};

// Agent context for AI seed generation
const agentContext = "${agentDescription}";



async function seedDatabase() {
  console.log('🌱 Starting database seeding for ${agentName}...');
  console.log(\`📊 Seeding \${models.length} models with AI-generated data\`);
  
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    let totalRecordsCreated = 0;
    
    // Seed each model with scalar fields only
    for (const model of models) {
      console.log(\`\\n🌱 Seeding model: \${model.name}\`);
      
      try {
        // Check if model exists in Prisma client (try both lowercase and original case)
        let modelClient = (prisma as any)[model.name.toLowerCase()];
        if (!modelClient) {
          modelClient = (prisma as any)[model.name];
        }
        if (!modelClient) {
          console.warn(\`⚠️ Model \${model.name} not found in Prisma client (tried both '\${model.name.toLowerCase()}' and '\${model.name}'), skipping...\`);
          continue;
        }
        
        const existingCount = await modelClient.count();
        if (existingCount > 0) {
          console.log(\`ℹ️ Model \${model.name} already has \${existingCount} records, skipping seeding\`);
          continue;
        }
        
        // Generate seed data using AI with full Prisma schema context
        const seedRecords = await generateSeedDataWithAI(
          model.name,
          \`${prismaSchema || ''}\`, // Pass the full Prisma schema
          agentContext,
          5 // Generate 5 records per model
        );
        
        if (seedRecords.length === 0) {
          console.log(\`ℹ️ No seed data generated for \${model.name}\`);
          continue;
        }
        
        // Insert seed data
        console.log(\`📝 Inserting \${seedRecords.length} records into \${model.name}...\`);
        
        for (const record of seedRecords) {
          try {
            await modelClient.create({
              data: record
            });
            totalRecordsCreated++;
          } catch (recordError) {
            console.warn(\`⚠️ Failed to create record in \${model.name}:\`, recordError);
            // Log the record data for debugging
            console.warn(\`   Record data:\`, JSON.stringify(record, null, 2));
          }
        }
        
        console.log(\`✅ Successfully seeded \${model.name} with \${seedRecords.length} records\`);
        
      } catch (modelError) {
        console.error(\`❌ Error seeding model \${model.name}:\`, modelError);
      }
    }
    
    console.log(\`\\n🎉 Database seeding completed!\`);
    console.log(\`📊 Total records created: \${totalRecordsCreated}\`);
    console.log(\`📋 Models seeded: \${models.length}\`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;`;
  }


} 