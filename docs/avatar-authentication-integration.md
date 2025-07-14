# Avatar Authentication Integration

This document describes the complete integration system that connects avatar creator authentication tokens to action execution.

## Overview

The system provides seamless integration between:
- **Avatar Creator**: Collects external API tokens (OAuth/API keys)
- **Action Execution**: Uses these tokens for real external API calls
- **Main App ↔ Client App Communication**: APIs for token synchronization

## Architecture

```
[Avatar Creator] → [API Endpoints] → [Action Execution Components] → [Execute Action API]
     ↓                    ↓                      ↓                        ↓
 Collects Tokens    Stores/Retrieves     Fetches & Validates        Uses Real Tokens
                       Tokens              Authentication                in envVars
```

## API Endpoints

### 1. `/api/avatar/auth` (GET)
**Purpose**: Retrieve current avatar authentication state

**Request**:
```
GET /api/avatar/auth?documentId=doc_123
```

**Response**:
```json
{
  "isAuthenticated": true,
  "provider": "shopify",
  "accessToken": "shpat_xxxxx",
  "envVars": {
    "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxx",
    "SHOPIFY_PROVIDER": "shopify",
    "SHOPIFY_SERVICE_URL": "my-store.myshopify.com"
  },
  "externalService": "my-store.myshopify.com",
  "availableProviders": ["shopify", "slack", "gmail", ...],
  "connectionType": "oauth"
}
```

### 2. `/api/avatar/auth/update` (POST)
**Purpose**: Update avatar authentication state when users connect/disconnect

**Request**:
```json
{
  "documentId": "doc_123",
  "authUpdate": {
    "isAuthenticated": true,
    "provider": "shopify",
    "accessToken": "shpat_xxxxx",
    "externalService": "my-store.myshopify.com",
    "connectionType": "oauth"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Avatar authentication state updated successfully",
  "authState": {
    "isAuthenticated": true,
    "provider": "shopify",
    "externalService": "my-store.myshopify.com",
    "connectionType": "oauth"
  }
}
```

## Provider Token Mapping

The system automatically maps provider names to standard environment variable names:

| Provider | Environment Variable | Token Format |
|----------|---------------------|--------------|
| shopify | SHOPIFY_ACCESS_TOKEN | shpat_xxxxx |
| slack | SLACK_BOT_TOKEN | xoxb-xxxxx |
| gmail | GMAIL_ACCESS_TOKEN | gmail_xxxxx |
| stripe | STRIPE_API_KEY | sk_test_xxxxx |
| salesforce | SALESFORCE_ACCESS_TOKEN | sf_xxxxx |
| instagram | INSTAGRAM_ACCESS_TOKEN | IGQVJXa_xxxxx |
| hubspot | HUBSPOT_API_KEY | hub_xxxxx |
| github | GITHUB_TOKEN | ghp_xxxxx |
| ... | ... | ... |

## Utility Functions

### Core Functions (`/lib/utils.ts`)

#### `getAvatarAuthTokens(documentId: string)`
Fetches current avatar authentication state from the API.

#### `mergeAvatarTokensWithEnvVars(avatarTokens, actionEnvVars)`
Combines avatar tokens with action-specific environment variables.

#### `actionRequiresExternalAuth(actionCode: string)`
Analyzes action code to determine if external authentication is needed.

#### `validateAuthRequirements(actionCode, avatarTokens)`
Validates that required authentication is available before execution.

#### `getAuthStatusMessage(avatarTokens)`
Returns user-friendly authentication status message.

## Component Integration

### ActionMindMapEditor
- Fetches avatar tokens on component mount
- Validates authentication before execution
- Displays authentication status in execution node
- Merges tokens with envVars in API calls

### ActionEditor
- Integrated authentication validation
- Shows authentication info in success messages
- Fetches fresh tokens before each execution

### ActionsListEditor
- Authentication integration for bulk action execution
- Validates tokens for each action execution

## Authentication Flow

### 1. Initial Setup
```typescript
// Component fetches avatar auth state
useEffect(() => {
  if (documentId) {
    getAvatarAuthTokens(documentId)
      .then(setAvatarAuthState)
      .catch(console.error);
  }
}, [documentId]);
```

### 2. Pre-Execution Validation
```typescript
// Validate auth requirements before execution
const authValidation = validateAuthRequirements(actionCode, avatarTokens);
if (!authValidation.isValid) {
  alert(`Authentication Error:\n${authValidation.message}`);
  return;
}
```

### 3. Token Merging
```typescript
// Merge avatar tokens with action env vars
const mergedEnvVars = mergeAvatarTokensWithEnvVars(avatarTokens, actionEnvVars);
```

### 4. Execution with Tokens
```typescript
// Execute with merged environment variables
const response = await fetch('/api/agent/execute-action', {
  method: 'POST',
  body: JSON.stringify({
    documentId,
    code: actionCode,
    inputParameters: {},
    envVars: mergedEnvVars, // Contains avatar tokens
    testMode: true
  })
});
```

### 5. Execute Action API Usage
The execute-action API automatically uses the provided tokens:

```typescript
// In execute-action/route.ts
const openaiClient = createOpenAI({
  apiKey: envVars.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

const xaiClient = createXai({
  apiKey: envVars.XAI_API_KEY || process.env.XAI_API_KEY,
});

// Avatar tokens are available as:
// envVars.SHOPIFY_ACCESS_TOKEN
// envVars.SLACK_BOT_TOKEN
// etc.
```

## Usage Examples

### Example 1: Shopify Integration
```typescript
// Avatar creator collects Shopify OAuth token
const authUpdate = {
  isAuthenticated: true,
  provider: "shopify",
  accessToken: "shpat_abc123",
  externalService: "my-store.myshopify.com"
};

// Action code can now use the token
const actionCode = `
async function executeAction({prisma, input, env}) {
  const response = await fetch('https://my-store.myshopify.com/admin/api/2023-04/products.json', {
    headers: {
      'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN
    }
  });
  return await response.json();
}
`;
```

### Example 2: Slack Integration
```typescript
// Avatar creator collects Slack bot token
const authUpdate = {
  isAuthenticated: true,
  provider: "slack",
  accessToken: "xoxb-abc123",
  externalService: "my-workspace.slack.com"
};

// Action code for Slack messaging
const actionCode = `
async function executeAction({prisma, input, env}) {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${env.SLACK_BOT_TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel: input.channel,
      text: input.message
    })
  });
  return await response.json();
}
`;
```

## Security Considerations

1. **Token Storage**: Tokens are stored in the database with the agent document
2. **Access Control**: Only document owners can access their tokens
3. **Transmission**: Tokens are transmitted over HTTPS
4. **Sensitive Data**: Tokens are marked as sensitive in env var configurations
5. **Validation**: Authentication is validated before each execution

## Error Handling

The system provides comprehensive error handling:

1. **Missing Authentication**: Clear error messages when tokens are required but not available
2. **Invalid Tokens**: Graceful handling of expired or invalid tokens
3. **Network Errors**: Robust error handling for API communication failures
4. **Validation Errors**: Pre-execution validation prevents runtime failures

## Testing

The system supports test mode execution:
- Authentication is validated but external API calls can be mocked
- Environment variables are available for testing purposes
- Authentication status is shown in execution results

## Future Enhancements

1. **Token Refresh**: Automatic OAuth token refresh
2. **Multiple Accounts**: Support for multiple accounts per provider
3. **Scoped Permissions**: Fine-grained permission management
4. **Token Encryption**: Enhanced security with encrypted token storage
5. **Audit Logging**: Track token usage and authentication events 