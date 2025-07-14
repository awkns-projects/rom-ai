# Client App API Architecture

This document describes the client app API layer that sits between the UI components and the main app APIs, providing proper separation of concerns and enhanced functionality.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │ -> │  Client App API │ -> │   Main App API  │
│                 │    │     (Proxy)     │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ ActionEditor    │    │ /api/client/*   │    │ /api/agent/*    │
│ MindMapEditor   │    │                 │    │ /api/avatar/*   │
│ ActionsListEdit │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Benefits of Client App Architecture

### 1. **Separation of Concerns**
- **Client App**: Handles UI-specific logic, client metadata, and request preprocessing
- **Main App**: Focuses on core business logic and data processing
- **Clear Boundaries**: Each layer has distinct responsibilities

### 2. **Enhanced Functionality**
- **Request Tracking**: Client APIs add request IDs and metadata for monitoring
- **Retry Logic**: Automatic retry with exponential backoff for failed requests
- **Client Context**: Component information, user context, and timestamps
- **Error Handling**: Enhanced error messages and client-side error recovery

### 3. **Scalability & Reliability**
- **Load Distribution**: Client app can handle multiple UI requests
- **Fault Tolerance**: Retry mechanisms and graceful degradation
- **Monitoring**: Enhanced logging and request tracking
- **Rate Limiting**: Client-side request management

## Client App APIs

### 1. `/api/client/execute-action`
**Purpose**: Execute actions with client-side enhancements

**Flow**:
```
UI Component → Client API → Main App API (/api/agent/execute-action)
```

**Client Enhancements**:
- Adds client metadata (component, user ID, request ID)
- Implements retry logic with exponential backoff
- Tracks execution metrics and latency
- Enhanced error handling and logging

**Example Request**:
```json
{
  "documentId": "doc_123",
  "code": "async function execute() { ... }",
  "inputParameters": {},
  "envVars": {"API_KEY": "value"},
  "testMode": true,
  "clientMetadata": {
    "component": "ActionMindMapEditor",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### 2. `/api/client/generate-code`
**Purpose**: Generate code with client context

**Flow**:
```
UI Component → Client API → Main App API (/api/agent/generate-code)
```

**Client Enhancements**:
- Adds generation type (initial, regenerate)
- Enhances business context with client information
- Implements longer timeout for code generation (60s)
- Tracks code generation metrics

**Example Request**:
```json
{
  "name": "Create Order",
  "description": "Creates a new order",
  "pseudoSteps": [...],
  "entityType": "action",
  "clientMetadata": {
    "component": "ActionEditor",
    "generationType": "initial"
  }
}
```

### 3. `/api/client/generate-steps`
**Purpose**: Generate pseudo steps with client context

**Flow**:
```
UI Component → Client API → Main App API (/api/agent/generate-steps)
```

**Client Enhancements**:
- Adds client context to business requirements
- Tracks step generation metrics
- Enhanced error handling for step generation failures

### 4. `/api/client/auth`
**Purpose**: Manage avatar authentication state

**Flow**:
```
UI Component → Client API → Main App API (/api/avatar/auth)
```

**Client Enhancements**:
- Component-aware authentication requests
- Enhanced auth state management
- Client-side auth caching and refresh logic

## Request/Response Flow

### 1. Request Processing
```typescript
// UI Component makes request
const response = await fetch('/api/client/execute-action', {
  method: 'POST',
  body: JSON.stringify({
    // Standard parameters
    documentId,
    code,
    inputParameters,
    envVars,
    testMode,
    // Client-specific metadata
    clientMetadata: {
      component: 'ActionEditor',
      timestamp: new Date().toISOString()
    }
  })
});
```

### 2. Client API Processing
```typescript
// Client API enhances request
const enhancedEnvVars = {
  ...envVars,
  CLIENT_USER_ID: session.user.id,
  CLIENT_REQUEST_ID: generateRequestId(),
  CLIENT_COMPONENT: component,
  CLIENT_TIMESTAMP: new Date().toISOString()
};

// Proxy to main app with retry logic
const mainAppResponse = await fetch('/api/agent/execute-action', {
  method: 'POST',
  body: JSON.stringify({
    documentId,
    code,
    inputParameters,
    envVars: enhancedEnvVars,
    testMode
  })
});
```

### 3. Response Enhancement
```typescript
// Client API enhances response
const enhancedResult = {
  ...mainAppResult,
  clientMetadata: {
    requestId: enhancedEnvVars.CLIENT_REQUEST_ID,
    component,
    processedAt: new Date().toISOString(),
    attempt: retryAttempt,
    mainAppLatency: executionTime
  }
};
```

## Configuration

### Environment Variables
```bash
# Main app URL for client API to proxy to
MAIN_APP_URL=http://localhost:3000

# Timeout configurations
CLIENT_REQUEST_TIMEOUT=30000
CLIENT_RETRY_COUNT=2
```

### Main App Configuration
```typescript
const MAIN_APP_CONFIG = {
  baseUrl: process.env.MAIN_APP_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
  retries: 2
};
```

## Error Handling

### 1. Client-Side Errors
```typescript
// Invalid request data
{
  "error": "Invalid request data",
  "details": [...validationErrors]
}

// Client app internal errors
{
  "error": "Client app internal error",
  "details": "Network timeout"
}
```

### 2. Main App Errors
```typescript
// Main app API errors (proxied)
{
  "error": "Failed to execute action after multiple attempts",
  "details": "Main app API error (500): Internal server error",
  "clientMetadata": {
    "requestId": "req_123",
    "attempts": 2,
    "failedAt": "2024-01-15T10:05:00Z"
  }
}
```

### 3. Retry Logic
```typescript
// Exponential backoff retry
for (let attempt = 1; attempt <= retries; attempt++) {
  try {
    const result = await callMainApp();
    return result;
  } catch (error) {
    if (attempt < retries) {
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

## Monitoring & Logging

### Client API Logs
```
🎯 Client App: Action execution request
🔄 Attempt 1/2: Calling main app execute-action API
✅ Client App: Action execution successful
❌ Client App: All attempts failed for action execution
```

### Request Tracking
```typescript
{
  requestId: "req_1642251600000_abc123",
  component: "ActionMindMapEditor", 
  userId: "user_456",
  mainAppLatency: 1250,
  attempt: 1,
  processedAt: "2024-01-15T10:00:00Z"
}
```

## Health Checks

Each client API includes health check endpoints:

```bash
# Check client API status
GET /api/client/execute-action
GET /api/client/generate-code  
GET /api/client/generate-steps
```

**Response**:
```json
{
  "status": "ok",
  "service": "client-app-execute-action",
  "timestamp": "2024-01-15T10:00:00Z",
  "mainApp": {
    "url": "http://localhost:3000",
    "status": "connected",
    "timeout": 30000,
    "retries": 2
  }
}
```

## Migration Guide

### Before (Direct Main App Calls)
```typescript
// UI Component called main app directly
const response = await fetch('/api/agent/execute-action', {
  method: 'POST',
  body: JSON.stringify({
    documentId,
    code,
    inputParameters,
    envVars,
    testMode
  })
});
```

### After (Client App Proxy)
```typescript
// UI Component calls client app API
const response = await fetch('/api/client/execute-action', {
  method: 'POST', 
  body: JSON.stringify({
    documentId,
    code,
    inputParameters,
    envVars,
    testMode,
    clientMetadata: {
      component: 'ActionEditor',
      timestamp: new Date().toISOString()
    }
  })
});
```

## Benefits Summary

1. **Better Architecture**: Clear separation between client and main app concerns
2. **Enhanced Reliability**: Retry logic, error handling, and fault tolerance
3. **Better Monitoring**: Request tracking, latency metrics, and detailed logging
4. **Scalability**: Client app can handle UI-specific optimizations
5. **Maintainability**: Easier to modify client behavior without affecting main app
6. **Security**: Additional validation and sanitization layer
7. **Performance**: Client-side optimizations and request batching opportunities

The client app architecture provides a robust foundation for scaling the application while maintaining clean separation of concerns between the UI layer and core business logic. 