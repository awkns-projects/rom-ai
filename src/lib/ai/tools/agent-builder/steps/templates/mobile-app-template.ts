import type { AgentAction, AgentSchedule } from '../../types';

// Helper function to normalize schedule structure (handles both old and new formats)
function normalizeSchedule(schedule: any) {
  // Handle both old (interval) and new (trigger) format
  const pattern = schedule.trigger?.pattern || schedule.interval?.pattern || '0 0 * * *';
  const active = schedule.trigger?.active ?? schedule.interval?.active ?? false;
  
  return {
    ...schedule,
    normalizedPattern: pattern,
    normalizedActive: active
  };
}

// Helper function to escape strings for safe JavaScript generation
function escapeJSString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "\\'")    // Escape single quotes
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t');  // Escape tabs
}

interface MobileAppTemplateOptions {
  projectName: string;
  models: any[];
  actions: AgentAction[];
  schedules: AgentSchedule[];
  prismaSchema: string; // Required - Complete Prisma schema from database generation step
  enums: any[]; // Required - Enums array from database generation step
  neonOptions?: { region?: string; pgVersion?: number; autoSuspend?: boolean; };
  
  // Local client app configuration
  agentConfig?: {
    name?: string;
    description?: string;
    theme?: string;
    avatar?: any;
    domain?: string;
  };
  
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
 * 🚀 FULLY LOCAL ARCHITECTURE:
 * 1. All Configuration Embedded: name, description, theme, avatar, models, actions, schedules
 * 2. Static Action Execution: /api/actions/[actionName] - embedded action code, executes locally
 * 3. Static Cron Jobs: /api/cron/[scheduleName] - embedded schedule code with cron timing
 * 4. Direct Model CRUD: /api/models/[modelName] + /api/models/[modelName]/[id] - PostgreSQL operations via Prisma
 * 5. Self-managed API Keys: Client manages its own OpenAI/Anthropic/Grok keys
 * 6. Interactive Action UI: Modal-based action execution with input parameters and results display
 * 7. Persistent Database: PostgreSQL with provided Prisma schema
 * 
 * Benefits: 
 * - Complete independence - no external dependencies
 * - Fast performance with all data embedded locally
 * - Persistent database with no resets
 * - Embedded action and schedule code
 * - Self-managed API keys and configuration
 * - Direct database operations for optimal performance
 * - Full CRUD operations with pagination and search
 * - Scalable PostgreSQL database
 * - Production-ready deployment
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

    // Generate TypeScript config optimized for App Router
    files['tsconfig.json'] = JSON.stringify({
      compilerOptions: {
        target: "es2017",
        lib: ["dom", "dom.iterable", "es2017"],
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
        paths: { "@/*": ["./src/*"] },
        downlevelIteration: true
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
      "@tailwindcss/forms": "^0.5.7",
      pg: "^8.11.3",
      "@types/pg": "^8.10.9"
    };

    // Add AI SDK packages for Vercel (enabled by default)
    if (aiSdkEnabled) {
      Object.assign(baseDependencies, {
        "ai": "^4.0.0",
        "@ai-sdk/openai": "^1.0.0",
        "@ai-sdk/react": "^1.0.0", 
        "@ai-sdk/anthropic": "^1.0.0",
        "zod": "^3.23.8",
        "nanoid": "^5.0.8"
      });
    }

    // Environment-aware scripts with PostgreSQL support
    const baseScripts = {
      dev: "npm run db:setup && next dev",
      build: "npm run db:setup && next build",
      start: "next start",
      lint: "next lint",
      "db:generate": "prisma generate",
      "db:push": "prisma db push --accept-data-loss",
      "db:deploy": "prisma migrate deploy",
      "db:migrate": "prisma migrate dev",
      "db:studio": "prisma studio",
      "db:seed": "tsx prisma/seed.ts",
      "db:setup": "npm run prisma:format && npm run db:generate && npm run db:push",
      "db:reset": "prisma migrate reset --force",
      "prisma:format": "prisma format",
      "prisma:validate": "prisma validate",
      postinstall: "npm run prisma:format && npm run db:generate",
      "vercel-build": "npm run db:setup && next build"
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

    let envContent = `# Database - PostgreSQL (Neon recommended for production)
# For local development, you can use a local PostgreSQL instance
# For production, create a Neon database and use the connection string
DATABASE_URL="postgresql://user:password@host:5432/database"

# Neon Database Configuration (for production)
NEON_API_KEY="your_neon_api_key_here"
NEON_PROJECT_ID="your_neon_project_id_here"

# Note: You need to create the PostgreSQL database first before running the app
# The tables will be created automatically when you run 'npm run db:setup'`;

    if (aiSdkEnabled) {
      envContent += `

# 🚀 AI Provider Configuration (Self-contained API Keys)
# Configure your own API keys for AI providers

# AI Provider Selection
AI_MODEL_PROVIDER="openai"    # openai | anthropic | grok
AI_MODEL_NAME="gpt-4o-mini"   # For OpenAI: gpt-4o-mini, gpt-4o, gpt-3.5-turbo
                              # For Anthropic: claude-3-haiku-20240307, claude-3-sonnet-20240229
                              # For Grok: grok-beta

# AI Provider API Keys (set at least one)
OPENAI_API_KEY="your_openai_api_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
GROK_API_KEY="your_grok_api_key_here"`;
    }

    envContent += `

# Application Configuration
NEXT_PUBLIC_APP_NAME="${this.options.agentConfig?.name || this.options.projectName}"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_DESCRIPTION="${this.options.agentConfig?.description || 'Smart agent powered by AI'}"
NEXT_PUBLIC_APP_THEME="${this.options.agentConfig?.theme || 'green'}"

# Security
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Cron security (for production)
CRON_SECRET="your-cron-secret-here"

# Optional: Custom environment variables
# Add your project-specific variables here`;

    return envContent;
  }

  private generateEnvLocal(): string {
    return `# Local Development Environment
# Database URL - PostgreSQL connection string
# For local development: Create a PostgreSQL database named '${this.options.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}'
# For production: Use your Neon database connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/${this.options.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}"

# Neon Database Configuration (for production deployment)
NEON_API_KEY="your_neon_api_key_here"
NEON_PROJECT_ID="your_neon_project_id_here"

# AI Provider API Keys (choose one or more)
OPENAI_API_KEY="your_openai_api_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
GROK_API_KEY="your_grok_api_key_here"

# AI Model Configuration
AI_MODEL_PROVIDER="openai"
AI_MODEL_NAME="gpt-4o-mini"

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="${this.options.agentConfig?.name || this.options.projectName}"
NEXT_PUBLIC_APP_DESCRIPTION="${this.options.agentConfig?.description || 'Smart agent powered by AI'}"
NEXT_PUBLIC_APP_THEME="${this.options.agentConfig?.theme || 'green'}"

# Security tokens (auto-generated)
NEXTAUTH_SECRET="${Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)}"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="${Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)}"
`;
  }

  private generateVercelConfig(): string {
    // Generate cron configurations for each schedule using the normalize function
    const cronConfigs = this.options.schedules.map(schedule => {
      const normalized = normalizeSchedule(schedule);
      return {
        path: `/api/cron/${schedule.name}`,
        schedule: normalized.normalizedPattern
      };
    });

    return JSON.stringify({
      buildCommand: "npm run vercel-build",
      functions: {
        "src/app/api/cron/**": { maxDuration: 300 },
        "src/app/api/models/**": { maxDuration: 60 },
        "src/app/api/actions/**": { maxDuration: 120 }
      },
      crons: cronConfigs,
      installCommand: "npm install",
      build: { 
        env: { 
          PRISMA_GENERATE_DATAPROXY: "true",
          NODE_ENV: "production"
        } 
      }
    }, null, 2);
  }





  private generatePages(): Record<string, string> {
    return {
      'src/app/layout.tsx': this.generateAppLayout(),
      'src/app/page.tsx': this.generateHomePage(),
      'src/app/models/page.tsx': this.generateModelsListPage(),
      'src/app/models/[modelName]/page.tsx': this.generateModelDetailPage(),
      'src/app/actions/page.tsx': this.generateActionsPage(),
      'src/app/schedules/page.tsx': this.generateSchedulesPage(),
      'src/app/chat/page.tsx': this.generateChatPage()
    };
  }

  private generateComponents(): Record<string, string> {
    return {
      'src/components/Layout.tsx': this.generateLayoutComponent(),
      'src/components/MobileNav.tsx': this.generateMobileNavComponent(),
      'src/components/ModelCard.tsx': this.generateModelCardComponent(),
      'src/components/ActionCard.tsx': this.generateActionCardComponent(),
      'src/components/ScheduleCard.tsx': this.generateScheduleCardComponent(),
      'src/components/ChatMessage.tsx': this.generateChatMessageComponent(),
      'src/components/LoadingSpinner.tsx': this.generateLoadingSpinnerComponent(),
      'src/components/ActionExecutionModal.tsx': this.generateActionExecutionModal(),
      'src/components/ClientProviders.tsx': this.generateClientProviders()
    };
  }

  private generateApiRoutes(): Record<string, string> {
    const files: Record<string, string> = {};

    // System endpoints (App Router format)
    files['src/app/api/health/route.ts'] = this.generateHealthEndpoint();
    files['src/app/api/stats/route.ts'] = this.generateStatsEndpoint();
    files['src/app/api/models/[modelName]/route.ts'] = this.generateModelEndpoint();
    files['src/app/api/models/[modelName]/[id]/route.ts'] = this.generateModelRecordEndpoint();
    files['src/app/api/chat/route.ts'] = this.generateSelfContainedChatEndpoint();
    
    // Agent configuration endpoints (embedded data)
    files['src/app/api/agent/actions/route.ts'] = this.generateActionsEndpoint();
    files['src/app/api/agent/schedules/route.ts'] = this.generateSchedulesEndpoint();
    files['src/app/api/agent/models/route.ts'] = this.generateModelsEndpoint();
    files['src/app/api/agent/config/route.ts'] = this.generateAgentConfigEndpoint();

    // Static action endpoints (one file per action with embedded code)
    this.options.actions.forEach(action => {
      files[`src/app/api/actions/${action.name}/route.ts`] = this.generateStaticActionEndpoint(action);
    });

    // Static cron endpoints (one file per schedule with embedded code)
    this.options.schedules.forEach(schedule => {
      files[`src/app/api/cron/${schedule.name}/route.ts`] = this.generateStaticCronEndpoint(schedule);
    });

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
      'prisma/seed.ts': this.generateSeedFile()
    };

    // Use the provided Prisma schema directly
    files['prisma/schema.prisma'] = this.options.prismaSchema;

    return files;
  }

  private generateStyles(): Record<string, string> {
    return {
      'src/app/globals.css': this.generateGlobalStyles(),
      '.gitignore': this.generateGitIgnore()
    };
  }

  private generateDocumentation(): Record<string, string> {
    return {
      'README.md': this.generateReadme()
    };
  }

  // App Router layout generator
  private generateAppLayout(): string {
    return `import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: '${this.options.agentConfig?.name || this.options.projectName}',
  description: '${this.options.agentConfig?.description || 'Smart agent powered by AI'}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}`;
  }

  // Component generators
  private generateLayoutComponent(): string {
    const agentName = escapeJSString(this.options.agentConfig?.name || this.options.projectName);
    const agentTheme = this.options.agentConfig?.theme || 'green';
    const agentDescription = escapeJSString(this.options.agentConfig?.description || 'Smart agent powered by AI');
    const agentAvatar = this.options.agentConfig?.avatar;
    
    return `'use client'
import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MobileNav from './MobileNav';
import { themes } from '@/lib/theme';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  agentName?: string;
  theme?: keyof typeof themes;
}

export default function Layout({ 
  children, 
  title = '${agentName}', 
  agentName = '${agentName}', 
  theme = '${agentTheme}' 
}: LayoutProps) {
  const [isMobile, setIsMobile] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use embedded local configuration
  const selectedTheme = theme;
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;
  const displayName = agentName;
  
  // Extract avatar URL from embedded config
  const avatarUrl = ${agentAvatar?.uploadedImage ? `"${agentAvatar.uploadedImage}"` : 'null'};

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render avatar function
  const renderAvatar = (size = 32) => {
    const containerClass = size === 32 ? 'w-8 h-8' : 'w-10 h-10';
    const iconSize = size === 32 ? 'text-lg' : 'text-xl';
    
    if (avatarUrl) {
      return (
        <img 
          src={avatarUrl} 
          alt="Agent Avatar" 
          className={\`\${containerClass} rounded-lg object-cover\`}
          onError={(e) => {
            // Fallback to theme gradient if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    
    return (
      <div className={\`\${containerClass} \${currentTheme.bg} border \${currentTheme.border} rounded-lg flex items-center justify-center\`}>
        <span className={\`\${iconSize} \${currentTheme.accent}\`}>🤖</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Subtle theme gradient overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className={\`absolute inset-0 bg-gradient-to-br \${currentTheme.gradient}\`}></div>
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <header className={\`relative z-40 \${currentTheme.bg} border-b \${currentTheme.border} backdrop-blur-sm bg-opacity-80\`}>
          <div className="px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {renderAvatar(32)}
                <div>
                  <h1 className={\`font-mono font-bold text-lg \${currentTheme.light}\`}>{displayName}</h1>
                  <div className="flex items-center gap-2">
                    <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-pulse\`}></div>
                    <span className={\`font-mono text-xs \${currentTheme.accent}\`}>Live</span>
                  </div>
                </div>
              </div>
              {pathname !== '/' && (
                <button
                  onClick={() => router.push('/')}
                  className={\`w-10 h-10 \${currentTheme.bg} border \${currentTheme.border} rounded-xl flex items-center justify-center \${currentTheme.bgHover} transition-colors duration-200\`}
                >
                  <span className={\`text-lg \${currentTheme.accent}\`}>🏠</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <header className={\`relative z-40 \${currentTheme.bg} border-b \${currentTheme.border} backdrop-blur-sm bg-opacity-80\`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Left side - Agent info */}
              <div className="flex items-center gap-4">
                {renderAvatar(40)}
                <div>
                  <h1 className={\`font-mono font-bold text-lg \${currentTheme.light}\`}>{displayName}</h1>
                  <div className="flex items-center gap-2">
                    <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-pulse\`}></div>
                    <span className={\`font-mono text-xs \${currentTheme.accent}\`}>Live</span>
                  </div>
                </div>
              </div>
              
              {/* Right side - Navigation */}
              <nav className="flex items-center gap-2">
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
                    className={\`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm transition-all duration-200 \${
                      pathname === item.path
                        ? \`\${currentTheme.bgActive} \${currentTheme.accent} border \${currentTheme.borderActive} scale-105\`
                        : \`\${currentTheme.dim} hover:\${currentTheme.light} hover:\${currentTheme.bgHover} hover:scale-105\`
                    }\`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="relative z-10">
        <div className={\`max-w-6xl mx-auto px-4 \${isMobile ? 'py-4 pb-24' : 'py-6'}\`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav currentTheme={currentTheme} />}
    </div>
  );
}`;
  }

  private generateMobileNavComponent(): string {
    return `'use client'
import { useRouter, usePathname } from 'next/navigation';

interface MobileNavProps {
  currentTheme: any;
}

export default function MobileNav({ currentTheme }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: '/models', icon: '🗃️', label: 'Data' },
    { path: '/actions', icon: '⚡', label: 'Actions' },
    { path: '/schedules', icon: '⏰', label: 'Tasks' },
    { path: '/chat', icon: '🤖', label: 'AI Chat' }
  ];

  return (
    <div className={\`fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t \${currentTheme?.border || 'border-gray-700'} p-3 z-40 safe-area-pb\`}>
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={\`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 \${
              pathname === item.path
                ? \`\${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} scale-105\`
                : \`hover:\${currentTheme?.bgHover || 'hover:bg-gray-800'} active:scale-95\`
            }\`}
          >
            <span className={\`text-xl mb-1 \${
              pathname === item.path ? (currentTheme?.accent || 'text-green-400') : (currentTheme?.dim || 'text-gray-400')
            }\`}>{item.icon}</span>
            <span className={\`text-xs font-mono font-medium \${
              pathname === item.path 
                ? (currentTheme?.light || 'text-gray-200')
                : (currentTheme?.dim || 'text-gray-400')
            }\`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}`;
  }

  private generateHomePage(): string {
    const { projectName, models, actions, schedules } = this.options;
    const agentName = escapeJSString(this.options.agentConfig?.name || this.options.projectName);
    const agentTheme = this.options.agentConfig?.theme || 'green';
    const agentAvatar = this.options.agentConfig?.avatar;
    const agentDescription = this.options.agentConfig?.description || 'Smart agent powered by AI';
    return `'use client'
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { themes } from '@/lib/theme';

export default function HomePage() {
  const router = useRouter();

  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;
  const displayName = '${agentName}';
  
  // Extract avatar URL from embedded config
  const avatarUrl = ${agentAvatar?.uploadedImage ? `"${agentAvatar.uploadedImage}"` : 'null'};

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
      desc: 'Manage your business information'
    },
    { 
      path: '/actions', 
      icon: '⚡', 
      title: 'Actions', 
      desc: 'Run automated workflows'
    },
    { 
      path: '/schedules', 
      icon: '⏰', 
      title: 'Schedules', 
      desc: 'Manage automated tasks'
    }
  ];

  return (
    <Layout title="${agentName}">
      <div className="space-y-6">
        {/* Hero Section with Avatar */}
        <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-8 text-center\`}>
          <div className="flex justify-center mb-6">
            <div className={\`w-24 h-24 rounded-2xl bg-gradient-to-br \${currentTheme.gradient} border-2 \${currentTheme.borderActive} flex items-center justify-center overflow-hidden\`}>
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
              <span className={\`text-3xl \${currentTheme.accent} \${avatarUrl ? 'hidden' : ''}\`}>🤖</span>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className={\`font-mono font-bold text-2xl \${currentTheme.light}\`}>{displayName}</h2>
            <p className={\`font-mono text-base \${currentTheme.dim} max-w-md mx-auto leading-relaxed\`}>
              ${agentDescription}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={\`w-3 h-3 bg-\${currentTheme.primary}-400 rounded-full animate-pulse\`}></div>
              <span className={\`font-mono text-sm \${currentTheme.accent}\`}>Live & Ready</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-6\`}>
          <h3 className={\`font-mono font-bold text-xl \${currentTheme.light} mb-4\`}>Quick Actions</h3>
          <div className="grid gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.path)}
                className={\`w-full flex items-center gap-4 p-4 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl hover:\${currentTheme.bgHover} transition-all duration-200 hover:scale-[1.02]\`}
              >
                <div className={\`w-12 h-12 \${currentTheme.bg} border \${currentTheme.border} rounded-xl flex items-center justify-center\`}>
                  <span className="text-xl">{action.icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className={\`font-mono text-base font-bold \${currentTheme.light}\`}>{action.title}</div>
                  <div className={\`font-mono text-sm \${currentTheme.dim}\`}>{action.desc}</div>
                </div>
                <span className={\`text-lg \${currentTheme.accent}\`}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-6\`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={\`w-12 h-12 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl flex items-center justify-center\`}>
                <div className={\`w-4 h-4 bg-\${currentTheme.primary}-400 rounded-full animate-pulse\`}></div>
              </div>
              <div>
                <div className={\`font-mono font-bold text-lg \${currentTheme.light}\`}>System Status</div>
                <div className={\`font-mono text-sm \${currentTheme.dim}\`}>All systems operational</div>
              </div>
            </div>
            <div className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl\`}>
              <span className={\`font-mono text-sm font-bold \${currentTheme.accent}\`}>LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}`;
  }

  // Add other component generators here...

  // More component generators would go here...
  // For brevity, I'll implement the key ones and indicate where others would go

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

  // Complete page implementations
  private generateModelsListPage(): string {
    const agentTheme = this.options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { themes } from '@/lib/theme';

export default function ModelsPage() {
  const router = useRouter();
  const [modelsData, setModelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use embedded local configuration with fallback safety
  const selectedTheme = '${agentTheme}' || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchModelData();
  }, []);

  const fetchModelData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint (returns embedded models)
      const response = await fetch('/api/agent/models');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch models: \${response.status} \${response.statusText}\`);
      }
      
      const data = await response.json();
      
      if (data.success && data.models && Array.isArray(data.models)) {
        // Use embedded models from sub-agent API
        const currentModels = data.models.map((model: any) => ({
          name: model.name || 'Unknown',
          title: model.title || model.name || 'Unknown',
          emoji: model.emoji || '📋',
          description: model.description || 'Data model',
          fields: Array.isArray(model.fields) ? model.fields : []
        }));
        
        setModels(currentModels);
        
        // Fetch data for each model with better error handling
        const promises = currentModels.map(async (model) => {
          try {
            const records = await api.getModelRecords(model.name);
            const recordArray = Array.isArray(records) ? records : [];
            return { 
              ...model, 
              recordCount: recordArray.length, 
              records: recordArray.slice(0, 3),
              error: false 
            };
          } catch (error) {
            console.warn(\`Failed to fetch records for model \${model.name}:\`, error);
            return { 
              ...model, 
              recordCount: 0, 
              records: [], 
              error: true 
            };
          }
        });
        
        const results = await Promise.all(promises);
        setModelsData(results);
      } else {
        console.warn('Invalid models response:', data);
        throw new Error('No valid models data received');
      }
    } catch (error) {
      console.error('Failed to fetch embedded model data:', error);
      setError(\`Failed to load models: \${error instanceof Error ? error.message : 'Unknown error'}\`);
      setModels([]);
      setModelsData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Data Models">
      <div className="space-y-6">
        <div className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-6\`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={\`text-3xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>Data Models</h1>
              <p className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'}\`}>
                Manage and view your data structures
              </p>
            </div>
            <span className={\`text-lg font-mono px-4 py-2 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl \${currentTheme?.accent || 'text-green-400'}\`}>
              {models.length} model{models.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
            <p className="font-mono text-sm text-red-300">
              ⚠️ {error}
            </p>
            <button
              onClick={fetchModelData}
              className="mt-3 px-4 py-2 bg-red-500/25 border border-red-400/50 rounded-lg text-red-200 font-mono text-xs hover:bg-red-500/35 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-5 animate-pulse\`}>
                <div className="flex items-start gap-4">
                  <div className={\`w-12 h-12 \${currentTheme?.bgActive || 'bg-gray-700'} rounded-xl\`}></div>
                  <div className="flex-1">
                    <div className={\`h-5 \${currentTheme?.bgActive || 'bg-gray-700'} rounded w-1/2 mb-2\`}></div>
                    <div className={\`h-4 \${currentTheme?.bgActive || 'bg-gray-700'} rounded w-3/4 mb-2\`}></div>
                    <div className={\`h-3 \${currentTheme?.bgActive || 'bg-gray-700'} rounded w-1/3\`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : modelsData.length > 0 ? (
          <div className="space-y-4">
            {modelsData.map((model, i) => (
              <div 
                key={i} 
                className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-5 cursor-pointer hover:\${currentTheme?.bgHover || 'hover:bg-gray-700'} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]\`}
                onClick={() => router.push(\`/models/\${model.name}\`)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={\`w-12 h-12 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl flex items-center justify-center flex-shrink-0\`}>
                    <span className="text-2xl">{model.emoji || '🗃️'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={\`font-mono text-lg font-bold \${currentTheme?.light || 'text-gray-200'} mb-1\`}>
                      {model.title || model.name}
                    </div>
                    <div className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} mb-2\`}>
                      {model.description || 'Data model for managing records'}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className={\`font-mono text-xs \${currentTheme?.dim || 'text-gray-400'}\`}>Fields:</span>
                        <span className={\`font-mono text-xs font-bold \${currentTheme?.accent || 'text-green-400'}\`}>
                          {model.fields?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={\`font-mono text-xs \${currentTheme?.dim || 'text-gray-400'}\`}>Records:</span>
                        <span className={\`font-mono text-xs font-bold \${currentTheme?.accent || 'text-green-400'}\`}>
                          {model.recordCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                  <span className={\`font-mono text-xs px-3 py-1.5 rounded-full \${
                    model.error 
                      ? 'bg-red-500/20 border border-red-400/30 text-red-300' 
                      : \`\${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} \${currentTheme?.accent || 'text-green-400'}\`
                  }\`}>
                    {model.error ? '⚠️ Error' : '✅ Ready'}
                  </span>
                  <span className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} flex items-center gap-1\`}>
                    <span>Tap to explore</span>
                    <span className={\`\${currentTheme?.accent || 'text-green-400'}\`}>→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={\`w-20 h-20 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-2xl flex items-center justify-center mx-auto mb-4\`}>
              <span className={\`text-3xl \${currentTheme?.dim || 'text-gray-400'}\`}>🗃️</span>
            </div>
            <div className={\`font-mono text-lg font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>No Models Yet</div>
            <div className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} max-w-xs mx-auto\`}>
              Your data models will appear here once you create them
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateModelDetailPage(): string {
    const agentTheme = this.options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';

export default function ModelDetailPage({ params }: { params: { modelName: string } }) {
  const router = useRouter();
  const { modelName } = params;
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelDef, setModelDef] = useState<any>(null);

  // Get model definition from embedded config
  const embeddedModels = ${JSON.stringify(this.options.models)};

  useEffect(() => {
    if (modelName && typeof modelName === 'string') {
      const foundModel = embeddedModels.find(m => m.name === modelName);
      setModelDef(foundModel);
      fetchRecords();
    }
  }, [modelName]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!modelName || typeof modelName !== 'string') {
        throw new Error('Invalid model name');
      }
      
      const data = await api.getModelRecords(modelName);
      const recordArray = Array.isArray(data) ? data : [];
      setRecords(recordArray);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for dynamic field handling
  const getRecordId = (record: any) => {
    if (!modelDef || !modelDef.fields) return record.id || 'Unknown';
    
    // Find ID field from model definition
    const idField = modelDef.fields.find((field: any) => 
      field.name === 'id' || field.name.toLowerCase().includes('id')
    );
    
    if (idField && record[idField.name]) {
      return record[idField.name];
    }
    
    return record.id || 'Unknown';
  };

  const getRecordDate = (record: any) => {
    if (!modelDef || !modelDef.fields) return null;
    
    // Find date/timestamp fields from model definition
    const dateFields = modelDef.fields.filter((field: any) => 
      field.type === 'DateTime' || 
      field.name.toLowerCase().includes('date') ||
      field.name.toLowerCase().includes('time') ||
      field.name === 'createdAt' ||
      field.name === 'updatedAt'
    );
    
    for (const field of dateFields) {
      if (record[field.name]) {
        return new Date(record[field.name]).toLocaleDateString();
      }
    }
    
    return 'No date';
  };

  const getDisplayFields = (record: any) => {
    if (!modelDef || !modelDef.fields) {
      // Fallback: show all fields except common system fields
      return Object.entries(record).filter(([key]) => 
        !key.toLowerCase().includes('id') && 
        !['createdAt', 'updatedAt'].includes(key)
      );
    }
    
    // Use model definition to determine display fields
    const displayFields = modelDef.fields.filter((field: any) => 
      !field.name.toLowerCase().includes('id') &&
      !['createdAt', 'updatedAt'].includes(field.name)
    );
    
    return displayFields
      .map((field: any) => [field.name, record[field.name]])
      .filter(([, value]) => value !== undefined && value !== null);
  };

  // Use embedded local configuration with fallback safety
  const selectedTheme = '${agentTheme}' || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

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
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className={\`p-3 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl \${currentTheme?.accent || 'text-green-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-700'} transition-colors\`}
          >
            ←
          </button>
          <div>
            <h1 className={\`text-2xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'} capitalize\`}>
              {modelName} Records
            </h1>
            {!loading && !error && (
              <p className={\`text-sm font-mono \${currentTheme?.dim || 'text-gray-400'}\`}>
                {records.length} record{records.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={\`w-8 h-8 border-2 border-\${currentTheme?.primary || 'green'}-400 border-t-transparent rounded-full animate-spin\`}></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-5 text-center">
            <div className="text-red-400 font-mono text-base mb-3">⚠️ {error}</div>
            <button
              onClick={fetchRecords}
              className="px-6 py-3 bg-red-500/25 border border-red-400/50 rounded-xl text-red-200 font-mono text-sm hover:bg-red-500/35 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record, i) => (
              <div
                key={getRecordId(record) || i}
                className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-5\`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={\`font-mono text-lg font-semibold \${currentTheme?.light || 'text-gray-200'}\`}>
                    Record #{getRecordId(record)}
                  </span>
                  <span className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'}\`}>
                    {getRecordDate(record)}
                  </span>
                </div>
                <div className="space-y-3">
                  {getDisplayFields(record).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-3">
                      <span className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} capitalize\`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className={\`font-mono text-sm \${currentTheme?.light || 'text-gray-200'} text-right flex-1 max-w-48 truncate\`}>
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
            <div className={\`w-20 h-20 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-2xl flex items-center justify-center mx-auto mb-4\`}>
              <span className={\`text-3xl \${currentTheme?.dim || 'text-gray-400'}\`}>📋</span>
            </div>
            <h3 className={\`font-mono text-lg font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>No Records</h3>
            <p className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} max-w-xs mx-auto\`}>
              This model doesn't have any records yet. Records will appear here once you add them.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateActionsPage(): string {
    const agentTheme = this.options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import ActionCard from '@/components/ActionCard';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint (returns embedded actions)
      const response = await fetch('/api/agent/actions');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch actions: \${response.status}\`);
      }
      
      const data = await response.json();
      
      if (data.success && data.actions) {
        const formattedActions = data.actions.map((action: any) => ({
          id: action.name, // Use name as ID for consistency
          name: action.name,
          title: action.title || action.name,
          emoji: action.emoji || '⚡',
          description: action.description || 'Execute action',
          type: action.type || 'query',
          role: action.role || 'member',
          uiComponentsDesign: action.uiComponentsDesign || [],
          pseudoSteps: action.pseudoSteps || []
        }));
        setActions(formattedActions);
      } else {
        throw new Error('No actions data received');
      }
    } catch (err) {
      console.error('Failed to fetch embedded actions:', err);
      setError('Failed to load actions. Please refresh the page.');
      setActions([]);
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
      <div className="space-y-6">
        <div className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-6\`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={\`text-3xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>Smart Actions</h1>
              <p className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'}\`}>
                Execute automated workflows and tasks
              </p>
            </div>
            <span className={\`text-lg font-mono px-4 py-2 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl \${currentTheme?.accent || 'text-green-400'}\`}>
              {actions.length} action{actions.length !== 1 ? 's' : ''}
            </span>
          </div>
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
            💡 <strong>Embedded Actions:</strong> Click any action card to open the execution modal. 
            All action code is embedded and executes locally on this sub-agent for optimal performance.
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
            <div className={\`w-20 h-20 \${currentTheme.bg} border \${currentTheme.border} rounded-2xl flex items-center justify-center mx-auto mb-4\`}>
              <span className={\`text-3xl \${currentTheme.dim}\`}>⚡</span>
            </div>
            <div className={\`font-mono text-lg font-bold \${currentTheme.light} mb-2\`}>No Actions Yet</div>
            <div className={\`font-mono text-sm \${currentTheme.dim} max-w-xs mx-auto\`}>
              Smart actions and workflows will appear here
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateSchedulesPage(): string {
    const agentTheme = this.options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import ScheduleCard from '@/components/ScheduleCard';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint (returns embedded schedules)
      const response = await fetch('/api/agent/schedules');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch schedules: \${response.status}\`);
      }
      
      const data = await response.json();
      
      if (data.success && data.schedules) {
        const formattedSchedules = data.schedules.map((schedule: any) => ({
          id: schedule.name, // Use name as ID for consistency
          name: schedule.name,
          emoji: schedule.emoji || '⏰',
          description: schedule.description || 'Scheduled task',
          pattern: schedule.trigger?.pattern || '0 0 * * *',
          active: schedule.trigger?.active !== false,
          nextRun: schedule.trigger?.pattern ? 'Calculated from pattern' : 'Unknown',
          steps: schedule.steps || []
        }));
        setSchedules(formattedSchedules);
      } else {
        throw new Error('No schedules data received');
      }
    } catch (err) {
      console.error('Failed to fetch embedded schedules:', err);
      setError('Failed to load schedules. Please refresh the page.');
      setSchedules([]);
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
      <div className="space-y-6">
        <div className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-6\`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={\`text-3xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>Scheduled Tasks</h1>
              <p className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'}\`}>
                Monitor and manage automated workflows
              </p>
            </div>
            <span className={\`text-lg font-mono px-4 py-2 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl \${currentTheme?.accent || 'text-green-400'}\`}>
              {schedules.filter(s => s.active).length}/{schedules.length} active
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
            <p className="font-mono text-sm text-red-300">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-5 text-center\`}>
            <div className={\`font-mono font-bold text-2xl \${currentTheme.accent} mb-1\`}>
              {schedules.length}
            </div>
            <div className={\`font-mono text-sm \${currentTheme.dim}\`}>Total Tasks</div>
          </div>
          <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-5 text-center\`}>
            <div className={\`font-mono font-bold text-2xl \${currentTheme.accent} mb-1\`}>
              {schedules.filter(s => s.active).length}
            </div>
            <div className={\`font-mono text-sm \${currentTheme.dim}\`}>Active Tasks</div>
          </div>
        </div>

        {schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]\`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={\`w-12 h-12 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl flex items-center justify-center flex-shrink-0\`}>
                    <span className="text-2xl">{schedule.emoji || '⏰'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={\`font-mono text-lg font-bold \${currentTheme.light} mb-1\`}>
                      {schedule.title || schedule.name}
                    </div>
                    <div className={\`font-mono text-sm \${currentTheme.dim} mb-3\`}>
                      {schedule.description || 'Automated task execution'}
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={\`w-3 h-3 rounded-full \${
                          schedule.trigger?.active ? \`bg-\${currentTheme.primary}-400 animate-pulse\` : \`bg-gray-500\`
                        }\`}></div>
                        <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
                          {schedule.trigger?.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className={\`px-2 py-1 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-md\`}>
                        <span className={\`font-mono text-xs \${currentTheme.accent}\`}>
                          {schedule.trigger?.pattern || 'Manual'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                  <span className={\`font-mono text-xs px-3 py-1.5 rounded-full \${
                    schedule.trigger?.active 
                      ? \`\${currentTheme.bgActive} border \${currentTheme.borderActive} \${currentTheme.accent}\`
                      : 'bg-gray-500/20 border border-gray-400/30 text-gray-400'
                  }\`}>
                    {schedule.steps?.length || 0} steps
                  </span>
                  <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
                    Next run: {schedule.trigger?.active ? 'Scheduled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={\`w-20 h-20 \${currentTheme.bg} border \${currentTheme.border} rounded-2xl flex items-center justify-center mx-auto mb-4\`}>
              <span className={\`text-3xl \${currentTheme.dim}\`}>⏰</span>
            </div>
            <div className={\`font-mono text-lg font-bold \${currentTheme.light} mb-2\`}>No Schedules Yet</div>
            <div className={\`font-mono text-sm \${currentTheme.dim} max-w-xs mx-auto\`}>
              Automated tasks and workflows will appear here
            </div>
          </div>
        )}

        {/* Today's Progress */}
        {schedules.length > 0 && (
          <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-3 mt-4\`}>
            <h4 className={\`font-mono text-sm font-semibold mb-2 \${currentTheme.light}\`}>Today's Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className={currentTheme.dim}>Schedules Active</span>
                <span className={\`font-bold \${currentTheme.accent}\`}>
                  {schedules.filter(s => s.trigger?.active).length}/{schedules.length}
                </span>
              </div>
              <div className={\`w-full bg-\${currentTheme.primary}-900/30 rounded-full h-2\`}>
                <div 
                  className={\`bg-\${currentTheme.primary}-400 h-2 rounded-full\`}
                  style={{ 
                    width: \`\${schedules.length > 0 ? (schedules.filter(s => s.trigger?.active).length / schedules.length) * 100 : 0}%\` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateChatPage(): string {
    const agentName = escapeJSString(this.options.agentConfig?.name || this.options.projectName);
    const agentDescription = escapeJSString(this.options.agentConfig?.description || 'Smart agent powered by AI');
    const agentTheme = this.options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import ChatMessage from '@/components/ChatMessage';
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { themes } from '@/lib/theme';

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  
  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const agentConfig = {
    name: '${agentName}',
    description: '${agentDescription}',
    models: ${JSON.stringify(this.options.models)},
    actions: ${JSON.stringify(this.options.actions)},
    schedules: ${JSON.stringify(this.options.schedules)}
  };
  
  // Create initial welcome message
  const initialWelcomeMessage = {
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

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [initialWelcomeMessage],
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

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
      <div className={\`flex flex-col \${isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-5rem)]'}\`}>



        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 mb-4">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={{
                id: message.id,
                type: message.role === 'user' ? 'user' : 'bot',
                content: message.content,
                timestamp: message.createdAt || new Date()
              }}
              theme={selectedTheme}
            />
          ))}
          
          {isLoading && (
            <div className={\`flex justify-start\`}>
              <div className={\`max-w-xs p-4 rounded-xl \${currentTheme.bg} border \${currentTheme.border}\`}>
                <div className="flex items-center gap-2">
                  <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`}></div>
                  <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`} style={{animationDelay: '0.1s'}}></div>
                  <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`} style={{animationDelay: '0.2s'}}></div>
                  <span className={\`text-xs font-mono \${currentTheme.dim} ml-2\`}>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4">
              <div className="text-red-400 font-mono text-sm">
                ⚠️ Chat Error: {error.message}
              </div>
              <div className="text-red-300/70 font-mono text-xs mt-2">
                Please check your AI API keys in environment variables and try again.
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>



        {/* Chat Input */}
        <div className={\`p-4 \${currentTheme.bg} border \${currentTheme.border} rounded-xl\`}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask AI anything..."
                className={\`w-full \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl px-4 py-3 \${currentTheme.light} font-mono text-sm focus:outline-none focus:\${currentTheme.borderActive} placeholder:\${currentTheme.dim} resize-none\`}
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={\`w-12 h-12 \${currentTheme.bgActive} hover:\${currentTheme.bgHover} border \${currentTheme.borderActive} rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed\`}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <div className={\`w-4 h-4 border-2 border-\${currentTheme.primary}-400 border-t-transparent rounded-full animate-spin\`}></div>
              ) : (
                <span className={\`text-lg \${currentTheme.accent}\`}>→</span>
              )}
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            <button 
              onClick={() => router.push('/models')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              🗃️ View Data
            </button>
            <button 
              onClick={() => router.push('/actions')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              ⚡ Run Action
            </button>
            <button 
              onClick={() => router.push('/schedules')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              ⏰ View Tasks
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}`;
  }
  private generateModelCardComponent(): string {
    const agentTheme = this.options.agentConfig?.theme || 'green';
    
    return `'use client'
import { themes } from '@/lib/theme';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  
  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  const handleClick = () => {
    router.push(\`/models/\${model.name}\`);
  };

  return (
    <div 
      className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4 cursor-pointer \${currentTheme.bgHover} transition-colors\`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{model.emoji || '📋'}</span>
        <div className="flex-1">
          <h3 className={\`font-mono font-semibold text-sm \${currentTheme.light} capitalize\`}>
            {model.title || model.name}
          </h3>
          <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
            {model.description || \`Manage \${model.title || model.name} records\`}
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
      
      {/* Click indicator */}
      <div className={\`mt-3 pt-3 border-t \${currentTheme.border}\`}>
        <p className={\`font-mono text-xs \${currentTheme.dim} text-center\`}>
          Click to view records →
        </p>
      </div>
    </div>
  );
}`;
  }

  private generateActionCardComponent(): string {
    const agentTheme = this.options.agentConfig?.theme || 'green';
    
    return `'use client'
import { useState } from 'react';
import ActionExecutionModal from './ActionExecutionModal';
import { themes } from '@/lib/theme';

interface ActionCardProps {
  action: {
    id: string;
    name: string;
    title?: string;
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

  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  const handleActionComplete = (result: any) => {
    setLastResult(result);
    setLastExecutionTime(new Date().toLocaleString());
    setShowModal(false);
  };

  return (
    <>
      <div 
        className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-5 cursor-pointer hover:\${currentTheme.bgHover} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]\`}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className={\`w-12 h-12 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl flex items-center justify-center flex-shrink-0\`}>
            <span className="text-2xl">{action.emoji || '⚡'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={\`font-mono text-lg font-bold \${currentTheme.light} mb-1\`}>
              {action.title || action.name}
            </h3>
            <p className={\`font-mono text-sm \${currentTheme.dim} mb-2\`}>
              {action.description || \`Execute \${action.title || action.name}\`}
            </p>
            <div className="flex items-center gap-4">
              <span className={\`font-mono text-xs px-3 py-1.5 rounded-full \${currentTheme.bgActive} border \${currentTheme.borderActive} \${currentTheme.accent}\`}>
                ✅ Ready
              </span>
              {lastExecutionTime && (
                <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
                  Last: {lastExecutionTime.split(' ')[1]?.substring(0, 5)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick status indicator */}
        {lastResult && (
          <div className={\`flex items-center gap-2 text-xs font-mono mb-3 p-2 rounded-lg \${
            lastResult.success ? \`\${currentTheme.bgActive} border \${currentTheme.borderActive}\` : 'bg-red-500/20 border border-red-400/30'
          }\`}>
            <div className={\`w-2 h-2 rounded-full \${
              lastResult.success ? currentTheme.accent.replace('text-', 'bg-') : 'bg-red-400'
            }\`} />
            <span className={\`\${lastResult.success ? currentTheme.accent : 'text-red-300'}\`}>
              {lastResult.success ? 'Last execution successful' : 'Last execution failed'}
            </span>
          </div>
        )}

        {/* Click indicator */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
            Type: {action.type || 'Action'}
          </span>
          <span className={\`font-mono text-sm \${currentTheme.dim} flex items-center gap-1\`}>
            <span>Tap to execute</span>
            <span className={\`\${currentTheme.accent}\`}>⚡</span>
          </span>
        </div>
      </div>

      {showModal && (
        <ActionExecutionModal
          action={action}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onComplete={handleActionComplete}
          theme={selectedTheme}
        />
      )}
    </>
  );
}`;
  }

  private generateScheduleCardComponent(): string {
    const agentTheme = this.options.agentConfig?.theme || 'green';
    
    return `'use client'
import { themes } from '@/lib/theme';

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
  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  return (
    <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4\`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{schedule.emoji || '⏰'}</span>
        <div className="flex-1">
          <h3 className={\`font-mono font-semibold text-sm \${currentTheme.light}\`}>
            {schedule.title || schedule.name}
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
      {schedule.steps && schedule.steps.length > 0 && (
        <div className={\`font-mono text-xs \${currentTheme.dim} mt-1\`}>
          Steps: <span className={\`\${currentTheme.light}\`}>{schedule.steps.length} actions</span>
        </div>
      )}
      {schedule.nextRun && (
        <div className={\`font-mono text-xs \${currentTheme.dim} mt-1\`}>
          Next: <span className={\`\${currentTheme.light}\`}>{schedule.nextRun}</span>
        </div>
      )}
    </div>
  );
}`;
  }


  private generateChatMessageComponent(): string {
    return `'use client'
import { memo } from 'react';
import { themes } from '@/lib/theme';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  theme?: keyof typeof themes;
}

const ChatMessage = memo(({ message, isTyping = false, theme = 'green' }: ChatMessageProps) => {
  const isUser = message.type === 'user';
  const currentTheme = themes[theme] || themes.green;
  
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
      .replace(/\`(.*?)\`/g, \`<code class="\${currentTheme.bg} px-1 rounded \${currentTheme.light}">$1</code>\`) // Inline code
      .replace(/\\n/g, '<br>'); // Line breaks
  };

  if (isTyping) {
    return (
      <div className="flex justify-start">
        <div className={\`max-w-xs p-3 rounded-lg \${currentTheme.bg} border \${currentTheme.border}\`}>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`}></div>
              <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`} style={{animationDelay: '0.1s'}}></div>
              <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`} style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className={\`text-xs font-mono \${currentTheme.dim} ml-2\`}>AI is typing...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={\`flex \${isUser ? 'justify-end' : 'justify-start'} mb-3\`}>
      <div className={\`flex \${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[85%]\`}>
        {!isUser && (
          <div className="flex-shrink-0">
            <div className={\`w-6 h-6 \${currentTheme.bg} border \${currentTheme.border} rounded-lg flex items-center justify-center\`}>
              <span className="text-xs">🤖</span>
            </div>
          </div>
        )}
        <div className={\`px-4 py-3 rounded-2xl font-mono text-sm leading-relaxed shadow-sm \${
          isUser 
            ? \`\${currentTheme.bgActive} border \${currentTheme.borderActive} \${currentTheme.light} rounded-br-md\` 
            : \`\${currentTheme.bg} border \${currentTheme.border} \${currentTheme.light} rounded-bl-md\`
        }\`}>
          <div className="mb-1">
            <div 
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          </div>
          <div className={\`text-xs \${currentTheme.dim} text-right mt-1\`}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;`;
  }
  private generateLoadingSpinnerComponent(): string {
    return `'use client'
import { themes } from '@/lib/theme';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: keyof typeof themes;
}

export default function LoadingSpinner({ size = 'md', theme = 'green' }: LoadingSpinnerProps) {
  const currentTheme = themes[theme] || themes.green;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={\`\${sizeClasses[size]} border-2 border-\${currentTheme.primary}-400 border-t-transparent rounded-full animate-spin\`}
      ></div>
    </div>
  );
}`;
  }

  private generateClientProviders(): string {
    return `'use client'
import { AgentProvider } from '@/contexts/AgentContext'

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AgentProvider>
      {children}
    </AgentProvider>
  );
}`;
  }

  private generateActionExecutionModal(): string {
    return `'use client'
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { themes } from '@/lib/theme';

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
  theme?: keyof typeof themes;
}

export default function ActionExecutionModal({ action, isOpen, onClose, onComplete, theme = 'green' }: ActionExecutionModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [inputParameters, setInputParameters] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'executing' | 'result'>('input');
  
  const currentTheme = themes[theme] || themes.green;

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

  const validateRequiredFields = () => {
    const errors: string[] = [];
    
    uiComponents.forEach(component => {
      if (component.required) {
        const value = inputParameters[component.name];
        if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
          errors.push(\`\${component.label || component.name} is required\`);
        }
      }
    });
    
    return errors;
  };

  const executeAction = async () => {
    // Validate required fields before execution
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      const errorResult = {
        success: false,
        error: 'Please fill in all required fields: ' + validationErrors.join(', '),
        validationErrors
      };
      setResult(errorResult);
      setStep('result');
      onComplete(errorResult);
      return;
    }

    setIsExecuting(true);
    setStep('executing');
    setResult(null);

    try {
      // Execute action locally using embedded action endpoint
      const actionResult = await api.executeAction(action.name, inputParameters);

      setResult(actionResult);
      setStep('result');
      
      // Notify parent component
      onComplete(actionResult);
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executedLocally: true
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

    // Determine if field has validation errors
    const hasError = component.required && (!value || value === '');
    const borderClass = hasError ? 'border-red-400/50' : currentTheme.border;
    const focusBorderClass = hasError ? 'focus:border-red-400/70' : \`focus:\${currentTheme.borderActive}\`;

    switch (component.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            className={\`w-full p-3 \${currentTheme.bg} border \${borderClass} rounded-lg \${currentTheme.light} font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          >
            <option value="" className="bg-gray-800">
              {component.placeholder || \`Select \${component.label}\`}
            </option>
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
              className={\`w-4 h-4 rounded \${currentTheme.border} \${currentTheme.bg} \${currentTheme.accent} focus:ring-\${currentTheme.primary}-400/50\`}
            />
            <span className={\`font-mono text-sm \${currentTheme.light}\`}>
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
            className={\`w-full p-3 \${currentTheme.bg} border \${borderClass} rounded-lg \${currentTheme.light} font-mono text-sm focus:outline-none \${focusBorderClass} resize-none\`}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const numValue = e.target.value;
              // Keep as string to preserve user input, but validate it's a valid number
              handleInputChange(component.name, numValue);
            }}
            placeholder={component.placeholder}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'datetime':
      case 'datetime-local':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
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
        mode: 'Local Execution'
      };
    } else {
      return {
        status: 'Error',
        message: result.error || 'Action failed',
        details: result.details || 'No additional details',
        mode: 'Local Execution'
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={\`bg-gray-900 border \${currentTheme.border} rounded-xl w-full max-w-lg max-h-[80vh] mb-16 overflow-hidden flex flex-col shadow-2xl\`}>
        {/* Header */}
        <div className={\`p-4 border-b \${currentTheme.border}\`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{action.emoji || '⚡'}</span>
              <div>
                <h2 className={\`font-mono font-bold \${currentTheme.light}\`}>{action.title || action.name}</h2>
                <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
                  {action.description || \`Execute \${action.title || action.name}\`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExecuting}
              className={\`w-10 h-10 \${currentTheme.bg} border \${currentTheme.border} rounded-xl flex items-center justify-center hover:\${currentTheme.bgHover} transition-colors disabled:opacity-50\`}
            >
              <span className={\`\${currentTheme.accent} font-mono text-xl\`}>×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'input' && (
            <div className="space-y-4">
              {/* Execution Info */}
              <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-3\`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={\`\${currentTheme.accent}\`}>🏠</span>
                  <span className={\`font-mono text-sm \${currentTheme.light}\`}>Local Execution</span>
                </div>
                <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
                  This action will run locally on this sub-agent with embedded code and your database.
                </p>
              </div>

              {/* Input Parameters */}
              <div>
                <label className="block font-mono text-sm text-green-300 mb-3">
                  Input Parameters
                </label>
                <div className="space-y-3">
                  {uiComponents.map((component, idx) => {
                    const hasError = component.required && (!inputParameters[component.name] || inputParameters[component.name] === '');
                    return (
                      <div key={idx}>
                        <label className="block font-mono text-xs text-green-300/70 mb-1">
                          {component.label || component.name}
                          {component.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {renderInputComponent(component)}
                        {hasError && (
                          <p className="mt-1 text-xs font-mono text-red-400">
                            This field is required
                          </p>
                        )}
                        {component.description && (
                          <p className="mt-1 text-xs font-mono text-green-300/50">
                            {component.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 'executing' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" theme={theme} />
              <p className={\`font-mono text-sm \${currentTheme.light} mt-4\`}>
                Executing {action.title || action.name}...
              </p>
              <p className={\`font-mono text-xs \${currentTheme.dim} mt-1\`}>
                Running locally with embedded code
              </p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={\`text-4xl mb-2 \${result.success ? '🟢' : '🔴'}\`}>
                  {result.success ? '✅' : '❌'}
                </div>
                <h3 className={\`font-mono text-lg \${currentTheme.light} mb-1\`}>
                  {result.success ? 'Success!' : 'Failed'}
                </h3>
              </div>

              <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-4\`}>
                <div className="space-y-3 font-mono text-sm">
                  {Object.entries(formatResult(result)).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-3">
                      <span className={\`\${currentTheme.dim} capitalize\`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className={\`\${currentTheme.light} text-right flex-1\`}>
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
        <div className={\`p-4 border-t \${currentTheme.border}\`}>
          {step === 'input' && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={\`flex-1 p-3 border \${currentTheme.border} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} transition-colors\`}
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={isExecuting || validateRequiredFields().length > 0}
                className={\`flex-1 p-3 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} disabled:opacity-50 transition-colors\`}
              >
                {validateRequiredFields().length > 0 ? 'Fill Required Fields' : 'Execute Action'}
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
                className={\`flex-1 p-3 border \${currentTheme.border} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} transition-colors\`}
              >
                Run Again
              </button>
              <button
                onClick={onClose}
                className={\`flex-1 p-3 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} transition-colors\`}
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

  private generateSelfContainedChatEndpoint(): string {
    const modelsContext = this.options.models.map(m => `${m.name} (${m.description || 'data model'})`).join(', ');
    const actionsContext = this.options.actions.map(a => `${a.name} (${a.description || 'action'})`).join(', ');
    const schedulesContext = this.options.schedules.map(s => `${s.name} (${s.description || 'scheduled task'})`).join(', ');
    
    return `import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';

// Self-contained AI model configuration with local API keys
async function getAIModelWithApiKeys() {
  try {
    // Use local environment variables for API keys
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const grokKey = process.env.GROK_API_KEY;

    // Determine which provider to use based on available keys
    const provider = process.env.AI_MODEL_PROVIDER || 'openai';
    const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
    
    switch (provider) {
      case 'anthropic':
        if (!anthropicKey) {
          throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }
        return anthropic(modelName, { apiKey: anthropicKey });
      case 'grok':
        if (!grokKey) {
          throw new Error('GROK_API_KEY environment variable is required');
        }
        return openai(modelName, { 
          apiKey: grokKey,
          baseURL: 'https://api.x.ai/v1'
        });
      case 'openai':
      default:
        if (!openaiKey) {
          throw new Error('OPENAI_API_KEY environment variable is required');
        }
        return openai(modelName, { apiKey: openaiKey });
    }
  } catch (error) {
    console.error('Failed to get AI model configuration:', error);
    throw new Error('Failed to configure AI model. Please check your API keys.');
  }
}

// Build system prompt with embedded agent data
async function buildSystemPrompt() {
  const baseName = "${escapeJSString(this.options.agentConfig?.name || this.options.projectName)}";
  const personality = "helpful and professional";
  const description = "${escapeJSString(this.options.agentConfig?.description || 'A self-contained AI agent application')}";
  
  return \`You are an AI assistant for "\${baseName}", a self-contained agent application.

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

// App Router API Route Handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Get AI model with local API keys
    const model = await getAIModelWithApiKeys();
    
    // Build system prompt
    const systemPrompt = await buildSystemPrompt();

    // Convert messages and add system message
    const coreMessages = convertToCoreMessages([
      { role: 'system', content: systemPrompt },
      ...messages
    ]);

    // Stream the response
    const result = await streamText({
      model,
      messages: coreMessages,
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateStaticActionEndpoint(action: any): string {
    // Extract action code from the standardized location: action.execute.code.script
    const actionCode = action.execute?.code?.script;

    // Check if we have generated code
    const hasGeneratedCode = !!actionCode;
    
    let wrappedActionCode;
    if (hasGeneratedCode && (actionCode.includes('async function') || actionCode.includes('function'))) {
      // If the code is already a function, execute it directly
      wrappedActionCode = `
    // Get AI model for the action
    const aiModel = await getAIModel();
    
    // Generated action code
    const actionFunction = ${actionCode};
    
    // Execute the action function directly with access to all libraries
    const result = await actionFunction();
    `;
    } else if (hasGeneratedCode) {
      // If it's raw code, wrap it in a function context
      wrappedActionCode = `
    // Get AI model for the action
    const aiModel = await getAIModel();
    
    // Execute the generated action code directly
    ${actionCode}
    `;
    } else {
      // No generated code - return error
      wrappedActionCode = `
    throw new Error('No generated code available for action: ${action.name}');
    `;
    }

    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const prisma = new PrismaClient();

// Get AI model configuration
async function getAIModel() {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
  
  switch (provider) {
    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      return anthropic(modelName, { apiKey: process.env.ANTHROPIC_API_KEY });
    case 'openai':
    default:
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      return openai(modelName, { apiKey: process.env.OPENAI_API_KEY });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { parameters } = await request.json();
    
    // Action: ${action.name}
    // Description: ${escapeJSString(action.description || 'No description provided')}
    // Type: ${action.results?.actionType || 'generated'}
    // Has Generated Code: ${!!hasGeneratedCode}
    
    ${wrappedActionCode}
    
    return NextResponse.json({ 
      success: true, 
      action: '${action.name}',
      result: result,
      executedAt: new Date().toISOString(),
      hasGeneratedCode: ${!!hasGeneratedCode}
    });
  } catch (error) {
    console.error('Action execution error:', error);
    return NextResponse.json({ 
      error: 'Action execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      action: '${action.name}'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

    private generateStaticCronEndpoint(schedule: any): string {
    // Schedules work by executing a sequence of actions, not standalone code
    const hasSteps = schedule.steps && schedule.steps.length > 0;
    
    // Create action ID to name mapping for schedules that might reference actions by ID
    const actionIdToNameMap = this.options.actions.reduce((map: any, action: any) => {
      if (action.id && action.id !== action.name) {
        map[action.id] = action.name;
      }
      return map;
    }, {});
    
    let scheduleExecutionCode;
    if (hasSteps) {
      // Execute actions sequentially based on schedule steps
      scheduleExecutionCode = `
    const results = [];
    const steps = ${JSON.stringify(schedule.steps)};
    const actionIdToNameMap = ${JSON.stringify(actionIdToNameMap)};
    
    console.log(\`📋 Executing \${steps.length} steps for schedule: ${schedule.name}\`);
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      // Resolve action name: use direct name if available, otherwise map from ID
      const actionName = step.actionName || actionIdToNameMap[step.actionId] || step.actionId;
      
      console.log(\`🔄 Step \${i + 1}/\${steps.length}: \${step.description || actionName} (action: \${actionName})\`);
      
      if (!actionName) {
        console.error(\`❌ Action "\${step.actionId || step.actionName}" not found\`);
        results.push({
          step: i + 1,
          actionId: step.actionId || step.actionName,
          success: false,
          error: 'Action not found',
          executedAt: new Date().toISOString()
        });
        continue;
      }
      
      try {
        // Execute the action directly by importing its handler (using action name)
        let actionResult;
        
        try {
          // Import the action handler dynamically using action name (App Router format)
          const actionModule = await import(\`../../actions/\${actionName}/route\`);
          
          // Create a mock NextRequest for the action
          const mockRequestBody = JSON.stringify({ parameters: step.inputParams || step.input || {} });
          const mockRequest = new Request('http://localhost:3000/api/actions/' + actionName, {
            method: 'POST',
            body: mockRequestBody,
            headers: { 'Content-Type': 'application/json' }
          });
          
          // Execute the action handler (App Router format)
          const response = await actionModule.POST(mockRequest);
          actionResult = await response.json();
          
        } catch (importError) {
          // Fallback to HTTP call if direct import fails (using action name)
          console.log(\`📞 Falling back to HTTP call for action \${actionName}\`);
          
          const baseUrl = process.env.VERCEL_URL ? \`https://\${process.env.VERCEL_URL}\` : 
                         process.env.NEXT_PUBLIC_VERCEL_URL ? \`https://\${process.env.NEXT_PUBLIC_VERCEL_URL}\` :
                         'http://localhost:3000';
          
          const actionResponse = await fetch(\`\${baseUrl}/api/actions/\${actionName}\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parameters: step.inputParams || step.input || {}
            })
          });
          
          if (!actionResponse.ok) {
            throw new Error(\`Action \${actionName} (ID: \${step.actionId}) failed with status: \${actionResponse.status}\`);
          }
          
          actionResult = await actionResponse.json();
        }
        results.push({
          step: i + 1,
          actionName: actionName,
          actionId: step.actionId,
          success: actionResult.success,
          result: actionResult.result || actionResult.data,
          executedAt: new Date().toISOString()
        });
        
        console.log(\`✅ Step \${i + 1} completed successfully\`);
        
        // Add delay if specified in step configuration
        if (step.delay && step.delay.duration) {
          console.log(\`⏳ Waiting \${step.delay.duration}ms before next step...\`);
          await new Promise(resolve => setTimeout(resolve, step.delay.duration));
        }
        
      } catch (stepError) {
        console.error(\`❌ Step \${i + 1} failed:\`, stepError);
        results.push({
          step: i + 1,
          actionName: actionName,
          actionId: step.actionId,
          success: false,
          error: stepError instanceof Error ? stepError.message : 'Unknown error',
          executedAt: new Date().toISOString()
        });
        
        // Stop execution if step is configured to stop on error
        if (step.onError?.action === 'stop') {
          console.log(\`🛑 Stopping schedule execution due to step error\`);
          break;
        }
      }
    }
    
    const successfulSteps = results.filter(r => r.success).length;
    const result = {
      scheduleName: '${schedule.name}',
      totalSteps: steps.length,
      completedSteps: results.length,
      successfulSteps: successfulSteps,
      results: results,
      success: successfulSteps > 0,
      executedAt: new Date().toISOString()
    };`;
    } else {
      // No steps defined - this shouldn't happen for properly generated schedules
      scheduleExecutionCode = `
    console.warn('⚠️ Schedule ${schedule.name} has no steps defined');
    const result = {
      scheduleName: '${schedule.name}',
      success: false,
      error: 'No steps defined for this schedule',
      totalSteps: 0,
      completedSteps: 0,
      successfulSteps: 0,
      results: [],
      executedAt: new Date().toISOString()
    };`;
    }

    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const prisma = new PrismaClient();

// Get AI model configuration
async function getAIModel() {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
  
  switch (provider) {
    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      return anthropic(modelName, { apiKey: process.env.ANTHROPIC_API_KEY });
    case 'openai':
    default:
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      return openai(modelName, { apiKey: process.env.OPENAI_API_KEY });
  }
}

export async function POST(request: NextRequest) {
  // Verify cron secret for manual calls, but allow Vercel's automatic cron execution
  const cronSecret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret');
  const userAgent = request.headers.get('user-agent') || '';
  const isVercelCron = userAgent.includes('vercel-cron') || 
                      request.headers.get('x-vercel-cron') === '1';
  
  // Allow Vercel's automatic cron execution or valid cron secret
  if (!isVercelCron && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🕐 Executing schedule: ${schedule.name}');
    console.log('📝 Description: ${escapeJSString(schedule.description || 'No description provided')}');
    console.log('⏰ Pattern: ${schedule.trigger?.pattern || '*/5 * * * *'}');
    console.log('🔢 Steps: ${schedule.steps?.length || 0} action steps');
    console.log('🔑 Auth method:', isVercelCron ? 'Vercel Cron' : 'Manual with secret');
    
    ${scheduleExecutionCode}
    
    return NextResponse.json({ 
      success: true, 
      schedule: '${schedule.name}',
      executedAt: new Date().toISOString(),
      result: result,
      hasSteps: ${hasSteps}
    });
  } catch (error) {
    console.error('Schedule execution error:', error);
    return NextResponse.json({ 
      error: 'Schedule execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      schedule: '${schedule.name}'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateHealthEndpoint(): string {
    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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
        type: 'PostgreSQL'
      },
      services: {
        actions: {
          count: ${this.options.actions.length},
          endpoints: [${this.options.actions.map(a => `'/api/actions/${a.name}'`).join(', ')}]
        },
        schedules: {
          count: ${this.options.schedules.length},
          active: ${this.options.schedules.filter(s => s.trigger?.active !== false).length},
          patterns: [${this.options.schedules.map(s => `'${s.trigger?.pattern || '* * * * *'}'`).join(', ')}]
        },
        models: {
          count: ${this.options.models.length},
          names: [${this.options.models.map(m => `'${m.name}'`).join(', ')}]
        }
      }
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      name: '${this.options.projectName}',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateStatsEndpoint(): string {
    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const stats = {
      totalRecords: 0,
      activeSchedules: ${this.options.schedules.filter(s => s.trigger?.active !== false).length},
      totalModels: ${this.options.models.length},
      totalActions: ${this.options.actions.length},
      totalSchedules: ${this.options.schedules.length},
      lastActivity: new Date().toISOString()
    };

    // First ensure database is initialized
    try {
      await prisma.$queryRaw\`SELECT 1\`;
      
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
    } catch (dbError) {
      console.log('Database not ready, using default stats:', dbError.message);
    }

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get stats',
      data: {
        totalRecords: 0,
        activeSchedules: ${this.options.schedules.filter(s => s.trigger?.active !== false).length},
        totalModels: ${this.options.models.length},
        totalActions: ${this.options.actions.length},
        totalSchedules: ${this.options.schedules.length},
        lastActivity: new Date().toISOString()
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateModelEndpoint(): string {
    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to ensure database is initialized
async function ensureDatabaseInit() {
  try {
    // Test database connection
    await prisma.$queryRaw\`SELECT 1\`;
    console.log('Database connection successful');
  } catch (error: any) {
    console.log('Database connection failed:', error.message);
    console.log('This is expected if the PostgreSQL database hasn\\'t been created yet.');
    
    // In production (Vercel), the database should already be set up by the build process
    if (process.env.NODE_ENV === 'production') {
      console.log('Production environment - database should be initialized by Vercel build process');
      // Try one more time after a brief delay for database warm-up
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await prisma.$queryRaw\`SELECT 1\`;
        console.log('Database connection successful on retry');
      } catch (retryError: any) {
        console.error('Database still not available:', retryError.message);
        throw new Error('Database connection failed in production - please ensure the PostgreSQL database exists and is accessible');
      }
    } else {
      throw new Error('Database connection failed - please ensure the PostgreSQL database exists and DATABASE_URL is correct');
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: { modelName: string } }) {
  const { modelName } = params;
  const { searchParams } = new URL(request.url);

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    console.error(\`Model '\${modelName}' (camelCase: '\${camelCaseModelName}') not found in Prisma client\`);
    console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    // GET method - Get all records with optional filtering and pagination
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '100';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get model definition from embedded config
    const embeddedModels = ${JSON.stringify(this.options.models)};
    const modelDef = embeddedModels.find(m => m.name === modelName);
          
          let availableFields: string[] = [];
          let defaultSortField = 'id'; // fallback
          
          if (modelDef && modelDef.fields) {
            // Extract field names from model definition
            availableFields = modelDef.fields.map((field: any) => field.name);
            
            // Prefer timestamp fields for default sorting
            const timestampFields = ['createdAt', 'updatedAt', 'requestDate'];
            const availableTimestamp = timestampFields.find(field => availableFields.includes(field));
            
            if (availableTimestamp) {
              defaultSortField = availableTimestamp;
            } else {
              // Use the first field that's likely an ID field
              const idFields = availableFields.filter(field => 
                field.toLowerCase().includes('id') || field === 'id'
              );
              defaultSortField = idFields[0] || availableFields[0] || 'id';
            }
          } else {
            console.log('Model definition not found in config, using fallback');
          }

          // Use provided sortBy if it exists in available fields, otherwise use default
          const finalSortBy = (sortBy && availableFields.includes(sortBy as string)) ? 
                              sortBy as string : defaultSortField;

          let where = {};
          if (search && typeof search === 'string') {
            // Use model definition to determine searchable fields
            const searchConditions = [];
            
            if (modelDef && modelDef.fields) {
              // Get string fields from model definition (exclude ID fields)
              const stringFields = modelDef.fields
                .filter((field: any) => 
                  (field.type === 'String' || field.type === 'string') && 
                  !field.name.toLowerCase().includes('id')
                )
                .map((field: any) => field.name);
              
              stringFields.forEach(field => {
                searchConditions.push({ [field]: { contains: search, mode: 'insensitive' } });
              });
            } else {
              // Fallback to common field names if model definition not available
              const commonFields = ['name', 'title', 'description', 'label', 'content', 'requestContent', 'featureName', 'featureDescription', 'requirementDescription'];
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
              orderBy: { [finalSortBy]: sortOrder }
            }),
            modelClient.count({ where })
          ]);
          
    return NextResponse.json({ 
      success: true, 
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error(\`Error with model \${modelName}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unique constraint violation',
        details: 'A record with this data already exists'
      }, { status: 409 });
    } else if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to access model \${modelName}\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest, { params }: { params: { modelName: string } }) {
  const { modelName } = params;

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    const createData = await request.json();
    if (!createData || typeof createData !== 'object') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    const newRecord = await modelClient.create({
      data: createData
    });
    
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    console.error(\`Error creating model \${modelName}:\`, error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unique constraint violation',
        details: 'A record with this data already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to create model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateModelRecordEndpoint(): string {
    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to ensure database is initialized
async function ensureDatabaseInit() {
  try {
    // Test database connection
    await prisma.$queryRaw\`SELECT 1\`;
    console.log('Database connection successful');
  } catch (error: any) {
    console.log('Database connection failed:', error.message);
    console.log('This is expected if the PostgreSQL database hasn\\'t been created yet.');
    
    // In production (Vercel), the database should already be set up by the build process
    if (process.env.NODE_ENV === 'production') {
      console.log('Production environment - database should be initialized by Vercel build process');
      // Try one more time after a brief delay for database warm-up
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await prisma.$queryRaw\`SELECT 1\`;
        console.log('Database connection successful on retry');
      } catch (retryError: any) {
        console.error('Database still not available:', retryError.message);
        throw new Error('Database connection failed in production - please ensure the PostgreSQL database exists and is accessible');
      }
    } else {
      throw new Error('Database connection failed - please ensure the PostgreSQL database exists and DATABASE_URL is correct');
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: { modelName: string; id: string } }) {
  const { modelName, id } = params;

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    console.error(\`Model '\${modelName}' (camelCase: '\${camelCaseModelName}') not found in Prisma client\`);
    console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    // Get single record by ID
    const record = await modelClient.findUnique({
      where: { id }
    });
    
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error(\`Error with model \${modelName} record \${id}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to access model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { modelName: string; id: string } }) {
  const { modelName, id } = params;

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    const updateData = await request.json();
    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    // Check if record exists first
    const existingRecord = await modelClient.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const updatedRecord = await modelClient.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    console.error(\`Error updating model \${modelName} record \${id}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unique constraint violation',
        details: 'A record with this data already exists'
      }, { status: 409 });
    } else if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to update model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { modelName: string; id: string } }) {
  const { modelName, id } = params;

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    // Check if record exists
    const recordToDelete = await modelClient.findUnique({
      where: { id }
    });

    if (!recordToDelete) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await modelClient.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error(\`Error deleting model \${modelName} record \${id}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to delete model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
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
  private generateSeedFile(): string {
    return `import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // TODO: Add your custom seed data here based on your Prisma schema
  // Example:
  // const sampleData = await prisma.yourModel.createMany({
  //   data: [
  //     { field1: 'value1', field2: 'value2' },
  //     // Add more sample records here
  //   ]
  // });
  // console.log(\`✅ Created \${sampleData.count} records\`);
  
  console.log('✅ Database seeded successfully - please add seed data above based on your schema')
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

This app uses **PostgreSQL** with **Prisma ORM** and is optimized for both local development and Vercel serverless deployment [[memory:7330668]]:

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
2. Create a database: \`createdb ${this.options.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}\`
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
${this.options.models.map(m => `- **${m.title || m.name}**: ${m.description || 'Data model'}`).join('\n')}

### Smart Actions (${this.options.actions.length})
${this.options.actions.map(a => `- **${a.title || a.name}**: ${a.description || 'Action'}`).join('\n')}

### Scheduled Tasks (${this.options.schedules.length})
${this.options.schedules.map(s => `- **${s.title || s.name}**: ${s.description || 'Scheduled task'} (\`${s.trigger?.pattern || '* * * * *'}\`) - ${s.steps?.length || 0} steps`).join('\n')}

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
${this.options.actions.map(a => `- \`POST /api/actions/${a.name}\` - ${a.description || 'Execute action'}`).join('\n')}

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
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return embedded actions directly (no main app calls)
    const actions = ${JSON.stringify(this.options.actions)};
    
    console.log('📦 Returning embedded actions:', {
      count: actions.length,
      names: actions.map(a => a.name)
    });
    
    return NextResponse.json({
      success: true,
      actions: actions,
      source: 'embedded'
    });
  } catch (error) {
    console.error('Error fetching embedded actions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateSchedulesEndpoint(): string {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return embedded schedules directly (no main app calls)
    const schedules = ${JSON.stringify(this.options.schedules)};
    
    console.log('📦 Returning embedded schedules:', {
      count: schedules.length,
      names: schedules.map(s => s.name)
    });
    
    return NextResponse.json({
      success: true,
      schedules: schedules,
      source: 'embedded'
    });
  } catch (error) {
    console.error('Error fetching embedded schedules:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateModelsEndpoint(): string {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return embedded models directly (no main app calls)
    const models = ${JSON.stringify(this.options.models)};
    
    console.log('📦 Returning embedded models:', {
      count: models.length,
      names: models.map(m => m.name)
    });
    
    return NextResponse.json({
      success: true,
      models: models,
      source: 'embedded'
    });
  } catch (error) {
    console.error('Error fetching embedded models:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateAgentConfigEndpoint(): string {
    const agentName = escapeJSString(this.options.agentConfig?.name || this.options.projectName);
    const agentDescription = escapeJSString(this.options.agentConfig?.description || 'Self-contained AI agent application');
    const agentTheme = this.options.agentConfig?.theme || 'green';
    const agentAvatar = this.options.agentConfig?.avatar || null;
    const agentDomain = this.options.agentConfig?.domain || null;
    
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Config API returning fully embedded local configuration');

    // Return fully embedded local configuration
    const config = {
      // All configuration embedded locally
      name: '${agentName}',
      description: '${agentDescription}',
      theme: '${agentTheme}',
      avatar: ${JSON.stringify(agentAvatar)},
      domain: ${JSON.stringify(agentDomain)},
      
      // Functional data embedded locally
      models: ${JSON.stringify(this.options.models)},
      actions: ${JSON.stringify(this.options.actions)},
      schedules: ${JSON.stringify(this.options.schedules)}
    };
    
    console.log('✅ Returning fully local config:', {
      name: config.name,
      theme: config.theme,
      hasAvatar: !!config.avatar,
      avatarType: config.avatar?.type,
      hasDescription: !!config.description,
      source: 'fully-local-embedded',
      modelsCount: config.models.length,
      actionsCount: config.actions.length,
      schedulesCount: config.schedules.length
    });
    
    return NextResponse.json({
      success: true,
      config,
      source: 'fully-local-embedded'
    });
  } catch (error) {
    console.error('❌ Error returning local config:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to return local configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }


  private generateAgentContext(): string {
    return `'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
        name: '${this.options.projectName}',
        description: 'Self-contained AI agent application',
        theme: 'green',
        avatar: null,
        models: ${JSON.stringify(this.options.models)},
        actions: ${JSON.stringify(this.options.actions)},
        schedules: ${JSON.stringify(this.options.schedules)}
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
}

export default MobileAppTemplate; 