import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { executeStep4VercelDeployment, updateExistingDeployment, checkDeploymentUpdateNeeded, type Step4Input } from '@/lib/ai/tools/agent-builder/steps/step4-vercel-deployment';
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

    console.log('🚀 Starting agent deployment...');

    // Extract data from agent for deployment
    const step1Output = {
      models: agentData.models || [],
      enums: agentData.enums || [],
      prismaSchema: agentData.prismaSchema || '',
      implementationNotes: ['Agent deployment from UI']
    };

    const step2Output = {
      actions: agentData.actions || [],
      implementationComplexity: 'medium' as const,
      implementationNotes: 'Agent deployment from UI'
    };

    const step3Output = {
      schedules: agentData.schedules || [],
      implementationComplexity: 'medium' as const,
      implementationNotes: 'Agent deployment from UI'
    };

    let deploymentResult;

    // Check if there's an existing deployment
    if (agentData.deployment?.projectId) {
      console.log('🔄 Updating existing deployment...');
      
      // Check if deployment update is needed
      const updateCheck = checkDeploymentUpdateNeeded(
        agentData,
        { 
          prismaSchema: step1Output.prismaSchema,
          actions: step2Output.actions, 
          schedules: step3Output.schedules 
        },
        agentData.deployment
      );

      if (updateCheck.needsUpdate) {
        console.log(`🔄 Updating deployment: ${updateCheck.reasons.join(', ')}`);

        deploymentResult = await updateExistingDeployment({
          step1Output,
          step2Output,
          step3Output,
          vercelProjectId: agentData.deployment.projectId,
          projectName: projectName || agentData.name,
          description: description || agentData.description,
          environmentVariables: environmentVariables || {},
          executeMigrations: updateCheck.requiresMigration
        });
      } else {
        console.log('✅ No deployment update needed');
        return NextResponse.json({
          success: true,
          deploymentResult: agentData.deployment,
          message: 'No deployment update needed'
        });
      }
    } else {
      console.log('🚀 Creating new deployment...');

      const step4Input: Step4Input = {
        step1Output,
        step2Output,
        step3Output,
        projectName: projectName || agentData.name,
        description: description || agentData.description,
        environmentVariables: environmentVariables || {},
        vercelTeam,
        documentId
      };

      deploymentResult = await executeStep4VercelDeployment(step4Input);
    }

    // Validate deployment result
    if (!deploymentResult || !deploymentResult.deploymentId) {
      throw new Error('Deployment failed: Invalid deployment result received');
    }

    console.log('✅ Deployment completed successfully!');

    // Update the agent data with deployment information
    const updatedAgentData = {
      ...agentData,
      deployment: {
        deploymentId: deploymentResult.deploymentId,
        projectId: deploymentResult.projectId,
        deploymentUrl: deploymentResult.deploymentUrl,
        status: deploymentResult.status,
        apiEndpoints: deploymentResult.apiEndpoints,
        vercelProjectId: deploymentResult.vercelProjectId,
        deployedAt: new Date().toISOString(),
        warnings: deploymentResult.warnings || [],
        deploymentNotes: deploymentResult.deploymentNotes || []
      },
      metadata: {
        ...agentData.metadata,
        updatedAt: new Date().toISOString(),
        status: 'deployed'
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
        console.log('💾 Updated agent data saved to document');
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
        deploymentNotes: deploymentResult.deploymentNotes || []
      },
      agentData: updatedAgentData
    });

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    return NextResponse.json(
      {
        error: 'Deployment failed',
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
      endpoint: '/api/agent/deploy',
      method: 'POST',
      requiredFields: ['agentData', 'documentId'],
      optionalFields: ['projectName', 'description', 'environmentVariables', 'vercelTeam'],
      responseFormat: 'Deployment result with updated agent data'
    }
  });
} 