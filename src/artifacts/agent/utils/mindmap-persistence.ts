// Utility functions for persisting mindmap editor states to document metadata

interface MindMapState {
  actionMindMaps?: {
    [actionId: string]: {
      nodes?: any[];
      flowState?: string;
      activeNode?: string | null;
      lastUpdated?: string;
    };
  };
  scheduleMindMaps?: {
    [scheduleId: string]: {
      expandedCard?: string | null;
      executionResult?: any;
      lastUpdated?: string;
    };
  };
  avatarCreator?: {
    avatarData?: any;
    step?: number;
    lastUpdated?: string;
  };
}

interface DocumentMetadata {
  mindMapStates?: MindMapState;
  [key: string]: any;
}

/**
 * Save action mindmap state to document metadata
 */
export async function saveActionMindMapState(
  documentId: string,
  actionId: string,
  state: {
    nodes?: any[];
    flowState?: string;
    activeNode?: string | null;
  }
): Promise<void> {
  try {
    const response = await fetch(`/api/document?id=${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          mindMapStates: {
            actionMindMaps: {
              [actionId]: {
                ...state,
                lastUpdated: new Date().toISOString()
              }
            }
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save action mindmap state');
    }
  } catch (error) {
    console.error('Error saving action mindmap state:', error);
  }
}

/**
 * Load action mindmap state from document metadata
 */
export async function loadActionMindMapState(
  documentId: string,
  actionId: string
): Promise<{
  nodes?: any[];
  flowState?: string;
  activeNode?: string | null;
} | null> {
  try {
    const response = await fetch(`/api/document?id=${documentId}`);
    if (!response.ok) {
      return null;
    }

    const document = await response.json();
    const metadata = document.metadata as DocumentMetadata;
    
    return metadata?.mindMapStates?.actionMindMaps?.[actionId] || null;
  } catch (error) {
    console.error('Error loading action mindmap state:', error);
    return null;
  }
}

/**
 * Save schedule mindmap state to document metadata
 */
export async function saveScheduleMindMapState(
  documentId: string,
  scheduleId: string,
  state: {
    expandedCard?: string | null;
    executionResult?: any;
  }
): Promise<void> {
  try {
    const response = await fetch(`/api/document?id=${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          mindMapStates: {
            scheduleMindMaps: {
              [scheduleId]: {
                ...state,
                lastUpdated: new Date().toISOString()
              }
            }
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save schedule mindmap state');
    }
  } catch (error) {
    console.error('Error saving schedule mindmap state:', error);
  }
}

/**
 * Load schedule mindmap state from document metadata
 */
export async function loadScheduleMindMapState(
  documentId: string,
  scheduleId: string
): Promise<{
  expandedCard?: string | null;
  executionResult?: any;
} | null> {
  try {
    const response = await fetch(`/api/document?id=${documentId}`);
    if (!response.ok) {
      return null;
    }

    const document = await response.json();
    const metadata = document.metadata as DocumentMetadata;
    
    return metadata?.mindMapStates?.scheduleMindMaps?.[scheduleId] || null;
  } catch (error) {
    console.error('Error loading schedule mindmap state:', error);
    return null;
  }
}

/**
 * Save avatar creator data to document metadata
 */
export async function saveAvatarCreatorState(
  documentId: string,
  state: {
    avatarData?: any;
    step?: number;
  }
): Promise<void> {
  try {
    console.log('🎨 Saving avatar creator state:', { documentId, state });
    
    // Validate documentId before making the request
    if (!documentId || documentId === 'init' || documentId.trim() === '') {
      throw new Error(`Invalid documentId: ${documentId}. Cannot save avatar state without a valid document ID.`);
    }
    
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(`/api/document?id=${documentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metadata: {
              mindMapStates: {
                avatarCreator: {
                  ...state,
                  lastUpdated: new Date().toISOString()
                }
              }
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle 404 specifically - document doesn't exist
          if (response.status === 404) {
            console.log(`🔧 Document ${documentId} not found (attempt ${retryCount + 1}/${maxRetries}). Attempting to create...`);
            
            // Try to create the document first
            const createResponse = await fetch(`/api/document?id=${documentId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: 'AI Agent System',
                content: JSON.stringify({
                  name: 'New Agent',
                  description: '',
                  domain: '',
                  models: [],
                  enums: [],
                  actions: [],
                  schedules: [],
                  createdAt: new Date().toISOString(),
                  // Include the avatar data in the initial content
                  ...(state.avatarData && { avatar: state.avatarData }),
                }, null, 2),
                kind: 'agent',
              }),
            });
            
            if (createResponse.ok) {
              console.log(`✅ Document ${documentId} created successfully. Retrying save...`);
              retryCount++;
              continue; // Retry the original save operation
            } else {
              console.error(`❌ Failed to create document ${documentId}:`, await createResponse.text());
              throw new Error(`Failed to create document: ${createResponse.status}`);
            }
          }
          
          // Enhanced error information for debugging
          console.error('🔍 SAVE FAILURE DEBUG:', {
            documentId,
            endpoint: `/api/document?id=${documentId}`,
            method: 'PATCH',
            status: response.status,
            statusText: response.statusText,
            errorText,
            attempt: retryCount + 1,
            maxRetries,
            suggestion: response.status === 404 
              ? 'Document not found - will attempt creation'
              : 'Unknown error - check server logs'
          });
          
          if (retryCount === maxRetries - 1) {
            throw new Error(`Failed to save avatar creator state after ${maxRetries} attempts: ${response.status} ${errorText}`);
          }
        } else {
          console.log('✅ Avatar creator state saved successfully');
          return; // Success - exit the retry loop
        }
        
      } catch (fetchError) {
        console.error(`❌ Network error on attempt ${retryCount + 1}:`, fetchError);
        if (retryCount === maxRetries - 1) {
          throw fetchError;
        }
      }
      
      retryCount++;
      
      // Wait before retrying (exponential backoff)
      const delayMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
      console.log(`⏳ Waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
  } catch (error) {
    console.error('❌ Error saving avatar creator state:', error);
    throw error; // Re-throw so the caller knows it failed
  }
}

/**
 * Load avatar creator data from document metadata
 */
export async function loadAvatarCreatorState(
  documentId: string
): Promise<{
  avatarData?: any;
  step?: number;
} | null> {
  try {
    console.log('🔍 Loading avatar creator state for document:', documentId);
    
    const response = await fetch(`/api/document?id=${documentId}`);
    if (!response.ok) {
      console.log('📭 No existing document found or access denied');
      return null;
    }

    const documents = await response.json();
    const document = Array.isArray(documents) ? documents[0] : documents;
    const metadata = document?.metadata as DocumentMetadata;
    const avatarState = metadata?.mindMapStates?.avatarCreator || null;
    
    console.log('📥 Loaded avatar creator state:', avatarState);
    return avatarState;
  } catch (error) {
    console.error('❌ Error loading avatar creator state:', error);
    return null;
  }
}

/**
 * Debounced save function to avoid too many API calls
 */
export function createDebouncedSaver<T>(
  saveFunction: (documentId: string, id: string, state: T) => Promise<void>,
  delay: number = 1000
) {
  let timeoutId: NodeJS.Timeout;
  
  return (documentId: string, id: string, state: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveFunction(documentId, id, state);
    }, delay);
  };
}

/**
 * Batch update multiple mindmap states
 */
export async function batchUpdateMindMapStates(
  documentId: string,
  updates: {
    actionMindMaps?: { [actionId: string]: any };
    scheduleMindMaps?: { [scheduleId: string]: any };
    avatarCreator?: any;
  }
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    
    // Add timestamps to all updates
    const mindMapStates: MindMapState = {};
    
    if (updates.actionMindMaps) {
      mindMapStates.actionMindMaps = {};
      for (const [actionId, state] of Object.entries(updates.actionMindMaps)) {
        mindMapStates.actionMindMaps[actionId] = {
          ...state,
          lastUpdated: timestamp
        };
      }
    }
    
    if (updates.scheduleMindMaps) {
      mindMapStates.scheduleMindMaps = {};
      for (const [scheduleId, state] of Object.entries(updates.scheduleMindMaps)) {
        mindMapStates.scheduleMindMaps[scheduleId] = {
          ...state,
          lastUpdated: timestamp
        };
      }
    }
    
    if (updates.avatarCreator) {
      mindMapStates.avatarCreator = {
        ...updates.avatarCreator,
        lastUpdated: timestamp
      };
    }

    const response = await fetch(`/api/document?id=${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          mindMapStates
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to batch update mindmap states');
    }
  } catch (error) {
    console.error('Error batch updating mindmap states:', error);
  }
} 