import { createDocumentHandler } from '@/lib/artifacts/server';

export const agentDocumentHandler = createDocumentHandler({
  kind: 'agent',
  onCreateDocument: async ({ id, title, dataStream }) => {
    const initialAgentData = {
      name: title,
      description: '',
      models: [],
      enums: [],
      actions: [],
      createdAt: new Date().toISOString()
    };

    const content = JSON.stringify(initialAgentData, null, 2);

    dataStream.writeData({
      type: 'agent-data',
      content: initialAgentData,
    });

    return content;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    try {
      const existingData = JSON.parse(document.content || '{}');
      
      // For now, just return the existing content
      // In a real implementation, you might use AI to modify the agent based on the description
      dataStream.writeData({
        type: 'agent-data',
        content: existingData,
      });

      return document.content || '{}';
    } catch (error) {
      // If parsing fails, create a new agent structure
      const newAgentData = {
        name: document.title,
        description: description || '',
        models: [],
        enums: [],
        actions: [],
        createdAt: new Date().toISOString()
      };

      const content = JSON.stringify(newAgentData, null, 2);

      dataStream.writeData({
        type: 'agent-data',
        content: newAgentData,
      });

      return content;
    }
  },
}); 