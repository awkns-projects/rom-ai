import type { AgentAction, AgentSchedule } from '../../types';

interface MobileAppTemplateOptions {
  projectName: string;
  models: any[];
  actions: AgentAction[];
  schedules: AgentSchedule[];
  prismaSchema?: string; // Add optional schema - will be passed from main deployment
  sqliteOptions?: { filename?: string; enableWAL?: boolean; enableForeignKeys?: boolean; };
  
  // Vercel deployment configuration
  vercelConfig?: {
    team?: string;
    buildCommand?: string;
    cronJobs?: boolean;
    aiSdkEnabled?: boolean;
  };
  environmentVariables?: Record<string, string>;
}

/**
 * Unified Mobile App Template Generator
 * Consolidates all file generation into one cohesive system
 * 
 * 🚀 NEW DYNAMIC ARCHITECTURE:
 * 1. Dynamic Action Execution: /api/actions/[actionName] - fetches code from main app, executes locally
 * 2. Direct Action Trigger: /api/trigger/action/[actionId] - calls main app directly by ID
 * 3. Direct Schedule Trigger: /api/trigger/schedule/[scheduleId] - calls main app directly by ID  
 * 4. Dynamic Cron Scheduler: /api/cron/scheduler - runs every minute, checks main app for schedules
 * 5. Dynamic API Key Fetching: Chat interface fetches OpenAI/Grok/Anthropic keys from main app
 * 6. Direct Model CRUD: /api/models/[modelName] + /api/models/[modelName]/[id] - SQLite/Prisma operations
 * 7. Interactive Action UI: Modal-based action execution with input parameters and results display
 * 
 * Benefits: 
 * - No redeployments needed for code changes
 * - Always up-to-date actions and schedules
 * - Local execution with fresh credentials
 * - Centralized API key management
 * - Direct database operations for optimal performance
 * - Full CRUD operations with pagination and search
 * - Interactive UI components like main app
 * - No manual API key configuration required
 */
export class MobileAppTemplate {
  private options: MobileAppTemplateOptions;

  constructor(options: MobileAppTemplateOptions) {
    this.options = options;
  }

  /**
   * Generate all files for the mobile app
   */
  generateAllFiles(): Record<string, string> {
    const files: Record<string, string> = {};

    // Core configuration files
    Object.assign(files, this.generateConfigFiles());
    
    // Pages
    Object.assign(files, this.generatePages());
    
    // Components
    Object.assign(files, this.generateComponents());
    
    // API routes
    Object.assign(files, this.generateApiRoutes());
    
    // Utilities and libs
    Object.assign(files, this.generateUtilities());
    
    // Styles and assets
    Object.assign(files, this.generateStyles());
    
    // Documentation
    Object.assign(files, this.generateDocumentation());

    return files;
  }

  private generateConfigFiles(): Record<string, string> {
    const { projectName, vercelConfig } = this.options;
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');

    const files: Record<string, string> = {};

    // Generate package.json for Vercel deployment
    files['package.json'] = this.generatePackageJson(sanitizedName, vercelConfig);

    // Generate Next.js config for Vercel
    files['next.config.js'] = this.generateNextConfig();

    // Generate TypeScript config (same for all targets)
    files['tsconfig.json'] = JSON.stringify({
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "es6"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] }
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    }, null, 2);

    // Generate Tailwind config (same for all targets)
    files['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
}`;

    // Generate PostCSS config (same for all targets)  
    files['postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

    // Generate environment example for Vercel
    files['.env.example'] = this.generateEnvExample();
    
    // Generate local environment file with database URL
    files['.env.local'] = this.generateEnvLocal();

    // Generate Vercel configuration
    files['vercel.json'] = this.generateVercelConfig();

    // Keep the existing .gitignore and README generation but make them return to files object
    files['.gitignore'] = `# Dependencies
node_modules/
.pnpm-debug.log*

# Next.js
.next/
out/

# Production
build/

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local
.env

# Database
*.db
*.db-journal
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Vercel
.vercel
`;

    files['README.md'] = this.generateReadme();

    return files;
  }

  // New helper methods for deployment-specific generation
  private generatePackageJson(sanitizedName: string, vercelConfig?: any): string {
    const aiSdkEnabled = vercelConfig?.aiSdkEnabled !== false; // Default true for Vercel

    const baseDependencies = {
      "@prisma/client": "^6.11.0",
      "@types/node": "^20",
      "@types/react": "^18", 
      "@types/react-dom": "^18",
      eslint: "^8",
      "eslint-config-next": "14.0.4",
      next: "14.0.4",
      prisma: "^6.11.0",
      react: "^18",
      "react-dom": "^18",
      tailwindcss: "^3.3.0",
      typescript: "^5",
      tsx: "^4.6.2",
      autoprefixer: "^10.0.1",
      postcss: "^8",
      "@tailwindcss/forms": "^0.5.7"
    };

    // Add AI SDK packages for Vercel (enabled by default)
    if (aiSdkEnabled) {
      Object.assign(baseDependencies, {
        "ai": "^4.3.13",
        "@ai-sdk/openai": "^1.3.22",
        "@ai-sdk/react": "^1.2.11", 
        "@ai-sdk/anthropic": "^0.0.50",
        "zod": "^3.23.8",
        "nanoid": "^5.0.8"
      });
    }

    // Vercel-optimized scripts with SQLite support
    const baseScripts = {
      dev: "npm run db:init && npm run db:generate && npm run db:push && next dev",
      build: "npm run build:db && next build",
      "build:db": "npm run db:init && npm run db:generate && npm run db:push",
      start: "next start",
      lint: "next lint",
      "db:generate": "prisma generate",
      "db:push": "prisma db push --accept-data-loss",
      "db:deploy": "prisma migrate deploy",
      "db:migrate": "prisma migrate dev",
      "db:studio": "prisma studio",
      "db:seed": "tsx prisma/seed.ts",
      "db:init": "node scripts/init-sqlite.js",
      "db:reset": "prisma migrate reset --force",
      postinstall: "npm run db:init && prisma generate",
      "vercel-build": "npm run build:db && next build"
    };

    return JSON.stringify({
      name: sanitizedName,
      version: "1.0.0",
      private: true,
      scripts: baseScripts,
      dependencies: baseDependencies
    }, null, 2);
  }

  private generateNextConfig(): string {
    // Vercel-optimized Next.js config
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig`;
  }

  private generateEnvExample(): string {
    const { vercelConfig } = this.options;
    const aiSdkEnabled = vercelConfig?.aiSdkEnabled !== false;

    let envContent = `# Database - SQLite (local development)
DATABASE_URL="file:./dev.db"`;

    if (aiSdkEnabled) {
      envContent += `

# 🚀 AI Provider Configuration (Dynamic API Key Fetching)
# API keys are automatically fetched from the main app - no local configuration needed!
# The sub-agent will:
# 1. First check user's saved API keys in main app (/api/user/api-keys)
# 2. Fall back to agent-specific credentials (/api/agent-credentials-public)
# 3. Support OpenAI, Anthropic, and Grok providers

# Optional: Override AI Provider Selection (defaults to openai)
AI_MODEL_PROVIDER="openai"    # openai | anthropic | grok
AI_MODEL_NAME="gpt-4o-mini"   # For OpenAI: gpt-4o-mini, gpt-4o, gpt-3.5-turbo
                              # For Anthropic: claude-3-haiku-20240307, claude-3-sonnet-20240229
                              # For Grok: grok-beta

# Only set these if you want to override the main app's API keys
# OPENAI_API_KEY=""      # Leave empty - fetched from main app
# ANTHROPIC_API_KEY=""   # Leave empty - fetched from main app  
# GROK_API_KEY=""        # Leave empty - fetched from main app`;
    }

    envContent += `

# Main App Integration (Required for agent communication)
NEXT_PUBLIC_MAIN_APP_URL="https://rewrite-complete.vercel.app"
NEXT_PUBLIC_DOCUMENT_ID=""  # Your agent document ID from main app
NEXT_PUBLIC_AGENT_KEY=""    # Your agent key for authentication

# Security
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Cron security (for production)
CRON_SECRET="your-cron-secret-here"

# Application Configuration
NEXT_PUBLIC_APP_NAME="${this.options.projectName}"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Optional: Custom branding
NEXT_PUBLIC_BRAND_NAME="${this.options.projectName}"
NEXT_PUBLIC_BRAND_DESCRIPTION="Smart agent powered by AI"
NEXT_PUBLIC_THEME_COLOR="emerald"  # Options: emerald, blue, purple, pink

# Optional: Custom environment variables
# Add your project-specific variables here`;

    return envContent;
  }

  private generateEnvLocal(): string {
    return `# Local Development Environment
DATABASE_URL="file:./dev.db"
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# These will be set automatically during deployment
# NEXT_PUBLIC_MAIN_APP_URL=
# NEXT_PUBLIC_DOCUMENT_ID=
# NEXT_PUBLIC_AGENT_TOKEN=
`;
  }

  private generateVercelConfig(): string {
    return JSON.stringify({
      buildCommand: "npm run vercel-build",
      functions: {
        "src/pages/api/cron/*.ts": { maxDuration: 300 }
      },
      crons: [{
        path: "/api/cron/scheduler",
        schedule: "* * * * *" // Run every minute to check main app for schedules
      }],
      installCommand: "npm install",
      build: { 
        env: { 
          PRISMA_GENERATE_DATAPROXY: "true",
          DATABASE_URL: "file:/tmp/dev.db"
        } 
      }
    }, null, 2);
  }





  private generatePages(): Record<string, string> {
    return {
      'src/pages/_app.tsx': this.generateAppPage(),
      'src/pages/index.tsx': this.generateHomePage(),
      'src/pages/models/index.tsx': this.generateModelsListPage(),
      'src/pages/models/[modelName].tsx': this.generateModelDetailPage(),
      'src/pages/actions/index.tsx': this.generateActionsPage(),
      'src/pages/schedules/index.tsx': this.generateSchedulesPage(),
      'src/pages/chat/index.tsx': this.generateChatPage()
    };
  }

  private generateComponents(): Record<string, string> {
    return {
      'src/components/Layout.tsx': this.generateLayoutComponent(),
      'src/components/MobileNav.tsx': this.generateMobileNavComponent(),
      'src/components/ModelCard.tsx': this.generateModelCardComponent(),
      'src/components/ActionCard.tsx': this.generateActionCardComponent(),
      'src/components/ScheduleCard.tsx': this.generateScheduleCardComponent(),
      'src/components/StatsCard.tsx': this.generateStatsCardComponent(),
      'src/components/ChatMessage.tsx': this.generateChatMessageComponent(),
      'src/components/LoadingSpinner.tsx': this.generateLoadingSpinnerComponent(),
      'src/components/ActionExecutionModal.tsx': this.generateActionExecutionModal()
    };
  }

  private generateApiRoutes(): Record<string, string> {
    const files: Record<string, string> = {};

    // System endpoints
    files['src/pages/api/health.ts'] = this.generateHealthEndpoint();
    files['src/pages/api/stats.ts'] = this.generateStatsEndpoint();
    files['src/pages/api/models/[modelName].ts'] = this.generateModelEndpoint();
    files['src/pages/api/models/[modelName]/[id].ts'] = this.generateModelRecordEndpoint();
    files['src/pages/api/chat.ts'] = this.generateChatEndpoint();

    // Dynamic action execution endpoint (fetches from main app)
    files['src/pages/api/actions/[actionName].ts'] = this.generateDynamicActionEndpoint();

    // Direct action trigger endpoint (calls main app directly)
    files['src/pages/api/trigger/action/[actionId].ts'] = this.generateDirectActionTriggerEndpoint();

    // Direct schedule trigger endpoint (calls main app directly)
    files['src/pages/api/trigger/schedule/[scheduleId].ts'] = this.generateDirectScheduleTriggerEndpoint();

    // Single cron endpoint that checks main app for schedules to run
    files['src/pages/api/cron/scheduler.ts'] = this.generateDynamicCronEndpoint();

    // Sub-agent's own API endpoints that call main app
    files['src/pages/api/agent/actions.ts'] = this.generateActionsEndpoint();
    files['src/pages/api/agent/schedules.ts'] = this.generateSchedulesEndpoint();
    files['src/pages/api/agent/models.ts'] = this.generateModelsEndpoint();
          files['src/pages/api/agent/config.ts'] = this.generateAgentConfigEndpoint();
      files['src/pages/api/agent/data.ts'] = this.generateAgentDataEndpoint();
      files['src/pages/api/agent/test-connection.ts'] = this.generateTestConnectionEndpoint();

    return files;
  }

  private generateUtilities(): Record<string, string> {
    const files: Record<string, string> = {
      'src/lib/prisma.ts': this.generatePrismaClient(),
      'src/lib/api.ts': this.generateApiClient(),
      'src/lib/theme.ts': this.generateThemeSystem(),
      'src/contexts/AgentContext.tsx': this.generateAgentContext(),
      'src/hooks/useApi.ts': this.generateApiHook(),
      'src/hooks/useMobile.ts': this.generateMobileHook(),
      'prisma/seed.ts': this.generateSeedFile(),
      'scripts/init-sqlite.js': this.generateSQLiteInitScript()
    };

    // Add Prisma schema - use provided one (sanitized) or generate default
    if (this.options.prismaSchema) {
      files['prisma/schema.prisma'] = this.sanitizePrismaSchema(this.options.prismaSchema);
    } else {
      files['prisma/schema.prisma'] = this.generateDefaultPrismaSchema();
    }

    return files;
  }

  private generateStyles(): Record<string, string> {
    return {
      'src/styles/globals.css': this.generateGlobalStyles(),
      '.gitignore': this.generateGitIgnore()
    };
  }

  private generateDocumentation(): Record<string, string> {
    return {
      'README.md': this.generateReadme()
    };
  }

  // Component generators
  private generateLayoutComponent(): string {
    return `import { useState, useEffect, ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import MobileNav from './MobileNav';
import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  agentName?: string;
  theme?: keyof typeof themes;
}

export default function Layout({ 
  children, 
  title = '${this.options.projectName}', 
  agentName = '${this.options.projectName}', 
  theme = 'green' 
}: LayoutProps) {
  const [isMobile, setIsMobile] = useState(true);
  const router = useRouter();
  
  // Use the global agent context
  const { config: agentConfig, loading, error } = useAgent();
  
  // Use agent config theme if available, fallback to props
  const selectedTheme = agentConfig?.theme || theme;
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;
  const displayName = agentConfig?.name || agentName;
  
  // Extract avatar URL from config
  const avatarUrl = agentConfig?.avatar?.uploadedImage || null;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={\`\${agentName} - AI Agent Application\`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={\`min-h-screen bg-black relative\`}>
        {/* Subtle dark gradient overlay */}
        <div className="fixed inset-0 pointer-events-none">
          <div className={\`absolute inset-0 bg-gradient-to-br from-\${currentTheme.primary}-950/40 via-black to-\${currentTheme.primary}-950/20\`}></div>
        </div>

        {/* Main Content */}
        <div className={\`relative z-10 \${isMobile ? 'pb-16' : ''}\`}>
          {/* Desktop Header */}
          {!isMobile && (
            <header className={\`\${currentTheme.bg} border-b \${currentTheme.border} sticky top-0 z-40\`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Agent Avatar" 
                        className="w-8 h-8 rounded-lg object-cover"
                        onError={(e) => {
                          // Fallback to theme gradient if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={\`w-8 h-8 rounded-lg bg-gradient-to-br \${currentTheme.gradient} border \${currentTheme.border} \${avatarUrl ? 'hidden' : ''}\`}></div>
                    <h1 className={\`font-mono font-bold text-lg \${currentTheme.light}\`}>{displayName}</h1>
                  </div>
                  
                  <nav className="flex items-center gap-6">
                    {[
                      { path: '/', icon: '🏠', label: 'Home' },
                      { path: '/models', icon: '🗃️', label: 'Data' },
                      { path: '/actions', icon: '⚡', label: 'Actions' },
                      { path: '/schedules', icon: '⏰', label: 'Tasks' },
                      { path: '/chat', icon: '💬', label: 'Chat' }
                    ].map((item) => (
                      <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={\`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm transition-all duration-200 \${
                          router.pathname === item.path
                            ? \`\${currentTheme.bgActive} \${currentTheme.accent} border \${currentTheme.borderActive}\`
                            : \`\${currentTheme.dim} hover:\${currentTheme.light} hover:\${currentTheme.bgHover}\`
                        }\`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </header>
          )}

          {/* Page Content */}
          <main className={\`\${isMobile ? 'max-w-sm mx-auto px-2' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}\`}>
            {children}
          </main>
        </div>

        {/* Mobile Navigation */}
        {isMobile && <MobileNav currentTheme={currentTheme} />}
      </div>
    </>
  );
}`;
  }

  private generateMobileNavComponent(): string {
    return `import { useRouter } from 'next/router';

interface MobileNavProps {
  currentTheme: any;
}

export default function MobileNav({ currentTheme }: MobileNavProps) {
  const router = useRouter();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/models', icon: '🗃️', label: 'Data' },
    { path: '/actions', icon: '⚡', label: 'Actions' },
    { path: '/schedules', icon: '⏰', label: 'Tasks' },
    { path: '/chat', icon: '💬', label: 'Chat' }
  ];

  return (
    <div className={\`fixed bottom-0 left-0 right-0 bg-black/90 border-t \${currentTheme.border} z-50\`}>
      <div className="flex justify-around items-center py-1 px-2 max-w-sm mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={\`flex flex-col items-center gap-1 p-1 rounded-lg transition-all duration-200 min-w-0 flex-1 \${
              router.pathname === item.path
                ? \`\${currentTheme.bgActive} \${currentTheme.accent}\`
                : \`\${currentTheme.dim} hover:\${currentTheme.light} hover:\${currentTheme.bgHover}\`
            }\`}
          >
            <span className={\`text-sm \${router.pathname === item.path ? 'scale-110' : ''} transition-transform\`}>
              {item.icon}
            </span>
            <span className="font-mono text-xs font-medium truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}`;
  }

  private generateHomePage(): string {
    const { projectName, models, actions, schedules } = this.options;
    
    return `import Layout from '@/components/Layout';
import StatsCard from '@/components/StatsCard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';
import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRecords: 0,
    activeSchedules: 0,
    totalModels: ${models.length},
    totalActions: ${actions.length},
    totalSchedules: ${schedules.length}
  });
  const [loading, setLoading] = useState(true);

  // Use the global agent context
  const { config: agentConfig } = useAgent();
  
  // Use agent config theme if available, fallback to green
  const selectedTheme = agentConfig?.theme || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;
  const displayName = agentConfig?.name || '${projectName}';
  
  // Extract avatar URL from config
  const avatarUrl = agentConfig?.avatar?.uploadedImage || null;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.getStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { 
      path: '/chat', 
      icon: '💬', 
      title: 'Chat with AI', 
      desc: 'Ask questions or give commands'
    },
    { 
      path: '/models', 
      icon: '🗃️', 
      title: 'View Data', 
      desc: 'Manage your information'
    },
    { 
      path: '/actions', 
      icon: '⚡', 
      title: 'Execute Actions', 
      desc: 'Run smart operations'
    },
    { 
      path: '/schedules', 
      icon: '⏰', 
      title: 'Schedules', 
      desc: 'Manage automated tasks'
    }
  ];

  return (
    <Layout title="${projectName}">
      <div className="p-2 space-y-3">
        {/* Hero Section */}
        <div className="text-center space-y-2 pt-3">
          <div className="flex justify-center">
            <div className={\`p-2 \${currentTheme.bg} border \${currentTheme.border} rounded-xl\`}>
              <div className={\`w-16 h-16 rounded-full bg-gradient-to-br \${currentTheme.gradient} border-2 \${currentTheme.borderActive} flex items-center justify-center overflow-hidden\`}>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Agent Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to theme emoji if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={\`text-xl \${currentTheme.accent} \${avatarUrl ? 'hidden' : ''}\`}>🤖</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className={\`font-mono font-bold text-xl \${currentTheme.light}\`}>{displayName}</h1>
            <p className={\`font-mono text-xs \${currentTheme.dim} max-w-xs mx-auto leading-tight\`}>
              Your intelligent AI assistant
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsCard stats={stats} loading={loading} />

        {/* Quick Actions */}
        <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-3\`}>
          <h3 className={\`font-mono font-semibold text-xs \${currentTheme.light} mb-2\`}>Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.path)}
                className={\`w-full flex items-center gap-2 p-2 \${currentTheme.bg} border \${currentTheme.border} \${currentTheme.bgHover} rounded-lg transition-all duration-200\`}
              >
                <span className="text-sm">{action.icon}</span>
                <div className="flex-1 text-left">
                  <div className={\`font-mono text-xs \${currentTheme.light}\`}>{action.title}</div>
                  <div className={\`font-mono text-xs \${currentTheme.dim}\`}>{action.desc}</div>
                </div>
                <span className={\`text-xs \${currentTheme.dim}\`}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-3\`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={\`w-2 h-2 \${currentTheme.accent.replace('text-', 'bg-')} rounded-full animate-pulse\`}></div>
              <div>
                <div className={\`font-mono font-semibold text-xs \${currentTheme.light}\`}>System Status</div>
                <div className={\`font-mono text-xs \${currentTheme.dim}\`}>All systems operational</div>
              </div>
            </div>
            <div className={\`px-2 py-1 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg\`}>
              <span className={\`font-mono text-xs \${currentTheme.accent}\`}>LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}`;
  }

  // Add other component generators here...
  private generateAppPage(): string {
    return `import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { AgentProvider } from '@/contexts/AgentContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AgentProvider>
      <Component {...pageProps} />
    </AgentProvider>
  );
}`;
  }

  // More component generators would go here...
  // For brevity, I'll implement the key ones and indicate where others would go

  private generateApiClient(): string {
    return `// API client for mobile app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
const AGENT_KEY = process.env.NEXT_PUBLIC_AGENT_KEY || 'default-agent-key';
const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

class ApiClient {
  private cachedCredentials: any = null;
  private cachedAgentConfig: any = null;
  private credentialsLastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async request(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('http') ? endpoint : \`\${API_BASE_URL}\${endpoint}\`;
    
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

  // Fetch credentials and agent config from main app
  async getCredentialsAndConfig() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cachedCredentials && this.cachedAgentConfig && 
        (now - this.credentialsLastFetch) < this.CACHE_DURATION) {
      return {
        credentials: this.cachedCredentials,
        agentConfig: this.cachedAgentConfig
      };
    }

    try {
      if (!DOCUMENT_ID) {
        console.warn('No document ID provided for agent credentials');
        return { credentials: {}, agentConfig: {} };
      }

      // Use JWT token for authentication with main app
      let response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public\`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        },
      });
      
      // Log error if authentication fails
      if (!response.ok) {
        console.error('Agent authentication failed:', response.status, response.statusText);
      }

      if (!response.ok) {
        console.error('Failed to fetch agent credentials:', response.status);
        return { credentials: {}, agentConfig: {} };
      }

      const data = await response.json();
      
      if (data.success) {
        this.cachedCredentials = data.credentials || {};
        this.cachedAgentConfig = data.agentConfig || {};
        this.credentialsLastFetch = now;
        
        return {
          credentials: this.cachedCredentials,
          agentConfig: this.cachedAgentConfig
        };
      } else {
        console.error('Failed to get credentials:', data.error);
        return { credentials: {}, agentConfig: {} };
      }
    } catch (error) {
      console.error('Error fetching credentials and config:', error);
      return { credentials: {}, agentConfig: {} };
    }
  }

  async getStats() {
    return this.request('/api/stats');
  }

  // ========== MODEL CRUD OPERATIONS (Direct SQLite/Prisma) ==========
  
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
    
    return this.request(endpoint);
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
    // Get fresh credentials for action execution
    const { credentials } = await this.getCredentialsAndConfig();
    
    return this.request(\`/api/actions/\${actionName}\`, {
      method: 'POST',
      body: JSON.stringify({ 
        input,
        credentials // Pass credentials to action
      }),
    });
  }

  async getHealth() {
    return this.request('/api/health');
  }

  // Direct action trigger (executes on main app)
  async triggerActionOnMainApp(actionId: string, input: any = {}, member?: any) {
    return this.request(\`/api/trigger/action/\${actionId}\`, {
      method: 'POST',
      body: JSON.stringify({ input, member }),
    });
  }

  // Direct schedule trigger (executes on main app)
  async triggerScheduleOnMainApp(scheduleId: string, force: boolean = false, member?: any) {
    return this.request(\`/api/trigger/schedule/\${scheduleId}\`, {
      method: 'POST',
      body: JSON.stringify({ force, member }),
    });
  }

  // Call back to main app for agent configuration (using the new API)
  async getAgentConfiguration() {
    try {
      const { agentConfig } = await this.getCredentialsAndConfig();
      return agentConfig || null;
    } catch (error) {
      console.error('Error fetching agent configuration:', error);
      return null;
    }
  }

  // Get complete agent data including personality for chat
  async getAgentData() {
    try {
      if (!DOCUMENT_ID) {
        console.warn('No document ID provided for agent data');
        return null;
      }

      const response = await fetch(\`\${MAIN_APP_URL}/api/document?id=\${DOCUMENT_ID}\`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Key': AGENT_KEY,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch agent data:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.document?.metadata) {
        const metadata = data.document.metadata;
        return {
          name: metadata.name || '${this.options.projectName}',
          description: metadata.description || '',
          personality: metadata.personality || '',
          theme: metadata.theme || 'green',
          avatar: metadata.avatar || null,
          models: metadata.models || [],
          actions: metadata.actions || [],
          schedules: metadata.schedules || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching agent data:', error);
      return null;
    }
  }

  // Call back to main app for avatar image
  async getAvatarImageUrl() {
    try {
      const config = await this.getAgentConfiguration();
      if (!config?.avatar) return null;

      const { avatar } = config;
      
      if (avatar.type === 'custom' && avatar.uploadedImage) {
        return avatar.uploadedImage;
      } else if (avatar.type === 'rom-unicorn' && avatar.unicornParts) {
        // Build unicorn avatar URL from main app
        const parts = avatar.unicornParts;
        return \`\${MAIN_APP_URL}/api/avatar/generate?body=\${parts.body}&hair=\${parts.hair}&eyes=\${parts.eyes}&mouth=\${parts.mouth}&accessory=\${parts.accessory}\`;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching avatar image:', error);
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
    bgGradient: 'bg-gradient-to-br from-black via-green-950/30 to-emerald-950/20',
    border: 'border-green-400/30',
    accent: 'text-green-400',
    light: 'text-green-200',
    dim: 'text-green-300/70',
    bg: 'bg-green-500/25',
    bgHover: 'hover:bg-green-500/35',
    borderActive: 'border-green-400/60',
    bgActive: 'bg-green-500/35',
    background: '#0a0f0a',
    foreground: '#22c55e'
  },
  blue: {
    name: 'Ocean',
    primary: 'blue',
    gradient: 'from-blue-400/20 via-sky-500/15 to-cyan-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-blue-950/30 to-cyan-950/20',
    border: 'border-blue-400/30',
    accent: 'text-blue-400',
    light: 'text-blue-200',
    dim: 'text-blue-300/70',
    bg: 'bg-blue-500/25',
    bgHover: 'hover:bg-blue-500/35',
    borderActive: 'border-blue-400/60',
    bgActive: 'bg-blue-500/35',
    background: '#0a0f1a',
    foreground: '#3b82f6'
  },
  purple: {
    name: 'Royal',
    primary: 'purple',
    gradient: 'from-purple-400/20 via-violet-500/15 to-indigo-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-purple-950/30 to-indigo-950/20',
    border: 'border-purple-400/30',
    accent: 'text-purple-400',
    light: 'text-purple-200',
    dim: 'text-purple-300/70',
    bg: 'bg-purple-500/25',
    bgHover: 'hover:bg-purple-500/35',
    borderActive: 'border-purple-400/60',
    bgActive: 'bg-purple-500/35',
    background: '#0f0a1a',
    foreground: '#a855f7'
  },
  cyan: {
    name: 'Cyber',
    primary: 'cyan',
    gradient: 'from-cyan-300/20 via-teal-400/15 to-emerald-300/20',
    bgGradient: 'bg-gradient-to-br from-black via-cyan-950/30 to-teal-950/20',
    border: 'border-cyan-400/30',
    accent: 'text-cyan-300',
    light: 'text-cyan-100',
    dim: 'text-cyan-200/70',
    bg: 'bg-cyan-500/25',
    bgHover: 'hover:bg-cyan-500/35',
    borderActive: 'border-cyan-400/60',
    bgActive: 'bg-cyan-500/35',
    background: '#0a1a1a',
    foreground: '#06b6d4'
  },
  orange: {
    name: 'Sunset',
    primary: 'orange',
    gradient: 'from-orange-400/20 via-amber-500/15 to-yellow-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-orange-950/30 to-amber-950/20',
    border: 'border-orange-400/30',
    accent: 'text-orange-300',
    light: 'text-orange-100',
    dim: 'text-orange-200/70',
    bg: 'bg-orange-500/25',
    bgHover: 'hover:bg-orange-500/35',
    borderActive: 'border-orange-400/60',
    bgActive: 'bg-orange-500/35',
    background: '#1a0f0a',
    foreground: '#f97316'
  },
  pink: {
    name: 'Neon',
    primary: 'pink',
    gradient: 'from-pink-400/20 via-rose-500/15 to-fuchsia-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-pink-950/30 to-fuchsia-950/20',
    border: 'border-pink-400/30',
    accent: 'text-pink-300',
    light: 'text-pink-100',
    dim: 'text-pink-200/70',
    bg: 'bg-pink-500/25',
    bgHover: 'hover:bg-pink-500/35',
    borderActive: 'border-pink-400/60',
    bgActive: 'bg-pink-500/35',
    background: '#1a0a1a',
    foreground: '#ec4899'
  },
  yellow: {
    name: 'Golden',
    primary: 'yellow',
    gradient: 'from-yellow-300/20 via-amber-400/15 to-orange-300/20',
    bgGradient: 'bg-gradient-to-br from-black via-yellow-950/30 to-amber-950/20',
    border: 'border-yellow-400/30',
    accent: 'text-yellow-300',
    light: 'text-yellow-100',
    dim: 'text-yellow-200/70',
    bg: 'bg-yellow-500/25',
    bgHover: 'hover:bg-yellow-500/35',
    borderActive: 'border-yellow-400/60',
    bgActive: 'bg-yellow-500/35',
    background: '#1a1a0a',
    foreground: '#eab308'
  },
  red: {
    name: 'Fire',
    primary: 'red',
    gradient: 'from-red-400/20 via-rose-500/15 to-pink-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-red-950/30 to-rose-950/20',
    border: 'border-red-400/30',
    accent: 'text-red-300',
    light: 'text-red-100',
    dim: 'text-red-200/70',
    bg: 'bg-red-500/25',
    bgHover: 'hover:bg-red-500/35',
    borderActive: 'border-red-400/60',
    bgActive: 'bg-red-500/35',
    background: '#1a0a0a',
    foreground: '#ef4444'
  },
  indigo: {
    name: 'Deep',
    primary: 'indigo',
    gradient: 'from-indigo-400/20 via-blue-600/15 to-slate-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-indigo-950/30 to-slate-950/20',
    border: 'border-indigo-400/30',
    accent: 'text-indigo-300',
    light: 'text-indigo-100',
    dim: 'text-indigo-200/70',
    bg: 'bg-indigo-500/25',
    bgHover: 'hover:bg-indigo-500/35',
    borderActive: 'border-indigo-400/60',
    bgActive: 'bg-indigo-500/35',
    background: '#0a0a1a',
    foreground: '#6366f1'
  },
  emerald: {
    name: 'Emerald',
    primary: 'emerald',
    gradient: 'from-emerald-400/20 via-green-600/15 to-teal-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-emerald-950/30 to-green-950/20',
    border: 'border-emerald-400/30',
    accent: 'text-emerald-300',
    light: 'text-emerald-100',
    dim: 'text-emerald-200/70',
    bg: 'bg-emerald-500/25',
    bgHover: 'hover:bg-emerald-500/35',
    borderActive: 'border-emerald-400/60',
    bgActive: 'bg-emerald-500/35',
    background: '#0a1a0f',
    foreground: '#10b981'
  },
  teal: {
    name: 'Teal',
    primary: 'teal',
    gradient: 'from-teal-400/20 via-cyan-600/15 to-blue-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-teal-950/30 to-cyan-950/20',
    border: 'border-teal-400/30',
    accent: 'text-teal-300',
    light: 'text-teal-100',
    dim: 'text-teal-200/70',
    bg: 'bg-teal-500/25',
    bgHover: 'hover:bg-teal-500/35',
    borderActive: 'border-teal-400/60',
    bgActive: 'bg-teal-500/35',
    background: '#0a1a1a',
    foreground: '#14b8a6'
  },
  rose: {
    name: 'Rose',
    primary: 'rose',
    gradient: 'from-rose-400/20 via-pink-600/15 to-red-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-rose-950/30 to-pink-950/20',
    border: 'border-rose-400/30',
    accent: 'text-rose-300',
    light: 'text-rose-100',
    dim: 'text-rose-200/70',
    bg: 'bg-rose-500/25',
    bgHover: 'hover:bg-rose-500/35',
    borderActive: 'border-rose-400/60',
    bgActive: 'bg-rose-500/35',
    background: '#1a0a0f',
    foreground: '#f43f5e'
  }
};

export type ThemeKey = keyof typeof themes;
export type Theme = typeof themes.green;`;
  }

  // Complete page implementations
  private generateModelsListPage(): string {
    return `import Layout from '@/components/Layout';
import ModelCard from '@/components/ModelCard';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

export default function ModelsPage() {
  const [modelsData, setModelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [models, setModels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use the global agent context
  const { config: agentConfig } = useAgent();
  
  // Use agent config theme if available, fallback to green
  const selectedTheme = agentConfig?.theme || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchModelData();
  }, []);

  const fetchModelData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint
      const response = await fetch('/api/agent/models');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch models: \${response.status}\`);
      }
      
      const data = await response.json();
      
      let currentModels = [];
      if (data.success && data.models) {
        // Use models from sub-agent API
        currentModels = data.models.map((model: any) => ({
          name: model.name,
          emoji: model.emoji || '📋',
          description: model.description || 'Data model',
          fields: model.fields || []
        }));
        
        if (data.source === 'fallback') {
          setError('Using cached models. Main app connection may be unavailable.');
        }
      } else {
        // Fallback to static models
        currentModels = ${JSON.stringify(this.options.models.map(m => ({
          name: m.name,
          emoji: m.emoji || '📋',
          description: m.description || 'Data model',
          fields: m.fields || []
        })), null, 2)};
      }
      
      setModels(currentModels);
      
      // Fetch data for each model
      const promises = currentModels.map(async (model) => {
        try {
          const records = await api.getModelRecords(model.name);
          return { ...model, recordCount: records.length, records: records.slice(0, 3) };
        } catch (error) {
          return { ...model, recordCount: 0, records: [], error: true };
        }
      });
      
      const results = await Promise.all(promises);
      setModelsData(results);
    } catch (error) {
      console.error('Failed to fetch model data:', error);
      setError('Failed to fetch model data from main app. Please check your connection.');
      
      // Fallback to static models
      const fallbackModels = ${JSON.stringify(this.options.models.map(m => ({
        name: m.name,
        emoji: m.emoji || '📋',
        description: m.description || 'Data model',
        fields: m.fields || []
      })), null, 2)};
      setModels(fallbackModels);
      setModelsData(fallbackModels.map(model => ({ ...model, recordCount: 0, records: [], error: true })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Data Models">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className={\`text-xl font-mono font-bold \${currentTheme.light}\`}>Data Models</h1>
          <span className={\`text-sm font-mono \${currentTheme.dim}\`}>
            {models.length} model{models.length !== 1 ? 's' : ''}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
            <p className="font-mono text-sm text-red-300">
              ⚠️ {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4 animate-pulse\`}>
                <div className={\`h-6 \${currentTheme.bg} rounded w-1/3 mb-2\`}></div>
                <div className={\`h-4 \${currentTheme.bg} rounded w-2/3\`}></div>
              </div>
            ))}
          </div>
        ) : modelsData.length > 0 ? (
          <div className="space-y-3">
            {modelsData.map((model, i) => (
              <ModelCard key={i} model={model} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🗃️</div>
            <h3 className={\`font-mono text-lg \${currentTheme.light} mb-2\`}>No Models Found</h3>
            <p className={\`font-mono text-sm \${currentTheme.dim}\`}>
              Your data models will appear here once they're created.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateModelDetailPage(): string {
    return `import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ModelDetailPage() {
  const router = useRouter();
  const { modelName } = router.query;
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modelName && typeof modelName === 'string') {
      fetchRecords();
    }
  }, [modelName]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getModelRecords(modelName as string);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  if (!modelName) {
    return (
      <Layout title="Model Details">
        <div className="p-4 text-center">
          <div className="text-red-400">Invalid model name</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={\`\${modelName} Records\`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-green-500/15 border border-green-400/30 rounded-lg text-green-400 hover:bg-green-500/25 transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-mono font-bold text-green-200 capitalize">
              {modelName} Records
            </h1>
            {!loading && !error && (
              <p className="text-sm font-mono text-green-300/70">
                {records.length} record{records.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4 text-center">
            <div className="text-red-400 font-mono text-sm">⚠️ {error}</div>
            <button
              onClick={fetchRecords}
              className="mt-3 px-4 py-2 bg-red-500/25 border border-red-400/50 rounded-lg text-red-200 font-mono text-xs hover:bg-red-500/35 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record, i) => (
              <div
                key={record.id || i}
                className="bg-green-500/15 border border-green-400/30 rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-sm font-semibold text-green-200">
                    Record #{record.id || i + 1}
                  </span>
                  <span className="font-mono text-xs text-green-300/70">
                    {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'No date'}
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.entries(record)
                    .filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start gap-3">
                        <span className="font-mono text-xs text-green-300/70 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-mono text-xs text-green-200 text-right flex-1 max-w-48 truncate">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-mono text-lg text-green-200 mb-2">No Records</h3>
            <p className="font-mono text-sm text-green-300/70">
              This model doesn't have any records yet.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateActionsPage(): string {
    return `import Layout from '@/components/Layout';
import ActionCard from '@/components/ActionCard';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the global agent context
  const { config: agentConfig } = useAgent();
  
  // Use agent config theme if available, fallback to green
  const selectedTheme = agentConfig?.theme || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint
      const response = await fetch('/api/agent/actions');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch actions: \${response.status}\`);
      }
      
      const data = await response.json();
      
      if (data.success && data.actions) {
        const formattedActions = data.actions.map((action: any) => ({
          id: action.id || action.name,
          name: action.name,
          emoji: action.emoji || '⚡',
          description: action.description || 'Execute action',
          type: action.type || 'query',
          role: action.role || 'member',
          uiComponentsDesign: action.uiComponentsDesign || [],
          pseudoSteps: action.pseudoSteps || []
        }));
        setActions(formattedActions);
        
        if (data.source === 'fallback') {
          setError('Using cached actions. Main app connection may be unavailable.');
        }
      } else {
        throw new Error('No actions data received');
      }
    } catch (err) {
      console.error('Failed to fetch actions:', err);
      setError('Failed to fetch actions. Please check your connection.');
      
      // Fallback to static actions
      const fallbackActions = ${JSON.stringify(this.options.actions.map(a => ({
        id: a.id,
        name: a.name,
        emoji: a.emoji || '⚡',
        description: a.description || 'Execute action',
        type: a.type || 'query',
        role: a.role || 'member',
        uiComponentsDesign: (a as any).uiComponentsDesign || [],
        pseudoSteps: (a as any).pseudoSteps || []
      })), null, 2)};
      setActions(fallbackActions);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Actions">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className={\`text-xl font-mono font-bold \${currentTheme.light}\`}>Smart Actions</h1>
            <span className={\`text-sm font-mono \${currentTheme.dim}\`}>Loading...</span>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4 animate-pulse\`}>
                <div className={\`h-6 \${currentTheme.bg} rounded w-1/3 mb-2\`}></div>
                <div className={\`h-4 \${currentTheme.bg} rounded w-2/3\`}></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Actions">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className={\`text-xl font-mono font-bold \${currentTheme.light}\`}>Smart Actions</h1>
          <span className={\`text-sm font-mono \${currentTheme.dim}\`}>
            {actions.length} action{actions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
            <p className="font-mono text-sm text-red-300">
              ⚠️ {error}
            </p>
          </div>
        )}

        <div className={\`mb-4 p-4 \${currentTheme.bg} border \${currentTheme.border} rounded-xl\`}>
          <p className={\`font-mono text-sm \${currentTheme.dim}\`}>
            💡 <strong>Interactive Actions:</strong> Click any action card to open the execution modal. 
            Choose between local execution (runs on this sub-agent) or remote execution (runs on main app).
          </p>
        </div>

        {actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className={\`font-mono text-lg \${currentTheme.light} mb-2\`}>No Actions Available</h3>
            <p className={\`font-mono text-sm \${currentTheme.dim}\`}>
              Smart actions will appear here once they're configured in the main app.
            </p>
            <div className={\`mt-6 p-4 \${currentTheme.bg} border \${currentTheme.border} rounded-xl\`}>
              <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
                🚀 Actions are automatically synced from the main app. Create actions in the main app 
                and they'll appear here for interactive execution.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateSchedulesPage(): string {
    return `import Layout from '@/components/Layout';
import ScheduleCard from '@/components/ScheduleCard';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the global agent context
  const { config: agentConfig } = useAgent();
  
  // Use agent config theme if available, fallback to green
  const selectedTheme = agentConfig?.theme || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint
      const response = await fetch('/api/agent/schedules');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch schedules: \${response.status}\`);
      }
      
      const data = await response.json();
      
      if (data.success && data.schedules) {
        const formattedSchedules = data.schedules.map((schedule: any) => ({
          id: schedule.id || schedule.name,
          name: schedule.name,
          emoji: schedule.emoji || '⏰',
          description: schedule.description || 'Scheduled task',
          pattern: schedule.interval?.pattern || '0 0 * * *',
          active: schedule.interval?.active !== false,
          nextRun: schedule.interval?.pattern ? 'Calculated from pattern' : 'Unknown'
        }));
        setSchedules(formattedSchedules);
        
        if (data.source === 'fallback') {
          setError('Using cached schedules. Main app connection may be unavailable.');
        }
      } else {
        throw new Error('No schedules data received');
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError('Failed to fetch schedules. Please check your connection.');
      
      // Fallback to static schedules
      const fallbackSchedules = ${JSON.stringify(this.options.schedules.map(s => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji || '⏰',
        description: s.description || 'Scheduled task',
        pattern: s.interval?.pattern || '0 0 * * *',
        active: s.interval?.active !== false,
        nextRun: s.interval?.pattern ? 'Calculated from pattern' : 'Unknown'
      })), null, 2)};
      setSchedules(fallbackSchedules);
    } finally {
      setLoading(false);
    }
  };

  const getNextRunTime = (pattern: string) => {
    // Simple next run calculation - in a real app, use a cron library
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    return nextHour.toLocaleString();
  };

  if (loading) {
    return (
      <Layout title="Schedules">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className={\`text-xl font-mono font-bold \${currentTheme.light}\`}>Scheduled Tasks</h1>
            <span className={\`text-sm font-mono \${currentTheme.dim}\`}>Loading...</span>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4 animate-pulse\`}>
                <div className={\`h-6 \${currentTheme.bg} rounded w-1/3 mb-2\`}></div>
                <div className={\`h-4 \${currentTheme.bg} rounded w-2/3\`}></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Schedules">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className={\`text-xl font-mono font-bold \${currentTheme.light}\`}>Scheduled Tasks</h1>
          <span className={\`text-sm font-mono \${currentTheme.dim}\`}>
            {schedules.filter(s => s.active).length}/{schedules.length} active
          </span>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
            <p className="font-mono text-sm text-red-300">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-3 text-center\`}>
            <div className={\`font-mono font-bold text-lg \${currentTheme.accent}\`}>
              {schedules.length}
            </div>
            <div className={\`font-mono text-xs \${currentTheme.dim}\`}>Total Tasks</div>
          </div>
          <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-3 text-center\`}>
            <div className={\`font-mono font-bold text-lg \${currentTheme.accent}\`}>
              {schedules.filter(s => s.active).length}
            </div>
            <div className={\`font-mono text-xs \${currentTheme.dim}\`}>Active Tasks</div>
          </div>
        </div>

        {schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={{
                  ...schedule,
                  nextRun: getNextRunTime(schedule.pattern)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className={\`font-mono text-lg \${currentTheme.light} mb-2\`}>No Schedules</h3>
            <p className={\`font-mono text-sm \${currentTheme.dim}\`}>
              Automated tasks will appear here once they're configured.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateChatPage(): string {
    return `import Layout from '@/components/Layout';
import ChatMessage from '@/components/ChatMessage';
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAgent } from '@/contexts/AgentContext';

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // Use global agent context
  const { config: agentConfig } = useAgent();
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  // Set personalized welcome message when agent config is loaded
  useEffect(() => {
    if (agentConfig && messages.length === 0) {
      const personalizedWelcome = {
        id: 'welcome',
        role: 'assistant' as const,
        content: \`Hello! I'm \${agentConfig.name || 'your AI assistant'}, and I'm here to help you with this agent app. \${agentConfig.description ? 'I\\'m ' + agentConfig.description + '.' : ''}

I can help you with:
• **Data Management**: View and manage your \${agentConfig.models?.length || ${this.options.models.length}} data models
• **Smart Actions**: Execute any of your \${agentConfig.actions?.length || ${this.options.actions.length}} configured actions  
• **Task Scheduling**: Monitor your \${agentConfig.schedules?.length || ${this.options.schedules.length}} automated tasks
• **System Status**: Check health and performance

What would you like to explore first?\`,
        createdAt: new Date()
      };
      
      // Add the welcome message to the chat
      const event = new CustomEvent('chat-initial-message', { detail: personalizedWelcome });
      window.dispatchEvent(event);
    }
  }, [agentConfig, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Smart input suggestions based on common patterns
  const detectIntentAndSuggest = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Action-related keywords
    const actionKeywords = ['run', 'execute', 'trigger', 'start', 'perform', 'do', 'action'];
    // Data-related keywords  
    const dataKeywords = ['show', 'list', 'get', 'find', 'view', 'data', 'records', 'create', 'add', 'update', 'edit', 'delete', 'remove'];
    
    const hasActionIntent = actionKeywords.some(keyword => lowerText.includes(keyword));
    const hasDataIntent = dataKeywords.some(keyword => lowerText.includes(keyword));
    
    return { hasActionIntent, hasDataIntent };
  };

  const getSuggestionButtons = () => {
    const { hasActionIntent, hasDataIntent } = detectIntentAndSuggest(input);
    
    const suggestions = [];
    
    if (hasActionIntent) {
      suggestions.push({
        text: '⚡ Go to Actions Page',
        action: () => router.push('/actions'),
        color: 'bg-blue-500/20 border-blue-400/30 text-blue-200'
      });
    }
    
    if (hasDataIntent) {
      suggestions.push({
        text: '🗃️ Go to Data Models',
        action: () => router.push('/models'),
        color: 'bg-purple-500/20 border-purple-400/30 text-purple-200'
      });
    }
    
    return suggestions;
  };

  const quickActions = [
    { 
      icon: '🗃️', 
      label: 'View Data Models', 
      action: () => router.push('/models'),
      description: 'Browse and manage your data'
    },
    { 
      icon: '⚡', 
      label: 'Execute Actions', 
      action: () => router.push('/actions'),
      description: 'Run smart actions'
    },
    { 
      icon: '⏰', 
      label: 'Check Schedules', 
      action: () => router.push('/schedules'),
      description: 'Monitor automated tasks'
    },
    { 
      icon: '📊', 
      label: 'System Status', 
      action: () => {
        handleInputChange({ target: { value: 'What is the current system status?' } } as any);
        setShowQuickActions(false);
      },
      description: 'Get system health info'
    }
  ];

  const suggestions = getSuggestionButtons();

  return (
    <Layout title="AI Chat">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-green-400/30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-mono font-bold text-green-200">
                {agentConfig?.name || 'AI Assistant'}
              </h1>
              <p className="text-sm font-mono text-green-300/70">
                {agentConfig?.description || 'Powered by AI SDK • Ask questions about your data, actions, and schedules'}
              </p>
            </div>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-2 bg-green-500/15 border border-green-400/30 rounded-lg text-green-200 hover:bg-green-500/25 transition-colors"
            >
              ⚡ Quick Actions
            </button>
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className="p-4 bg-green-500/10 border-b border-green-400/20">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-3 bg-green-500/15 border border-green-400/30 rounded-lg text-left hover:bg-green-500/25 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{action.icon}</span>
                    <span className="font-mono text-sm text-green-200">{action.label}</span>
                  </div>
                  <p className="text-xs font-mono text-green-300/70">{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={{
                id: message.id,
                type: message.role === 'user' ? 'user' : 'bot',
                content: message.content,
                timestamp: message.createdAt || new Date()
              }} 
            />
          ))}
          
          {isLoading && (
            <ChatMessage
              message={{
                id: 'loading',
                type: 'bot',
                content: '',
                timestamp: new Date()
              }}
              isTyping={true}
            />
          )}

          {error && (
            <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4">
              <div className="text-red-400 font-mono text-sm">
                ⚠️ Error: {error.message}
              </div>
              <div className="text-red-300/70 font-mono text-xs mt-2">
                Please check your API configuration and try again.
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && input.length > 10 && (
          <div className="px-4 py-2 border-t border-green-400/20">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-mono text-green-300/70 self-center">Suggestions:</span>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={suggestion.action}
                  className={\`px-3 py-1 rounded-lg text-xs font-mono transition-colors \${suggestion.color}\`}
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-green-400/30">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={\`Ask \${agentConfig?.name || 'me'} anything about your agent...\`}
              className="flex-1 p-3 bg-green-500/15 border border-green-400/30 rounded-lg text-green-200 font-mono text-sm placeholder-green-300/50 focus:outline-none focus:border-green-400/60 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-green-500/25 border border-green-400/50 rounded-lg text-green-200 font-mono text-sm hover:bg-green-500/35 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </div>
              ) : (
                'Send'
              )}
            </button>
          </form>
          
          <div className="mt-2 text-xs font-mono text-green-300/50 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </Layout>
  );
}`;
  }
  private generateModelCardComponent(): string {
    return `import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

interface ModelCardProps {
  model: {
    name: string;
    emoji?: string;
    description?: string;
    recordCount?: number;
    error?: boolean;
  };
}

export default function ModelCard({ model }: ModelCardProps) {
  // Use the global agent context
  const { config: agentConfig } = useAgent();
  
  // Use agent config theme if available, fallback to green
  const selectedTheme = agentConfig?.theme || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  return (
    <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4\`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{model.emoji || '📋'}</span>
        <div className="flex-1">
          <h3 className={\`font-mono font-semibold text-sm \${currentTheme.light} capitalize\`}>
            {model.name}
          </h3>
          <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
            {model.description || \`Manage \${model.name} records\`}
          </p>
        </div>
        <div className="text-right">
          <div className={\`font-mono font-semibold text-sm \${currentTheme.accent}\`}>
            {model.error ? '⚠️' : (model.recordCount || 0)}
          </div>
          <div className={\`font-mono text-xs \${currentTheme.dim}\`}>
            {model.error ? 'Error' : 'records'}
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  private generateActionCardComponent(): string {
    return `import { useState } from 'react';
import ActionExecutionModal from './ActionExecutionModal';
import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

interface ActionCardProps {
  action: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    type: string;
    uiComponentsDesign?: any[];
    pseudoSteps?: any[];
  };
}

export default function ActionCard({ action }: ActionCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [lastExecutionTime, setLastExecutionTime] = useState<string | null>(null);

  // Use the global agent context
  const { config: agentConfig } = useAgent();
  
  // Use agent config theme if available, fallback to green
  const selectedTheme = agentConfig?.theme || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  const handleActionComplete = (result: any) => {
    setLastResult(result);
    setLastExecutionTime(new Date().toLocaleString());
    setShowModal(false);
  };

  return (
    <>
      <div 
        className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4 cursor-pointer \${currentTheme.bgHover} transition-colors\`}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg">{action.emoji || '⚡'}</span>
          <div className="flex-1">
            <h3 className={\`font-mono font-semibold text-sm \${currentTheme.light}\`}>
              {action.name}
            </h3>
            <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
              {action.description || \`Execute \${action.name}\`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={\`px-2 py-1 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg font-mono text-xs \${currentTheme.light}\`}>
              {action.type === 'query' ? '🔍 Query' : '⚡ Action'}
            </span>
            {lastExecutionTime && (
              <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
                Last: {lastExecutionTime.split(' ')[1]?.substring(0, 5)}
              </span>
            )}
          </div>
        </div>

        {/* Quick status indicator */}
        {lastResult && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className={\`w-2 h-2 rounded-full \${
              lastResult.success ? currentTheme.accent.replace('text-', 'bg-') : 'bg-red-400'
            }\`} />
            <span className={\`\${currentTheme.dim}\`}>
              {lastResult.success ? 'Last execution successful' : 'Last execution failed'}
            </span>
          </div>
        )}

        {/* Click indicator */}
        <div className={\`mt-3 pt-3 border-t \${currentTheme.border}\`}>
          <p className={\`font-mono text-xs \${currentTheme.dim} text-center\`}>
            Click to execute → 
          </p>
        </div>
      </div>

      {showModal && (
        <ActionExecutionModal
          action={action}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onComplete={handleActionComplete}
        />
      )}
    </>
  );
}`;
  }

  private generateScheduleCardComponent(): string {
    return `import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

interface ScheduleCardProps {
  schedule: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    pattern: string;
    active: boolean;
    nextRun?: string;
  };
}

export default function ScheduleCard({ schedule }: ScheduleCardProps) {
  // Use the global agent context
  const { config: agentConfig } = useAgent();
  
  // Use agent config theme if available, fallback to green
  const selectedTheme = agentConfig?.theme || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  return (
    <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4\`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{schedule.emoji || '⏰'}</span>
        <div className="flex-1">
          <h3 className={\`font-mono font-semibold text-sm \${currentTheme.light}\`}>
            {schedule.name}
          </h3>
          <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
            {schedule.description || \`Scheduled: \${schedule.pattern}\`}
          </p>
        </div>
        <div className={\`px-2 py-1 rounded-lg border \${
          schedule.active 
            ? \`\${currentTheme.bgActive} \${currentTheme.borderActive} \${currentTheme.accent}\`
            : 'bg-gray-500/25 border-gray-400/50 text-gray-400'
        }\`}>
          <span className="font-mono text-xs">
            {schedule.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className={\`font-mono text-xs \${currentTheme.dim}\`}>
        Pattern: <span className={\`\${currentTheme.light}\`}>{schedule.pattern}</span>
      </div>
      {schedule.nextRun && (
        <div className={\`font-mono text-xs \${currentTheme.dim} mt-1\`}>
          Next: <span className={\`\${currentTheme.light}\`}>{schedule.nextRun}</span>
        </div>
      )}
    </div>
  );
}`;
  }

  private generateStatsCardComponent(): string {
    return `import { themes } from '@/lib/theme';
import { useAgent } from '@/contexts/AgentContext';

interface StatsCardProps {
  stats: {
    totalRecords: number;
    activeSchedules: number;
    totalModels: number;
    totalActions: number;
    totalSchedules: number;
  };
  loading: boolean;
}

export default function StatsCard({ stats, loading }: StatsCardProps) {
  // Use the global agent context
  const { config: agentConfig } = useAgent();
  
  // Use agent config theme if available, fallback to green
  const selectedTheme = agentConfig?.theme || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  if (loading) {
    return (
      <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4\`}>
        <div className="animate-pulse">
          <div className={\`h-4 \${currentTheme.bg} rounded w-1/3 mb-3\`}></div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className={\`h-6 \${currentTheme.bg} rounded w-8 mx-auto mb-1\`}></div>
                <div className={\`h-3 \${currentTheme.bg} rounded w-12 mx-auto\`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4\`}>
      <h3 className={\`font-mono font-semibold text-sm \${currentTheme.light} mb-3\`}>System Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className={\`font-mono font-bold text-lg \${currentTheme.accent}\`}>{stats.totalRecords}</div>
          <div className={\`font-mono text-xs \${currentTheme.dim}\`}>Records</div>
        </div>
        <div className="text-center">
          <div className={\`font-mono font-bold text-lg \${currentTheme.accent}\`}>{stats.activeSchedules}</div>
          <div className={\`font-mono text-xs \${currentTheme.dim}\`}>Active Tasks</div>
        </div>
        <div className="text-center">
          <div className={\`font-mono font-bold text-lg \${currentTheme.accent}\`}>{stats.totalModels}</div>
          <div className={\`font-mono text-xs \${currentTheme.dim}\`}>Models</div>
        </div>
        <div className="text-center">
          <div className={\`font-mono font-bold text-lg \${currentTheme.accent}\`}>{stats.totalActions}</div>
          <div className={\`font-mono text-xs \${currentTheme.dim}\`}>Actions</div>
        </div>
      </div>
    </div>
  );
}`;
  }
  private generateChatMessageComponent(): string {
    return `import { memo } from 'react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
}

const ChatMessage = memo(({ message, isTyping = false }: ChatMessageProps) => {
  const isUser = message.type === 'user';
  
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>') // Bold
      .replace(/\\*(.*?)\\*/g, '<em>$1</em>') // Italic
      .replace(/\`(.*?)\`/g, '<code class="bg-green-500/20 px-1 rounded text-green-200">$1</code>') // Inline code
      .replace(/\\n/g, '<br>'); // Line breaks
  };

  if (isTyping) {
    return (
      <div className="flex justify-start">
        <div className="max-w-xs p-3 rounded-lg bg-green-500/15 border border-green-400/30">
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-xs font-mono text-green-300/70 ml-2">AI is typing...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={\`flex \${isUser ? 'justify-end' : 'justify-start'}\`}>
      <div className="max-w-xs lg:max-w-md">
        <div
          className={\`p-3 rounded-lg font-mono text-sm \${
            isUser
              ? 'bg-green-500/25 text-green-200 border border-green-400/50'
              : 'bg-green-500/15 text-green-300 border border-green-400/30'
          }\`}
        >
          {/* Message content with basic formatting */}
          <div 
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        </div>
        
        {/* Timestamp */}
        <div className={\`text-xs font-mono text-green-300/50 mt-1 \${isUser ? 'text-right' : 'text-left'}\`}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;`;
  }
  private generateLoadingSpinnerComponent(): string {
    return `interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({ size = 'md', color = 'green' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    green: 'border-green-400 border-t-transparent',
    blue: 'border-blue-400 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={\`\${sizeClasses[size]} border-2 \${colorClasses[color] || colorClasses.green} rounded-full animate-spin\`}
      ></div>
    </div>
  );
}`;
  }

  private generateActionExecutionModal(): string {
    return `import { useState, useEffect } from 'react';
import api from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';

interface ActionExecutionModalProps {
  action: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    type: string;
    uiComponentsDesign?: any[];
    pseudoSteps?: any[];
  };
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: any) => void;
}

export default function ActionExecutionModal({ action, isOpen, onClose, onComplete }: ActionExecutionModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<'local' | 'remote'>('local');
  const [inputParameters, setInputParameters] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'executing' | 'result'>('input');

  // Generate mock UI components if none provided
  const uiComponents = action.uiComponentsDesign || [
    {
      name: 'input',
      type: 'text',
      label: 'Input Data',
      placeholder: 'Enter input for ' + action.name,
      required: false,
      defaultValue: ''
    }
  ];

  // Initialize input parameters with default values
  useEffect(() => {
    const defaultInputs: Record<string, any> = {};
    uiComponents.forEach(component => {
      if (component.defaultValue !== undefined) {
        defaultInputs[component.name] = component.defaultValue;
      } else if (component.type === 'checkbox') {
        defaultInputs[component.name] = false;
      } else if (component.type === 'select' && component.options && component.options.length > 0) {
        defaultInputs[component.name] = component.options[0].value;
      } else {
        defaultInputs[component.name] = '';
      }
    });
    setInputParameters(defaultInputs);
  }, [action.name]);

  const executeAction = async () => {
    setIsExecuting(true);
    setStep('executing');
    setResult(null);

    try {
      let actionResult;
      
      if (executionMode === 'local') {
        // Execute action locally (fetches code from main app, runs on sub-agent)
        actionResult = await api.executeAction(action.name, inputParameters);
      } else {
        // Execute action on main app directly
        actionResult = await api.triggerActionOnMainApp(action.id, inputParameters);
      }

      setResult(actionResult);
      setStep('result');
      
      // Notify parent component
      onComplete(actionResult);
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionMode
      };
      setResult(errorResult);
      setStep('result');
      onComplete(errorResult);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInputChange = (componentName: string, value: any) => {
    setInputParameters(prev => ({
      ...prev,
      [componentName]: value
    }));
  };

  const renderInputComponent = (component: any) => {
    const value = inputParameters[component.name] || '';

    switch (component.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            className="w-full p-3 bg-green-500/10 border border-green-400/30 rounded-lg text-green-200 font-mono text-sm focus:outline-none focus:border-green-400/50"
          >
            {(component.options || []).map((option: any, idx: number) => (
              <option key={idx} value={option.value} className="bg-gray-800">
                {option.label || option.value}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleInputChange(component.name, e.target.checked)}
              className="w-4 h-4 rounded border-green-400/30 bg-green-500/10 text-green-400 focus:ring-green-400/50"
            />
            <span className="font-mono text-sm text-green-200">
              {component.label}
            </span>
          </label>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            rows={4}
            className="w-full p-3 bg-green-500/10 border border-green-400/30 rounded-lg text-green-200 font-mono text-sm focus:outline-none focus:border-green-400/50 resize-none"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(component.name, parseFloat(e.target.value) || 0)}
            placeholder={component.placeholder}
            className="w-full p-3 bg-green-500/10 border border-green-400/30 rounded-lg text-green-200 font-mono text-sm focus:outline-none focus:border-green-400/50"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            className="w-full p-3 bg-green-500/10 border border-green-400/30 rounded-lg text-green-200 font-mono text-sm focus:outline-none focus:border-green-400/50"
          />
        );
    }
  };

  const formatResult = (result: any) => {
    if (!result) return 'No result';
    
    if (result.success) {
      return {
        status: 'Success',
        message: result.message || 'Action executed successfully',
        data: result.data || result,
        executionTime: result.executionTime || 'N/A',
        mode: result.executedLocally ? 'Local Execution' : 'Remote Execution'
      };
    } else {
      return {
        status: 'Error',
        message: result.error || 'Action failed',
        details: result.details || 'No additional details',
        mode: executionMode === 'local' ? 'Local Execution' : 'Remote Execution'
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-gray-900 border border-green-400/30 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-green-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{action.emoji || '⚡'}</span>
              <div>
                <h2 className="font-mono font-bold text-green-200">{action.name}</h2>
                <p className="font-mono text-xs text-green-300/70">
                  {action.description || \`Execute \${action.name}\`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExecuting}
              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-green-400 font-mono text-lg">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'input' && (
            <div className="space-y-4">
              {/* Execution Mode Toggle */}
              <div>
                <label className="block font-mono text-sm text-green-300 mb-2">
                  Execution Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExecutionMode('local')}
                    className={\`flex-1 p-2 border rounded-lg font-mono text-xs transition-colors \${
                      executionMode === 'local'
                        ? 'bg-green-500/25 border-green-400/50 text-green-200'
                        : 'bg-green-500/10 border-green-400/30 text-green-300/70 hover:bg-green-500/15'
                    }\`}
                  >
                    🏠 Local Execution
                  </button>
                  <button
                    onClick={() => setExecutionMode('remote')}
                    className={\`flex-1 p-2 border rounded-lg font-mono text-xs transition-colors \${
                      executionMode === 'remote'
                        ? 'bg-blue-500/25 border-blue-400/50 text-blue-200'
                        : 'bg-green-500/10 border-green-400/30 text-green-300/70 hover:bg-green-500/15'
                    }\`}
                  >
                    ☁️ Remote Execution
                  </button>
                </div>
                <p className="font-mono text-xs text-green-300/50 mt-1">
                  {executionMode === 'local' 
                    ? 'Runs on this sub-agent with local database'
                    : 'Executes on main app with latest code'
                  }
                </p>
              </div>

              {/* Input Parameters */}
              <div>
                <label className="block font-mono text-sm text-green-300 mb-3">
                  Input Parameters
                </label>
                <div className="space-y-3">
                  {uiComponents.map((component, idx) => (
                    <div key={idx}>
                      <label className="block font-mono text-xs text-green-300/70 mb-1">
                        {component.label || component.name}
                        {component.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {renderInputComponent(component)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'executing' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="font-mono text-sm text-green-300 mt-4">
                Executing {action.name}...
              </p>
              <p className="font-mono text-xs text-green-300/50 mt-1">
                Mode: {executionMode === 'local' ? 'Local Execution' : 'Remote Execution'}
              </p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={\`text-4xl mb-2 \${result.success ? '🟢' : '🔴'}\`}>
                  {result.success ? '✅' : '❌'}
                </div>
                <h3 className="font-mono text-lg text-green-200 mb-1">
                  {result.success ? 'Success!' : 'Failed'}
                </h3>
              </div>

              <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
                <div className="space-y-3 font-mono text-sm">
                  {Object.entries(formatResult(result)).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-3">
                      <span className="text-green-300/70 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-green-200 text-right flex-1">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-green-400/20">
          {step === 'input' && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 p-3 border border-green-400/30 rounded-lg font-mono text-sm text-green-300 hover:bg-green-500/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={isExecuting}
                className="flex-1 p-3 bg-green-500/25 border border-green-400/50 rounded-lg font-mono text-sm text-green-200 hover:bg-green-500/35 disabled:opacity-50 transition-colors"
              >
                Execute Action
              </button>
            </div>
          )}

          {step === 'result' && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('input');
                  setResult(null);
                }}
                className="flex-1 p-3 border border-green-400/30 rounded-lg font-mono text-sm text-green-300 hover:bg-green-500/10 transition-colors"
              >
                Run Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 p-3 bg-green-500/25 border border-green-400/50 rounded-lg font-mono text-sm text-green-200 hover:bg-green-500/35 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;
  }

  private generateChatEndpoint(): string {
    const modelsContext = this.options.models.map(m => `${m.name} (${m.description || 'data model'})`).join(', ');
    const actionsContext = this.options.actions.map(a => `${a.name} (${a.description || 'action'})`).join(', ');
    const schedulesContext = this.options.schedules.map(s => `${s.name} (${s.description || 'scheduled task'})`).join(', ');
    
    return `import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';

// Fetch API keys and model configuration from main app
async function getAIModelWithApiKeys() {
  const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
  const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
  const AGENT_KEY = process.env.NEXT_PUBLIC_AGENT_KEY || 'default-agent-key';
  const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

  try {
    // First try to get user's API keys from main app
    let response = await fetch(\`\${MAIN_APP_URL}/api/user/api-keys\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
      },
    });

    let apiKeys = {};
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        apiKeys = data.apiKeys || {};
      }
    }

    // If no user API keys, try to get agent credentials which might include API keys
    if (!apiKeys.openai && !apiKeys.anthropic && !apiKeys.grok) {
      response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public\`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.credentials) {
          // Extract AI provider keys from credentials
          if (data.credentials.openai_api_key) {
            apiKeys.openai = data.credentials.openai_api_key;
          }
          if (data.credentials.anthropic_api_key) {
            apiKeys.anthropic = data.credentials.anthropic_api_key;
          }
          if (data.credentials.grok_api_key) {
            apiKeys.grok = data.credentials.grok_api_key;
          }
        }
      }
    }

    // Determine which provider to use based on available keys
    const provider = process.env.AI_MODEL_PROVIDER || 'openai';
    const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
    
    switch (provider) {
      case 'anthropic':
        if (!apiKeys.anthropic) {
          throw new Error('Anthropic API key not found. Please configure your API keys in the main app.');
        }
        return anthropic(modelName, { apiKey: apiKeys.anthropic });
      case 'grok':
        if (!apiKeys.grok) {
          throw new Error('Grok API key not found. Please configure your API keys in the main app.');
        }
        return openai(modelName, { 
          apiKey: apiKeys.grok,
          baseURL: 'https://api.x.ai/v1'
        });
      case 'openai':
      default:
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key not found. Please configure your API keys in the main app.');
        }
        return openai(modelName, { apiKey: apiKeys.openai });
    }
  } catch (error) {
    console.error('Failed to get AI model configuration:', error);
    throw new Error('Failed to configure AI model. Please check your API keys in the main app.');
  }
}

// Fetch agent data including personality directly from main app
async function getAgentData() {
  try {
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

    if (!DOCUMENT_ID) {
      throw new Error('No document ID configured');
    }

    // Call main app directly to get agent document data
    const response = await fetch(\`\${MAIN_APP_URL}/api/document?id=\${DOCUMENT_ID}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        'X-Agent-Token': AGENT_TOKEN,
        'X-Document-ID': DOCUMENT_ID,
      },
    });

    if (!response.ok) {
      console.warn('Main app call failed, using fallback');
      throw new Error(\`API call failed: \${response.status}\`);
    }

    const data = await response.json();
    
    if (data.success && data.document?.metadata) {
      const metadata = data.document.metadata;
      return {
        name: metadata.name || '${this.options.projectName}',
        description: metadata.description || '',
        personality: metadata.personality || '',
        theme: metadata.theme || 'green',
        avatar: metadata.avatar || null,
        models: metadata.models || [],
        actions: metadata.actions || [],
        schedules: metadata.schedules || []
      };
    }
    
    throw new Error('No valid document data in response');
  } catch (error) {
    console.error('Error fetching agent data from main app:', error);
    
    // Fallback to static data
    return {
      name: '${this.options.projectName}',
      description: 'Agent application',
      personality: 'helpful and professional',
      theme: 'green',
      avatar: null,
      models: ${JSON.stringify(this.options.models)},
      actions: ${JSON.stringify(this.options.actions)},
      schedules: ${JSON.stringify(this.options.schedules)}
    };
  }
}

// Build system prompt with fallback data (frontend has real agent data via context)
async function buildSystemPrompt() {
  const baseName = "${this.options.projectName}";
  const personality = "helpful and professional";
  const description = "A smart AI agent application";
  
  return \`You are an AI assistant for "\${baseName}", a smart agent application.

**Agent Description:** \${description}

**Your Personality:** \${personality}

**About this agent:**
- **Data Models (${this.options.models.length})**: ${this.options.models.map(m => m.name).join(', ')}
- **Smart Actions (${this.options.actions.length})**: ${this.options.actions.map(a => a.name).join(', ')}  
- **Scheduled Tasks (${this.options.schedules.length})**: ${this.options.schedules.map(s => s.name).join(', ')}

**Your capabilities:**
1. **Data Management & CRUD**: Help users view, create, update, and delete records in their data models
2. **Action Execution**: Guide users through executing smart actions with proper parameters
3. **Task Management**: Assist with scheduled task monitoring and configuration
4. **System Insights**: Provide status updates and performance insights
5. **Conversational Support**: Answer questions and provide guidance

**Response Guidelines:**
- Embody the personality described above in all your responses
- Be helpful, concise, and technical when needed
- Use emojis sparingly but effectively to match your personality
- Provide actionable suggestions with clear next steps
- Reference specific models, actions, or schedules when relevant
- Format code or data clearly with markdown
- When users want to perform actions or CRUD operations, guide them to the appropriate UI

**Available context:**
- Models: ${modelsContext}
- Actions: ${actionsContext}
- Schedules: ${schedulesContext}

**Smart Detection:**
Detect user intent and respond appropriately:
- **Action Request**: If user wants to execute an action, suggest using the Actions page
- **Data CRUD**: If user wants to manage data, suggest using the Models/Data page
- **General Questions**: Answer conversationally while maintaining your personality
- **System Status**: Provide insights about the agent's current state

Always be ready to help with queries about data, actions, schedules, or general system operations while maintaining your unique personality.\`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const model = await getAIModelWithApiKeys();
    const systemPrompt = await buildSystemPrompt();
    
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
      maxTokens: 1000,
      temperature: 0.7,
      tools: {
        getSystemInfo: {
          description: 'Get current system information and status',
          parameters: z.object({}),
          execute: async () => {
            return {
              models: ${this.options.models.length},
              actions: ${this.options.actions.length},
              schedules: ${this.options.schedules.length},
              activeSchedules: ${this.options.schedules.filter(s => s.interval?.active !== false).length},
              status: 'operational',
              timestamp: new Date().toISOString()
            };
          }
        },
        listModels: {
          description: 'List all available data models',
          parameters: z.object({}),
          execute: async () => {
            return {
              models: ${JSON.stringify(this.options.models.map(m => ({
                name: m.name,
                description: m.description || 'Data model',
                fields: m.fields?.length || 0
              })))}
            };
          }
        },
        listActions: {
          description: 'List all available smart actions',
          parameters: z.object({}),
          execute: async () => {
            return {
              actions: ${JSON.stringify(this.options.actions.map(a => ({
                name: a.name,
                description: a.description || 'Smart action',
                type: a.type || 'query'
              })))}
            };
          }
        },
        listSchedules: {
          description: 'List all scheduled tasks',
          parameters: z.object({}),
          execute: async () => {
            return {
              schedules: ${JSON.stringify(this.options.schedules.map(s => ({
                name: s.name,
                description: s.description || 'Scheduled task',
                pattern: s.interval?.pattern || '* * * * *',
                active: s.interval?.active !== false
              })))}
            };
          }
        }
      }
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error.message?.includes('API_KEY')) {
      return res.status(500).json({ 
        error: 'AI service configuration error. Please check your API keys.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to process chat request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}`;
  }

  private generateHealthEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection
    await prisma.$queryRaw\`SELECT 1\`;
    
    const healthData = {
      status: 'healthy',
      name: '${this.options.projectName}',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        type: 'SQLite'
      },
      services: {
        actions: {
          count: ${this.options.actions.length},
          endpoints: [${this.options.actions.map(a => `'/api/${a.name}'`).join(', ')}]
        },
        schedules: {
          count: ${this.options.schedules.length},
          active: ${this.options.schedules.filter(s => s.interval?.active !== false).length},
          patterns: [${this.options.schedules.map(s => `'${s.interval?.pattern || '* * * * *'}'`).join(', ')}]
        },
        models: {
          count: ${this.options.models.length},
          names: [${this.options.models.map(m => `'${m.name}'`).join(', ')}]
        }
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      name: '${this.options.projectName}',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
}`;
  }

  private generateStatsEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = {
      totalRecords: 0,
      activeSchedules: ${this.options.schedules.filter(s => s.interval?.active !== false).length},
      totalModels: ${this.options.models.length},
      totalActions: ${this.options.actions.length},
      totalSchedules: ${this.options.schedules.length},
      lastActivity: new Date().toISOString()
    };

    // Try to get actual record counts from each model
    ${this.options.models.map(model => {
      const camelCaseModelName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
      return `
    try {
      const ${camelCaseModelName}Count = await prisma.${camelCaseModelName}.count();
      stats.totalRecords += ${camelCaseModelName}Count;
    } catch (error) {
      console.log('Model ${model.name} not yet available:', error.message);
    }`;
    }).join('')}

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get stats',
      data: {
        totalRecords: 0,
        activeSchedules: ${this.options.schedules.filter(s => s.interval?.active !== false).length},
        totalModels: ${this.options.models.length},
        totalActions: ${this.options.actions.length},
        totalSchedules: ${this.options.schedules.length},
        lastActivity: new Date().toISOString()
      }
    });
  }
}`;
  }

  private generateModelEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { modelName, id } = req.query;

  if (!modelName || typeof modelName !== 'string') {
    return res.status(400).json({ error: 'Model name is required' });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    console.error(\`Model '\${modelName}' (camelCase: '\${camelCaseModelName}') not found in Prisma client\`);
    console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    return res.status(404).json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        if (id && typeof id === 'string') {
          // Get single record by ID
          const record = await modelClient.findUnique({
            where: { id }
          });
          
          if (!record) {
            return res.status(404).json({ error: 'Record not found' });
          }
          
          res.status(200).json({ success: true, data: record });
        } else {
          // Get all records with optional filtering and pagination
          const { page = '1', limit = '100', search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
          const pageNum = parseInt(page as string, 10);
          const limitNum = parseInt(limit as string, 10);
          const skip = (pageNum - 1) * limitNum;

          let where = {};
          if (search && typeof search === 'string') {
            // Dynamic search - try to search across text fields that might exist
            // This is a basic implementation that attempts common field names
            const searchConditions = [];
            
            try {
              // Get a sample record to see what fields exist
              const sampleRecord = await modelClient.findFirst();
              if (sampleRecord) {
                const stringFields = Object.keys(sampleRecord).filter(key => 
                  typeof sampleRecord[key] === 'string' && 
                  !['id', 'createdAt', 'updatedAt'].includes(key)
                );
                
                stringFields.forEach(field => {
                  searchConditions.push({ [field]: { contains: search, mode: 'insensitive' } });
                });
              }
            } catch (error) {
              // Fallback to common field names if schema inspection fails
              const commonFields = ['name', 'title', 'description', 'label'];
              commonFields.forEach(field => {
                searchConditions.push({ [field]: { contains: search, mode: 'insensitive' } });
              });
            }
            
            if (searchConditions.length > 0) {
              where = { OR: searchConditions };
            }
          }

          const [records, total] = await Promise.all([
            modelClient.findMany({
              where,
              skip,
              take: limitNum,
              orderBy: { [sortBy as string]: sortOrder }
            }),
            modelClient.count({ where })
          ]);
          
          res.status(200).json({ 
            success: true, 
            data: records,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              pages: Math.ceil(total / limitNum)
            }
          });
        }
        break;

      case 'POST':
        // Create a new record
        const createData = req.body;
        if (!createData || typeof createData !== 'object') {
          return res.status(400).json({ error: 'Invalid data provided' });
        }

        const newRecord = await modelClient.create({
          data: createData
        });
        
        res.status(201).json({ success: true, data: newRecord });
        break;

      case 'PUT':
      case 'PATCH':
        // Update a record
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Record ID is required for update' });
        }

        const updateData = req.body;
        if (!updateData || typeof updateData !== 'object') {
          return res.status(400).json({ error: 'Invalid data provided' });
        }

        // Check if record exists
        const existingRecord = await modelClient.findUnique({
          where: { id }
        });

        if (!existingRecord) {
          return res.status(404).json({ error: 'Record not found' });
        }

        const updatedRecord = await modelClient.update({
          where: { id },
          data: updateData
        });
        
        res.status(200).json({ success: true, data: updatedRecord });
        break;

      case 'DELETE':
        // Delete a record
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Record ID is required for deletion' });
        }

        // Check if record exists
        const recordToDelete = await modelClient.findUnique({
          where: { id }
        });

        if (!recordToDelete) {
          return res.status(404).json({ error: 'Record not found' });
        }

        await modelClient.delete({
          where: { id }
        });
        
        res.status(200).json({ success: true, message: 'Record deleted successfully' });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(\`Error with model \${modelName}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        error: 'Unique constraint violation',
        details: 'A record with this data already exists'
      });
    } else if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: \`Failed to access model \${modelName}\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}`;
  }

  private generateModelRecordEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { modelName, id } = req.query;

  if (!modelName || typeof modelName !== 'string') {
    return res.status(400).json({ error: 'Model name is required' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Record ID is required' });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    console.error(\`Model '\${modelName}' (camelCase: '\${camelCaseModelName}') not found in Prisma client\`);
    console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    return res.status(404).json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get single record by ID
        const record = await modelClient.findUnique({
          where: { id }
        });
        
        if (!record) {
          return res.status(404).json({ error: 'Record not found' });
        }
        
        res.status(200).json({ success: true, data: record });
        break;

      case 'PUT':
      case 'PATCH':
        // Update a record
        const updateData = req.body;
        if (!updateData || typeof updateData !== 'object') {
          return res.status(400).json({ error: 'Invalid data provided' });
        }

        // Check if record exists first
        const existingRecord = await modelClient.findUnique({
          where: { id }
        });

        if (!existingRecord) {
          return res.status(404).json({ error: 'Record not found' });
        }

        const updatedRecord = await modelClient.update({
          where: { id },
          data: updateData
        });
        
        res.status(200).json({ success: true, data: updatedRecord });
        break;

      case 'DELETE':
        // Delete a record
        const recordToDelete = await modelClient.findUnique({
          where: { id }
        });

        if (!recordToDelete) {
          return res.status(404).json({ error: 'Record not found' });
        }

        await modelClient.delete({
          where: { id }
        });
        
        res.status(200).json({ success: true, message: 'Record deleted successfully' });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(\`Error with model \${modelName} record \${id}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        error: 'Unique constraint violation',
        details: 'A record with this data already exists'
      });
    } else if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: \`Failed to access model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}`;
  }

  private generateDynamicActionEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Fetch action definition from main app
async function getActionFromMainApp(actionName: string) {
  const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
  const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
  const AGENT_KEY = process.env.NEXT_PUBLIC_AGENT_KEY || 'default-agent-key';
  const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

  try {
    // Call main app to get action definition
    let response = await fetch(\`\${MAIN_APP_URL}/api/agent/execute-action\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
      },
      body: JSON.stringify({
        actionName: actionName,
        getDefinitionOnly: true // Only fetch definition, don't execute
      })
    });

    if (!response.ok) {
      throw new Error(\`Failed to fetch action definition: \${response.status}\`);
    }

    const data = await response.json();
    return data.success ? data.action : null;
  } catch (error) {
    console.error('Failed to fetch action from main app:', error);
    throw error;
  }
}

// Fetch credentials from main app
async function getCredentials() {
  const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
  const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
  const AGENT_KEY = process.env.NEXT_PUBLIC_AGENT_KEY || 'default-agent-key';
  const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

  try {
    let response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.credentials : {};
    }
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
  }
  return {};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { actionName } = req.query;

  if (!actionName || typeof actionName !== 'string') {
    return res.status(400).json({ error: 'Action name is required' });
  }

  try {
    console.log('🚀 Executing dynamic action:', actionName);
    
    // Fetch action definition from main app
    const action = await getActionFromMainApp(actionName);
    if (!action) {
      return res.status(404).json({ error: \`Action '\${actionName}' not found\` });
    }

    // Verify HTTP method matches action type
    const expectedMethod = action.type === 'query' ? 'GET' : 'POST';
    if (req.method !== expectedMethod) {
      return res.status(405).json({ error: \`Method not allowed. Expected \${expectedMethod}\` });
    }

    // Extract input and get credentials
    const { input } = req.body || {};
    const credentials = await getCredentials();
    
    console.log('🔑 Using credentials for external APIs:', Object.keys(credentials));
    
    // Mock member object for action execution
    const member = {
      id: 'demo-user',
      role: 'admin',
      email: 'demo@example.com'
    };
    
    // Mock AI object for action execution
    const ai = {
      generateText: async (prompt: string) => {
        return { text: \`Mock AI response for: \${prompt}\` };
      }
    };
    
    let result;
    
    if (action.execute?.code?.script) {
      // Execute the fetched action code against local SQLite database
      const actionCode = action.execute.code.script;
      const envVars = { ...credentials, ...process.env };
      
      // Create function from action code and execute it
      const actionFunction = new Function('database', 'input', 'member', 'ai', 'envVars', \`
        \${actionCode}
        return executeAction(database, input, member, ai, envVars);
      \`);
      
      result = await actionFunction(prisma, input, member, ai, envVars);
    } else {
      // Basic fallback execution logic
      result = {
        actionName: actionName,
        type: action.type || 'query',
        description: action.description || 'Dynamic action',
        input: input,
        success: true,
        timestamp: new Date().toISOString(),
        usedCredentials: Object.keys(credentials),
        executedLocally: true
      };
    }
    
    console.log(\`✅ Dynamic action '\${actionName}' completed successfully\`);
    res.status(200).json({ success: true, data: result });
    
  } catch (error) {
    console.error(\`❌ Error executing dynamic action '\${actionName}':\`, error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error',
      actionName: actionName
    });
  }
}`;
  }

  private generateDynamicCronEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Get schedules from sub-agent's own API (which calls main app)
async function getSchedulesToRun() {
  try {
    // Call sub-agent's own schedules API
    const response = await fetch('http://localhost:3000/api/agent/schedules');

    if (!response.ok) {
      console.log('Failed to get schedules from sub-agent API:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (data.success && data.schedules) {
      // Filter schedules that should run now
      const now = new Date();
      const schedulesToRun = [];
      
      for (const schedule of data.schedules) {
        if (schedule.interval?.active && schedule.interval?.pattern) {
          // Simple check - in a real app, use a proper cron parser
          // For now, run all active schedules every minute
          schedulesToRun.push(schedule);
        }
      }
      
      return schedulesToRun;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to get schedules from sub-agent API:', error);
    return [];
  }
}

// Fetch credentials from main app
async function getCredentials() {
  const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
  const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
  const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

  try {
    const response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public?documentId=\${DOCUMENT_ID}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        'X-Agent-Token': AGENT_TOKEN,
        'X-Document-ID': DOCUMENT_ID,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.credentials : {};
    }
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
  }
  return {};
}

// Execute a schedule's steps locally
async function executeScheduleSteps(schedule: any, credentials: any) {
  const stepResults = [];
  const steps = schedule.steps || [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    try {
      console.log(\`Executing step \${i + 1}: \${step.description || step.name}\`);
      
      // Call the main app to execute the step's action
      const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
      const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';
      
      const actionResponse = await fetch(\`\${MAIN_APP_URL}/api/agent/execute-action\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        },
        body: JSON.stringify({
          actionId: step.actionId,
          input: step.input || {},
          credentials: credentials
        }),
      });
      
      const actionResult = await actionResponse.json();
      stepResults.push({
        step: i + 1,
        actionId: step.actionId,
        success: actionResult.success,
        result: actionResult.data
      });
      
      // Add delay if specified
      if (step.delay?.duration) {
        await new Promise(resolve => setTimeout(resolve, step.delay.duration));
      }
      
    } catch (stepError) {
      console.error(\`Error in step \${i + 1}:\`, stepError);
      stepResults.push({
        step: i + 1,
        actionId: step.actionId,
        success: false,
        error: stepError instanceof Error ? stepError.message : 'Unknown error'
      });
      
      // Stop execution if step is configured to stop on error
      if (step.onError?.action === 'stop') {
        break;
      }
    }
  }

  return stepResults;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron request (optional security check)
  if (req.headers.authorization !== \`Bearer \${process.env.CRON_SECRET}\` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🕐 Checking for schedules to run...');
    
    // Get schedules that need to run from main app
    const schedulesToRun = await getSchedulesToRun();
    
    if (schedulesToRun.length === 0) {
      console.log('✅ No schedules need to run at this time');
      return res.status(200).json({ 
        success: true, 
        message: 'No schedules to run',
        timestamp: new Date().toISOString()
      });
    }

    console.log(\`🔄 Found \${schedulesToRun.length} schedule(s) to run\`);
    
    // Get credentials for external API calls
    const credentials = await getCredentials();
    console.log('🔑 Retrieved credentials for schedules:', Object.keys(credentials));
    
    const results = [];
    
    // Execute each schedule
    for (const schedule of schedulesToRun) {
      try {
        console.log(\`🚀 Executing schedule: \${schedule.name}\`);
        
        let stepResults = [];
        if (schedule.steps && schedule.steps.length > 0) {
          stepResults = await executeScheduleSteps(schedule, credentials);
        }
        
        const result = {
          scheduleName: schedule.name,
          description: schedule.description || 'Scheduled task',
          pattern: schedule.trigger?.pattern || schedule.interval?.pattern || '* * * * *',
          executedAt: new Date().toISOString(),
          success: true,
          stepResults: stepResults,
          totalSteps: stepResults.length,
          completedSteps: stepResults.filter(r => r.success).length,
          executedLocally: true
        };
        
        results.push(result);
        console.log(\`✅ Schedule '\${schedule.name}' completed successfully\`);
        
      } catch (scheduleError) {
        console.error(\`❌ Error executing schedule '\${schedule.name}':\`, scheduleError);
        results.push({
          scheduleName: schedule.name,
          success: false,
          error: scheduleError instanceof Error ? scheduleError.message : 'Unknown error',
          executedAt: new Date().toISOString()
        });
      }
    }
    
    console.log(\`✅ Completed \${results.length} schedule(s)\`);
    res.status(200).json({ 
      success: true, 
      data: results,
      summary: {
        totalSchedules: results.length,
        successfulSchedules: results.filter(r => r.success).length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error in dynamic scheduler:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}`;
  }

  private generateDirectActionTriggerEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { actionId } = req.query;

  if (!actionId || typeof actionId !== 'string') {
    return res.status(400).json({ error: 'Action ID is required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔗 Triggering action directly on main app:', actionId);
    
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_KEY = process.env.NEXT_PUBLIC_AGENT_KEY || 'default-agent-key';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';
    
    // Extract input from request body
    const { input = {}, member } = req.body || {};
    
    // Call main app to execute action directly
    const response = await fetch(\`\${MAIN_APP_URL}/api/agent/execute-action\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
      },
      body: JSON.stringify({
        actionId: actionId,
        input: input,
        member: member || {
          id: 'sub-agent-user',
          role: 'admin',
          email: 'sub-agent@deployed.app'
        }
      })
    });

    if (!response.ok) {
      throw new Error(\`Main app responded with status: \${response.status}\`);
    }

    const result = await response.json();
    
    console.log('✅ Action executed successfully on main app');
    res.status(200).json({
      success: true,
      data: result.data,
      triggeredRemotely: true,
      actionId: actionId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error triggering action on main app:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger action',
      actionId: actionId
    });
  }
}`;
  }

  private generateDirectScheduleTriggerEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { scheduleId } = req.query;

  if (!scheduleId || typeof scheduleId !== 'string') {
    return res.status(400).json({ error: 'Schedule ID is required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔗 Triggering schedule directly on main app:', scheduleId);
    
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_KEY = process.env.NEXT_PUBLIC_AGENT_KEY || 'default-agent-key';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';
    
    // Extract any additional parameters from request body
    const { member, force = false } = req.body || {};
    
    // Call main app to execute schedule directly
    const response = await fetch(\`\${MAIN_APP_URL}/api/agent/execute-schedule\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
      },
      body: JSON.stringify({
        scheduleId: scheduleId,
        force: force, // Force execution even if not scheduled
        member: member || {
          id: 'sub-agent-user',
          role: 'admin',
          email: 'sub-agent@deployed.app'
        }
      })
    });

    if (!response.ok) {
      throw new Error(\`Main app responded with status: \${response.status}\`);
    }

    const result = await response.json();
    
    console.log('✅ Schedule executed successfully on main app');
    res.status(200).json({
      success: true,
      data: result.data,
      triggeredRemotely: true,
      scheduleId: scheduleId,
      forced: force,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error triggering schedule on main app:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger schedule',
      scheduleId: scheduleId
    });
  }
}`;
  }

  private generatePrismaClient(): string {
    return `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`;
  }

  private generateApiHook(): string {
    return `import { useState, useCallback } from 'react';

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
    return `import { useState, useEffect } from 'react';

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
  private generateSeedFile(): string {
    return `import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Add your custom seed data here for your models
  ${this.options.models.map(model => `
  // TODO: Add seed data for ${model.name}
  // Example:
  // const sample${model.name} = await prisma.${model.name.charAt(0).toLowerCase() + model.name.slice(1)}.createMany({
  //   data: [
  //     // Add your sample data here based on your ${model.name} model fields
  //   ]
  // });
  // console.log(\`✅ Created \${sample${model.name}.count} ${model.name} records\`);`).join('\n')}
  
  console.log('✅ Database seeded successfully - please uncomment and customize the seed data above')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })`;
  }

  private sanitizePrismaSchema(schema: string): string {
    try {
      // Fix common relation issues that cause validation errors
      let sanitizedSchema = schema;
      
      // 1. Remove problematic one-to-one relations without @unique
      // Pattern: fieldName ModelName @relation(fields: [fieldId], references: [id])
      // where fieldId is not marked as @unique
      const relationPattern = /(\w+)\s+(\w+)\s*@relation\(fields:\s*\[(\w+)\],\s*references:\s*\[[^\]]+\]\)/g;
      
      sanitizedSchema = sanitizedSchema.replace(relationPattern, (match, fieldName, modelName, foreignKeyField) => {
        // Check if the foreign key field has @unique constraint
        const uniquePattern = new RegExp(`${foreignKeyField}\\s+\\w+[^\\n]*@unique`, 'g');
        const hasUnique = uniquePattern.test(sanitizedSchema);
        
        if (!hasUnique) {
          // For now, remove the relation attribute to avoid validation errors
          // Keep just the field without the relation
          console.log(`Sanitizing relation: Removed @relation from ${fieldName} -> ${modelName} (missing @unique on ${foreignKeyField})`);
          return `${fieldName} ${modelName}?`;
        }
        
        return match;
      });
      
      // 2. Ensure foreign key fields are optional if they have relations (but NOT ID fields)
      const foreignKeyPattern = /(\w+Id)\s+(String|Int)(\s+@unique)?(?!\s*@id)/g;
      sanitizedSchema = sanitizedSchema.replace(foreignKeyPattern, (match, fieldName, type, unique) => {
        // Don't make ID fields optional - they must be required
        if (match.includes('@id')) {
          return match;
        }
        
        if (unique) {
          return `${fieldName} ${type}?${unique}`;
        } else {
          return `${fieldName} ${type}?`;
        }
      });
      
      // 3. Fix any ID fields that were accidentally made optional
      const idFieldPattern = /(\w+)\s+(String|Int)\?\s+@id/g;
      sanitizedSchema = sanitizedSchema.replace(idFieldPattern, (match, fieldName, type) => {
        console.log(`Fixing ID field: Removing ? from ${fieldName} (ID fields must be required)`);
        return `${fieldName} ${type} @id`;
      });
      
      // 4. Add note about sanitization
      if (sanitizedSchema !== schema) {
        sanitizedSchema += '\n\n// Note: Schema was sanitized to remove problematic relations during deployment.';
      }
      
      return sanitizedSchema;
    } catch (error) {
      console.error('Error sanitizing Prisma schema:', error);
      // Fallback to generating a clean default schema
      return this.generateDefaultPrismaSchema();
    }
  }

  private generateDefaultPrismaSchema(): string {
    const modelSchemas = this.options.models.map(model => {
      // Check if model has an explicit ID field
      const hasIdField = model.fields.some((field: any) => field.isId);
      
      let fieldsArray = [...model.fields];
      
      // Add default ID field if none exists
      if (!hasIdField) {
        fieldsArray.unshift({
          name: 'id',
          type: 'String',
          isId: true,
          required: true,
          unique: false
        });
      }
      
      const fields = fieldsArray.map((field: any) => {
        let prismaType = 'String';
        switch (field.type.toLowerCase()) {
          case 'int':
          case 'integer':
            prismaType = 'Int';
            break;
          case 'float':
          case 'decimal':
            prismaType = 'Float';
            break;
          case 'boolean':
          case 'bool':
            prismaType = 'Boolean';
            break;
          case 'datetime':
          case 'date':
            prismaType = 'DateTime';
            break;
          default:
            prismaType = 'String';
        }

        const modifiers = [];
        if (field.isId) {
          // ID fields are ALWAYS required (no ?)
          modifiers.push('@id @default(cuid())');
        } else {
          // Make all non-ID fields optional for flexibility
          if (!field.required) modifiers.push('?');
          
          // Handle unique constraints carefully
          if (field.unique && !field.isId) {
            modifiers.push('@unique');
          }
        }

        return `  ${field.name} ${prismaType}${modifiers.length > 0 ? ' ' + modifiers.join(' ') : ''}`;
      }).join('\n');

      return `model ${model.name} {
${fields}
  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
}`;
    }).join('\n\n');

    return `// This file was auto-generated based on your agent models
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

${modelSchemas}

// Note: This schema is automatically generated.
// Any manual changes will be overwritten on next deployment.
// Relations are simplified to avoid validation errors.
`;
  }

  private generateSQLiteInitScript(): string {
    return `const fs = require('fs');
const path = require('path');

// Determine the correct database path for different environments
let dbDir, dbPath;

if (process.env.VERCEL) {
  // Vercel deployment - use /tmp directory
  dbDir = '/tmp';
  dbPath = path.join(dbDir, 'dev.db');
  console.log('🚀 Running on Vercel, using temporary database at:', dbPath);
} else {
  // Local development - use project directory
  dbDir = path.join(__dirname, '..');
  dbPath = path.join(dbDir, 'dev.db');
  console.log('💻 Running locally, using database at:', dbPath);
}

// Ensure the directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Created database directory:', dbDir);
}

// Create empty SQLite database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
  try {
    fs.writeFileSync(dbPath, '');
    console.log('✅ SQLite database file created:', dbPath);
  } catch (error) {
    console.error('❌ Failed to create database file:', error);
    process.exit(1);
  }
} else {
  console.log('📋 SQLite database file already exists:', dbPath);
}

// Update DATABASE_URL environment variable for Prisma
if (process.env.VERCEL) {
  process.env.DATABASE_URL = \`file:\${dbPath}\`;
  console.log('🔗 Updated DATABASE_URL for Vercel:', process.env.DATABASE_URL);
}

console.log('🗄️ SQLite database initialization complete');`;
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
  private generateGitIgnore(): string {
    return `# Dependencies
node_modules/
.pnpm-debug.log*

# Next.js
.next/
out/

# Production
build/

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local
.env

# Database
*.db
*.db-journal
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Vercel
.vercel
`;
  }
  private generateReadme(): string {
    return `# ${this.options.projectName}

A mobile-first AI agent application with **real AI chat functionality** powered by Vercel's AI SDK and deployed on Vercel.

## ✨ Key Features

- **🤖 AI-Powered Chat**: Real conversational AI using OpenAI GPT-4 or Anthropic Claude－ 
- **📱 Mobile-First Design**: Bottom navigation, touch-friendly interface
- **🗃️ Data Management**: Interactive data models with CRUD operations
- **⚡ Smart Actions**: Execute agent actions with real-time feedback
- **⏰ Task Scheduling**: Automated cron jobs with Vercel Functions
- **🚀 Vercel Deployment**: Optimized for Vercel platform with zero-config deployment

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- **OpenAI API Key** or **Anthropic API Key**
- Vercel account (for deployment)

### 1. Setup Environment Variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

Add your AI provider credentials:
\`\`\`env
# For OpenAI (recommended)
OPENAI_API_KEY=sk-your-openai-key-here
AI_MODEL_PROVIDER=openai
AI_MODEL_NAME=gpt-4o-mini

# OR for Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
AI_MODEL_PROVIDER=anthropic
AI_MODEL_NAME=claude-3-haiku-20240307
\`\`\`

### 2. Install and Run
\`\`\`bash
npm install
npm run dev
\`\`\`

The app will be available at \`http://localhost:3000\` with a fully functional AI chat!

## 📊 Your Agent Data

### Data Models (${this.options.models.length})
${this.options.models.map(m => `- **${m.name}**: ${m.description || 'Data model'}`).join('\n')}

### Smart Actions (${this.options.actions.length})
${this.options.actions.map(a => `- **${a.name}**: ${a.description || 'Action'} (${a.type})`).join('\n')}

### Scheduled Tasks (${this.options.schedules.length})
${this.options.schedules.map(s => `- **${s.name}**: ${s.description || 'Scheduled task'} (\`${s.interval?.pattern || '* * * * *'}\`)`).join('\n')}

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
${this.options.actions.map(a => `- \`POST /api/${a.name}\` - ${a.description || 'Execute action'}`).join('\n')}

### Cron APIs
${this.options.schedules.map(s => `- \`POST /api/cron/${s.name}\` - ${s.description || 'Scheduled task'}`).join('\n')}

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

  // Sub-agent API endpoints that call main app
  private generateActionsEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

    console.log('🔗 Actions API calling main app:', { MAIN_APP_URL, DOCUMENT_ID: DOCUMENT_ID.substring(0, 8) + '...', hasToken: !!AGENT_TOKEN });

    // Call main app to get agent configuration
    const response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public?documentId=\${DOCUMENT_ID}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        'X-Agent-Token': AGENT_TOKEN,
        'X-Document-ID': DOCUMENT_ID,
      },
    });

    console.log('🔗 Main app response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔗 Main app error:', errorText);
      throw new Error(\`Failed to fetch from main app: \${response.status} - \${errorText}\`);
    }

    const data = await response.json();
    console.log('🔗 Main app data received:', { success: data.success, hasActions: !!data.agentConfig?.actions });
    
    if (data.success && data.agentConfig?.actions) {
      res.status(200).json({
        success: true,
        actions: data.agentConfig.actions
      });
    } else {
      // Fallback to static actions
      console.log('🔗 Using fallback actions');
      const fallbackActions = ${JSON.stringify(this.options.actions)};
      res.status(200).json({
        success: true,
        actions: fallbackActions,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('🔗 Error fetching actions:', error);
    
    // Return fallback actions on error
    const fallbackActions = ${JSON.stringify(this.options.actions)};
    res.status(200).json({
      success: true,
      actions: fallbackActions,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}`;
  }

  private generateSchedulesEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

    console.log('🔗 Schedules API calling main app:', { MAIN_APP_URL, DOCUMENT_ID: DOCUMENT_ID.substring(0, 8) + '...', hasToken: !!AGENT_TOKEN });

    // Call main app to get agent configuration
    const response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public?documentId=\${DOCUMENT_ID}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        'X-Agent-Token': AGENT_TOKEN,
        'X-Document-ID': DOCUMENT_ID,
      },
    });

    console.log('🔗 Main app response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔗 Main app error:', errorText);
      throw new Error(\`Failed to fetch from main app: \${response.status} - \${errorText}\`);
    }

    const data = await response.json();
    console.log('🔗 Main app data received:', { success: data.success, hasSchedules: !!data.agentConfig?.schedules });
    
    if (data.success && data.agentConfig?.schedules) {
      res.status(200).json({
        success: true,
        schedules: data.agentConfig.schedules
      });
    } else {
      // Fallback to static schedules
      console.log('🔗 Using fallback schedules');
      const fallbackSchedules = ${JSON.stringify(this.options.schedules)};
      res.status(200).json({
        success: true,
        schedules: fallbackSchedules,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('🔗 Error fetching schedules:', error);
    
    // Return fallback schedules on error
    const fallbackSchedules = ${JSON.stringify(this.options.schedules)};
    res.status(200).json({
      success: true,
      schedules: fallbackSchedules,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}`;
  }

  private generateModelsEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

    console.log('🔗 Models API calling main app:', { MAIN_APP_URL, DOCUMENT_ID: DOCUMENT_ID.substring(0, 8) + '...', hasToken: !!AGENT_TOKEN });

    // Call main app to get agent configuration
    const response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public?documentId=\${DOCUMENT_ID}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        'X-Agent-Token': AGENT_TOKEN,
        'X-Document-ID': DOCUMENT_ID,
      },
    });

    console.log('🔗 Main app response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔗 Main app error:', errorText);
      throw new Error(\`Failed to fetch from main app: \${response.status} - \${errorText}\`);
    }

    const data = await response.json();
    console.log('🔗 Main app data received:', { success: data.success, hasModels: !!data.agentConfig?.models });
    
    if (data.success && data.agentConfig?.models) {
      res.status(200).json({
        success: true,
        models: data.agentConfig.models
      });
    } else {
      // Fallback to static models
      console.log('🔗 Using fallback models');
      const fallbackModels = ${JSON.stringify(this.options.models)};
      res.status(200).json({
        success: true,
        models: fallbackModels,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    
    // Return fallback models on error
    const fallbackModels = ${JSON.stringify(this.options.models)};
    res.status(200).json({
      success: true,
      models: fallbackModels,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}`;
  }

  private generateAgentConfigEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

    console.log('🔗 Config API calling main app:', { MAIN_APP_URL, DOCUMENT_ID: DOCUMENT_ID.substring(0, 8) + '...', hasToken: !!AGENT_TOKEN });

    // Call main app to get full agent configuration
    const response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public?documentId=\${DOCUMENT_ID}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        'X-Agent-Token': AGENT_TOKEN,
        'X-Document-ID': DOCUMENT_ID,
      },
    });

    console.log('🔗 Main app response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔗 Main app error:', errorText);
      throw new Error(\`Failed to fetch from main app: \${response.status} - \${errorText}\`);
    }

    const data = await response.json();
    console.log('🔗 Main app data received:', { 
      success: data.success, 
      hasConfig: !!data.agentConfig,
      hasAvatar: !!data.agentConfig?.avatar,
      avatarType: data.agentConfig?.avatar?.type,
      theme: data.agentConfig?.theme,
      name: data.agentConfig?.name
    });
    
    if (data.success && data.agentConfig) {
      // Ensure we're returning the complete config with proper structure
      const config = {
        name: data.agentConfig.name || '${this.options.projectName}',
        description: data.agentConfig.description || 'Agent application',
        theme: data.agentConfig.theme || 'green',
        avatar: data.agentConfig.avatar || null,
        domain: data.agentConfig.domain || null,
        models: data.agentConfig.models || [],
        actions: data.agentConfig.actions || [],
        schedules: data.agentConfig.schedules || []
      };
      
      console.log('✅ Returning config to sub-agent:', {
        name: config.name,
        theme: config.theme,
        hasAvatar: !!config.avatar,
        avatarType: config.avatar?.type
      });
      
      res.status(200).json({
        success: true,
        config
      });
    } else {
      // Fallback configuration
      console.log('⚠️ Using fallback config - main app data not available');
      const fallbackConfig = {
        name: '${this.options.projectName}',
        description: 'Agent application',
        theme: 'green',
        avatar: null,
        domain: null,
        models: ${JSON.stringify(this.options.models)},
        actions: ${JSON.stringify(this.options.actions)},
        schedules: ${JSON.stringify(this.options.schedules)}
      };
      
      console.log('📋 Fallback config:', {
        name: fallbackConfig.name,
        theme: fallbackConfig.theme,
        hasAvatar: !!fallbackConfig.avatar
      });
      
      res.status(200).json({
        success: true,
        config: fallbackConfig,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching agent config:', error);
    
    // Return fallback config on error
    console.log('🔄 Using error fallback config');
    const fallbackConfig = {
      name: '${this.options.projectName}',
      description: 'Agent application',
      theme: 'green',
      avatar: null,
      domain: null,
      models: ${JSON.stringify(this.options.models)},
      actions: ${JSON.stringify(this.options.actions)},
      schedules: ${JSON.stringify(this.options.schedules)}
    };
    
    console.log('🔄 Error fallback config:', {
      name: fallbackConfig.name,
      theme: fallbackConfig.theme,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(200).json({
      success: true,
      config: fallbackConfig,
      source: 'error-fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}`;
  }

  private generateAgentDataEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

    console.log('🔗 Data API calling main app:', { MAIN_APP_URL, DOCUMENT_ID: DOCUMENT_ID.substring(0, 8) + '...', hasToken: !!AGENT_TOKEN });

    if (!DOCUMENT_ID) {
      return res.status(400).json({ error: 'No document ID configured' });
    }

    // Call main app to get agent document data
    const response = await fetch(\`\${MAIN_APP_URL}/api/document?id=\${DOCUMENT_ID}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        'X-Agent-Token': AGENT_TOKEN,
        'X-Document-ID': DOCUMENT_ID,
      },
    });

    console.log('🔗 Main app response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔗 Main app error:', errorText);
      throw new Error(\`Failed to fetch from main app: \${response.status} - \${errorText}\`);
    }

    const data = await response.json();
    console.log('🔗 Main app data received:', { success: data.success, hasDocument: !!data.document });
    
    if (data.success && data.document?.metadata) {
      const metadata = data.document.metadata;
      const agentData = {
        name: metadata.name || '${this.options.projectName}',
        description: metadata.description || '',
        personality: metadata.personality || '',
        theme: metadata.theme || 'green',
        avatar: metadata.avatar || null,
        models: metadata.models || [],
        actions: metadata.actions || [],
        schedules: metadata.schedules || []
      };
      
      res.status(200).json({
        success: true,
        data: agentData
      });
    } else {
      // Fallback data
      const fallbackData = {
        name: '${this.options.projectName}',
        description: 'Agent application',
        personality: '',
        theme: 'green',
        avatar: null,
        models: ${JSON.stringify(this.options.models)},
        actions: ${JSON.stringify(this.options.actions)},
        schedules: ${JSON.stringify(this.options.schedules)}
      };
      
      res.status(200).json({
        success: true,
        data: fallbackData,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error fetching agent data:', error);
    
    // Return fallback data on error
    const fallbackData = {
      name: '${this.options.projectName}',
      description: 'Agent application',
      personality: '',
      theme: 'green',
      avatar: null,
      models: ${JSON.stringify(this.options.models)},
      actions: ${JSON.stringify(this.options.actions)},
      schedules: ${JSON.stringify(this.options.schedules)}
    };
    
    res.status(200).json({
      success: true,
      data: fallbackData,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}`;
  }

  private generateAgentContext(): string {
    return `import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AgentConfig {
  name: string;
  description: string;
  theme: string;
  avatar: any;
  domain?: string;
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
      
      console.log('🔧 AgentProvider: Fetching agent config...');
      const response = await fetch('/api/agent/config');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch config: \${response.status}\`);
      }
      
      const data = await response.json();
      console.log('🔧 AgentProvider: Config response:', data);
      
      if (data.success && data.config) {
        console.log('✅ AgentProvider: Setting config:', {
          name: data.config.name,
          theme: data.config.theme,
          hasAvatar: !!data.config.avatar,
          avatarType: data.config.avatar?.type
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
      
      // Set fallback config
      const fallbackConfig: AgentConfig = {
        name: '${this.options.projectName}',
        description: 'Agent application',
        theme: 'green',
        avatar: null,
        models: [],
        actions: [],
        schedules: []
      };
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

  private generateTestConnectionEndpoint(): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
    const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
    const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';

    console.log('🔗 Testing connection to main app:', { 
      MAIN_APP_URL, 
      DOCUMENT_ID: DOCUMENT_ID.substring(0, 8) + '...', 
      hasToken: !!AGENT_TOKEN 
    });

    // Test authenticated endpoint
    const authResponse = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public?documentId=\${DOCUMENT_ID}\`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${AGENT_TOKEN}\`,
        'X-Agent-Token': AGENT_TOKEN,
        'X-Document-ID': DOCUMENT_ID,
      },
    }).catch(error => {
      console.error('❌ Auth test failed:', error);
      return null;
    });

    const authOk = authResponse?.ok;
    
    let authData = null;
    if (authOk) {
      try {
        authData = await authResponse.json();
      } catch (e) {
        console.error('❌ Failed to parse auth response:', e);
      }
    }

    const result = {
      success: true,
      tests: {
        authentication: {
          status: authOk ? 'pass' : 'fail',
          response: authOk ? 'Authentication successful' : 'Authentication failed'
        },
        dataRetrieval: {
          status: (authData?.success && authData?.agentConfig) ? 'pass' : 'fail',
          response: (authData?.success && authData?.agentConfig) ? 'Agent data retrieved' : 'Failed to retrieve agent data',
          hasAvatar: !!authData?.agentConfig?.avatar,
          theme: authData?.agentConfig?.theme || 'not found',
          name: authData?.agentConfig?.name || 'not found'
        }
      },
      environment: {
        MAIN_APP_URL,
        hasDocumentId: !!DOCUMENT_ID,
        hasAgentToken: !!AGENT_TOKEN
      },
      debug: authData?.debug || null
    };

    console.log('🔍 Connection test results:', result);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Test connection error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: {
        authentication: { status: 'error', response: 'Test failed with error' },
        dataRetrieval: { status: 'error', response: 'Test failed with error' }
      }
    });
  }
}`;
  }
}

export default MobileAppTemplate; 