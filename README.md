# AI Agent Builder

A powerful Next.js application for creating, managing, and deploying AI agents with custom actions, authentication, and database integrations.

## 🚀 Features

- **AI Agent Creation**: Build custom AI agents with specific personas and capabilities
- **Custom Actions**: Define and integrate custom actions for your agents
- **Database Integration**: Built-in support for PostgreSQL with Drizzle ORM
- **Authentication**: Multi-provider authentication (Email/Password, Google, Facebook, GitHub, Discord)
- **Guest Mode**: Try the platform without registration
- **Agent Deployment**: Deploy agents to Vercel with automatic environment setup
- **Avatar Creator**: Create custom 3D avatars for your agents
- **Real-time Chat**: Interactive chat interface with your created agents
- **Code Generation**: Generate and execute code artifacts
- **File Management**: Upload and process various file types
- **Cron Scheduling**: Schedule recurring tasks for your agents

## 📋 Prerequisites

- **Node.js** 18.x or later
- **pnpm** (recommended package manager)
- **PostgreSQL** database (local or cloud)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rewrite-complete
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   
   ```env
   # Database
   POSTGRES_URL="postgresql://username:password@localhost:5432/database_name"
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   
   # Authentication Secret
   AUTH_SECRET="your-auth-secret-here"
   AGENT_JWT_SECRET="your-agent-jwt-secret-here"
   
   # AI Providers (at least one required)
   AI_PROVIDER="openai" # or "xai"
   OPENAI_API_KEY="your-openai-api-key"
   XAI_API_KEY="your-xai-api-key"
   
   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   FACEBOOK_CLIENT_ID="your-facebook-client-id"
   FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   DISCORD_CLIENT_ID="your-discord-client-id"
   DISCORD_CLIENT_SECRET="your-discord-client-secret"
   
   # Deployment (optional)
   VERCEL_TOKEN="your-vercel-token"
   NEXT_PUBLIC_MAIN_APP_URL="http://localhost:3000"
   
   # Cron Jobs (optional)
   CRON_SECRET="your-cron-secret"
   
   # Redis (optional)
   REDIS_URL="redis://localhost:6379"
   ```

4. **Set up the database**
   
   Generate database migrations:
   ```bash
   pnpm db:generate
   ```
   
   Run migrations:
   ```bash
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## 🗄️ Database Setup

### Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a database:
   ```sql
   CREATE DATABASE ai_agent_builder;
   ```
3. Update the `POSTGRES_URL` in your `.env.local` file

### Cloud PostgreSQL (Recommended)

You can use cloud providers like:
- **Neon** (recommended for development)
- **Supabase**
- **PlanetScale**
- **Railway**

## 🔐 Authentication Setup

### Basic Setup

The app supports multiple authentication methods:

1. **Email/Password**: Built-in credentials authentication
2. **Guest Mode**: Temporary access without registration
3. **OAuth Providers**: Google, Facebook, GitHub, Discord

### OAuth Configuration

For each OAuth provider you want to enable:

1. Create an application in the provider's developer console
2. Set the redirect URI to: `http://localhost:3000/api/auth/callback/[provider]`
3. Add the client ID and secret to your `.env.local`

## 🤖 AI Provider Setup

### OpenAI

1. Create an account at [OpenAI](https://platform.openai.com)
2. Generate an API key
3. Add to `.env.local`: `OPENAI_API_KEY="your-key"`

### xAI (Grok)

1. Create an account at [xAI](https://x.ai)
2. Generate an API key
3. Add to `.env.local`: `XAI_API_KEY="your-key"`
4. Set the provider: `AI_PROVIDER="xai"`

## 📜 Available Scripts

### Development
- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Database Operations
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:reset` - Reset database
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:push` - Push schema changes
- `pnpm db:pull` - Pull schema from database

### Code Quality
- `pnpm lint` - Run ESLint and Biome linting
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format code with Biome

### Testing
- `pnpm test` - Run Playwright end-to-end tests

### Deployment Management
- `pnpm delete:vercel` - Delete Vercel projects
- `pnpm delete:neon` - Delete Neon projects
- `pnpm delete:all` - Delete all projects

### Prisma Operations
- `pnpm prisma:format` - Format Prisma schema
- `pnpm prisma:validate` - Validate Prisma schema

## 🔧 Utility Scripts

The application includes several utility scripts for development and maintenance tasks. These can be run directly with `npx tsx`:

### Project Management
```bash
# Delete unconnected Vercel projects (interactive)
npx tsx scripts/delete-unconnected-vercel-projects.ts

# Dry run to see what would be deleted
VERCEL_TOKEN=your_token npx tsx scripts/delete-unconnected-vercel-projects.ts --dry-run

# Force interactive mode
VERCEL_TOKEN=your_token npx tsx scripts/delete-unconnected-vercel-projects.ts --force

# Generate manual deletion commands
VERCEL_TOKEN=your_token npx tsx scripts/delete-unconnected-vercel-projects.ts --manual
```

### Database Diagnostics
```bash
# Diagnose Neon database setup issues
npx tsx scripts/diagnose-neon-setup.ts

# Test Neon-only functionality
npx tsx scripts/test-neon-only.ts
```

### Testing Scripts
```bash
# Test agent credentials API
npx tsx scripts/test-agent-credentials.ts

# Test full orchestrator deployment
npx tsx scripts/test-full-orchestrator-deployment.ts

# Test Vercel deployment step
npx tsx scripts/test-step4-vercel-deployment.ts

# Test deployment process
npx tsx scripts/test-step4-deployment.ts
```

### Cleanup Operations
```bash
# Delete all projects (Vercel + Neon)
npx tsx scripts/delete-all-projects.ts

# Delete only Vercel projects
npx tsx scripts/delete-vercel-projects.ts

# Delete only Neon projects
npx tsx scripts/delete-neon-projects.ts
```

### Script Prerequisites

Most scripts require environment variables:
```env
# Required for Vercel operations
VERCEL_TOKEN="your-vercel-token"

# Required for Neon operations
NEON_API_KEY="your-neon-api-key"

# Required for database operations
POSTGRES_URL="your-postgres-connection-string"
```

**Note**: Get your Vercel token from [vercel.com/account/tokens](https://vercel.com/account/tokens) and Neon API key from your Neon dashboard.

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Environment Variables**
   
   Add all environment variables from your `.env.local` to your Vercel project:
   ```bash
   vercel env add POSTGRES_URL
   vercel env add AUTH_SECRET
   vercel env add OPENAI_API_KEY
   # ... add all other variables
   ```

### Manual Deployment

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify
- Netlify

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (builder)/         # Agent builder interface
│   ├── (cron)/            # Scheduled jobs
│   └── api/               # API routes
├── components/            # React components
│   ├── agent-builder/     # Agent creation components
│   ├── ui/                # UI components
│   └── ...
├── lib/                   # Utility libraries
│   ├── ai/                # AI provider integrations
│   ├── db/                # Database utilities
│   └── ...
├── avatar-creator/        # 3D avatar creation
├── artifacts/             # Generated code artifacts
└── hooks/                 # React hooks
```

## 🎯 Usage

### Creating Your First Agent

1. **Sign up or use Guest Mode**
2. **Navigate to Agent Builder**
3. **Define Agent Properties**:
   - Name and description
   - Personality and behavior
   - Avatar selection
4. **Add Custom Actions** (optional):
   - Database queries
   - API calls
   - Custom functions
5. **Deploy Your Agent**
6. **Start Chatting**

### Managing Agents

- **View All Agents**: See your created agents
- **Edit Agents**: Modify properties and actions
- **Deploy Updates**: Push changes to production
- **Monitor Usage**: Track agent interactions

## 🔧 Advanced Configuration

### Custom Actions

Create powerful agent capabilities:

```typescript
// Example custom action
{
  name: "get_weather",
  description: "Get current weather for a location",
  parameters: {
    location: "string"
  },
  implementation: {
    type: "api_call",
    url: "https://api.weather.com/v1/current",
    headers: {
      "API-Key": "${WEATHER_API_KEY}"
    }
  }
}
```

### Database Integration

Agents can interact with your database:
- Query data
- Insert records
- Update information
- Execute stored procedures

### Cron Jobs

Schedule recurring tasks:
- Data synchronization
- Report generation
- Maintenance tasks
- Notifications

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your `POSTGRES_URL` format
   - Ensure database is running
   - Verify credentials

2. **AI Provider Errors**
   - Validate API keys
   - Check API quotas
   - Verify provider configuration

3. **Authentication Issues**
   - Check `AUTH_SECRET` is set
   - Verify OAuth redirect URIs
   - Clear browser cookies

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
```

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review error logs
3. Check environment configuration
4. Verify database connectivity

## 🔄 Updates

To update the application:

```bash
git pull origin main
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm build
```

---

**Happy Agent Building! 🤖✨**
