# AI Chat SDK - Complete Feature Documentation

## Overview

The AI Chat SDK is a comprehensive, full-stack AI-powered application platform that combines an advanced chatbot interface with a powerful agent builder system. Built with Next.js 15, React 19, and the AI SDK, it enables users to have intelligent conversations and automatically generate complete, functional applications from natural language descriptions.

## 🌟 Key Features

### 1. Advanced AI Chat Interface
- **Multi-Model Support**: Seamlessly switch between xAI (Grok 3) and OpenAI (GPT-4o, GPT-4o Mini) models
- **Multimodal Input**: Support for text, images, and file attachments
- **Real-time Streaming**: Live response streaming with typing indicators
- **Message Actions**: Vote, edit, copy, and regenerate messages
- **Chat History**: Persistent conversation storage with sidebar navigation
- **Visibility Controls**: Public/private chat sharing options

### 2. Agent Builder System
The crown jewel of the platform - an AI system that generates complete, functional applications from natural language prompts.

#### 🤖 What the Agent Builder Creates:
- **Database Models**: Complete data schemas with relationships, fields, and enums
- **Executable Actions**: Business logic with auto-generated UI components
- **Automated Schedules**: CRUD operations with cron-based triggers
- **Complete Applications**: Fully functional apps that run independently

#### 🔧 Agent Builder Capabilities:
- **Natural Language Processing**: Converts plain English descriptions into technical specifications
- **Progressive Generation**: Step-by-step creation with real-time progress tracking
- **Intelligent Merging**: Updates existing agents without losing data
- **Code Generation**: Produces executable JavaScript/TypeScript code
- **UI Generation**: Creates interactive forms and interfaces
- **Database Design**: Defines tables, relationships, and constraints

### 3. Artifact System
Interactive code execution and preview environment supporting multiple artifact types:

#### 📝 **Text Artifacts**
- Rich text editing with ProseMirror
- Real-time collaboration features
- Version history and diff viewing
- Export capabilities

#### 💻 **Code Artifacts**
- Interactive code editor with syntax highlighting
- Multiple language support (JavaScript, Python, etc.)
- Live code execution and preview
- Error handling and debugging support

#### 📊 **Sheet Artifacts**
- Spreadsheet functionality with data grid
- Formula support and calculations
- Data import/export capabilities
- Interactive data manipulation

#### 🖼️ **Image Artifacts**
- Image viewing and basic editing
- Support for multiple image formats
- Integration with AI image generation

#### 🎯 **Agent Artifacts**
- Visual agent builder interface
- Real-time agent preview and testing
- Component-based architecture
- Deployment and sharing capabilities

### 4. Database & Data Management
- **PostgreSQL Integration**: Robust data persistence with Drizzle ORM
- **User Management**: Authentication with NextAuth.js
- **Chat Storage**: Persistent conversation history
- **Document Versioning**: Complete version control for all artifacts
- **Vote System**: Message rating and feedback collection
- **File Storage**: Vercel Blob integration for file uploads

### 5. Authentication & Security
- **NextAuth.js Integration**: Secure authentication system
- **Guest Mode**: Limited access for anonymous users
- **API Key Management**: Encrypted storage of AI provider keys
- **Role-based Access**: Admin and member permissions
- **Secure Middleware**: Route protection and authentication checks

### 6. Developer Experience
- **TypeScript**: Full type safety throughout the application
- **Modern React**: React 19 with Server Components and Server Actions
- **Tailwind CSS**: Utility-first styling with shadcn/ui components
- **Biome**: Fast linting and formatting
- **Playwright**: End-to-end testing
- **Hot Reload**: Turbo development mode

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 (Release Candidate)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: SWR for data fetching, Zustand for global state
- **Animations**: Framer Motion
- **Code Editor**: CodeMirror 6
- **Rich Text**: ProseMirror
- **Icons**: Lucide React + Radix UI Icons

### Backend Stack
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js 5 (Beta)
- **File Storage**: Vercel Blob
- **Caching**: Redis (optional)
- **API Routes**: Next.js API routes with streaming support
- **AI Integration**: AI SDK with multiple provider support

### AI Providers
- **xAI (Grok)**: Default provider with Grok-3 model
- **OpenAI**: GPT-4o and GPT-4o Mini support
- **Extensible**: Easy to add new providers via AI SDK

## 🚀 Key Components

### Chat Interface (`components/chat.tsx`)
- Main chat component with real-time messaging
- Model selection and provider switching
- Message history and state management
- Integration with artifact system

### Agent Builder (`lib/ai/tools/agent-builder/`)
- Core agent generation logic
- Progressive step-by-step creation
- Intelligent merging and updates
- Code generation and validation

### Artifact System (`components/artifact.tsx`)
- Multi-type artifact support
- Real-time preview and editing
- Version control and collaboration
- Save and share functionality

### Message Component (`components/message.tsx`)
- Rich message rendering with markdown support
- Tool call visualization
- Action buttons and voting
- Artifact integration

### Multimodal Input (`components/multimodal-input.tsx`)
- Text input with auto-resize
- File upload and attachment handling
- Suggested actions
- Keyboard shortcuts

## 📊 Database Schema

### Core Tables
```sql
-- Users with encrypted API keys
User {
  id: UUID (Primary Key)
  email: String
  password: String (hashed)
  openaiApiKey: Text (encrypted)
  xaiApiKey: Text (encrypted)
  createdAt: DateTime
  updatedAt: DateTime
}

-- Chat conversations
Chat {
  id: UUID (Primary Key)
  title: String
  userId: UUID (Foreign Key)
  visibility: Enum ('public', 'private')
  createdAt: DateTime
}

-- Individual messages
Message {
  id: UUID (Primary Key)
  chatId: UUID (Foreign Key)
  role: String ('user', 'assistant', 'system')
  parts: JSON (multimodal content)
  attachments: JSON
  createdAt: DateTime
}

-- Documents/Artifacts
Document {
  id: UUID
  createdAt: DateTime (Part of composite key)
  title: String
  content: Text
  kind: Enum ('text', 'code', 'image', 'sheet', 'agent')
  userId: UUID (Foreign Key)
  metadata: JSON
}

-- Message voting
Vote {
  chatId: UUID (Foreign Key)
  messageId: UUID (Foreign Key)
  isUpvoted: Boolean
}

-- Document suggestions
Suggestion {
  id: UUID (Primary Key)
  documentId: UUID
  documentCreatedAt: DateTime
  originalText: Text
  suggestedText: Text
  description: Text
  isResolved: Boolean
  userId: UUID (Foreign Key)
  createdAt: DateTime
}
```

## 🔧 API Endpoints

### Chat APIs
- `POST /api/chat` - Stream chat responses
- `GET /api/chat` - Get chat history
- `DELETE /api/chat` - Delete chat

### Agent APIs
- `POST /api/agent/generate-code` - Generate agent code
- `POST /api/agent/execute-action` - Execute agent action
- `POST /api/agent/test-action` - Test agent functionality
- `GET /api/agent/schedules` - Get agent schedules
- `POST /api/agent/execute-schedule` - Run scheduled tasks

### Document APIs
- `GET /api/document` - Get document by ID
- `POST /api/document` - Create/update document
- `DELETE /api/document` - Delete document

### File APIs
- `POST /api/files/upload` - Upload files to Vercel Blob
- `GET /api/files/:id` - Retrieve uploaded files

### Cron APIs
- `POST /api/cron/execute-schedules` - Trigger scheduled tasks

### Authentication APIs
- `/api/auth/*` - NextAuth.js endpoints
- `GET /api/auth/guest` - Guest access endpoint

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database
- Redis (optional)
- xAI and/or OpenAI API keys

### Environment Variables
```bash
# Authentication
AUTH_SECRET=your-auth-secret

# AI Providers
XAI_API_KEY=your-xai-key
OPENAI_API_KEY=your-openai-key
AI_PROVIDER=xai

# Database
POSTGRES_URL=your-postgres-connection-string

# File Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Caching (optional)
REDIS_URL=your-redis-url
```

### Installation Steps
```bash
# Clone the repository
git clone <repository-url>
cd ai-chatbot

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
pnpm db:migrate

# Start development server
pnpm dev
```

### Database Management
```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Reset database
pnpm db:reset

# Open database studio
pnpm db:studio

# Push schema changes
pnpm db:push
```

## 🧪 Testing

### End-to-End Testing
```bash
# Run Playwright tests
pnpm test
```

### Linting & Formatting
```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Manual Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔐 Security Features

- **API Key Encryption**: All AI provider keys are encrypted at rest
- **Authentication Middleware**: Protects routes and API endpoints
- **Input Validation**: Zod schemas for type-safe data validation
- **CORS Protection**: Secure cross-origin request handling
- **Rate Limiting**: Built-in request throttling
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first responsive interface
- **Dark/Light Mode**: Theme switching with next-themes
- **Accessibility**: ARIA labels and keyboard navigation
- **Animations**: Smooth transitions with Framer Motion
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: User-friendly error messages and fallbacks
- **Keyboard Shortcuts**: Productivity-focused shortcuts

## 🔄 Real-time Features

- **Streaming Responses**: Live AI response streaming
- **Progress Tracking**: Real-time agent building progress
- **Auto-save**: Automatic document saving
- **Live Preview**: Real-time artifact preview
- **Collaborative Editing**: Multi-user document editing

## 📈 Performance Optimizations

- **Server Components**: React Server Components for better performance
- **Streaming**: Response streaming for faster perceived loading
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js image optimization
- **Caching**: SWR for client-side caching, Redis for server-side
- **Lazy Loading**: Component lazy loading for better initial load

## 🔧 Customization

### Adding New AI Providers
1. Update `lib/ai/providers.ts`
2. Add provider configuration in `lib/ai/models.ts`
3. Update environment variables

### Creating Custom Artifacts
1. Add artifact definition in `artifacts/`
2. Register in `components/artifact.tsx`
3. Implement client and server components

### Extending Agent Builder
1. Modify schemas in `lib/ai/tools/agent-builder/schemas.ts`
2. Update generation logic in `generation.ts`
3. Add new step types in `types.ts`

## 📚 Documentation

- **API Documentation**: Auto-generated from TypeScript types
- **Component Storybook**: Interactive component documentation
- **Agent Builder Spec**: Complete specification in `AGENT_BUILDER_COMPLETE_SPEC.md`
- **Architecture Docs**: Technical architecture documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Add tests for new features
- Update documentation
- Follow existing code style

## 📄 License

MIT License - see `LICENSE` file for details.

## 🆘 Support

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community discussions and questions
- **Documentation**: Comprehensive docs at [chat-sdk.dev](https://chat-sdk.dev)

---

This AI Chat SDK represents the cutting edge of conversational AI and automated application generation, providing developers and users with unprecedented capabilities for creating intelligent, interactive applications through natural language interaction. 