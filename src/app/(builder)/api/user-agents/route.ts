import { auth } from '@/app/(auth)/auth';
import { getChatsByUserId, getMessagesByChatId, getDocumentById } from '@/lib/db/queries';

interface AgentData {
  chatId: string;
  title: string;
  agentData: any;
  documentId?: string;
  createdAt: string;
}

interface PaginatedResponse {
  agents: AgentData[];
  hasMore: boolean;
  total?: number;
}

async function extractAgentDataFromMessages(chatId: string): Promise<{ agentData: any; documentId?: string } | null> {
  try {
    const messages = await getMessagesByChatId({ id: chatId });
    
    console.log(`🔍 Extracting agent data from chat ${chatId} with ${messages.length} messages`);
    
    // Look for agent data in messages (similar to message.tsx logic)
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      
      if (message.parts && Array.isArray(message.parts)) {
        for (const part of message.parts) {
          // Check for tool-invocation parts with agentBuilder 
          if (part.type === 'tool-invocation' && part.toolInvocation?.toolName === 'agentBuilder') {
            
            console.log(`🔍 Found agentBuilder tool invocation in chat ${chatId}, state: ${part.toolInvocation.state}`);
            
            // Check both 'call' and 'result' states - following message.tsx pattern
            const content = part.toolInvocation.state === 'call' ? part.toolInvocation.args : 
                          part.toolInvocation.state === 'result' ? part.toolInvocation.result : null;
            
                         if (content && typeof content === 'object') {
               console.log(`📦 Found content in tool invocation:`, Object.keys(content));
               
               // For 'result' state, extract document ID and fetch agent data (following chat route pattern)
               if (part.toolInvocation.state === 'result') {
                 console.log(`📋 Tool result structure:`, {
                   hasId: !!content.id,
                   hasKind: !!content.kind,
                   kind: content.kind,
                   hasContent: !!content.content,
                   contentType: typeof content.content
                 });
                 
                 // Check if this is an agent document result
                 if (content.id && content.kind === 'agent') {
                   const documentId = content.id;
                   console.log(`🎯 Found agent document ID in chat ${chatId}: ${documentId}`);
                   
                   try {
                     // Fetch the document from the database to get the latest agent data
                     const document = await getDocumentById({ id: documentId });
                     
                     if (document && document.content) {
                       let agentData;
                       
                       // Parse the agent data from document content
                       if (typeof document.content === 'string') {
                         agentData = JSON.parse(document.content);
                       } else {
                         agentData = document.content;
                       }
                       
                       // Validate agent data
                       if (agentData && (agentData.models || agentData.actions || agentData.schedules || agentData.name)) {
                         console.log(`✅ Successfully loaded agent data from document ${documentId}:`, {
                           name: agentData.name,
                           modelsCount: agentData.models?.length || 0,
                           actionsCount: agentData.actions?.length || 0,
                           schedulesCount: agentData.schedules?.length || 0
                         });
                         
                         return {
                           agentData,
                           documentId
                         };
                       }
                     } else {
                       console.log(`⚠️ Document ${documentId} not found or has no content`);
                     }
                   } catch (e) {
                     console.error(`❌ Failed to fetch document ${documentId}:`, e);
                   }
                 }
               }

             }
          }
        }
      }
    }
    
    console.log(`❌ No agent data found in chat ${chatId}`);
    return null;
  } catch (error) {
    console.error(`❌ Failed to extract agent data from chat ${chatId}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Parse pagination parameters from URL
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50); // Max 50 items per page
    const startingAfter = url.searchParams.get('startingAfter') || null;
    const endingBefore = url.searchParams.get('endingBefore') || null;

    console.log(`🔍 Fetching agents with pagination: limit=${limit}, startingAfter=${startingAfter}, endingBefore=${endingBefore}`);

    // Get user's chats with pagination
    const { chats, hasMore } = await getChatsByUserId({
      id: session.user.id,
      limit,
      startingAfter,
      endingBefore
    });

    console.log(`🔍 Found ${chats.length} chats for user ${session.user.id}, hasMore: ${hasMore}`);
    console.log(`📋 Chat titles:`, chats.map(c => ({ id: c.id, title: c.title })));

    // Extract agent data from each chat
    const agentDataPromises = chats.map(async (chat): Promise<AgentData | null> => {
      console.log(`🔍 Processing chat: ${chat.title} (${chat.id})`);
      const agentInfo = await extractAgentDataFromMessages(chat.id);
      
      if (agentInfo?.agentData) {
        console.log(`✅ Found agent in chat ${chat.id}: ${agentInfo.agentData.name}`);
        return {
          chatId: chat.id,
          title: chat.title,
          agentData: agentInfo.agentData,
          documentId: agentInfo.documentId,
          createdAt: chat.createdAt.toISOString()
        };
      }
      
      console.log(`❌ No agent found in chat ${chat.id}`);
      return null;
    });

    const results = await Promise.all(agentDataPromises);
    const agents = results.filter((agent): agent is AgentData => agent !== null);

    // Sort by creation date (newest first) - already sorted by database query
    console.log(`✅ Found ${agents.length} agents from ${chats.length} chats for user ${session.user.id}`);

    const response: PaginatedResponse = {
      agents,
      hasMore: hasMore && agents.length > 0 // Only show hasMore if we actually have agents
    };

    return Response.json(response);
  } catch (error) {
    console.error('Failed to get user agents:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 