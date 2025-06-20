import { createDocumentHandler } from '@/lib/artifacts/server';
import { getDocumentById } from '@/lib/db/queries';

export const agentDocumentHandler = createDocumentHandler({
  kind: 'agent',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    // For agent documents, try to fetch the document content
    try {
      console.log(`🤖 Loading agent document: ${title} with ID: ${id}`);
      
      // Try to get the document from the document table
      const document = await getDocumentById({ id });
      
      if (document && document.content) {
        console.log(`✅ Found agent document in database: ${document.title}`);
        
        // Parse the agent data from document content
        const agentData = JSON.parse(document.content);
        
        // Stream the actual agent data
        dataStream.writeData({
          type: 'agent-data',
          content: agentData,
        });

        return document.content;
      } else {
        console.log(`⚠️ Agent document not found, creating basic structure for: ${title}`);
        
        // Create basic agent structure for immediate display
        const basicAgentData = {
          name: title,
          description: `Agent system for ${title}`,
          domain: '',
          models: [],
          enums: [],
          actions: [],
          createdAt: new Date().toISOString()
        };

        // Stream the basic data immediately
        dataStream.writeData({
          type: 'agent-data',
          content: basicAgentData,
        });

        return JSON.stringify(basicAgentData, null, 2);
      }
      
    } catch (error) {
      console.error('❌ Error in agent document handler:', error);
      
      // Fallback to basic structure
      const basicAgentData = {
        name: title,
        description: '',
        domain: '',
        models: [],
        enums: [],
        actions: [],
        createdAt: new Date().toISOString()
      };

      dataStream.writeData({
        type: 'agent-data',
        content: basicAgentData,
      });

      return JSON.stringify(basicAgentData, null, 2);
    }
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    try {
      console.log(`🔄 Updating agent document: ${document.title} with ID: ${document.id}`);
      
      // Use the document content directly
      if (document.content) {
        console.log(`✅ Using document content for agent: ${document.title}`);
        
        // Parse the agent data from document content
        const agentData = JSON.parse(document.content);
        
        // Stream the agent data
        dataStream.writeData({
          type: 'agent-data',
          content: agentData,
        });
        
        console.log(`✅ Agent document update handled: ${document.title}`);
        return document.content;
      } else {
        console.log(`⚠️ No content found in document, creating basic structure`);
        
        // Create basic agent structure
        const newAgentData = {
          name: document.title,
          description: description || '',
          domain: '',
          models: [],
          enums: [],
          actions: [],
          createdAt: new Date().toISOString()
        };
        
        dataStream.writeData({
          type: 'agent-data',
          content: newAgentData,
        });
        
        return JSON.stringify(newAgentData, null, 2);
      }
      
    } catch (error) {
      console.error('❌ Error updating agent document:', error);
      
      // If parsing fails, return existing content or create new basic structure
      try {
        const existingData = JSON.parse(document.content || '{}');
        dataStream.writeData({
          type: 'agent-data',
          content: existingData,
        });
        return document.content || '{}';
      } catch (parseError) {
        // Last resort: create a new basic structure
        const newAgentData = {
          name: document.title,
          description: description || '',
          domain: '',
          models: [],
          enums: [],
          actions: [],
          createdAt: new Date().toISOString()
        };

        dataStream.writeData({
          type: 'agent-data',
          content: newAgentData,
        });

        return JSON.stringify(newAgentData, null, 2);
      }
    }
  },
}); 