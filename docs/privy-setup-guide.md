# Privy Authentication Setup Guide

This guide will walk you through setting up Privy authentication in your application using the Privy SDK integrated with Next-Auth.

## Overview

Our Privy integration uses the Privy SDK directly within a Next-Auth credentials provider, giving you access to:

- **Email/SMS authentication**
- **Social logins** (Google, Twitter, Discord, GitHub, LinkedIn, Apple)
- **Wallet connections** (MetaMask, Coinbase Wallet, WalletConnect, and more)
- **Embedded wallets** for users without existing wallets
- **Multi-factor authentication**
- **Cross-platform compatibility**

## Prerequisites

1. A Privy account and app configured at [privy.io](https://privy.io)
2. Your Privy App ID and App Secret

## Step 1: Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Privy Configuration
PRIVY_APP_ID="your-privy-app-id-here"
PRIVY_APP_SECRET="your-privy-app-secret-here"
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id-here"
```

### Getting Your Privy Credentials

1. Go to [console.privy.io](https://console.privy.io)
2. Create a new app or select an existing one
3. In your app dashboard:
   - Copy the **App ID** (this goes in both `PRIVY_APP_ID` and `NEXT_PUBLIC_PRIVY_APP_ID`)
   - Copy the **App Secret** (this goes in `PRIVY_APP_SECRET`)

## Step 2: Configure Your Privy App

In your Privy console, configure the following settings:

### Login Methods
Enable the authentication methods you want to support:
- ✅ Email
- ✅ SMS
- ✅ Wallet
- ✅ Google OAuth
- ✅ Twitter OAuth
- ✅ Discord OAuth
- ✅ GitHub OAuth
- ✅ LinkedIn OAuth
- ✅ Apple OAuth

### Allowed Origins
Add your domain(s) to the allowed origins:
- `http://localhost:3000` (for development)
- `https://yourdomain.com` (for production)

### Redirect URLs
**Not needed!** Our implementation uses Privy's SDK with modal authentication, so users never leave your site. No redirect URLs are required.

### Wallet Configuration
Configure wallet settings:
- **Embedded Wallets**: Enable for users without existing wallets
- **External Wallets**: Enable MetaMask, Coinbase Wallet, WalletConnect
- **Supported Chains**: Configure Ethereum, Polygon, Base, or other chains

## Step 3: Database Schema

The database schema already includes the necessary fields for Privy integration:

```sql
-- User table includes privyId field
privyId: text('privyId').unique(), // Privy user ID (did:privy:...)
```

If you need to add wallet-specific fields, you can extend the schema:

```typescript
// Optional: Add wallet fields to user table
walletAddress: text('walletAddress'),
walletType: varchar('walletType', { enum: ['ethereum', 'solana'] }),
```

## Step 4: Using Privy Authentication

### Login Page

The Privy login buttons are already integrated into the login page at `/login`:

- **"Continue with Privy"** - Opens Privy's universal login modal
- **"Connect Wallet"** - Wallet-first authentication flow

### Programmatic Usage

You can also use Privy authentication programmatically:

```tsx
import { usePrivy } from '@privy-io/react-auth'
import { signIn } from 'next-auth/react'

function MyComponent() {
  const { login, authenticated, getAccessToken } = usePrivy()

  const handleLogin = async () => {
    await login()
    const accessToken = await getAccessToken()
    await signIn('privy', { accessToken })
  }

  return <button onClick={handleLogin}>Login with Privy</button>
}
```

### Session Data

After successful authentication, the Next-Auth session will include Privy data:

```typescript
// Session type includes Privy fields
interface Session {
  user: {
    id: string
    email: string
    name: string
    image: string
    // Privy-specific fields
    privyId?: string
    walletAddress?: string
    walletType?: 'ethereum' | 'solana'
    phoneNumber?: string
    emailVerified?: boolean
    phoneVerified?: boolean
    linkedAccounts?: Array<{...}>
    customMetadata?: Record<string, any>
  }
}
```

## Step 5: Customization

### Appearance

Customize the Privy UI in `src/components/providers/privy-provider.tsx`:

```typescript
appearance: {
  theme: 'dark', // or 'light'
  accentColor: '#6366f1',
  logo: 'https://your-domain.com/logo.png',
}
```

### Login Methods

Configure which login methods to show:

```typescript
loginMethods: [
  'email',
  'sms',
  'wallet',
  'google',
  'twitter',
  'discord',
  'github',
  'linkedin',
  'apple',
]
```

### Supported Chains

Configure blockchain networks:

```typescript
supportedChains: [
  {
    id: 1, // Ethereum
    name: 'Ethereum',
    // ... chain config
  },
  {
    id: 137, // Polygon
    name: 'Polygon',
    // ... chain config
  },
]
```

## Step 6: Testing

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Click "Continue with Privy" or "Connect Wallet"
4. Complete the authentication flow
5. Verify you're redirected and logged in

## Troubleshooting

### Common Issues

**"Privy configuration invalid" error:**
- Verify `PRIVY_APP_ID` and `PRIVY_APP_SECRET` are set correctly
- Check that your domain is added to Privy's allowed origins

**"Failed to get Privy access token" error:**
- Ensure the user completed the Privy authentication flow
- Check browser console for additional error details

**Wallet connection issues:**
- Verify wallet is installed and unlocked
- Check that the chain is supported in your Privy configuration
- Ensure external wallet configuration is correct

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will show detailed console logs for the authentication flow.

## Security Considerations

1. **Environment Variables**: Never expose `PRIVY_APP_SECRET` on the client-side
2. **Token Validation**: All Privy tokens are verified server-side before creating sessions
3. **Database Security**: User data is stored securely with proper validation
4. **HTTPS**: Always use HTTPS in production for secure token transmission

## Advanced Features

### Custom Metadata

Store additional user data in Privy:

```typescript
// Access custom metadata from session
const { customMetadata } = session.user
```

### Multi-Factor Authentication

Privy automatically handles MFA when enabled in your app configuration.

### Wallet Operations

Access wallet functionality through the Privy SDK:

```typescript
import { useWallets } from '@privy-io/react-auth'

function WalletComponent() {
  const { wallets } = useWallets()
  
  // Access connected wallets
  // Perform transactions
  // Sign messages
}
```

## Support

For additional help:
- [Privy Documentation](https://docs.privy.io)
- [Privy Discord Community](https://discord.gg/privy)
- [Next-Auth Documentation](https://next-auth.js.org)

## Migration from Other Auth Providers

If you're migrating from other authentication providers, the Privy integration can coexist with existing providers. Users can link their existing accounts with Privy authentication methods. 