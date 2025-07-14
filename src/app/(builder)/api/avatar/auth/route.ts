import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById } from '@/lib/db/queries';

// Schema for the avatar auth request
const AvatarAuthRequestSchema = z.object({
  documentId: z.string().describe('Document ID containing the agent/avatar data')
});

// Provider to environment variable mapping
const PROVIDER_ENV_MAP: Record<string, string> = {
  shopify: 'SHOPIFY_ACCESS_TOKEN',
  instagram: 'INSTAGRAM_ACCESS_TOKEN', 
  gmail: 'GMAIL_ACCESS_TOKEN',
  slack: 'SLACK_BOT_TOKEN',
  stripe: 'STRIPE_API_KEY',
  salesforce: 'SALESFORCE_ACCESS_TOKEN',
  hubspot: 'HUBSPOT_API_KEY',
  'google-calendar': 'GOOGLE_CALENDAR_TOKEN',
  'microsoft-teams': 'MICROSOFT_TEAMS_TOKEN',
  github: 'GITHUB_TOKEN',
  trello: 'TRELLO_TOKEN',
  notion: 'NOTION_TOKEN',
  airtable: 'AIRTABLE_API_KEY',
  mailchimp: 'MAILCHIMP_API_KEY',
  twilio: 'TWILIO_AUTH_TOKEN',
  discord: 'DISCORD_BOT_TOKEN',
  linkedin: 'LINKEDIN_ACCESS_TOKEN',
  twitter: 'TWITTER_ACCESS_TOKEN',
  facebook: 'FACEBOOK_ACCESS_TOKEN',
  pinterest: 'PINTEREST_ACCESS_TOKEN',
  tiktok: 'TIKTOK_ACCESS_TOKEN'
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Fetch the document to get avatar authentication state
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to document' }, { status: 403 });
    }

    if (!document.content) {
      return NextResponse.json({ 
        isAuthenticated: false,
        provider: null,
        accessToken: null,
        envVars: {},
        externalService: null
      });
    }

    // Parse the agent data from document content
    let agentData;
    try {
      agentData = JSON.parse(document.content);
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid agent data format' }, { status: 400 });
    }

    // Extract avatar authentication state
    const avatar = agentData.avatar || {};
    const isAuthenticated = avatar.isAuthenticated || false;
    const accessToken = avatar.accessToken || null;
    const externalService = avatar.externalService || null;
    
    // Determine provider from external API metadata or avatar data
    let provider = null;
    if (agentData.externalApiMetadata?.provider) {
      provider = agentData.externalApiMetadata.provider;
    } else if (externalService) {
      // Try to infer provider from external service URL/name
      const serviceStr = externalService.toLowerCase();
      if (serviceStr.includes('shopify')) provider = 'shopify';
      else if (serviceStr.includes('slack')) provider = 'slack';
      else if (serviceStr.includes('gmail')) provider = 'gmail';
      else if (serviceStr.includes('stripe')) provider = 'stripe';
      else if (serviceStr.includes('salesforce')) provider = 'salesforce';
      // Add more inference logic as needed
    }

    // Create environment variables mapping if authenticated
    const envVars: Record<string, string> = {};
    if (isAuthenticated && accessToken && provider) {
      const envVarName = PROVIDER_ENV_MAP[provider];
      if (envVarName) {
        envVars[envVarName] = accessToken;
      }
      
      // Add common environment variables that might be needed
      envVars[`${provider.toUpperCase()}_PROVIDER`] = provider;
      if (externalService) {
        envVars[`${provider.toUpperCase()}_SERVICE_URL`] = externalService;
      }
    }

    return NextResponse.json({
      isAuthenticated,
      provider,
      accessToken: isAuthenticated ? accessToken : null, // Only return token if authenticated
      envVars,
      externalService,
      availableProviders: Object.keys(PROVIDER_ENV_MAP),
      connectionType: agentData.externalApiMetadata?.connectionType || 'unknown'
    });

  } catch (error) {
    console.error('Error retrieving avatar auth state:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve avatar authentication state' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = AvatarAuthRequestSchema.parse(body);
    const { documentId } = validatedData;

    // This endpoint could be extended to update avatar authentication state
    // For now, we'll just return the current state (same as GET)
    
    return NextResponse.json({
      message: 'Avatar auth state retrieved successfully',
      // Could implement state updates here in the future
    });

  } catch (error) {
    console.error('Error updating avatar auth state:', error);
    return NextResponse.json(
      { error: 'Failed to update avatar authentication state' },
      { status: 500 }
    );
  }
} 