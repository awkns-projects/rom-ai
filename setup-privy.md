# Quick Privy Setup

## 🚀 Get Privy Working in 5 Minutes

### Step 1: Get Privy Credentials
1. Go to **[console.privy.io](https://console.privy.io)**
2. Sign up/log in
3. Click **"Create New App"**
4. Give it a name (e.g., "My App Dev")
5. Copy your **App ID** from the dashboard

### Step 2: Create `.env.local`
Create a `.env.local` file in your project root with:

```env
# Privy Configuration
# Client-side (for React components)
NEXT_PUBLIC_PRIVY_APP_ID="clxxxxxxxxxxxxxxx"

# Server-side (for JWT verification) 
PRIVY_APP_ID="clxxxxxxxxxxxxxxx"  
PRIVY_APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Your existing vars...
AUTH_SECRET="your-auth-secret"
POSTGRES_URL="your-database-url"
NEXTAUTH_URL="http://localhost:3000"  # IMPORTANT: Must match your dev domain!
# etc...
```

**Get these values from your Privy dashboard:**
- **App ID**: Copy from the main dashboard (use for both `NEXT_PUBLIC_PRIVY_APP_ID` and `PRIVY_APP_ID`)
- **App Secret**: Go to "Settings" → "API Keys" → Copy the App Secret (use for `PRIVY_APP_SECRET`)

**Why 3 variables?**
- `NEXT_PUBLIC_PRIVY_APP_ID`: Used by React components (client-side)
- `PRIVY_APP_ID` + `PRIVY_APP_SECRET`: Used by NextAuth to verify JWTs (server-side)

### Step 3: Configure Privy App
In your Privy console:

1. **Settings** → **Allowed Origins**
   - Add: `http://localhost:3000`
   - Add your production domain later

2. **Login Methods** 
   - Enable: Email, SMS, Wallet
   - Enable social logins you want (Google, Twitter, etc.)

### Step 4: Test It
```bash
npm run dev
```

Visit `http://localhost:3000/login` and click **"Continue with Privy"**!

---

## 🔧 Troubleshooting

**"Failed to get Privy access token"**
- ✅ Check `.env.local` has all 3 Privy variables
- ✅ Restart dev server after adding env vars
- ✅ Verify App ID matches in Privy console

**"NextAuth sign-in failed"** or **"You need to sign in to view this chat"**
- ✅ Check `PRIVY_APP_SECRET` is set (server-side)
- ✅ Check server logs for JWT verification errors
- ✅ **CRITICAL**: Ensure `NEXTAUTH_URL` matches your domain:
  - Local dev: `NEXTAUTH_URL="http://localhost:3000"`
  - Production: `NEXTAUTH_URL="https://yourdomain.com"`
- ✅ Restart dev server after changing `NEXTAUTH_URL`
- ✅ Verify client calls correct provider: `signIn('privy', ...)` not `signIn('credentials', ...)`

**Privy modal doesn't open**
- ✅ Check browser console for JavaScript errors
- ✅ Verify `NEXT_PUBLIC_PRIVY_APP_ID` is set (client-side)

---

## ✨ What You Get

- **Email/SMS login** - No passwords needed
- **Wallet connection** - MetaMask, Coinbase Wallet, etc.
- **Social login** - Google, Twitter, Discord, etc.
- **Progressive onboarding** - Start with email, add wallet later
- **Cross-platform** - Works on mobile & desktop

All while keeping NextAuth for session management! 🎉

## 🔄 **User ID Management**

**Two types of user IDs:**
- **Privy DID**: `did:privy:clxxxxxxxx` (Privy's unique identifier)
- **Database ID**: UUID (our app's internal user ID)

**The authentication flow:**
1. **Privy JWT** contains the **Privy DID** 
2. **Database lookup** for user with that **Privy DID**
3. **If found** → use existing **Database ID**
4. **If not found** → create new user record with new **Database ID**
5. **NextAuth session** uses **Database ID** as `session.user.id`

**This ensures:**
- ✅ **Consistent user identity** across sessions
- ✅ **Database relationships** work correctly (chats, documents, etc.)
- ✅ **Privy data preserved** (`privyDid`, `privySessionId` in session)

**Session structure:**
```typescript
session.user = {
  id: "550e8400-e29b-41d4-a716-446655440000", // Database UUID
  email: "user@example.com",
  privyDid: "did:privy:clxxxxxxxx",           // Privy identifier
  privySessionId: "session123",               // Privy session
  type: "regular"
}
``` 