import { TemplateGenerator, MobileAppTemplateOptions, normalizeSchedule } from '../base/MobileAppTemplateBase';

export class ConfigGenerator implements TemplateGenerator {
  generate(options: MobileAppTemplateOptions): Record<string, string> {
    const files: Record<string, string> = {};
    const { projectName, vercelConfig } = options;
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');

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
    files['.env.example'] = this.generateEnvExample(options);
    
    // Generate local environment file with database URL
    files['.env.local'] = this.generateEnvLocal(options);

    // Generate Vercel configuration
    files['vercel.json'] = this.generateVercelConfig(options);

    // Generate .gitignore
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

    return files;
  }

  private generatePackageJson(sanitizedName: string, vercelConfig?: any): string {
    const aiSdkEnabled = vercelConfig?.aiSdkEnabled !== false; // Default true for Vercel
    const discoveredPackages = vercelConfig?.discoveredPackages || [];

    const baseDependencies: Record<string, string> = {
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
      "@types/pg": "^8.10.9",
      "@vercel/blob": "^1.1.0",
      "redis": "^5.0.0"
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

    // Add discovered packages from web search
    if (discoveredPackages && discoveredPackages.length > 0) {
      console.log(`📦 Adding ${discoveredPackages.length} discovered packages to package.json`);
      discoveredPackages.forEach((pkg: any) => {
        if (pkg.name && !baseDependencies[pkg.name]) {
          baseDependencies[pkg.name] = pkg.version || 'latest';
          console.log(`  + ${pkg.name}@${pkg.version || 'latest'} (${pkg.useCase})`);
        }
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
      "vercel-build": "npm run db:setup && next build && npm run db:seed"
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
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      },
    ],
  },
}

module.exports = nextConfig`;
  }

  private generateEnvExample(options: MobileAppTemplateOptions): string {
    const { vercelConfig } = options;
    const aiSdkEnabled = vercelConfig?.aiSdkEnabled !== false;

    let envContent = `# Database - PostgreSQL (Neon recommended for production)
# For local development, you can use a local PostgreSQL instance
# For production, create a Neon database and use the connection string
DATABASE_URL="postgresql://user:password@host:5432/database"

# Neon Database Configuration (for production)
NEON_API_KEY="your_neon_api_key_here"
NEON_PROJECT_ID="your_neon_project_id_here"

# Redis Configuration (for execution logging)
# Create a Redis instance (e.g., Redis Cloud, Upstash, or local Redis)
REDIS_URL="redis://default:password@host:port"

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
NEXT_PUBLIC_APP_NAME="${options.agentConfig?.name || options.projectName}"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_DESCRIPTION="${options.agentConfig?.description || 'Smart agent powered by AI'}"
NEXT_PUBLIC_APP_THEME="${options.agentConfig?.theme || 'green'}"

# Security
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Cron security (for production)
CRON_SECRET="your-cron-secret-here"

# Optional: Custom environment variables
# Add your project-specific variables here`;

    return envContent;
  }

  private generateEnvLocal(options: MobileAppTemplateOptions): string {
    return `# Local Development Environment
# Database URL - PostgreSQL connection string
# For local development: Create a PostgreSQL database named '${options.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}'
# For production: Use your Neon database connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/${options.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}"

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
NEXT_PUBLIC_APP_NAME="${options.agentConfig?.name || options.projectName}"
NEXT_PUBLIC_APP_DESCRIPTION="${options.agentConfig?.description || 'Smart agent powered by AI'}"
NEXT_PUBLIC_APP_THEME="${options.agentConfig?.theme || 'green'}"

# Security tokens (auto-generated)
NEXTAUTH_SECRET="${Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)}"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="${Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)}"
`;
  }

  private generateVercelConfig(options: MobileAppTemplateOptions): string {
    // Generate cron configurations for each schedule using the normalize function
    const cronConfigs = options.schedules.map(schedule => {
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
} 