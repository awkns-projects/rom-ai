# 🔧 Fix Sub-Agent Environment Variables

## The Problem
Your deployed sub-agent `inventorytracker-998934-aduco3tnj-awkns` has these issues:
1. **Double HTTPS Protocol**: `NEXT_PUBLIC_MAIN_APP_URL` has `https://https://ada4eeb4905c.ngrok-free.app`
2. **Missing/Wrong Document ID**: The agent can't authenticate with main app
3. **Outdated Configuration**: May be using old environment variables

## 🚀 Step-by-Step Fix

### Step 1: Go to Vercel Dashboard
1. Visit: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find project: `inventorytracker-998934-aduco3tnj-awkns`
3. Click on the project

### Step 2: Fix Environment Variables
Go to **Settings** → **Environment Variables** and update these:

#### Required Fixes:
```bash
# Fix the double HTTPS issue
NEXT_PUBLIC_MAIN_APP_URL=https://ada4eeb4905c.ngrok-free.app

# These should already exist but verify:
NEXT_PUBLIC_DOCUMENT_ID=[YOUR_DOCUMENT_ID]
NEXT_PUBLIC_AGENT_KEY=[AGENT_KEY]  
NEXT_PUBLIC_AGENT_TOKEN=[JWT_TOKEN]
```

### Step 3: Find Your Document ID
You need to find the document ID for your inventory tracker agent.

**Option A: Check Browser Storage**
1. Go to your main app: `https://ada4eeb4905c.ngrok-free.app/chat`
2. Open Developer Tools → Application/Storage → Local Storage
3. Look for keys like `document-id` or recent documents

**Option B: Check URL History**
1. Look in your browser history for URLs like `/chat/[document-id]`
2. The long string after `/chat/` is your document ID

### Step 4: Redeploy
1. After updating environment variables
2. Go to **Deployments** tab
3. Click **⋯** on latest deployment → **Redeploy**
4. Wait 2-3 minutes for deployment to complete

### Step 5: Test
Visit your sub-agent: `https://inventorytracker-998934-aduco3tnj-awkns.vercel.app`

Expected results:
- ✅ Data tab shows inventory models
- ✅ Actions tab shows available actions  
- ✅ Tasks tab shows schedules
- ✅ Chat works
- ✅ Theme appears correctly

---

## 🆘 If You Can't Find Document ID

If you can't find your document ID, we can create a new inventory tracker agent:

1. Go to main app: `https://ada4eeb4905c.ngrok-free.app/chat`
2. Create a new agent with inventory tracking features
3. Deploy it with the corrected environment variable handling
4. The new deployment will have correct environment variables

---

## 🔍 Testing Your Fix

You can test if the fix worked by checking this URL:
```bash
https://inventorytracker-998934-aduco3tnj-awkns.vercel.app/api/health
```

If working, it should return a JSON response with agent status.

---

**Priority:** Fix `NEXT_PUBLIC_MAIN_APP_URL` first - this is causing the double HTTPS issue that breaks all API calls. 