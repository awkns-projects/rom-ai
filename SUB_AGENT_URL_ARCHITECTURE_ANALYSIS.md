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
1. **Action Creation**: User defines actions in main app with parameters, steps, UI components, and executable code
2. **Action Storage**: Actions stored in main app's agent configuration (metadata + code)
3. **Action Deployment**: Sub-agent receives action definitions during deployment

#### Action Execution Flow (CORRECTED)
```
Sub-Agent UI → Action Modal → Local API → Fetch Code from Main App → Execute Locally → External Services
```

**Detailed Steps:**
1. **UI Trigger**: User clicks action card on `/actions` page
2. **Modal Display**: `ActionExecutionModal` shows action parameters and description
3. **Parameter Input**: User fills in required parameters via generated form
4. **Local API Call**: Frontend calls `/api/actions/trigger-action/[actionId]`
5. **Code Fetch**: Sub-agent API calls `${MAIN_APP_URL}/api/agent/actions` to get action code and configuration
6. **Credential Fetch**: Sub-agent API calls `${MAIN_APP_URL}/api/agent-credentials-public` to get API keys
7. **Local Execution**: Sub-agent executes the action code locally with credentials and parameters
8. **External Service**: Action code calls external APIs (Shopify, Stripe, etc.) directly from sub-agent
9. **Result Display**: Results shown in modal with success/error status
10. **Logging**: Execution details logged to SQLite database

#### Action API Endpoints (CORRECTED)
- **Configuration & Code**: `/api/agent/actions` → `${MAIN_APP_URL}/api/agent/actions` (get action definitions + code)
- **Credentials**: `/api/agent/credentials` → `${MAIN_APP_URL}/api/agent-credentials-public` (get API keys)
- **Local Execution**: `/api/actions/trigger-action/[actionId]` → Execute locally with fetched code
- **Dynamic Execution**: `/api/actions/[actionName]` → Execute locally with fetched code

#### UI ↔ API Interaction for Actions
```
Actions Page (/actions):
├── Load: GET /api/agent/actions → Display action cards
├── Click Action → Open ActionExecutionModal
├── Fill Parameters → Show dynamic form based on action.uiComponents
├── Execute → POST /api/actions/trigger-action/[actionId] with parameters
└── Results → Display success/error + execution logs
```

### ⏰ Schedules System

#### Schedule Definition Flow
```
Main App → Agent Builder → Sub-Agent Deployment → Vercel Cron
```
1. **Schedule Creation**: User defines schedules with cron patterns and action chain sequences
2. **Schedule Storage**: Schedules stored in main app's agent configuration (action chains)
3. **Cron Registration**: Vercel cron job registered to call `/api/cron/scheduler` every minute

#### Schedule Execution Flow (CORRECTED)
```
Vercel Cron → Cron API → Fetch Schedules → Check Timing → Fetch Action Code → Execute Action Chain Locally → Log Results
```

**Detailed Steps:**
1. **Cron Trigger**: Vercel calls `/api/cron/scheduler` every minute
2. **Schedule Fetch**: Cron API calls `${MAIN_APP_URL}/api/agent/schedules` to get all schedule definitions
3. **Previous Run Check**: For each schedule, check SQLite `schedule_executions` table for last run time
4. **Timing Evaluation**: Compare current time vs last run + cron pattern to determine if execution is needed
5. **Schedule Filter**: Only process schedules that should run now based on timing logic
6. **Action Code Fetch**: For each action in the schedule chain, fetch code from `${MAIN_APP_URL}/api/agent/actions`
7. **Credential Fetch**: Get API keys/tokens from `${MAIN_APP_URL}/api/agent-credentials-public`
8. **Local Action Chain Execution**: Execute each action in sequence locally with parameters and delays
9. **Step Logging**: Log each action execution result to SQLite `action_execution_logs` table
10. **Schedule Completion**: Log overall schedule completion to SQLite `schedule_executions` table
11. **Error Handling**: Stop chain execution if action fails (configurable per action)

#### Schedule Timing Logic (CRITICAL)
```javascript
// Pseudo-code for schedule timing check
function shouldScheduleRun(schedule, lastRunTime) {
  const now = new Date();
  const cronPattern = schedule.interval.pattern; // e.g., "*/5 * * * *" (every 5 minutes)
  
  if (!lastRunTime) {
    return true; // First run
  }
  
  const nextRunTime = calculateNextRun(lastRunTime, cronPattern);
  return now >= nextRunTime;
}

function calculateNextRun(lastRun, cronPattern) {
  // Parse cron pattern and calculate next execution time
  // Examples:
  // "* * * * *" = every minute
  // "*/5 * * * *" = every 5 minutes  
  // "0 * * * *" = every hour
  // "0 9 * * *" = every day at 9 AM
}
```

#### Schedule Database Schema (Required)
```sql
-- Store schedule execution history
CREATE TABLE schedule_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id TEXT NOT NULL,
  schedule_name TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  total_actions INTEGER NOT NULL,
  successful_actions INTEGER NOT NULL,
  failed_actions INTEGER NOT NULL,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store individual action execution logs
CREATE TABLE action_execution_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_execution_id INTEGER,
  action_id TEXT NOT NULL,
  action_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  input_parameters TEXT, -- JSON
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  result_data TEXT, -- JSON
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_execution_id) REFERENCES schedule_executions(id)
);
```

#### Schedule API Endpoints (CORRECTED)
- **Schedule Definitions**: Cron calls `${MAIN_APP_URL}/api/agent/schedules` (get schedule configurations)
- **Action Code**: Cron calls `${MAIN_APP_URL}/api/agent/actions` (get action code for each step)
- **Credentials**: Cron calls `${MAIN_APP_URL}/api/agent-credentials-public` (get API keys)
- **Execution History**: Local SQLite queries to `schedule_executions` and `action_execution_logs`
- **Cron Endpoint**: `/api/cron/scheduler` → Execute locally with fetched schedules and action code
- **Manual Trigger**: `/api/schedules/trigger-schedule/[scheduleId]` → Execute specific schedule manually

#### UI ↔ API Interaction for Schedules
```
Schedules Page (/schedules):
├── Load: GET /api/agent/schedules → Display schedule cards with next run times
├── Manual Trigger: POST /api/schedules/trigger-schedule/[scheduleId]
├── View Logs: GET /api/schedules/[scheduleId]/executions → Show execution history
└── Real-time Updates: WebSocket or polling for live execution status

Schedule Execution Logs:
├── Overall Schedule: schedule_executions table
├── Individual Actions: action_execution_logs table  
├── Timing Data: start/end times, duration, success/failure
└── Error Details: full error messages and stack traces
```

### 📊 Models System (CRUD Operations) ✅ CORRECT

#### Model Definition Flow
```
Main App → Agent Builder → Sub-Agent → Prisma Schema → SQLite Database
```
1. **Model Definition**: User defines data models with fields and relationships in main app
2. **Schema Generation**: Prisma schema generated with model definitions during deployment
3. **Database Creation**: SQLite database created with `prisma db push` during build
4. **Client Generation**: Prisma client generated for type-safe database access

#### Model CRUD Flow (LOCAL OPERATIONS ONLY)
```
Sub-Agent UI → Local API → Prisma Client → SQLite Database
```

**Detailed Steps:**

##### Read Operations (GET):
1. **UI Request**: User visits `/models/[modelName]` page
2. **API Call**: Frontend calls `/api/models/[modelName]` with pagination/search params
3. **Database Query**: API uses `prisma[modelName].findMany()` with filters directly on local SQLite
4. **Result Display**: Records displayed in cards with field values

##### Create Operations (POST):
1. **Form Submission**: User submits create form on model detail page
2. **API Call**: Frontend calls `/api/models/[modelName]` with POST method and data
3. **Database Insert**: API uses `prisma[modelName].create()` with form data directly to local SQLite
4. **Result Update**: New record added to UI list immediately

##### Update Operations (PUT):
1. **Edit Trigger**: User clicks edit on record card  
2. **API Call**: Frontend calls `/api/models/[modelName]/[id]` with PUT method and updated data
3. **Database Update**: API uses `prisma[modelName].update()` with new data directly to local SQLite
4. **Result Refresh**: Updated record shown in UI immediately

##### Delete Operations (DELETE):
1. **Delete Trigger**: User clicks delete button
2. **API Call**: Frontend calls `/api/models/[modelName]/[id]` with DELETE method
3. **Database Delete**: API uses `prisma[modelName].delete()` directly from local SQLite
4. **UI Update**: Record removed from display immediately

#### Model API Endpoints (LOCAL ONLY)
- **Model List Configuration**: `/api/agent/models` → `${MAIN_APP_URL}/api/agent-credentials-public` (get model definitions for UI)
- **CRUD Operations**: `/api/models/[modelName]` → **Direct SQLite via Prisma** (no main app calls)
- **Individual Records**: `/api/models/[modelName]/[id]` → **Direct SQLite via Prisma** (no main app calls)

#### UI ↔ API Interaction for Models
```
Models Page (/models):
├── Load: GET /api/agent/models → Get model definitions from main app for UI display
├── Model List: Display cards for each model with record counts
├── Click Model → Navigate to /models/[modelName]

Model Detail Page (/models/[modelName]):
├── Load Records: GET /api/models/[modelName]?page=1&limit=10 → Direct SQLite query
├── Search: GET /api/models/[modelName]?search=term → Direct SQLite query with filters
├── Create Record: POST /api/models/[modelName] with JSON body → Direct SQLite insert
├── Update Record: PUT /api/models/[modelName]/[id] with JSON body → Direct SQLite update  
├── Delete Record: DELETE /api/models/[modelName]/[id] → Direct SQLite delete
└── Real-time Updates: Immediate UI refresh after each operation
```

**IMPORTANT**: Models system is fully autonomous and does NOT call main app for data operations - only for initial configuration.

### 💬 Chat System ✅ MOSTLY CORRECT

#### Chat Configuration Flow
```
Main App → API Keys → Sub-Agent → AI Model Selection
```
1. **API Key Fetch**: Sub-agent gets OpenAI/Anthropic keys from main app
2. **Model Selection**: Chooses model based on availability and configuration  
3. **Context Setup**: Loads agent configuration, models, actions, and schedules as context

#### Chat Execution Flow
```
Sub-Agent UI → Chat API → Fetch Keys → AI Provider → Streaming Response
```

**Detailed Steps:**
1. **Message Input**: User types message in chat interface
2. **API Key Fetch**: Chat API calls `${MAIN_APP_URL}/api/user/api-keys` to get OpenAI/Anthropic keys
3. **Agent Context Fetch**: Chat API calls `${MAIN_APP_URL}/api/agent-credentials-public` for agent metadata
4. **Context Building**: API builds context with agent name, description, models, actions, and schedules
5. **AI Provider Call**: Calls OpenAI/Anthropic with streaming enabled and full context
6. **Response Streaming**: AI response streamed back to frontend in real-time
7. **Message Storage**: Messages stored in local state (⚠️ NOT persisted - lost on refresh)

#### Chat API Endpoints ✅ CORRECT
- **Chat Streaming**: `/api/chat` → Fetch keys → OpenAI/Anthropic APIs
- **API Key Fetch**: `${MAIN_APP_URL}/api/user/api-keys` for AI API keys
- **Agent Context**: `${MAIN_APP_URL}/api/agent-credentials-public` for agent metadata

#### UI ↔ API Interaction for Chat
```
Chat Page (/chat):
├── Load: Initialize useChat hook with /api/chat endpoint
├── Message Input: Type message and press enter
├── Send: POST /api/chat with message history
├── Stream Response: Receive AI response in real-time chunks
├── Display: Show conversation history in chat bubbles
└── ⚠️ Issue: Messages lost on page refresh (not persisted)

Chat Context Built:
├── Agent Name: From main app configuration
├── Agent Description: From main app configuration  
├── Available Models: List of data models and their purposes
├── Available Actions: List of actions and their capabilities
└── Available Schedules: List of scheduled tasks and their functions
```

**IMPROVEMENT NEEDED**: Chat messages should be persisted to SQLite for conversation history.

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

## Critical Issues to Fix

### 1. ❌ CRITICAL: Wrong Action Execution Pattern
**Current Issue**: Actions call main app for execution  
**Should Be**: Fetch action code from main app, execute locally in sub-agent  
**Impact**: Violates the autonomous sub-agent architecture  
**Solution**: Implement local action code execution with fetched credentials

### 2. ❌ CRITICAL: Missing Schedule Timing Logic  
**Current Issue**: No proper cron timing evaluation logic  
**Should Be**: Check last run time vs cron pattern to determine if schedule should run  
**Impact**: Schedules may run too frequently or not at all  
**Solution**: Implement `shouldScheduleRun()` function with cron pattern parsing

### 3. ❌ CRITICAL: Missing Schedule Execution Logging
**Current Issue**: No database tables for tracking schedule and action execution history  
**Should Be**: Complete logging of all executions with timing and results  
**Impact**: No visibility into what schedules ran and their outcomes  
**Solution**: Add `schedule_executions` and `action_execution_logs` tables

### 4. ❌ CRITICAL: Inconsistent Self-Referencing URLs
**Current Issue**: Cron scheduler uses hardcoded `localhost:3000`  
**Should Be**: Dynamic URL resolution using `VERCEL_URL` or `NEXT_PUBLIC_APP_URL`  
**Impact**: Breaks in production Vercel environment  
**Solution**: Use `getAppUrl()` helper function

### 5. ⚠️ Missing Action Code Storage/Execution
**Current Issue**: No mechanism to fetch and execute action code locally  
**Should Be**: Fetch action code from main app and execute with local credentials  
**Impact**: Actions cannot run autonomously in sub-agent  
**Solution**: Implement action code fetching and local execution engine

### 6. ⚠️ Chat Messages Not Persisted
**Current Issue**: Chat conversations lost on page refresh  
**Should Be**: Store chat history in SQLite database  
**Impact**: Poor user experience, conversations not saved  
**Solution**: Add chat persistence with message history tables

### 7. ⚠️ Missing Real-time Schedule Status
**Current Issue**: No real-time sync between cron executions and UI  
**Should Be**: Live updates of schedule execution status  
**Impact**: Users don't see execution results immediately  
**Solution**: Add WebSocket or polling for live execution updates

### 8. ⚠️ No Error Fallback Mechanisms
**Current Issue**: Sub-agent fails completely when main app is unreachable  
**Should Be**: Graceful degradation with cached data  
**Impact**: Sub-agent becomes non-functional during main app outages  
**Solution**: Implement caching and offline operation modes

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

### Corrected Sub-Agent Architecture Understanding

The sub-agent app should operate with **maximum autonomy** while fetching configuration and credentials from the main app:

#### ✅ **Correct Architecture Patterns:**

**Models System**: ✅ **Fully Local**
- Configuration from main app → Local CRUD operations → Direct SQLite via Prisma
- No main app calls for data operations

**Actions System**: ❌ **Needs Major Correction**  
- **Current**: Sub-agent calls main app to execute actions
- **Should Be**: Fetch action code + credentials from main app → Execute locally in sub-agent
- **Benefit**: Autonomous execution, reduced latency, better reliability

**Schedules System**: ❌ **Needs Major Correction**
- **Current**: Basic cron without proper timing logic or logging
- **Should Be**: Proper cron timing evaluation + action chain execution + comprehensive logging
- **Critical**: Must check last run time vs cron pattern to prevent over-execution

**Chat System**: ✅ **Mostly Correct**
- Fetch API keys from main app → Execute AI calls locally → Stream responses
- **Minor Issue**: Messages not persisted to SQLite

#### 🎯 **Key Architectural Principles:**

1. **Fetch Configuration Once**: Get definitions, code, and credentials from main app
2. **Execute Everything Locally**: Run actions, schedules, and chat in sub-agent  
3. **Store Results Locally**: Use SQLite for all execution logs and data
4. **Minimal Main App Dependency**: Only for configuration and credentials, not execution

#### ❌ **Critical Issues Identified:**

1. **Actions execute remotely instead of locally** (violates autonomy)
2. **Schedule timing logic missing** (may run incorrectly)  
3. **No execution logging system** (no visibility into what happened)
4. **Hardcoded URLs break production deployment**
5. **Missing action code fetching and execution engine**

#### 🚀 **Implementation Priority:**

**Phase 1 (Critical)**:
1. Fix action execution to be local with fetched code
2. Implement proper schedule timing logic with database tracking
3. Add schedule and action execution logging tables
4. Fix URL resolution for production deployment

**Phase 2 (Important)**:
1. Add chat message persistence  
2. Implement real-time schedule status updates
3. Add error fallback mechanisms
4. Optimize performance and reliability

The corrected architecture will make sub-agents truly autonomous, reliable, and production-ready while maintaining seamless integration with the main orchestrator app. 