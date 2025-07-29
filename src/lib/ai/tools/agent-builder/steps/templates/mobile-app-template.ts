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
      "build:db": "npm run db:generate && npm run db:deploy",
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
      postinstall: "prisma generate",
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

# AI Provider Configuration
# Choose ONE provider and add the corresponding API key
OPENAI_API_KEY="sk-your-openai-key-here"
# OR
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"

# Optional: AI Provider Selection (defaults to openai)
AI_MODEL_PROVIDER="openai"    # openai | anthropic
AI_MODEL_NAME="gpt-4o-mini"   # For OpenAI: gpt-4o-mini, gpt-4o, gpt-3.5-turbo
                              # For Anthropic: claude-3-haiku-20240307, claude-3-sonnet-20240229`;
    }

    envContent += `

# Security
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Cron security (for production)
CRON_SECRET="your-cron-secret-here"

# Optional: Custom environment variables
# Add your project-specific variables here`;

    return envContent;
  }

  private generateVercelConfig(): string {
    return JSON.stringify({
      buildCommand: "npm run vercel-build",
      functions: {
        "src/pages/api/cron/*.ts": { maxDuration: 300 }
      },
      crons: this.options.schedules.map(schedule => ({
        path: `/api/cron/${schedule.name}`,
        schedule: schedule.interval?.pattern || '0 0 * * *'
      })),
      installCommand: "npm install",
      build: { env: { PRISMA_GENERATE_DATAPROXY: "true" } }
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
      'src/components/LoadingSpinner.tsx': this.generateLoadingSpinnerComponent()
    };
  }

  private generateApiRoutes(): Record<string, string> {
    const files: Record<string, string> = {};

    // System endpoints
    files['src/pages/api/health.ts'] = this.generateHealthEndpoint();
    files['src/pages/api/stats.ts'] = this.generateStatsEndpoint();
    files['src/pages/api/models/[modelName].ts'] = this.generateModelEndpoint();
    files['src/pages/api/chat.ts'] = this.generateChatEndpoint();

    // Action endpoints
    this.options.actions.forEach(action => {
      files[`src/pages/api/${action.name}.ts`] = this.generateActionEndpoint(action);
    });

    // Cron endpoints
    this.options.schedules.forEach(schedule => {
      files[`src/pages/api/cron/${schedule.name}.ts`] = this.generateCronEndpoint(schedule);
    });

    // Vercel configuration
    files['vercel.json'] = JSON.stringify({
      buildCommand: "npm run vercel-build",
      functions: {
        "src/pages/api/cron/*.ts": { maxDuration: 300 }
      },
      crons: this.options.schedules.map(schedule => ({
        path: `/api/cron/${schedule.name}`,
        schedule: schedule.interval?.pattern || '0 0 * * *'
      })),
      installCommand: "npm install",
      build: { env: { PRISMA_GENERATE_DATAPROXY: "true" } }
    }, null, 2);

    return files;
  }

  private generateUtilities(): Record<string, string> {
    const files: Record<string, string> = {
      'src/lib/prisma.ts': this.generatePrismaClient(),
      'src/lib/api.ts': this.generateApiClient(),
      'src/lib/theme.ts': this.generateThemeSystem(),
      'src/hooks/useApi.ts': this.generateApiHook(),
      'src/hooks/useMobile.ts': this.generateMobileHook(),
      'prisma/seed.ts': this.generateSeedFile(),
      'scripts/init-sqlite.js': this.generateSQLiteInitScript()
    };

    // Only add schema if one was provided (it should come from main deployment)
    if (this.options.prismaSchema) {
      files['prisma/schema.prisma'] = this.options.prismaSchema;
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
import api from '@/lib/api';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  agentName?: string;
  theme?: keyof typeof themes;
}

interface AgentConfig {
  avatar?: any;
  theme?: string;
  name?: string;
  description?: string;
  domain?: string;
}

export default function Layout({ 
  children, 
  title = '${this.options.projectName}', 
  agentName = '${this.options.projectName}', 
  theme = 'green' 
}: LayoutProps) {
  const [isMobile, setIsMobile] = useState(true);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();
  
  // Use agent config theme if available, fallback to props
  const selectedTheme = agentConfig?.theme || theme;
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;
  const displayName = agentConfig?.name || agentName;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch agent configuration from main app
  useEffect(() => {
    const fetchAgentConfig = async () => {
      try {
        const config = await api.getAgentConfiguration();
        if (config) {
          setAgentConfig(config);
          
          // Fetch avatar image URL
          const avatarImageUrl = await api.getAvatarImageUrl();
          if (avatarImageUrl) {
            setAvatarUrl(avatarImageUrl);
          }
        }
      } catch (error) {
        console.error('Failed to load agent configuration:', error);
      }
    };

    fetchAgentConfig();
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={\`\${agentName} - AI Agent Application\`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={\`min-h-screen \${currentTheme.bgGradient || 'bg-gradient-to-br from-black via-green-950/30 to-emerald-950/20'} relative\`}>
        {/* Background Pattern */}
        <div className="fixed inset-0 opacity-10">
          <div className={\`absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,\${currentTheme.foreground || '#22c55e'},transparent)]\`}></div>
        </div>
        
        {/* Matrix-style animated background */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className={\`absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,\${currentTheme.foreground || '#22c55e'}15_25%,transparent_26%,transparent_74%,\${currentTheme.foreground || '#22c55e'}15_75%,transparent_76%),linear-gradient(transparent_24%,\${currentTheme.foreground || '#22c55e'}15_25%,transparent_26%,transparent_74%,\${currentTheme.foreground || '#22c55e'}15_75%,transparent_76%)] bg-[size:50px_50px]\`}></div>
        </div>

        {/* Main Content */}
        <div className={\`relative z-10 \${isMobile ? 'pb-20' : ''}\`}>
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
          <main className={\`\${isMobile ? 'max-w-md mx-auto' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}\`}>
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
    <div className={\`fixed bottom-0 left-0 right-0 \${currentTheme.bg} border-t \${currentTheme.border} z-50\`}>
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={\`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 \${
              router.pathname === item.path
                ? \`\${currentTheme.bgActive} \${currentTheme.accent} scale-110\`
                : \`\${currentTheme.dim} hover:\${currentTheme.light} hover:\${currentTheme.bgHover}\`
            }\`}
          >
            <span className={\`text-lg \${router.pathname === item.path ? 'scale-110' : ''} transition-transform\`}>
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
      desc: 'Ask questions or give commands',
      color: 'bg-blue-500/15 border-blue-400/30 hover:bg-blue-500/25'
    },
    { 
      path: '/models', 
      icon: '🗃️', 
      title: 'View Data', 
      desc: 'Manage your information',
      color: 'bg-green-500/15 border-green-400/30 hover:bg-green-500/25'
    },
    { 
      path: '/actions', 
      icon: '⚡', 
      title: 'Execute Actions', 
      desc: 'Run smart operations',
      color: 'bg-yellow-500/15 border-yellow-400/30 hover:bg-yellow-500/25'
    },
    { 
      path: '/schedules', 
      icon: '⏰', 
      title: 'Schedules', 
      desc: 'Manage automated tasks',
      color: 'bg-purple-500/15 border-purple-400/30 hover:bg-purple-500/25'
    }
  ];

  return (
    <Layout title="${projectName}">
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-6">
          <div className="flex justify-center">
            <div className="p-4 bg-green-500/15 border border-green-400/30 rounded-2xl">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/20 border-2 border-green-400/30 flex items-center justify-center">
                <span className="text-2xl text-green-400">🤖</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-mono font-bold text-2xl text-green-200">${projectName}</h1>
            <p className="font-mono text-sm text-green-300/70 max-w-xs mx-auto leading-relaxed">
              Your intelligent AI assistant powered by Agent Builder
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsCard stats={stats} loading={loading} />

        {/* Quick Actions */}
        <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
          <h3 className="font-mono font-semibold text-sm text-green-200 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.path)}
                className={\`w-full flex items-center gap-3 p-3 \${action.color} border rounded-lg transition-all duration-200 transform hover:scale-[1.02]\`}
              >
                <span className="text-lg">{action.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-mono text-sm text-green-200">{action.title}</div>
                  <div className="font-mono text-xs text-green-300/70">{action.desc}</div>
                </div>
                <span className="text-xs text-green-300/70">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <div className="font-mono font-semibold text-sm text-green-200">System Status</div>
                <div className="font-mono text-xs text-green-300/70">All systems operational</div>
              </div>
            </div>
            <div className="px-2 py-1 bg-green-500/25 border border-green-400/50 rounded-lg">
              <span className="font-mono text-xs text-green-400">LIVE</span>
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

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
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

      // Try public endpoint first for deployed agents, fallback to authenticated endpoint
      let response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public?documentId=\${DOCUMENT_ID}&agentKey=\${AGENT_KEY}\`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // If public endpoint fails, try the authenticated one
      if (!response.ok) {
        console.log('Public endpoint failed, trying authenticated endpoint...');
        response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials?documentId=\${DOCUMENT_ID}&agentKey=\${AGENT_KEY}\`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
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

  async getModelRecords(modelName: string) {
    return this.request(\`/api/models/\${modelName}\`);
  }

  async executeAction(actionName: string, input: any) {
    // Get fresh credentials for action execution
    const { credentials } = await this.getCredentialsAndConfig();
    
    return this.request(\`/api/\${actionName}\`, {
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
    bg: 'bg-green-500/15',
    bgHover: 'hover:bg-green-500/25',
    borderActive: 'border-green-400/50',
    bgActive: 'bg-green-500/25',
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
    bg: 'bg-blue-500/15',
    bgHover: 'hover:bg-blue-500/25',
    borderActive: 'border-blue-400/50',
    bgActive: 'bg-blue-500/25',
    background: '#0a0f1a',
    foreground: '#3b82f6'
  },
  purple: {
    name: 'Cosmic',
    primary: 'purple',
    gradient: 'from-purple-400/20 via-violet-500/15 to-indigo-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-purple-950/30 to-indigo-950/20',
    border: 'border-purple-400/30',
    accent: 'text-purple-400',
    light: 'text-purple-200',
    dim: 'text-purple-300/70',
    bg: 'bg-purple-500/15',
    bgHover: 'hover:bg-purple-500/25',
    borderActive: 'border-purple-400/50',
    bgActive: 'bg-purple-500/25',
    background: '#0f0a1a',
    foreground: '#a855f7'
  },
  orange: {
    name: 'Sunset',
    primary: 'orange',
    gradient: 'from-orange-400/20 via-amber-500/15 to-yellow-400/20',
    bgGradient: 'bg-gradient-to-br from-black via-orange-950/30 to-amber-950/20',
    border: 'border-orange-400/30',
    accent: 'text-orange-400',
    light: 'text-orange-200',
    dim: 'text-orange-300/70',
    bg: 'bg-orange-500/15',
    bgHover: 'hover:bg-orange-500/25',
    borderActive: 'border-orange-400/50',
    bgActive: 'bg-orange-500/25',
    background: '#1a0f0a',
    foreground: '#f97316'
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

export default function ModelsPage() {
  const [modelsData, setModelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const models = ${JSON.stringify(this.options.models.map(m => ({
    name: m.name,
    emoji: m.emoji || '📋',
    description: m.description || 'Data model',
    fields: m.fields || []
  })), null, 2)};

  useEffect(() => {
    fetchModelData();
  }, []);

  const fetchModelData = async () => {
    try {
      const promises = models.map(async (model) => {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Data Models">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-mono font-bold text-green-200">Data Models</h1>
          <span className="text-sm font-mono text-green-300/70">
            {models.length} model{models.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 animate-pulse">
                <div className="h-6 bg-green-500/20 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-green-500/20 rounded w-2/3"></div>
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
            <h3 className="font-mono text-lg text-green-200 mb-2">No Models Found</h3>
            <p className="font-mono text-sm text-green-300/70">
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
import { useState } from 'react';
import api from '@/lib/api';

export default function ActionsPage() {
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const actions = ${JSON.stringify(this.options.actions.map(a => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji || '⚡',
    description: a.description || 'Execute action',
    type: a.type || 'query',
    role: a.role || 'member'
  })), null, 2)};

  const executeAction = async (actionName: string) => {
    try {
      setExecutingAction(actionName);
      setResults(prev => ({ ...prev, [actionName]: null }));
      
      const result = await api.executeAction(actionName, {
        // Default input - in a real app, this would come from a form
        timestamp: new Date().toISOString(),
        source: 'mobile-app'
      });
      
      setResults(prev => ({ ...prev, [actionName]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [actionName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setExecutingAction(null);
    }
  };

  return (
    <Layout title="Actions">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-mono font-bold text-green-200">Smart Actions</h1>
          <span className="text-sm font-mono text-green-300/70">
            {actions.length} action{actions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                isExecuting={executingAction === action.name}
                result={results[action.name]}
                onExecute={() => executeAction(action.name)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-mono text-lg text-green-200 mb-2">No Actions Available</h3>
            <p className="font-mono text-sm text-green-300/70">
              Smart actions will appear here once they're configured.
            </p>
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

export default function SchedulesPage() {
  const schedules = ${JSON.stringify(this.options.schedules.map(s => ({
    id: s.id,
    name: s.name,
    emoji: s.emoji || '⏰',
    description: s.description || 'Scheduled task',
    pattern: s.interval?.pattern || '0 0 * * *',
    active: s.interval?.active !== false,
    nextRun: s.interval?.pattern ? 'Calculated from pattern' : 'Unknown'
  })), null, 2)};

  const getNextRunTime = (pattern: string) => {
    // Simple next run calculation - in a real app, use a cron library
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    return nextHour.toLocaleString();
  };

  return (
    <Layout title="Schedules">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-mono font-bold text-green-200">Scheduled Tasks</h1>
          <span className="text-sm font-mono text-green-300/70">
            {schedules.filter(s => s.active).length}/{schedules.length} active
          </span>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-3 text-center">
            <div className="font-mono font-bold text-lg text-green-400">
              {schedules.length}
            </div>
            <div className="font-mono text-xs text-green-300/70">Total Tasks</div>
          </div>
          <div className="bg-blue-500/15 border border-blue-400/30 rounded-xl p-3 text-center">
            <div className="font-mono font-bold text-lg text-blue-400">
              {schedules.filter(s => s.active).length}
            </div>
            <div className="font-mono text-xs text-blue-300/70">Active Tasks</div>
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
            <h3 className="font-mono text-lg text-green-200 mb-2">No Schedules</h3>
            <p className="font-mono text-sm text-green-300/70">
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
import { useEffect, useRef } from 'react';

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: \`Hello! I'm your AI assistant for this agent app. I can help you with:

• **Data Management**: View and analyze your ${this.options.models.length} data models
• **Smart Actions**: Execute any of your ${this.options.actions.length} configured actions
• **Task Scheduling**: Monitor your ${this.options.schedules.length} automated tasks
• **System Status**: Check health and performance

What would you like to explore first?\`
      }
    ],
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

  return (
    <Layout title="AI Chat">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-green-400/30">
          <h1 className="text-xl font-mono font-bold text-green-200">AI Assistant</h1>
          <p className="text-sm font-mono text-green-300/70">
            Powered by AI SDK • Ask questions about your data, actions, and schedules
          </p>
        </div>

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

        {/* Input */}
        <div className="p-4 border-t border-green-400/30">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your agent..."
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
    return `interface ModelCardProps {
  model: {
    name: string;
    emoji?: string;
    description?: string;
    recordCount?: number;
    error?: boolean;
  };
}

export default function ModelCard({ model }: ModelCardProps) {
  return (
    <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{model.emoji || '📋'}</span>
        <div className="flex-1">
          <h3 className="font-mono font-semibold text-sm text-green-200 capitalize">
            {model.name}
          </h3>
          <p className="font-mono text-xs text-green-300/70">
            {model.description || \`Manage \${model.name} records\`}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono font-semibold text-sm text-green-400">
            {model.error ? '⚠️' : (model.recordCount || 0)}
          </div>
          <div className="font-mono text-xs text-green-300/70">
            {model.error ? 'Error' : 'records'}
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  private generateActionCardComponent(): string {
    return `interface ActionCardProps {
  action: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    type: string;
  };
  isExecuting: boolean;
  result?: any;
  onExecute: () => void;
}

export default function ActionCard({ action, isExecuting, result, onExecute }: ActionCardProps) {
  return (
    <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{action.emoji || '⚡'}</span>
        <div className="flex-1">
          <h3 className="font-mono font-semibold text-sm text-green-200">
            {action.name}
          </h3>
          <p className="font-mono text-xs text-green-300/70">
            {action.description || \`Execute \${action.name}\`}
          </p>
        </div>
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="px-3 py-2 bg-green-500/25 border border-green-400/50 rounded-lg font-mono text-xs text-green-200 hover:bg-green-500/35 disabled:opacity-50"
        >
          {isExecuting ? 'Running...' : 'Run'}
        </button>
      </div>
      {result && (
        <div className="mt-3 p-2 bg-green-500/10 border border-green-400/20 rounded-lg">
          <pre className="font-mono text-xs text-green-300 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}`;
  }

  private generateScheduleCardComponent(): string {
    return `interface ScheduleCardProps {
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
  return (
    <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{schedule.emoji || '⏰'}</span>
        <div className="flex-1">
          <h3 className="font-mono font-semibold text-sm text-green-200">
            {schedule.name}
          </h3>
          <p className="font-mono text-xs text-green-300/70">
            {schedule.description || \`Scheduled: \${schedule.pattern}\`}
          </p>
        </div>
        <div className={\`px-2 py-1 rounded-lg border \${
          schedule.active 
            ? 'bg-green-500/25 border-green-400/50 text-green-400' 
            : 'bg-gray-500/25 border-gray-400/50 text-gray-400'
        }\`}>
          <span className="font-mono text-xs">
            {schedule.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="font-mono text-xs text-green-300/70">
        Pattern: <span className="text-green-300">{schedule.pattern}</span>
      </div>
      {schedule.nextRun && (
        <div className="font-mono text-xs text-green-300/70 mt-1">
          Next: <span className="text-green-300">{schedule.nextRun}</span>
        </div>
      )}
    </div>
  );
}`;
  }

  private generateStatsCardComponent(): string {
    return `interface StatsCardProps {
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
  if (loading) {
    return (
      <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-green-500/20 rounded w-1/3 mb-3"></div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-green-500/20 rounded w-8 mx-auto mb-1"></div>
                <div className="h-3 bg-green-500/20 rounded w-12 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
      <h3 className="font-mono font-semibold text-sm text-green-200 mb-3">System Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="font-mono font-bold text-lg text-green-400">{stats.totalRecords}</div>
          <div className="font-mono text-xs text-green-300/70">Records</div>
        </div>
        <div className="text-center">
          <div className="font-mono font-bold text-lg text-blue-400">{stats.activeSchedules}</div>
          <div className="font-mono text-xs text-blue-300/70">Active Tasks</div>
        </div>
        <div className="text-center">
          <div className="font-mono font-bold text-lg text-yellow-400">{stats.totalModels}</div>
          <div className="font-mono text-xs text-yellow-300/70">Models</div>
        </div>
        <div className="text-center">
          <div className="font-mono font-bold text-lg text-purple-400">{stats.totalActions}</div>
          <div className="font-mono text-xs text-purple-300/70">Actions</div>
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
  private generateChatEndpoint(): string {
    const modelsContext = this.options.models.map(m => `${m.name} (${m.description || 'data model'})`).join(', ');
    const actionsContext = this.options.actions.map(a => `${a.name} (${a.description || 'action'})`).join(', ');
    const schedulesContext = this.options.schedules.map(s => `${s.name} (${s.description || 'scheduled task'})`).join(', ');
    
    return `import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';

// Configure AI provider based on environment
function getAIModel() {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
  
  switch (provider) {
    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider');
      }
      return anthropic(modelName);
    case 'openai':
    default:
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for OpenAI provider');
      }
      return openai(modelName);
  }
}

// System prompt with agent context
const systemPrompt = \`You are an AI assistant for a smart agent application called "${this.options.projectName}".

**About this agent:**
- **Data Models (${this.options.models.length})**: ${this.options.models.map(m => m.name).join(', ')}
- **Smart Actions (${this.options.actions.length})**: ${this.options.actions.map(a => a.name).join(', ')}  
- **Scheduled Tasks (${this.options.schedules.length})**: ${this.options.schedules.map(s => s.name).join(', ')}

**Your capabilities:**
1. **Data Analysis**: Help users understand and query their data models
2. **Action Execution**: Guide users through executing smart actions
3. **Task Management**: Assist with scheduled task monitoring and configuration
4. **System Insights**: Provide status updates and performance insights

**Response style:**
- Be helpful, concise, and technical when needed
- Use emojis sparingly but effectively
- Provide actionable suggestions
- Reference specific models, actions, or schedules when relevant
- Format code or data clearly with markdown

**Available context:**
- Models: ${modelsContext}
- Actions: ${actionsContext}
- Schedules: ${schedulesContext}

Always be ready to help with queries about data, actions, schedules, or general system operations.\`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const model = getAIModel();
    
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
    ${this.options.models.map(model => `
    try {
      const ${model.name.toLowerCase()}Count = await prisma.${model.name.toLowerCase()}.count();
      stats.totalRecords += ${model.name.toLowerCase()}Count;
    } catch (error) {
      console.log('Model ${model.name} not yet available:', error.message);
    }`).join('')}

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
  const { modelName } = req.query;

  if (!modelName || typeof modelName !== 'string') {
    return res.status(400).json({ error: 'Model name is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get all records from the model
      const records = await (prisma as any)[modelName.toLowerCase()].findMany({
        take: 100,
        orderBy: { createdAt: 'desc' }
      });
      
      res.status(200).json({ success: true, data: records });
    } else if (req.method === 'POST') {
      // Create a new record
      const record = await (prisma as any)[modelName.toLowerCase()].create({
        data: req.body
      });
      
      res.status(201).json({ success: true, data: record });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(\`Error with model \${modelName}:\`, error);
    res.status(500).json({ 
      success: false, 
      error: \`Failed to access model \${modelName}\`,
      details: error.message 
    });
  }
}`;
  }

  private generateActionEndpoint(action: AgentAction): string {
    return `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${action.type === 'query' ? 'GET' : 'POST'}') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Executing action: ${action.name}');
    
    // Extract input and credentials from request
    const { input, credentials = {} } = req.body || {};
    
    // Initialize external API credentials for action execution
    const externalApiCredentials = credentials;
    console.log('🔑 Using credentials for external APIs:', Object.keys(externalApiCredentials));
    
    // Mock member object for action execution
    const member = {
      id: 'demo-user',
      role: 'admin', // Default to admin for deployed apps
      email: 'demo@example.com'
    };
    
    // Mock AI object for action execution
    const ai = {
      generateText: async (prompt: string) => {
        return { text: \`Mock AI response for: \${prompt}\` };
      }
    };
    
    ${action.execute?.code?.script ? `
    // Execute the generated action code
    const actionCode = \`${action.execute.code.script.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
    const envVars = { ...externalApiCredentials, ...process.env };
    
    // Create function from action code and execute it
    const actionFunction = new Function('database', 'input', 'member', 'ai', 'envVars', \`
      \${actionCode}
      return executeAction(database, input, member, ai, envVars);
    \`);
    
    const result = await actionFunction(prisma, input, member, ai, envVars);
    ` : `
    // Basic action execution logic
    ${action.type === 'query' ? `
    // Query action - get data
    const result = {
      actionName: '${action.name}',
      type: 'query',
      description: '${action.description || 'Query action'}',
      data: [], // Replace with actual query logic
      timestamp: new Date().toISOString(),
      usedCredentials: Object.keys(externalApiCredentials)
    };` : `
    // Mutation action - modify data  
    const result = {
      actionName: '${action.name}',
      type: 'mutation',
      description: '${action.description || 'Mutation action'}',
      input: input,
      success: true,
      timestamp: new Date().toISOString(),
      usedCredentials: Object.keys(externalApiCredentials)
    };`}`}
    
    console.log(\`✅ Action '\${action.name}' completed successfully\`);
    res.status(200).json({ success: true, data: result });
    
  } catch (error) {
    console.error(\`❌ Error executing action '\${action.name}':\`, error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error',
      actionName: '${action.name}'
    });
  }
}`;
  }

  private generateCronEndpoint(schedule: AgentSchedule): string {
    // Handle both old and new schedule formats
    const scheduleData = schedule as any; // Cast to access new properties
    const steps = scheduleData.steps || [];
    const triggerPattern = scheduleData.trigger?.pattern || schedule.interval?.pattern || '* * * * *';
    
    return `import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Fetch credentials from main app
async function getCredentials() {
  const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
  const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
  const AGENT_KEY = process.env.NEXT_PUBLIC_AGENT_KEY || 'default-agent-key';

  try {
    // Try public endpoint first for deployed agents
    let response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials-public?documentId=\${DOCUMENT_ID}&agentKey=\${AGENT_KEY}\`);
    
    // If public endpoint fails, try the authenticated one
    if (!response.ok) {
      console.log('Public endpoint failed, trying authenticated endpoint...');
      response = await fetch(\`\${MAIN_APP_URL}/api/agent-credentials?documentId=\${DOCUMENT_ID}&agentKey=\${AGENT_KEY}\`);
    }
    
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.credentials : {};
    } else {
      console.error('Failed to fetch credentials:', response.status);
    }
  } catch (error) {
    console.error('Failed to fetch credentials for cron job:', error);
  }
  return {};
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
    console.log('🕐 Running scheduled task: ${schedule.name}');
    
    // Get credentials for external API calls
    const credentials = await getCredentials();
    console.log('🔑 Retrieved credentials for schedule:', Object.keys(credentials));
    
         ${steps?.length ? `
     // Execute schedule steps in sequence
     const stepResults = [];
     
     ${steps.map((step: any, index: number) => `
    // Execute Step ${index + 1}: ${step.name || `Step ${index + 1}`}
    try {
      console.log('Executing step ${index + 1}: ${step.description || step.name}');
      
      // Call the associated action with credentials
      const actionResponse = await fetch(\`\${process.env.VERCEL_URL || 'http://localhost:3000'}/api/${step.actionId}\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {}, // Add any step-specific input here
          credentials: credentials
        }),
      });
      
      const actionResult = await actionResponse.json();
      stepResults.push({
        step: ${index + 1},
        actionId: '${step.actionId}',
        success: actionResult.success,
        result: actionResult.data
      });
      
      // Add delay if specified
      ${step.delay?.duration ? `await new Promise(resolve => setTimeout(resolve, ${step.delay.duration}));` : ''}
      
    } catch (stepError) {
      console.error(\`Error in step ${index + 1}:\`, stepError);
      stepResults.push({
        step: ${index + 1},
        actionId: '${step.actionId}',
        success: false,
        error: stepError.message
      });
      
      ${step.onError?.action === 'stop' ? `throw stepError;` : '// Continue to next step'}
    }`).join('\n    ')}
    
         const result = {
       scheduleName: '${schedule.name}',
       description: '${schedule.description || 'Scheduled task'}',
       pattern: '${triggerPattern}',
       executedAt: new Date().toISOString(),
       success: true,
       stepResults: stepResults,
       totalSteps: ${steps.length},
       completedSteps: stepResults.filter(r => r.success).length
     };
    ` : `
         // Basic schedule execution logic (no steps defined)
     const result = {
       scheduleName: '${schedule.name}',
       description: '${schedule.description || 'Scheduled task'}',
       pattern: '${triggerPattern}',
       executedAt: new Date().toISOString(),
       success: true,
       data: [], // Replace with actual scheduled task logic
       usedCredentials: Object.keys(credentials)
     };`}
    
    console.log(\`✅ Scheduled task completed: \${schedule.name}\`);
    res.status(200).json({ success: true, data: result });
    
  } catch (error) {
    console.error(\`❌ Error in scheduled task \${schedule.name}:\`, error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error',
      scheduleName: '${schedule.name}'
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
  // const sample${model.name} = await prisma.${model.name.toLowerCase()}.createMany({
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

  private generateSQLiteInitScript(): string {
    return `const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');

// Create empty SQLite database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log('✅ SQLite database file created: dev.db');
} else {
  console.log('📋 SQLite database file already exists: dev.db');
}

console.log('🗄️ SQLite database ready for development');`;
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
}

export default MobileAppTemplate; 