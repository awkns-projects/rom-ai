# Quick Privy Setup

Simple Privy + NextAuth integration: **Privy handles login UI, NextAuth manages sessions**.

## 1. Get Privy Credentials

1. Go to [console.privy.io](https://console.privy.io)
2. Create a new app or select an existing one
3. Copy your **App ID** and **App Secret**

## 2. Set Environment Variables

Add these to your `.env.local` file:

```env
# Privy Configuration  
PRIVY_APP_ID="your-privy-app-id-here"
PRIVY_APP_SECRET="your-privy-app-secret-here"
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id-here"
```

## 3. Configure Privy App

In your Privy console:

1. **Allowed Origins**: Add `http://localhost:3000` (and your production domain)
2. **Login Methods**: Enable the methods you want (email, SMS, wallet, social, etc.)

**Note**: No redirect URLs needed! We use Privy's SDK with modal authentication.

## 4. How It Works

1. **User clicks "Continue with Privy"** → Privy modal opens
2. **User authenticates** → Modal closes, gets Privy JWT token
3. **NextAuth verifies JWT** → Creates app session with Privy DID as user ID
4. **User is signed in** → Can access protected routes

## 5. Test It

```bash
npm run dev
```

Visit `/login` and try the Privy buttons. Users get Privy's smooth onboarding while you keep NextAuth's session management.

For detailed configuration, see `docs/privy-setup-guide.md`. 