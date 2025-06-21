import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import type { Session } from 'next-auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getDocumentById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { getUserApiKeys } from '@/lib/db/api-keys';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { xai, createXai } from '@ai-sdk/xai';
import { chatModels } from '@/lib/ai/models';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import { agentBuilder } from '@/lib/ai/tools/agent-builder';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

// Function to determine which tool to use based on conversation context
function determineToolsForConversation(messages: any[], isNewConversation: boolean): string[] {
  // Always use the agent builder
  return ['agentBuilder'];
}

async function getExistingAgentContext(messages: any[], session: Session | null): Promise<{ documentId: string; content: string } | null> {
  console.log('🔍 Searching for existing agent document in conversation...');
  console.log(`📋 Analyzing ${messages.length} messages for agent document ID`);
  
  // Look for the most recent agent document ID in the conversation from any message
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    console.log(`🔍 Checking message ${i + 1}/${messages.length} (role: ${message.role})`);
    
    // Check if this message has parts (could be any role)
    if (message.parts) {
      console.log(`📋 Message has ${message.parts.length} parts`);
      
      for (const part of message.parts) {
        console.log(`🔍 Checking part type: ${part.type}`);
        
        // Method 1: Look for tool-invocation parts (correct AI framework structure)
        if (part.type === 'tool-invocation' && part.toolInvocation) {
          const { toolInvocation } = part;
          const { toolName, state } = toolInvocation;
          
          console.log(`🔍 Found tool invocation: ${toolName}, state: ${state}`);
          
          if (toolName === 'agentBuilder') {
            console.log('✅ Found agentBuilder tool invocation');
            
            // Check if this is a result state with document ID
            if (state === 'result' && toolInvocation.result) {
              const result = toolInvocation.result;
              console.log('🔍 Tool result data:', JSON.stringify(result).substring(0, 200));
              
              if (result.id && result.kind === 'agent') {
                const documentId = result.id;
                console.log('🎯 Found agent document ID from tool invocation result:', documentId);
                
                const agentData = await fetchAndValidateAgentDocument(documentId, session);
                if (agentData) return agentData;
              }
            }
            
            // Also check call state args for document ID (in case of continuing conversation)
            if (state === 'call' && toolInvocation.args) {
              const args = toolInvocation.args;
              console.log('🔍 Tool call args:', JSON.stringify(args).substring(0, 200));
              
              if (args.context || args.existingDocumentId) {
                const documentId = args.existingDocumentId;
                if (documentId) {
                  console.log('🎯 Found existing document ID from tool call args:', documentId);
                  
                  const agentData = await fetchAndValidateAgentDocument(documentId, session);
                  if (agentData) return agentData;
                }
              }
            }
          }
        }
        
        // Method 2: Legacy support - Look for old tool-call structure
        if (part.type === 'tool-call' && part.toolName === 'agentBuilder') {
          console.log('✅ Found legacy agentBuilder tool call');
          
          if (part.result?.id && part.result.kind === 'agent') {
            const documentId = part.result.id;
            console.log('🎯 Found agent document ID from legacy tool result:', documentId);
            
            const agentData = await fetchAndValidateAgentDocument(documentId, session);
            if (agentData) return agentData;
          }
        }
        
        // Method 3: Look for tool-result parts
        if (part.type === 'tool-result' && part.toolName === 'agentBuilder') {
          console.log('✅ Found agentBuilder tool result');
          
          if (part.result?.id && part.result.kind === 'agent') {
            const documentId = part.result.id;
            console.log('🎯 Found agent document ID from tool result part:', documentId);
            
            const agentData = await fetchAndValidateAgentDocument(documentId, session);
            if (agentData) return agentData;
          }
        }
        
        // Method 4: Look in text content for document references
        if (part.type === 'text' && typeof part.text === 'string') {
          // Look for document ID patterns in text
          const documentIdMatch = part.text.match(/document.*?(?:id|ID)[:\s]*([a-f0-9-]{36})/i);
          if (documentIdMatch) {
            const documentId = documentIdMatch[1];
            console.log('🎯 Found potential document ID in text:', documentId);
            
            const agentData = await fetchAndValidateAgentDocument(documentId, session);
            if (agentData) return agentData;
          }
        }
        
        // Method 5: Look for streaming data that might contain document IDs
        if (part.experimental_providerMetadata?.cursor) {
          console.log('🔍 Checking provider metadata for document references...');
          const metadata = part.experimental_providerMetadata;
          
          // Check if metadata contains document information
          if (metadata.documentId) {
            const documentId = metadata.documentId;
            console.log('🎯 Found document ID in provider metadata:', documentId);
            
            const agentData = await fetchAndValidateAgentDocument(documentId, session);
            if (agentData) return agentData;
          }
        }
      }
    }
    
    // Method 6: Check if message itself has document metadata
    if (message.experimental_providerMetadata) {
      console.log('🔍 Checking message-level provider metadata...');
      const metadata = message.experimental_providerMetadata;
      
      if (metadata.documentId) {
        const documentId = metadata.documentId;
        console.log('🎯 Found document ID in message metadata:', documentId);
        
        const agentData = await fetchAndValidateAgentDocument(documentId, session);
        if (agentData) return agentData;
      }
    }
    
    // Method 7: Look for document ID in the entire message content (as fallback)
    const messageStr = JSON.stringify(message);
    const documentIdMatch = messageStr.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g);
    if (documentIdMatch) {
      console.log(`🔍 Found ${documentIdMatch.length} potential UUID(s) in message:`, documentIdMatch);
      
      // Try each UUID to see if it's a valid agent document
      for (const potentialId of documentIdMatch) {
        console.log('🎯 Testing potential document ID:', potentialId);
        const agentData = await fetchAndValidateAgentDocument(potentialId, session);
        if (agentData) return agentData;
      }
    }
  }
  
  console.log('🔍 No existing agent document found in conversation');
  return null;
}

// Helper function to fetch and validate agent document
async function fetchAndValidateAgentDocument(documentId: string, session: Session | null): Promise<{ documentId: string; content: string } | null> {
  try {
    console.log('📄 Attempting to fetch document:', documentId);
    
    // Fetch the latest agent data from the document table
    const document = await getDocumentById({ id: documentId });
    
    if (!document) {
      console.log('❌ Document not found');
      return null;
    }
    
    if (!document.content) {
      console.log('❌ Document has no content');
      return null;
    }
    
    if (document.userId !== session?.user?.id) {
      console.log('❌ Document access denied (user mismatch)');
      return null;
    }
    
    console.log('✅ Document found and accessible');
    
    // Validate that the content is valid JSON and contains agent-like structure
    try {
      const parsed = JSON.parse(document.content);
      
      // Check if this looks like valid agent data
      if (typeof parsed === 'object' && parsed !== null) {
        // Check for agent data structure (arrays can be empty, so check for presence, not truthiness)
        if (Array.isArray(parsed.models) && Array.isArray(parsed.actions) && typeof parsed.name === 'string') {
          console.log('✅ Valid agent document content found with proper structure');
          console.log(`📊 Agent data: ${parsed.models.length} models, ${parsed.actions.length} actions`);
          
          // Migrate actions to have IDs if they don't have them
          if (parsed.actions && Array.isArray(parsed.actions)) {
            let hasChanges = false;
            const migratedActions = parsed.actions.map((action: any, index: number) => {
              if (!action.id) {
                hasChanges = true;
                const newId = `act${index + 1}`;
                console.log(`🔄 Migrating action "${action.name}" to ID: ${newId}`);
                return { ...action, id: newId };
              }
              return action;
            });
            
            if (hasChanges) {
              console.log(`🔄 Migrated ${migratedActions.length} actions to have IDs`);
              parsed.actions = migratedActions;
              // Update the document with migrated data
              const updatedContent = JSON.stringify(parsed, null, 2);
              return { documentId, content: updatedContent };
            }
          }
          
          return { documentId, content: document.content };
        }
        
        // Fallback check for less strict validation - if it has at least some agent-like properties
        if ((parsed.hasOwnProperty('models') || parsed.hasOwnProperty('actions')) && parsed.hasOwnProperty('name')) {
          console.log('✅ Valid agent document content found with basic structure');
          return { documentId, content: document.content };
        }
        
        // If it's just status/progress data, not the final agent data
        if (parsed.status || parsed.step) {
          console.log('📋 Found intermediate agent document (status/progress), skipping...');
          return null; // This is not the final agent data
        }
      }
      
      console.log('⚠️ Document content is JSON but not valid agent data:', JSON.stringify(parsed).substring(0, 100));
      return null;
    } catch (jsonError) {
      console.log('⚠️ Document content is not valid JSON, skipping:', document.content.substring(0, 100));
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching agent document:', error);
    return null;
  }
}

// Helper function to get the appropriate provider for a model with user API keys
async function getModelProvider(modelId: string, session: Session | null) {
  // Find the model configuration
  const model = chatModels.find(m => m.id === modelId);
  
  if (!model) {
    // Fallback to default provider for unknown models
    return myProvider.languageModel(modelId);
  }

  // Try to get user API keys if session exists
  let userApiKeys: { openaiApiKey?: string; xaiApiKey?: string } = {};
  
  if (session?.user?.id) {
    try {
      userApiKeys = await getUserApiKeys(session.user.id);
    } catch (error) {
      console.warn('Failed to get user API keys:', error);
    }
  }

  // Create provider based on model's provider and user API keys
  if (model.providerId === 'openai') {
    const apiKey = userApiKeys.openaiApiKey || process.env.OPENAI_API_KEY;
    if (apiKey) {
      // Use user's API key or environment variable
      const provider = createOpenAI({ apiKey });
      return provider(modelId);
    }
  } else if (model.providerId === 'xai') {
    const apiKey = userApiKeys.xaiApiKey || process.env.XAI_API_KEY;
    if (apiKey) {
      // Use user's API key or environment variable
      const provider = createXai({ apiKey });
      return provider(modelId);
    }
  }

  // Fallback to default provider
  return myProvider.languageModel(modelId);
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });
    const isNewConversation = !chat;

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from Message[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude: longitude ? Number.parseFloat(longitude) : undefined,
      latitude: latitude ? Number.parseFloat(latitude) : undefined,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Determine which tools to use based on conversation context
    const activeTools = determineToolsForConversation(messages, isNewConversation);
    console.log('🎯 Active tools for this conversation:', activeTools);

    const stream = createDataStream({
      execute: async (dataStream) => {
        const tools: Record<string, any> = {};

        // Add the agent builder tool
        if (activeTools.includes('agentBuilder')) {
          const existingAgentData = await getExistingAgentContext(messages, session);
          tools.agentBuilder = agentBuilder({ 
            messages, 
            dataStream, 
            existingContext: existingAgentData?.content || null,
            existingDocumentId: existingAgentData?.documentId || null,
            session,
            chatId: id
          });
        }

        const result = streamText({
          model: await getModelProvider(selectedChatModel, session),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : activeTools,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools,
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
