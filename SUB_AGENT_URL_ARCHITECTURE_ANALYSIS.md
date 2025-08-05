# Sub-Agent App URL Architecture Analysis

## Overview
The sub-agent app has a dual URL architecture where it needs to communicate with both the main orchestrator app and its own internal APIs. This document analyzes the current implementation and defines the correct usage patterns.

## URL Types

### 1. Main App URL (`NEXT_PUBLIC_MAIN_APP_URL`)
**Purpose**: The orchestrator app that deploys and manages sub-agents  
**Default**: `https://rewrite-complete.vercel.app`  
**Usage**: For fetching agent configuration, credentials, and orchestrating complex operations

### 2. Sub-Agent App URL (`NEXT_PUBLIC_APP_URL` / `VERCEL_URL`)  
**Purpose**: The deployed sub-agent app itself  
**Default**: `http://localhost:3000` (dev) / `https://{vercel-deployment}.vercel.app` (prod)  
**Usage**: For internal API calls and self-referencing operations

## Current Architecture Patterns

### Pattern 1: UI → Sub-Agent API → Main App
```
User Browser → Sub-Agent Frontend → Sub-Agent API → Main App API
```

**Example Flow**:
1. User visits `/models` page in sub-agent app
2. Frontend calls `/api/agent/models` (sub-agent's own API)
3. Sub-agent API calls `${MAIN_APP_URL}/api/agent-credentials-public` 
4. Main app returns agent configuration
5. Sub-agent API returns models to frontend

### Pattern 2: UI → Sub-Agent Local APIs (CRUD)
```
User Browser → Sub-Agent Frontend → Sub-Agent Local API → Local SQLite DB
```

**Example Flow**:
1. User views specific model records
2. Frontend calls `/api/models/User` (sub-agent's own CRUD API)
3. Sub-agent API queries local SQLite database via Prisma
4. Returns data directly from local database

### Pattern 3: Schedule/Action Execution
```
Vercel Cron → Sub-Agent Cron API → Main App API → External Services
```

**Example Flow**:
1. Vercel cron triggers `/api/cron/scheduler`
2. Cron API calls its own `/api/agent/schedules` (self-call)
3. Schedules API calls `${MAIN_APP_URL}/api/agent-credentials-public`
4. For each action, calls `${MAIN_APP_URL}/api/agent/execute-action`

## API Endpoint Categories

### A. Sub-Agent Internal APIs (Use Relative URLs)
**Pattern**: `fetch('/api/...')`

#### CRUD Operations:
- `/api/models/[modelName]` - Get/Create model records
- `/api/models/[modelName]/[id]` - Get/Update/Delete specific record

#### Internal Configuration:
- `/api/agent/config` - Sub-agent's own configuration
- `/api/health` - Health check endpoint

### B. Sub-Agent Proxy APIs (Call Main App)
**Pattern**: `fetch('/api/agent/...')` → calls `${MAIN_APP_URL}/api/...`

#### Agent Metadata:
- `/api/agent/models` → `${MAIN_APP_URL}/api/agent-credentials-public`
- `/api/agent/actions` → `${MAIN_APP_URL}/api/agent-credentials-public` 
- `/api/agent/schedules` → `${MAIN_APP_URL}/api/agent-credentials-public`

#### Test/Connection:
- `/api/agent/test-connection` → `${MAIN_APP_URL}/api/document`

### C. Dynamic Execution APIs (Call Main App)
**Pattern**: Direct calls to `${MAIN_APP_URL}/api/...`

#### Action Execution:
- Dynamic actions: `${MAIN_APP_URL}/api/agent/execute-action`
- Direct triggers: `${MAIN_APP_URL}/api/agent/execute-action`

#### Schedule Execution:  
- Schedule triggers: `${MAIN_APP_URL}/api/agent/execute-schedule`

## Self-Referencing Issue

### Problem Identified
In `/api/cron/scheduler`, there's a problematic self-call:
```javascript
// ❌ CURRENT: Uses hardcoded localhost
const response = await fetch('http://localhost:3000/api/agent/schedules');
```

### Fixed Implementation  
```javascript
// ✅ CORRECT: Dynamic URL resolution
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';
const response = await fetch(`${APP_URL}/api/agent/schedules`);
```

## Environment Variable Usage

### Main App Communication
```javascript
const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
const DOCUMENT_ID = process.env.NEXT_PUBLIC_DOCUMENT_ID || '';
const AGENT_TOKEN = process.env.NEXT_PUBLIC_AGENT_TOKEN || '';
```

### Sub-Agent Self-Reference
```javascript
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
```

## Data Flow Architecture

### Configuration Data (Main App → Sub-Agent)
1. **Agent Metadata**: Models, actions, schedules definitions
2. **Credentials**: API keys, OAuth tokens for external services  
3. **Settings**: Theme, name, avatar configurations

### Operational Data (Sub-Agent Local)
1. **Model Records**: All CRUD operations on business data
2. **Local State**: UI state, temporary data
3. **Execution Logs**: Local logging and monitoring

### Execution Commands (Sub-Agent → Main App)
1. **Action Triggers**: Execute actions with credentials
2. **Schedule Triggers**: Execute scheduled workflows
3. **Status Updates**: Report execution results

## Authentication Flow

### Sub-Agent → Main App
```javascript
headers: {
  'Authorization': `Bearer ${AGENT_TOKEN}`,
  'X-Agent-Token': AGENT_TOKEN,
  'X-Document-ID': DOCUMENT_ID,
}
```

### Internal API Calls
- No authentication required for self-calls
- Cron endpoints use `CRON_SECRET` for security

## Current Issues to Fix

### 1. Inconsistent Self-Referencing
**Issue**: Some APIs use hardcoded localhost URLs  
**Impact**: Breaks in production Vercel environment  
**Solution**: Use dynamic URL resolution

### 2. Missing Error Handling  
**Issue**: No fallback when main app is unreachable  
**Impact**: Sub-agent becomes completely non-functional  
**Solution**: Graceful degradation with cached data

### 3. Credential Refresh
**Issue**: No automatic token refresh mechanism  
**Impact**: Authentication failures over time  
**Solution**: Implement token refresh logic

## Recommended Fixes

### 1. Standardize URL Resolution
Create a helper function for consistent URL resolution:
```javascript
// utils/urls.ts
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

export function getMainAppUrl(): string {
  return process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
}
```

### 2. Fix Self-Referencing APIs
Update cron scheduler and any other self-calling APIs to use dynamic URLs.

### 3. Add Fallback Mechanisms
Implement caching and graceful degradation when main app is unreachable.

### 4. Environment Variable Validation
Add startup checks to ensure all required environment variables are present.

## Detailed Component Mappings

### 🎯 Actions System

#### Action Definition Flow
```
Main App → Agent Builder → Sub-Agent Deployment
```
1. **Action Creation**: User defines actions in main app with parameters, steps, and UI components
2. **Action Storage**: Actions stored in main app's agent configuration (metadata)
3. **Action Deployment**: Sub-agent receives action definitions during deployment

#### Action Execution Flow
```
Sub-Agent UI → Action Modal → Local API → Main App API → External Services
```

**Detailed Steps:**
1. **UI Trigger**: User clicks action card on `/actions` page
2. **Modal Display**: `ActionExecutionModal` shows action parameters and description
3. **Parameter Input**: User fills in required parameters via generated form
4. **Local API Call**: Frontend calls `/api/actions/trigger-action/[actionId]`
5. **Main App Execution**: Sub-agent API calls `${MAIN_APP_URL}/api/agent/execute-action`
6. **External Service**: Main app executes action with credentials and parameters
7. **Result Display**: Results shown in modal with success/error status

#### Action API Endpoints
- **Configuration**: `/api/agent/actions` → `${MAIN_APP_URL}/api/agent-credentials-public`
- **Execution**: `/api/actions/trigger-action/[actionId]` → `${MAIN_APP_URL}/api/agent/execute-action`
- **Dynamic**: `/api/actions/[actionName]` → `${MAIN_APP_URL}/api/agent/execute-action`

### ⏰ Schedules System

#### Schedule Definition Flow
```
Main App → Agent Builder → Sub-Agent Deployment → Vercel Cron
```
1. **Schedule Creation**: User defines schedules with cron patterns and action sequences
2. **Schedule Storage**: Schedules stored in main app's agent configuration
3. **Cron Registration**: Vercel cron job registered to call `/api/cron/scheduler`

#### Schedule Execution Flow
```
Vercel Cron → Cron API → Self-Call → Main App API → Action Execution
```

**Detailed Steps:**
1. **Cron Trigger**: Vercel calls `/api/cron/scheduler` every minute
2. **Schedule Fetch**: Cron API calls `${APP_URL}/api/agent/schedules` (self-call)
3. **Schedule Filter**: Determines which schedules should run based on cron patterns
4. **Credential Fetch**: Gets API keys/tokens from `${MAIN_APP_URL}/api/agent-credentials-public`
5. **Action Execution**: For each schedule step, calls `${MAIN_APP_URL}/api/agent/execute-action`
6. **Result Logging**: Logs execution results and timestamps

#### Schedule API Endpoints
- **Configuration**: `/api/agent/schedules` → `${MAIN_APP_URL}/api/agent-credentials-public`
- **Cron Execution**: `/api/cron/scheduler` → `${APP_URL}/api/agent/schedules` (self-call)
- **Direct Trigger**: `/api/schedules/trigger-schedule/[scheduleId]` → `${MAIN_APP_URL}/api/agent/execute-schedule`

### 📊 Models System (CRUD Operations)

#### Model Definition Flow
```
Main App → Agent Builder → Sub-Agent → Prisma Schema → SQLite Database
```
1. **Model Definition**: User defines data models with fields and relationships
2. **Schema Generation**: Prisma schema generated with model definitions
3. **Database Creation**: SQLite database created with `prisma db push`
4. **Client Generation**: Prisma client generated for type-safe database access

#### Model CRUD Flow
```
Sub-Agent UI → Local API → Prisma Client → SQLite Database
```

**Detailed Steps:**

##### Read Operations (GET):
1. **UI Request**: User visits `/models/[modelName]` page
2. **API Call**: Frontend calls `/api/models/[modelName]` with pagination/search params
3. **Database Query**: API uses `prisma[modelName].findMany()` with filters
4. **Result Display**: Records displayed in cards with field values

##### Create Operations (POST):
1. **Form Submission**: User submits create form on model detail page
2. **API Call**: Frontend calls `/api/models/[modelName]` with POST method
3. **Database Insert**: API uses `prisma[modelName].create()` with form data
4. **Result Update**: New record added to UI list

##### Update Operations (PUT):
1. **Edit Trigger**: User clicks edit on record card
2. **API Call**: Frontend calls `/api/models/[modelName]/[id]` with PUT method
3. **Database Update**: API uses `prisma[modelName].update()` with new data
4. **Result Refresh**: Updated record shown in UI

##### Delete Operations (DELETE):
1. **Delete Trigger**: User clicks delete button
2. **API Call**: Frontend calls `/api/models/[modelName]/[id]` with DELETE method
3. **Database Delete**: API uses `prisma[modelName].delete()` 
4. **UI Update**: Record removed from display

#### Model API Endpoints
- **Configuration**: `/api/agent/models` → `${MAIN_APP_URL}/api/agent-credentials-public`
- **CRUD Operations**: `/api/models/[modelName]` → Direct SQLite via Prisma
- **Individual Records**: `/api/models/[modelName]/[id]` → Direct SQLite via Prisma

### 💬 Chat System

#### Chat Configuration Flow
```
Main App → API Keys → Sub-Agent → AI Model Selection
```
1. **API Key Fetch**: Sub-agent gets OpenAI/Anthropic keys from main app
2. **Model Selection**: Chooses model based on availability and configuration
3. **Context Setup**: Loads agent configuration, models, actions, and schedules as context

#### Chat Execution Flow
```
Sub-Agent UI → Chat API → AI Provider → Streaming Response
```

**Detailed Steps:**
1. **Message Input**: User types message in chat interface
2. **Context Building**: API builds context with agent metadata and capabilities
3. **AI Provider Call**: Calls OpenAI/Anthropic with streaming enabled
4. **Response Streaming**: AI response streamed back to frontend in real-time
5. **Message Storage**: Messages stored in local state (not persisted)

#### Chat API Endpoints
- **Chat Streaming**: `/api/chat` → OpenAI/Anthropic APIs
- **Credential Fetch**: `${MAIN_APP_URL}/api/user/api-keys` for AI API keys
- **Agent Context**: `${MAIN_APP_URL}/api/agent-credentials-public` for agent metadata

### 🔄 Cross-Component Integration

#### Agent Configuration Sync
```
Main App Storage → Sub-Agent Fetch → UI Display → User Interaction
```
- **Models**: Configuration fetched → CRUD UI generated → Database operations
- **Actions**: Configuration fetched → Action cards → Execution modals
- **Schedules**: Configuration fetched → Schedule cards → Cron execution
- **Chat**: Configuration fetched → Context building → AI conversations

#### Authentication Chain
```
Deployment → Environment Variables → API Headers → Main App Validation
```
1. **DOCUMENT_ID**: Identifies the specific agent instance
2. **AGENT_TOKEN**: Authenticates requests to main app
3. **Headers**: Passed in Authorization, X-Agent-Token, X-Document-ID
4. **Validation**: Main app validates tokens and returns appropriate data

## Current Issues to Fix

### 1. Inconsistent Self-Referencing
**Issue**: Some APIs use hardcoded localhost URLs  
**Impact**: Breaks in production Vercel environment  
**Solution**: Use dynamic URL resolution

### 2. Missing Error Handling  
**Issue**: No fallback when main app is unreachable  
**Impact**: Sub-agent becomes completely non-functional  
**Solution**: Graceful degradation with cached data

### 3. Credential Refresh
**Issue**: No automatic token refresh mechanism  
**Impact**: Authentication failures over time  
**Solution**: Implement token refresh logic

### 4. Chat Persistence
**Issue**: Chat messages not persisted to database
**Impact**: Conversations lost on page refresh
**Solution**: Store chat history in SQLite

### 5. Real-time Updates
**Issue**: No real-time sync between cron executions and UI
**Impact**: Users don't see schedule execution results immediately
**Solution**: Add WebSocket or polling for live updates

## Recommended Fixes

### 1. Standardize URL Resolution
Create a helper function for consistent URL resolution:
```javascript
// utils/urls.ts
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

export function getMainAppUrl(): string {
  return process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://rewrite-complete.vercel.app';
}
```

### 2. Fix Self-Referencing APIs
Update cron scheduler and any other self-calling APIs to use dynamic URLs.

### 3. Add Fallback Mechanisms
Implement caching and graceful degradation when main app is unreachable.

### 4. Environment Variable Validation
Add startup checks to ensure all required environment variables are present.

### 5. Enhance Data Persistence
Store chat history, execution logs, and schedule results in SQLite for better user experience.

## Summary

The sub-agent app architecture correctly separates concerns between:
- **Main App APIs**: For orchestration, configuration, and execution
- **Local APIs**: For CRUD operations and internal management
- **Self-Reference APIs**: For internal communication (needs fixing)

Each component (Actions, Schedules, Models, Chat) has a clear data flow pattern, but some issues need addressing for production reliability. The main issue is inconsistent URL resolution for self-referencing calls, which breaks the app in production environments. 