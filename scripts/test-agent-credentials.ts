import { getDocumentById } from '@/lib/db/queries';

async function testAgentCredentials() {
  console.log('🧪 Testing Agent Credentials API...');
  
  try {
    // First, let's find a document to test with
    console.log('📄 Looking for documents in database...');
    
    // You would replace this with an actual document ID
    const testDocumentId = 'test-document-id';
    const testAgentKey = 'test-agent-key';
    
    // Test the public endpoint
    const response = await fetch(`http://localhost:3000/api/agent-credentials-public?documentId=${testDocumentId}&agentKey=${testAgentKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Public API Response:', {
        success: data.success,
        hasCredentials: !!data.credentials,
        hasAgentConfig: !!data.agentConfig,
        debug: data.debug
      });
    } else {
      console.log('❌ API Response:', response.status, await response.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAgentCredentials().catch(console.error); 