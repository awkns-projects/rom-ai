import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { executeStep4VercelDeployment, type Step4Input } from '@/lib/ai/tools/agent-builder/steps/step4-vercel-deployment';
import { getDocumentById, saveOrUpdateDocument } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for deployment

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentData, documentId, projectName, description, environmentVariables, vercelTeam } = body;

    // Validate required fields
    if (!agentData || !documentId) {
      return NextResponse.json(
        { error: 'Missing required fields: agentData, documentId' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.VERCEL_TOKEN) {
      return NextResponse.json(
        { error: 'Server configuration error: VERCEL_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Validate agent data structure
    if (!agentData.models && !agentData.actions && !agentData.schedules) {
      return NextResponse.json(
        { error: 'Invalid agent data: At least one of models, actions, or schedules is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Starting agent complete redeployment...');
    console.log('🎭 Agent personality debug (redeploy):', {
      hasAgentData: !!agentData,
      agentDataPersonality: agentData.personality,
      agentDataCharacterNames: agentData.characterNames,
      hasAvatar: !!agentData.avatar,
      avatarPersonality: agentData.avatar?.personality,
      avatarCharacterNames: agentData.avatar?.characterNames,
      avatarType: agentData.avatar?.type,
      avatarUnicornParts: !!agentData.avatar?.unicornParts
    });

    // Extract data from agent for deployment
    const step1Output = {
      models: agentData.models || [],
      enums: agentData.enums || [],
      prismaSchema: agentData.prismaSchema || '',
      implementationNotes: ['Agent complete redeployment from UI']
    };

    const step2Output = {
      actions: agentData.actions || [],
      implementationComplexity: 'medium' as const,
      implementationNotes: 'Agent complete redeployment from UI'
    };

    const step3Output = {
      schedules: agentData.schedules || [],
      implementationComplexity: 'medium' as const,
      implementationNotes: 'Agent complete redeployment from UI'
    };

    // For redeploy, we ALWAYS create a new deployment (complete rebuild)
    console.log('🚀 Creating complete new deployment (redeploy)...');

    const step4Input: Step4Input = {
      step1Output,
      step2Output,
      step3Output,
      projectName: projectName || agentData.name,
      description: description || agentData.description,
      environmentVariables: environmentVariables || {},
      vercelTeam,
      documentId,
      agentConfig: {
        name: agentData.name,
        description: agentData.description,
        theme: agentData.theme,
        avatar: agentData.avatar,
        domain: agentData.domain,
        personality: agentData.personality || agentData.avatar?.personality,
        characterNames: agentData.characterNames || agentData.avatar?.characterNames
      }
    };

    const deploymentResult = await executeStep4VercelDeployment(step4Input);

    // Validate deployment result
    if (!deploymentResult || !deploymentResult.deploymentId) {
      throw new Error('Redeployment failed: Invalid deployment result received');
    }

    console.log('✅ Complete redeployment completed successfully!');

    // Update the agent data with deployment information
    const updatedAgentData = {
      ...agentData,
      deployment: {
        deploymentId: deploymentResult.deploymentId,
        projectId: deploymentResult.projectId,
        deploymentUrl: deploymentResult.deploymentUrl, // This is now the custom domain URL
        status: deploymentResult.status,
        apiEndpoints: deploymentResult.apiEndpoints,
        vercelProjectId: deploymentResult.vercelProjectId,
        deployedAt: new Date().toISOString(),
        warnings: deploymentResult.warnings || [],
        deploymentNotes: deploymentResult.deploymentNotes || [],
        isRedeployment: true, // Mark as redeployment
        // Add custom domain information
        customDomain: deploymentResult.customDomain
      },
      metadata: {
        ...agentData.metadata,
        updatedAt: new Date().toISOString(),
        status: 'deployed',
        lastRedeployedAt: new Date().toISOString()
      }
    };

    // Save updated agent data to document
    try {
      const existingDoc = await getDocumentById({ id: documentId });
      if (existingDoc) {
        await saveOrUpdateDocument({
          id: documentId,
          title: existingDoc.title,
          content: JSON.stringify(updatedAgentData, null, 2),
          kind: existingDoc.kind,
          userId: session.user.id as string,
          metadata: existingDoc.metadata
        });
        console.log('💾 Updated agent data saved to document after redeployment');
      } else {
        console.warn('⚠️ Document not found, skipping save operation');
      }
    } catch (error) {
      console.error('❌ Failed to save updated agent data:', error);
      // Don't fail the deployment because of this, but include it in the response
    }

    return NextResponse.json({
      success: true,
      deploymentResult: {
        deploymentId: deploymentResult.deploymentId,
        projectId: deploymentResult.projectId,
        deploymentUrl: deploymentResult.deploymentUrl,
        status: deploymentResult.status,
        apiEndpoints: deploymentResult.apiEndpoints || [],
        vercelProjectId: deploymentResult.vercelProjectId,
        deployedAt: new Date().toISOString(),
        warnings: deploymentResult.warnings || [],
        deploymentNotes: deploymentResult.deploymentNotes || [],
        isRedeployment: true
      },
      agentData: updatedAgentData
    });

  } catch (error) {
    console.error('❌ Complete redeployment failed:', error);
    return NextResponse.json(
      {
        error: 'Complete redeployment failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    documentation: {
      endpoint: '/api/agent/redeploy',
      method: 'POST',
      description: 'Complete redeployment of an agent (creates new deployment instead of updating existing)',
      requiredFields: ['agentData', 'documentId'],
      optionalFields: ['projectName', 'description', 'environmentVariables', 'vercelTeam'],
      responseFormat: 'Deployment result with updated agent data'
    }
  });
} 