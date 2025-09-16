import { TemplateGenerator, MobileAppTemplateOptions, escapeJSString } from '../base/MobileAppTemplateBase';

export class ApiGenerator implements TemplateGenerator {
  generate(options: MobileAppTemplateOptions): Record<string, string> {
    const files: Record<string, string> = {};

    // System endpoints (App Router format)
    files['src/app/api/health/route.ts'] = this.generateHealthEndpoint(options);
    files['src/app/api/stats/route.ts'] = this.generateStatsEndpoint(options);
    files['src/app/api/models/[modelName]/route.ts'] = this.generateModelEndpoint(options);
    files['src/app/api/models/[modelName]/[id]/route.ts'] = this.generateModelRecordEndpoint();
    files['src/app/api/chat/route.ts'] = this.generateSelfContainedChatEndpoint(options);
    
    // Agent configuration endpoints (embedded data)
    files['src/app/api/agent/actions/route.ts'] = this.generateActionsEndpoint(options);
    files['src/app/api/agent/schedules/route.ts'] = this.generateSchedulesEndpoint(options);
    files['src/app/api/agent/models/route.ts'] = this.generateModelsEndpoint(options);
    files['src/app/api/agent/config/route.ts'] = this.generateAgentConfigEndpoint(options);
    files['src/app/api/debug/route.ts'] = this.generateDebugEndpoint(options);
    
    // Avatar blob storage endpoint
    files['src/app/api/avatar/upload-parts/route.ts'] = this.generateAvatarUploadEndpoint(options);

    // Static action endpoints (one file per action with embedded code)
    options.actions.forEach(action => {
      files[`src/app/api/actions/${action.name}/route.ts`] = this.generateStaticActionEndpoint(action);
    });

    // Static cron endpoints (one file per schedule with embedded code)
    options.schedules.forEach(schedule => {
      files[`src/app/api/cron/${schedule.name}/route.ts`] = this.generateStaticCronEndpoint(schedule, options);
    });

    return files;
  }

  private generateHealthEndpoint(options: MobileAppTemplateOptions): string {
    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw\`SELECT 1\`;
    
    const healthData = {
      status: 'healthy',
      name: '${options.projectName}',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        type: 'PostgreSQL'
      },
      services: {
        actions: {
          count: ${options.actions.length},
          endpoints: [${options.actions.map(a => `'/api/actions/${a.name}'`).join(', ')}]
        },
        schedules: {
          count: ${options.schedules.length},
          active: ${options.schedules.filter(s => s.trigger?.active !== false).length},
          patterns: [${options.schedules.map(s => `'${s.trigger?.pattern || '* * * * *'}'`).join(', ')}]
        },
        models: {
          count: ${options.models.length},
          names: [${options.models.map(m => `'${m.name}'`).join(', ')}]
        }
      }
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      name: '${options.projectName}',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateStatsEndpoint(options: MobileAppTemplateOptions): string {
    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const stats = {
      totalRecords: 0,
      activeSchedules: ${options.schedules.filter(s => s.trigger?.active !== false).length},
      totalModels: ${options.models.length},
      totalActions: ${options.actions.length},
      totalSchedules: ${options.schedules.length},
      lastActivity: new Date().toISOString()
    };

    // First ensure database is initialized
    try {
      await prisma.$queryRaw\`SELECT 1\`;
      
      // Try to get actual record counts from each model
      ${options.models.map(model => {
        const camelCaseModelName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
        return `
      try {
        const ${camelCaseModelName}Count = await prisma.${camelCaseModelName}.count();
        stats.totalRecords += ${camelCaseModelName}Count;
      } catch (error) {
        console.log('Model ${model.name} not yet available:', error.message);
      }`;
      }).join('')}
    } catch (dbError) {
      console.log('Database not ready, using default stats:', dbError.message);
    }

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get stats',
      data: {
        totalRecords: 0,
        activeSchedules: ${options.schedules.filter(s => s.trigger?.active !== false).length},
        totalModels: ${options.models.length},
        totalActions: ${options.actions.length},
        totalSchedules: ${options.schedules.length},
        lastActivity: new Date().toISOString()
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateModelEndpoint(options: MobileAppTemplateOptions): string {
    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to ensure database is initialized
async function ensureDatabaseInit() {
  try {
    // Test database connection
    await prisma.$queryRaw\`SELECT 1\`;
    console.log('Database connection successful');
  } catch (error: any) {
    console.log('Database connection failed:', error.message);
    console.log('This is expected if the PostgreSQL database hasn\\'t been created yet.');
    
    // In production (Vercel), the database should already be set up by the build process
    if (process.env.NODE_ENV === 'production') {
      console.log('Production environment - database should be initialized by Vercel build process');
      // Try one more time after a brief delay for database warm-up
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await prisma.$queryRaw\`SELECT 1\`;
        console.log('Database connection successful on retry');
      } catch (retryError: any) {
        console.error('Database still not available:', retryError.message);
        throw new Error('Database connection failed in production - please ensure the PostgreSQL database exists and is accessible');
      }
    } else {
      throw new Error('Database connection failed - please ensure the PostgreSQL database exists and DATABASE_URL is correct');
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: { modelName: string } }) {
  const { modelName } = params;
  const { searchParams } = new URL(request.url);

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    console.error(\`Model '\${modelName}' (camelCase: '\${camelCaseModelName}') not found in Prisma client\`);
    console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    // GET method - Get all records with optional filtering and pagination
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '100';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get model definition from embedded config
    const embeddedModels = ${JSON.stringify(options.models)};
    const modelDef = embeddedModels.find(m => m.name === modelName);
          
          let availableFields: string[] = [];
          let defaultSortField = 'id'; // fallback
          
          if (modelDef && modelDef.fields) {
            // Extract field names from model definition
            availableFields = modelDef.fields.map((field: any) => field.name);
            
            // Prefer timestamp fields for default sorting
            const timestampFields = ['createdAt', 'updatedAt', 'requestDate'];
            const availableTimestamp = timestampFields.find(field => availableFields.includes(field));
            
            if (availableTimestamp) {
              defaultSortField = availableTimestamp;
            } else {
              // Use the first field that's likely an ID field
              const idFields = availableFields.filter(field => 
                field.toLowerCase().includes('id') || field === 'id'
              );
              defaultSortField = idFields[0] || availableFields[0] || 'id';
            }
          } else {
            console.log('Model definition not found in config, using fallback');
          }

          // Use provided sortBy if it exists in available fields, otherwise use default
          const finalSortBy = (sortBy && availableFields.includes(sortBy as string)) ? 
                              sortBy as string : defaultSortField;

          let where = {};
          if (search && typeof search === 'string') {
            // Use model definition to determine searchable fields
            const searchConditions = [];
            
            if (modelDef && modelDef.fields) {
              // Get string fields from model definition (exclude ID fields)
              const stringFields = modelDef.fields
                .filter((field: any) => 
                  (field.type === 'String' || field.type === 'string') && 
                  !field.name.toLowerCase().includes('id')
                )
                .map((field: any) => field.name);
              
              stringFields.forEach(field => {
                searchConditions.push({ [field]: { contains: search, mode: 'insensitive' } });
              });
            } else {
              // Fallback to common field names if model definition not available
              const commonFields = ['name', 'title', 'description', 'label', 'content', 'requestContent', 'featureName', 'featureDescription', 'requirementDescription'];
              commonFields.forEach(field => {
                searchConditions.push({ [field]: { contains: search, mode: 'insensitive' } });
              });
            }
            
            if (searchConditions.length > 0) {
              where = { OR: searchConditions };
            }
          }

          const [records, total] = await Promise.all([
            modelClient.findMany({
              where,
              skip,
              take: limitNum,
              orderBy: { [finalSortBy]: sortOrder }
            }),
            modelClient.count({ where })
          ]);
          
    return NextResponse.json({ 
      success: true, 
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error(\`Error with model \${modelName}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unique constraint violation',
        details: 'A record with this data already exists'
      }, { status: 409 });
    } else if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to access model \${modelName}\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest, { params }: { params: { modelName: string } }) {
  const { modelName } = params;

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    const createData = await request.json();
    if (!createData || typeof createData !== 'object') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    const newRecord = await modelClient.create({
      data: createData
    });
    
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    console.error(\`Error creating model \${modelName}:\`, error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unique constraint violation',
        details: 'A record with this data already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to create model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateModelRecordEndpoint(): string {
    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to ensure database is initialized
async function ensureDatabaseInit() {
  try {
    // Test database connection
    await prisma.$queryRaw\`SELECT 1\`;
    console.log('Database connection successful');
  } catch (error: any) {
    console.log('Database connection failed:', error.message);
    console.log('This is expected if the PostgreSQL database hasn\\'t been created yet.');
    
    // In production (Vercel), the database should already be set up by the build process
    if (process.env.NODE_ENV === 'production') {
      console.log('Production environment - database should be initialized by Vercel build process');
      // Try one more time after a brief delay for database warm-up
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await prisma.$queryRaw\`SELECT 1\`;
        console.log('Database connection successful on retry');
      } catch (retryError: any) {
        console.error('Database still not available:', retryError.message);
        throw new Error('Database connection failed in production - please ensure the PostgreSQL database exists and is accessible');
      }
    } else {
      throw new Error('Database connection failed - please ensure the PostgreSQL database exists and DATABASE_URL is correct');
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: { modelName: string; id: string } }) {
  const { modelName, id } = params;

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    console.error(\`Model '\${modelName}' (camelCase: '\${camelCaseModelName}') not found in Prisma client\`);
    console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    // Get single record by ID
    const record = await modelClient.findUnique({
      where: { id }
    });
    
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error(\`Error with model \${modelName} record \${id}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to access model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { modelName: string; id: string } }) {
  const { modelName, id } = params;

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    const updateData = await request.json();
    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    // Check if record exists first
    const existingRecord = await modelClient.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const updatedRecord = await modelClient.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    console.error(\`Error updating model \${modelName} record \${id}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unique constraint violation',
        details: 'A record with this data already exists'
      }, { status: 409 });
    } else if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to update model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { modelName: string; id: string } }) {
  const { modelName, id } = params;

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
  }

  // Ensure database is initialized before proceeding
  try {
    await ensureDatabaseInit();
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: 'Unable to initialize PostgreSQL database'
    }, { status: 500 });
  }

  // Convert PascalCase model name to camelCase for Prisma client access
  const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const modelClient = (prisma as any)[camelCaseModelName];
  
  if (!modelClient) {
    return NextResponse.json({ 
      error: \`Model '\${modelName}' not found\`,
      details: \`Attempted to access '\${camelCaseModelName}' on Prisma client\`,
      availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    }, { status: 404 });
  }

  try {
    // Check if record exists
    const recordToDelete = await modelClient.findUnique({
      where: { id }
    });

    if (!recordToDelete) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await modelClient.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error(\`Error deleting model \${modelName} record \${id}:\`, error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found',
        details: 'The record you are trying to access does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: \`Failed to delete model \${modelName} record\`,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateSelfContainedChatEndpoint(options: MobileAppTemplateOptions): string {
    const modelsContext = options.models.map(m => `${m.name} (${m.description || 'data model'})`).join(', ');
    const actionsContext = options.actions.map(a => `${a.name} (${a.description || 'action'})`).join(', ');
    const schedulesContext = options.schedules.map(s => `${s.name} (${s.description || 'scheduled task'})`).join(', ');
    
    return `import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';

// Self-contained AI model configuration with local API keys
async function getAIModelWithApiKeys() {
  try {
    // Use local environment variables for API keys
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const grokKey = process.env.GROK_API_KEY;

    // Determine which provider to use based on available keys
    const provider = process.env.AI_MODEL_PROVIDER || 'openai';
    const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
    
    switch (provider) {
      case 'anthropic':
        if (!anthropicKey) {
          throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }
        return anthropic(modelName, { apiKey: anthropicKey });
      case 'grok':
        if (!grokKey) {
          throw new Error('GROK_API_KEY environment variable is required');
        }
        return openai(modelName, { 
          apiKey: grokKey,
          baseURL: 'https://api.x.ai/v1'
        });
      case 'openai':
      default:
        if (!openaiKey) {
          throw new Error('OPENAI_API_KEY environment variable is required');
        }
        return openai(modelName, { apiKey: openaiKey });
    }
  } catch (error) {
    console.error('Failed to get AI model configuration:', error);
    throw new Error('Failed to configure AI model. Please check your API keys.');
  }
}

// Build system prompt with embedded agent data
async function buildSystemPrompt() {
  const baseName = "${escapeJSString(options.agentConfig?.name || options.projectName)}";
  const agentPersonality = "${escapeJSString(options.agentConfig?.avatar?.personality || options.agentConfig?.personality || '')}";
  const characterInspiration = "${escapeJSString(options.agentConfig?.avatar?.characterNames || options.agentConfig?.characterNames || '')}";
  const description = "${escapeJSString(options.agentConfig?.description || 'A self-contained AI agent application')}";
  
  // Build personality prompt based on available data
  let personalityPrompt = "helpful and professional";
  
  console.log('🎭 Building personality prompt:', {
    agentPersonality: agentPersonality,
    characterInspiration: characterInspiration,
    hasPersonality: !!agentPersonality,
    hasCharacterInspiration: !!characterInspiration
  });
  
  if (agentPersonality && characterInspiration) {
    personalityPrompt = \`\${agentPersonality}. Draw inspiration from: \${characterInspiration}\`;
  } else if (agentPersonality) {
    personalityPrompt = agentPersonality;
  } else if (characterInspiration) {
    personalityPrompt = \`professional and helpful, drawing inspiration from: \${characterInspiration}\`;
  }
  
  console.log('🎭 Final personality prompt:', personalityPrompt);
  
  return \`You are an AI assistant for "\${baseName}", a self-contained agent application.

**Agent Description:** \${description}

**Your Personality:** \${personalityPrompt}

**About this agent:**
- **Data Models (${options.models.length})**: ${options.models.map(m => m.name).join(', ')}
- **Smart Actions (${options.actions.length})**: ${options.actions.map(a => a.name).join(', ')}  
- **Scheduled Tasks (${options.schedules.length})**: ${options.schedules.map(s => s.name).join(', ')}

**Your capabilities:**
1. **Data Management & CRUD**: Help users view, create, update, and delete records in their data models
2. **Action Execution**: Guide users through executing smart actions with proper parameters
3. **Task Management**: Assist with scheduled task monitoring and configuration
4. **System Insights**: Provide status updates and performance insights
5. **Conversational Support**: Answer questions and provide guidance

**Response Guidelines:**
- Embody the personality described above in all your responses
- If you have character inspirations, subtly incorporate their communication style and mannerisms
- Be helpful, concise, and technical when needed
- Use emojis sparingly but effectively to match your personality
- Provide actionable suggestions with clear next steps
- Reference specific models, actions, or schedules when relevant
- Format code or data clearly with markdown
- When users want to perform actions or CRUD operations, guide them to the appropriate UI
- Stay true to your personality while being professional and helpful

**Available context:**
- Models: ${modelsContext}
- Actions: ${actionsContext}
- Schedules: ${schedulesContext}

**Smart Detection:**
Detect user intent and respond appropriately:
- **Action Request**: If user wants to execute an action, suggest using the Actions page
- **Data CRUD**: If user wants to manage data, suggest using the Models/Data page
- **General Questions**: Answer conversationally while maintaining your personality
- **System Status**: Provide insights about the agent's current state
- **Personality Questions**: When asked about your personality, mention: \${personalityPrompt}
- **Character Questions**: When asked about character names or inspiration, respond with: \${characterInspiration || 'I don\\'t have specific character inspirations set'}

Always be ready to help with queries about data, actions, schedules, or general system operations while maintaining your unique personality.\`;
}

// App Router API Route Handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Get AI model with local API keys
    const model = await getAIModelWithApiKeys();
    
    // Build system prompt
    const systemPrompt = await buildSystemPrompt();

    // Convert messages and add system message
    const coreMessages = convertToCoreMessages([
      { role: 'system', content: systemPrompt },
      ...messages
    ]);

    // Stream the response
    const result = await streamText({
      model,
      messages: coreMessages,
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateStaticActionEndpoint(action: any): string {
    // Extract action code from the standardized location: action.execute.code.script
    const actionCode = action.execute?.code?.script;

    // Check if we have generated code
    const hasGeneratedCode = !!actionCode;
    
    let wrappedActionCode;
    if (hasGeneratedCode && (actionCode.includes('async function') || actionCode.includes('function'))) {
      // If the code is already a function, execute it directly
      wrappedActionCode = `
    // Get AI model for the action
    const aiModel = await getAIModel();
    
    // Generated action code
    const actionFunction = ${actionCode};
    
    // Execute the action function directly with access to all libraries
    const result = await actionFunction();
    `;
    } else if (hasGeneratedCode) {
      // If it's raw code, wrap it in a function context
      wrappedActionCode = `
    // Get AI model for the action
    const aiModel = await getAIModel();
    
    // Execute the generated action code directly
    ${actionCode}
    `;
    } else {
      // No generated code - return error
      wrappedActionCode = `
    throw new Error('No generated code available for action: ${action.name}');
    `;
    }

    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const prisma = new PrismaClient();

// Get AI model configuration
async function getAIModel() {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
  
  switch (provider) {
    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      return anthropic(modelName, { apiKey: process.env.ANTHROPIC_API_KEY });
    case 'openai':
    default:
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      return openai(modelName, { apiKey: process.env.OPENAI_API_KEY });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { parameters } = await request.json();
    
    // Action: ${action.name}
    // Description: ${escapeJSString(action.description || 'No description provided')}
    // Type: ${action.results?.actionType || 'generated'}
    // Has Generated Code: ${!!hasGeneratedCode}
    
    ${wrappedActionCode}
    
    return NextResponse.json({ 
      success: true, 
      action: '${action.name}',
      result: result,
      executedAt: new Date().toISOString(),
      hasGeneratedCode: ${!!hasGeneratedCode}
    });
  } catch (error) {
    console.error('Action execution error:', error);
    return NextResponse.json({ 
      error: 'Action execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      action: '${action.name}'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  private generateStaticCronEndpoint(schedule: any, options: MobileAppTemplateOptions): string {
    // Schedules work by executing a sequence of actions, not standalone code
    const hasSteps = schedule.steps && schedule.steps.length > 0;
    
    // Create action ID to name mapping for schedules that might reference actions by ID
    const actionIdToNameMap = options.actions.reduce((map: any, action: any) => {
      if (action.id && action.id !== action.name) {
        map[action.id] = action.name;
      }
      return map;
    }, {});
    
    let scheduleExecutionCode;
    if (hasSteps) {
      // Execute actions sequentially based on schedule steps
      scheduleExecutionCode = `
    const results = [];
    const steps = ${JSON.stringify(schedule.steps)};
    const actionIdToNameMap = ${JSON.stringify(actionIdToNameMap)};
    
    console.log(\`📋 Executing \${steps.length} steps for schedule: ${schedule.name}\`);
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      // Resolve action name: use direct name if available, otherwise map from ID
      const actionName = step.actionName || actionIdToNameMap[step.actionId] || step.actionId;
      
      console.log(\`🔄 Step \${i + 1}/\${steps.length}: \${step.description || actionName} (action: \${actionName})\`);
      
      if (!actionName) {
        console.error(\`❌ Action "\${step.actionId || step.actionName}" not found\`);
        results.push({
          step: i + 1,
          actionId: step.actionId || step.actionName,
          success: false,
          error: 'Action not found',
          executedAt: new Date().toISOString()
        });
        continue;
      }
      
      try {
        // Execute the action directly by importing its handler (using action name)
        let actionResult;
        
        try {
          // Import the action handler dynamically using action name (App Router format)
          const actionModule = await import(\`../../actions/\${actionName}/route\`);
          
          // Create a mock NextRequest for the action
          const mockRequestBody = JSON.stringify({ parameters: step.inputParams || step.input || {} });
          const mockRequest = new Request('http://localhost:3000/api/actions/' + actionName, {
            method: 'POST',
            body: mockRequestBody,
            headers: { 'Content-Type': 'application/json' }
          });
          
          // Execute the action handler (App Router format)
          const response = await actionModule.POST(mockRequest);
          actionResult = await response.json();
          
        } catch (importError) {
          // Fallback to HTTP call if direct import fails (using action name)
          console.log(\`📞 Falling back to HTTP call for action \${actionName}\`);
          
          const baseUrl = process.env.VERCEL_URL ? \`https://\${process.env.VERCEL_URL}\` : 
                         process.env.NEXT_PUBLIC_VERCEL_URL ? \`https://\${process.env.NEXT_PUBLIC_VERCEL_URL}\` :
                         'http://localhost:3000';
          
          const actionResponse = await fetch(\`\${baseUrl}/api/actions/\${actionName}\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parameters: step.inputParams || step.input || {}
            })
          });
          
          if (!actionResponse.ok) {
            throw new Error(\`Action \${actionName} (ID: \${step.actionId}) failed with status: \${actionResponse.status}\`);
          }
          
          actionResult = await actionResponse.json();
        }
        results.push({
          step: i + 1,
          actionName: actionName,
          actionId: step.actionId,
          success: actionResult.success,
          result: actionResult.result || actionResult.data,
          executedAt: new Date().toISOString()
        });
        
        console.log(\`✅ Step \${i + 1} completed successfully\`);
        
        // Add delay if specified in step configuration
        if (step.delay && step.delay.duration) {
          console.log(\`⏳ Waiting \${step.delay.duration}ms before next step...\`);
          await new Promise(resolve => setTimeout(resolve, step.delay.duration));
        }
        
      } catch (stepError) {
        console.error(\`❌ Step \${i + 1} failed:\`, stepError);
        results.push({
          step: i + 1,
          actionName: actionName,
          actionId: step.actionId,
          success: false,
          error: stepError instanceof Error ? stepError.message : 'Unknown error',
          executedAt: new Date().toISOString()
        });
        
        // Stop execution if step is configured to stop on error
        if (step.onError?.action === 'stop') {
          console.log(\`🛑 Stopping schedule execution due to step error\`);
          break;
        }
      }
    }
    
    const successfulSteps = results.filter(r => r.success).length;
    const result = {
      scheduleName: '${schedule.name}',
      totalSteps: steps.length,
      completedSteps: results.length,
      successfulSteps: successfulSteps,
      results: results,
      success: successfulSteps > 0,
      executedAt: new Date().toISOString()
    };`;
    } else {
      // No steps defined - this shouldn't happen for properly generated schedules
      scheduleExecutionCode = `
    console.warn('⚠️ Schedule ${schedule.name} has no steps defined');
    const result = {
      scheduleName: '${schedule.name}',
      success: false,
      error: 'No steps defined for this schedule',
      totalSteps: 0,
      completedSteps: 0,
      successfulSteps: 0,
      results: [],
      executedAt: new Date().toISOString()
    };`;
    }

    return `import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const prisma = new PrismaClient();

// Get AI model configuration
async function getAIModel() {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
  
  switch (provider) {
    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      return anthropic(modelName, { apiKey: process.env.ANTHROPIC_API_KEY });
    case 'openai':
    default:
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      return openai(modelName, { apiKey: process.env.OPENAI_API_KEY });
  }
}

export async function POST(request: NextRequest) {
  // Verify cron secret for manual calls, but allow Vercel's automatic cron execution
  const cronSecret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret');
  const userAgent = request.headers.get('user-agent') || '';
  const isVercelCron = userAgent.includes('vercel-cron') || 
                      request.headers.get('x-vercel-cron') === '1';
  
  // Allow Vercel's automatic cron execution or valid cron secret
  if (!isVercelCron && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🕐 Executing schedule: ${schedule.name}');
    console.log('📝 Description: ${escapeJSString(schedule.description || 'No description provided')}');
    console.log('⏰ Pattern: ${schedule.trigger?.pattern || '*/5 * * * *'}');
    console.log('🔢 Steps: ${schedule.steps?.length || 0} action steps');
    console.log('🔑 Auth method:', isVercelCron ? 'Vercel Cron' : 'Manual with secret');
    
    ${scheduleExecutionCode}
    
    return NextResponse.json({ 
      success: true, 
      schedule: '${schedule.name}',
      executedAt: new Date().toISOString(),
      result: result,
      hasSteps: ${hasSteps}
    });
  } catch (error) {
    console.error('Schedule execution error:', error);
    return NextResponse.json({ 
      error: 'Schedule execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      schedule: '${schedule.name}'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}`;
  }

  // Agent configuration endpoints
  private generateActionsEndpoint(options: MobileAppTemplateOptions): string {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return embedded actions directly (no main app calls)
    const actions = ${JSON.stringify(options.actions)};
    
    console.log('📦 Returning embedded actions:', {
      count: actions.length,
      names: actions.map(a => a.name)
    });
    
    return NextResponse.json({
      success: true,
      actions: actions,
      source: 'embedded'
    });
  } catch (error) {
    console.error('Error fetching embedded actions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateSchedulesEndpoint(options: MobileAppTemplateOptions): string {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return embedded schedules directly (no main app calls)
    const schedules = ${JSON.stringify(options.schedules)};
    
    console.log('📦 Returning embedded schedules:', {
      count: schedules.length,
      names: schedules.map(s => s.name)
    });
    
    return NextResponse.json({
      success: true,
      schedules: schedules,
      source: 'embedded'
    });
  } catch (error) {
    console.error('Error fetching embedded schedules:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateModelsEndpoint(options: MobileAppTemplateOptions): string {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return embedded models directly (no main app calls)
    const models = ${JSON.stringify(options.models)};
    
    console.log('📦 Returning embedded models:', {
      count: models.length,
      names: models.map(m => m.name)
    });
    
    return NextResponse.json({
      success: true,
      models: models,
      source: 'embedded'
    });
  } catch (error) {
    console.error('Error fetching embedded models:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateAgentConfigEndpoint(options: MobileAppTemplateOptions): string {
    const agentName = escapeJSString(options.agentConfig?.name || options.projectName);
    const agentDescription = escapeJSString(options.agentConfig?.description || 'Self-contained AI agent application');
    const agentTheme = options.agentConfig?.theme || 'green';
    const agentAvatar = options.agentConfig?.avatar || null;
    const agentDomain = options.agentConfig?.domain || null;
    const agentPersonality = escapeJSString(options.agentConfig?.personality || '');
    const agentCharacterNames = escapeJSString(options.agentConfig?.characterNames || '');
    
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Config API returning fully embedded local configuration');
    console.log('🎭 Personality data check:', {
      agentPersonality: '${agentPersonality}',
      agentCharacterNames: '${agentCharacterNames}',
      hasPersonality: !!'${agentPersonality}',
      hasCharacterNames: !!'${agentCharacterNames}'
    });

    // Return fully embedded local configuration
    const config = {
      // All configuration embedded locally
      name: '${agentName}',
      description: '${agentDescription}',
      theme: '${agentTheme}',
      avatar: ${JSON.stringify(agentAvatar)},
      domain: ${JSON.stringify(agentDomain)},
      personality: '${agentPersonality}' || ${JSON.stringify(agentAvatar)}?.personality,
      characterNames: '${agentCharacterNames}' || ${JSON.stringify(agentAvatar)}?.characterNames,
      
      // Functional data embedded locally
      models: ${JSON.stringify(options.models)},
      actions: ${JSON.stringify(options.actions)},
      schedules: ${JSON.stringify(options.schedules)}
    };
    
    console.log('✅ Returning fully local config:', {
      name: config.name,
      theme: config.theme,
      hasAvatar: !!config.avatar,
      avatarType: config.avatar?.type,
      hasDescription: !!config.description,
      hasPersonality: !!config.personality,
      personality: config.personality,
      hasCharacterNames: !!config.characterNames,
      characterNames: config.characterNames,
      source: 'fully-local-embedded',
      modelsCount: config.models.length,
      actionsCount: config.actions.length,
      schedulesCount: config.schedules.length
    });
    
    return NextResponse.json({
      success: true,
      config,
      source: 'fully-local-embedded'
    });
  } catch (error) {
    console.error('❌ Error returning local config:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to return local configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateDebugEndpoint(options: MobileAppTemplateOptions): string {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const debugInfo = {
      agentConfig: {
        name: '${escapeJSString(options.agentConfig?.name || options.projectName)}',
        description: '${escapeJSString(options.agentConfig?.description || '')}',
        theme: '${options.agentConfig?.theme || 'green'}',
        hasAvatar: ${!!options.agentConfig?.avatar},
        avatar: ${JSON.stringify(options.agentConfig?.avatar)},
        personality: '${escapeJSString(options.agentConfig?.personality || '')}',
        characterNames: '${escapeJSString(options.agentConfig?.characterNames || '')}',
        avatarPersonality: '${escapeJSString(options.agentConfig?.avatar?.personality || '')}',
        avatarCharacterNames: '${escapeJSString(options.agentConfig?.avatar?.characterNames || '')}',
      },
      models: ${JSON.stringify(options.models.map(m => ({ name: m.name, title: m.title })))},
      actions: ${JSON.stringify(options.actions.map(a => ({ name: a.name, title: a.title })))},
      schedules: ${JSON.stringify(options.schedules.map(s => ({ name: s.name, description: s.description })))},
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}`;
  }

  private generateAvatarUploadEndpoint(options: MobileAppTemplateOptions): string {
    return `import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for validating unicorn parts upload
const UnicornPartsSchema = z.object({
  parts: z.object({
    body: z.string(),
    hair: z.string(), 
    eyes: z.string(),
    mouth: z.string(),
    accessory: z.string()
  })
});

// Mapping of local files to their blob URLs (will be populated from public folder)
const UNICORN_PARTS_MAP: Record<string, Record<string, string>> = {
  bodies: {
    "body.png": "/images/unicorn/bodies/body.png",
    "body_h.png": "/images/unicorn/bodies/body_h.png"
  },
  hair: {
    "hair_blue.png": "/images/unicorn/hair/hair_blue.png", 
    "hair_g.png": "/images/unicorn/hair/hair_g.png"
  },
  eyes: {
    "eye_h.png": "/images/unicorn/eyes/eye_h.png",
    "eye_heart.png": "/images/unicorn/eyes/eye_heart.png"
  },
  mouths: {
    "m_.png": "/images/unicorn/mouths/m_.png",
    "m_ice.png": "/images/unicorn/mouths/m_ice.png"
  },
  accessories: {
    "corn_ice1.png": "/images/unicorn/accessories/corn_ice1.png",
    "corn_ice2.png": "/images/unicorn/accessories/corn_ice2.png"
  }
};

// Function to upload a single image part to blob storage
async function uploadPartToBlob(
  category: string, 
  filename: string, 
  userId: string
): Promise<string> {
  try {
    // Get the local file path
    const localPath = UNICORN_PARTS_MAP[category]?.[filename];
    if (!localPath) {
      throw new Error(\`Image not found: \${category}/\${filename}\`);
    }

    // Read the file from the public directory
    const response = await fetch(\`\${process.env.NEXTAUTH_URL || 'http://localhost:3000'}\${localPath}\`);
    if (!response.ok) {
      throw new Error(\`Failed to fetch \${localPath}: \${response.statusText}\`);
    }

    const fileBuffer = await response.arrayBuffer();
    
    // Generate unique filename with user ID and timestamp
    const timestamp = Date.now();
    const uniqueFilename = \`avatars/\${userId}/\${timestamp}-\${category}-\${filename}\`;
    
    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, fileBuffer, {
      access: 'public',
      contentType: 'image/png'
    });

    return blob.url;
  } catch (error) {
    console.error(\`Failed to upload \${category}/\${filename}:\`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // For deployed agents, we'll skip auth for simplicity (could add later)
    const body = await request.json();
    const validatedData = UnicornPartsSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid parts data', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { parts } = validatedData.data;
    const userId = 'deployed-agent'; // Use a generic user ID for deployed agents

    console.log('🔄 Processing unicorn parts:', { parts, userId });

    // Check if Vercel Blob is available
    const hasVercelBlob = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (hasVercelBlob) {
      console.log('📦 Vercel Blob available, uploading to blob storage...');
      try {
        // Upload each part to blob storage
        const uploadedParts = {
          body: await uploadPartToBlob('bodies', parts.body, userId),
          hair: await uploadPartToBlob('hair', parts.hair, userId), 
          eyes: await uploadPartToBlob('eyes', parts.eyes, userId),
          mouth: await uploadPartToBlob('mouths', parts.mouth, userId),
          accessory: await uploadPartToBlob('accessories', parts.accessory, userId)
        };

        console.log('✅ Successfully uploaded all unicorn parts to blob:', uploadedParts);

        return NextResponse.json({
          success: true,
          uploadedParts,
          message: 'All unicorn parts uploaded to blob storage successfully',
          source: 'blob'
        });
      } catch (blobError) {
        console.warn('⚠️ Blob upload failed, falling back to local paths:', blobError);
        // Fall through to local path handling
      }
    } else {
      console.log('📁 Vercel Blob not available, using local paths...');
    }

    // Fallback: Convert to local static paths
    const uploadedParts = {
      body: UNICORN_PARTS_MAP.bodies[parts.body] || \`/images/unicorn/bodies/\${parts.body}\`,
      hair: UNICORN_PARTS_MAP.hair[parts.hair] || \`/images/unicorn/hair/\${parts.hair}\`,
      eyes: UNICORN_PARTS_MAP.eyes[parts.eyes] || \`/images/unicorn/eyes/\${parts.eyes}\`,
      mouth: UNICORN_PARTS_MAP.mouths[parts.mouth] || \`/images/unicorn/mouths/\${parts.mouth}\`,
      accessory: UNICORN_PARTS_MAP.accessories[parts.accessory] || \`/images/unicorn/accessories/\${parts.accessory}\`
    };

    console.log('✅ Successfully mapped unicorn parts to local paths:', uploadedParts);

    return NextResponse.json({
      success: true,
      uploadedParts,
      message: 'All unicorn parts mapped to local paths successfully',
      source: 'local'
    });

  } catch (error) {
    console.error('❌ Error processing unicorn parts:', error);
    return NextResponse.json(
      { error: 'Failed to process unicorn parts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available unicorn parts
export async function GET() {
  try {
    return NextResponse.json({
      availableParts: UNICORN_PARTS_MAP,
      message: 'Available unicorn parts retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error retrieving unicorn parts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve unicorn parts' },
      { status: 500 }
    );
  }
}`;
  }
} 