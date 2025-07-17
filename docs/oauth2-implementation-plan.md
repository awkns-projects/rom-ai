# OAuth2 Implementation Plan

## Priority 1: Essential Business Providers

### Google OAuth2
```typescript
// Provider Configuration
{
  id: "google",
  name: "Google",
  type: "oauth",
  authorization: "https://accounts.google.com/o/oauth2/auth",
  token: "https://oauth2.googleapis.com/token",
  userinfo: "https://www.googleapis.com/oauth2/v2/userinfo",
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  scope: "openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar",
  tokenEndpointRefresh: true
}
```

### Microsoft Azure AD
```typescript
{
  id: "azure-ad",
  name: "Microsoft",
  type: "oauth",
  authorization: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  userinfo: "https://graph.microsoft.com/v1.0/me",
  scope: "openid email profile User.Read Files.ReadWrite Calendars.ReadWrite",
  tokenEndpointRefresh: true
}
```

### GitHub
```typescript
{
  id: "github",
  name: "GitHub", 
  type: "oauth",
  authorization: "https://github.com/login/oauth/authorize",
  token: "https://github.com/login/oauth/access_token",
  userinfo: "https://api.github.com/user",
  scope: "user:email repo read:org",
  tokenEndpointRefresh: false // GitHub doesn't support refresh tokens
}
```

### LinkedIn
```typescript
{
  id: "linkedin",
  name: "LinkedIn",
  type: "oauth", 
  authorization: "https://www.linkedin.com/oauth/v2/authorization",
  token: "https://www.linkedin.com/oauth/v2/accessToken",
  userinfo: "https://api.linkedin.com/v2/people/~",
  scope: "r_liteprofile r_emailaddress w_member_social",
  tokenEndpointRefresh: true
}
```

### Slack
```typescript
{
  id: "slack",
  name: "Slack",
  type: "oauth",
  authorization: "https://slack.com/oauth/v2/authorize",
  token: "https://slack.com/api/oauth.v2.access", 
  userinfo: "https://slack.com/api/users.identity",
  scope: "identity.basic identity.email chat:write channels:read",
  tokenEndpointRefresh: true
}
```

## Priority 2: Business Tools

### Salesforce
```typescript
{
  id: "salesforce",
  name: "Salesforce",
  type: "oauth",
  authorization: "https://login.salesforce.com/services/oauth2/authorize",
  token: "https://login.salesforce.com/services/oauth2/token",
  userinfo: "https://login.salesforce.com/services/oauth2/userinfo",
  scope: "api refresh_token",
  tokenEndpointRefresh: true
}
```

### Zoom
```typescript
{
  id: "zoom", 
  name: "Zoom",
  type: "oauth",
  authorization: "https://zoom.us/oauth/authorize",
  token: "https://zoom.us/oauth/token",
  userinfo: "https://api.zoom.us/v2/users/me",
  scope: "user:read meeting:write webinar:write",
  tokenEndpointRefresh: true
}
```

### Dropbox
```typescript
{
  id: "dropbox",
  name: "Dropbox", 
  type: "oauth",
  authorization: "https://www.dropbox.com/oauth2/authorize",
  token: "https://api.dropboxapi.com/oauth2/token",
  userinfo: "https://api.dropboxapi.com/2/users/get_current_account",
  scope: "files.content.write files.content.read sharing.write",
  tokenEndpointRefresh: true
}
```

## Environment Variables Required

```bash
# Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft
AZURE_AD_CLIENT_ID=your_azure_client_id  
AZURE_AD_CLIENT_SECRET=your_azure_client_secret

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Slack
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Salesforce
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret

# Zoom
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret

# Dropbox
DROPBOX_CLIENT_ID=your_dropbox_client_id
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret
```

## Implementation Roadmap

### Phase 1: Core Business (Week 1-2)
- [ ] Google OAuth2 (Drive, Calendar, Gmail)
- [ ] Microsoft Azure AD (Office 365, Teams)
- [ ] GitHub (Repository access)

### Phase 2: Professional Tools (Week 3-4)  
- [ ] LinkedIn (Professional networking)
- [ ] Slack (Team communication)
- [ ] Salesforce (CRM integration)

### Phase 3: Productivity & Storage (Week 5-6)
- [ ] Zoom (Video conferencing)
- [ ] Dropbox (File storage)
- [ ] Notion (Documentation)

## Special Considerations

### Google OAuth2
- Supports incremental authorization
- Requires domain verification for sensitive scopes
- Has different flows for web vs mobile

### Microsoft Azure AD
- Supports both personal and work accounts
- Multi-tenant vs single-tenant configuration
- Complex permission model

### GitHub
- No refresh tokens (tokens don't expire)
- Different scopes for organization access
- Rate limiting considerations

### LinkedIn
- Strict review process for Marketing Developer Platform
- Limited to basic profile without approval
- Different endpoints for different products

### Slack
- Workspace-specific tokens
- Bot vs user tokens
- Complex permission scopes

## Testing Strategy

1. **Sandbox/Development Apps**: Use test applications for each provider
2. **Scope Testing**: Test minimal scopes first, then expand
3. **Token Refresh**: Verify refresh token functionality
4. **Error Handling**: Test expired tokens, revoked access
5. **Rate Limiting**: Implement proper retry logic

## Security Considerations

1. **Scope Minimization**: Request only necessary permissions
2. **Token Storage**: Encrypt tokens at rest
3. **Token Rotation**: Implement proper refresh logic
4. **Audit Logging**: Log all OAuth events
5. **PKCE**: Use PKCE for public clients

## Business Value by Provider

| Provider | Use Cases | Business Impact |
|----------|-----------|-----------------|
| Google | Email, Calendar, Drive, Analytics | High - Universal business tool |
| Microsoft | Office 365, Teams, OneDrive | High - Enterprise standard |
| GitHub | Code repos, CI/CD, Issues | High - Developer productivity |
| LinkedIn | Professional networking, B2B | Medium - Lead generation |
| Slack | Team communication, automation | Medium - Workplace productivity |
| Salesforce | CRM, customer data | High - Revenue operations |
| Zoom | Video meetings, webinars | Medium - Remote collaboration |
| Dropbox | File storage, sharing | Medium - Document workflows |

## Next Steps

1. Choose 3 providers from Priority 1 to implement first
2. Set up developer accounts and obtain credentials
3. Implement using existing OAuth2 pattern
4. Add to avatar creator interface
5. Test integration thoroughly
6. Document API capabilities for code generation 