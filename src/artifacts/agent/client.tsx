import * as React from 'react';
import { useState, useCallback, useEffect, memo, useMemo } from 'react';
import { Artifact } from '@/components/create-artifact';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { DiffView } from '@/components/diffview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CopyIcon,
  PlusIcon,
  CrossIcon,
  CodeIcon,
  PlayIcon,
  PencilEditIcon,
  ClockRewind,
  UndoIcon,
  RedoIcon,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useArtifact } from '@/hooks/use-artifact';
import { generateNewId, calculateProgressPercentage } from './utils';
import { ModelsListEditor } from './components/lists/ModelsListEditor';
import { ActionsListEditor } from './components/lists/ActionsListEditor';
import { SchedulesListEditor } from './components/lists/SchedulesListEditor';
import { OnboardContent } from './components/OnboardContent';
import { ModelDataViewer } from './components/editors/ModelDataViewer';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
// Import proper types
import type { AgentData, AgentArtifactMetadata } from './types/agent';
import type { AgentModel } from './types/model';
import type { AgentAction } from './types/action';
import type { LegacyAgentSchedule as AgentSchedule } from './types/schedule';

interface AgentField {
  id: string;
  name: string;
  type: string;
  isId: boolean;
  unique: boolean;
  list: boolean;
  required: boolean;
  kind: 'scalar' | 'object' | 'enum';
  relationField: boolean;
  title: string;
  sort: boolean;
  order: number;
  defaultValue?: string;
}

interface AgentEnum {
  id: string;
  name: string;
  fields: AgentEnumField[];
}

interface AgentEnumField {
  id: string;
  name: string;
  type: string;
  defaultValue?: string;
}

interface DatabaseModel {
  id: string;
  name: string;
  fields: DatabaseField[];
  where?: Record<string, any>;
  limit?: number;
}

interface DatabaseField {
  id: string;
  name: string;
}

interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  sensitive: boolean;
}

interface ModelRecord {
  id: string;
  modelId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface AgentForm {
  id: string;
  name: string;
  title: string;
  description?: string;
  fields: AgentFormField[];
  order: number;
}

interface AgentFormField {
  id: string;
  fieldId: string; // Reference to AgentField.id
  required?: boolean; // Override field's required setting for this form
  hidden?: boolean; // Hide field in this form
  order: number;
}

const FIELD_TYPES = [
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'Json',
  'Bytes'
];

const FIELD_KINDS = [
  { value: 'scalar', label: 'Scalar' },
  { value: 'object', label: 'Object' },
  { value: 'enum', label: 'Enum' }
];

// Helper function to generate new IDs
// Helper function to determine step status consistently across all progress indicators
const getStepStatus = (stepId: string, currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>, agentData?: any) => {
  // If there's explicit progress for this step, use it
  if (stepProgress?.[stepId as keyof typeof stepProgress]) {
    return stepProgress[stepId as keyof typeof stepProgress];
  }
  
  // Check if we have data for this step
  if (agentData) {
    switch (stepId) {
      case 'schedules':
        return agentData.schedules && agentData.schedules.length > 0 ? 'complete' : 'pending';
      case 'models':
        return agentData.models && agentData.models.length > 0 ? 'complete' : 'pending';
      case 'actions':
        return agentData.actions && agentData.actions.length > 0 ? 'complete' : 'pending';
      case 'analysis':
        return agentData.name && agentData.description && agentData.domain ? 'complete' : 'pending';
      case 'complete':
        return 'pending'; // This should be set explicitly
      default:
        return 'pending';
    }
  }
  
  // If this is the current step, it's processing
  if (currentStep === stepId) {
    return 'processing';
  }
  
  return 'pending';
};

// Custom hooks for managing agent builder state
const useAgentData = (content: string) => {
  return useState<AgentData>(() => {
    console.log('🚀 Initializing agent data with content:', {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentPreview: content ? content.substring(0, 100) + (content.length > 100 ? '...' : '') : 'none'
    });

    try {
      // Handle case where content might be empty, whitespace, or just '{}'
      if (!content || content.trim() === '' || content.trim() === '{}') {
        console.log('📝 Using default agent data (no meaningful content)');
        return {
          name: 'New Agent',
          description: '',
          domain: '',
          models: [],
          enums: [],
          actions: [],
          schedules: [],
          prismaSchema: '',
          createdAt: new Date().toISOString()
        };
      }

      const parsed = JSON.parse(content);
      
      // Validate that the parsed content looks like agent data
      if (typeof parsed === 'object' && parsed !== null) {
        // Ensure arrays exist and are actually arrays
        const models = Array.isArray(parsed.models) ? parsed.models : [];
        const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
        const schedules = Array.isArray(parsed.schedules) ? parsed.schedules : [];
        
        const initialData = {
          id: parsed.id, // Keep id if it exists (from orchestrator)
          name: parsed.name || 'New Agent',
          description: parsed.description || '',
          domain: parsed.domain || '',
          models,
          enums: parsed.enums, // Preserve generated enums
          actions,
          schedules,
          prismaSchema: parsed.prismaSchema, // Preserve generated schema
          createdAt: parsed.createdAt || new Date().toISOString(),
          theme: parsed.theme, // Preserve theme selection
          avatar: parsed.avatar, // Include avatar data
          externalApis: parsed.externalApis, // Preserve external API metadata
          deployment: parsed.deployment, // Include deployment information
          metadata: parsed.metadata // Keep metadata if it exists (from orchestrator)
        };

        console.log('📥 Initialized agent data from content:', {
          id: initialData.id,
          name: initialData.name,
          modelCount: initialData.models.length,
          actionCount: initialData.actions.length,
          scheduleCount: initialData.schedules.length,
          hasMetadata: !!initialData.metadata,
          hasExternalApis: !!initialData.externalApis?.length,
          externalApiProviders: initialData.externalApis?.map((api: any) => api.provider).join(', ') || 'none',
          externalApiRequiresConnection: initialData.externalApis?.some((api: any) => api.requiresConnection) || false
        });

        return initialData;
      } else {
        console.warn('⚠️ Parsed content is not an object, using defaults');
        return {
          name: 'New Agent',
          description: '',
          domain: '',
          models: [],
          enums: [],
          actions: [],
          schedules: [],
          prismaSchema: '',
          createdAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.error('❌ Failed to parse initial content, using defaults. Error:', (e as Error).message);
      console.error('📄 Problematic content (first 500 chars):', content ? content.substring(0, 500) : 'none');
      console.error('🔍 Full error stack:', e);
      return {
        name: 'New Agent',
        description: '',
        domain: '',
        models: [],
        enums: [],
        actions: [],
        schedules: [],
        prismaSchema: '',
        createdAt: new Date().toISOString()
      };
    }
  });
};

const useIntroductionState = () => {
  // Introduction section states - collapsed by default on mobile, expanded on desktop
  const [isModelsIntroExpanded, setIsModelsIntroExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint - true for desktop, false for mobile
    }
    return false; // Default to collapsed for SSR to match mobile-first
  });
  const [isActionsIntroExpanded, setIsActionsIntroExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint - true for desktop, false for mobile
    }
    return false; // Default to collapsed for SSR to match mobile-first
  });
  const [isSchedulesIntroExpanded, setIsSchedulesIntroExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint - true for desktop, false for mobile
    }
    return false; // Default to collapsed for SSR to match mobile-first
  });

  // Handle window resize to adjust intro state
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768; // md breakpoint
      // Auto-expand when switching to desktop if currently collapsed
      if (isDesktop) {
        if (!isModelsIntroExpanded) setIsModelsIntroExpanded(true);
        if (!isActionsIntroExpanded) setIsActionsIntroExpanded(true);
        if (!isSchedulesIntroExpanded) setIsSchedulesIntroExpanded(true);
      }
      // Don't auto-collapse when switching to mobile, let user control it
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isModelsIntroExpanded, isActionsIntroExpanded, isSchedulesIntroExpanded]);

  return {
    isModelsIntroExpanded,
    setIsModelsIntroExpanded,
    isActionsIntroExpanded,
    setIsActionsIntroExpanded,
    isSchedulesIntroExpanded,
    setIsSchedulesIntroExpanded
  };
};

const useAgentActions = (agentData: AgentData, updateAgentData: (data: AgentData) => void, updateMetadata: (updates: Partial<AgentArtifactMetadata>) => void) => {
  const addModel = useCallback(() => {
    const newModel: AgentModel = {
      id: generateNewId('model', agentData.models || []),
      name: `Model${(agentData.models?.length || 0) + 1}`,
      emoji: '🗃️', // Default emoji, will be auto-generated by AI
      idField: 'id',
      displayFields: [],
      fields: [
        {
          id: 'fld1',
          name: 'id',
          type: 'String',
          isId: true,
          unique: true,
          list: false,
          required: true,
          kind: 'scalar',
          relationField: false,
          title: 'ID',
          sort: false,
          order: 1
        },
        {
          id: 'fld2',
          name: 'published',
          type: 'Boolean',
          isId: false,
          unique: false,
          list: false,
          required: false,
          kind: 'scalar',
          relationField: false,
          title: 'Published',
          sort: false,
          order: 2,
          defaultValue: 'false'
        }
      ],
      enums: [],
      hasPublishedField: true
    };
    
    // Add to top of list and set to editing mode
    updateAgentData({
      ...agentData,
      models: [newModel, ...(agentData.models || [])]
    });
    updateMetadata({ editingModel: newModel.id });
  }, [agentData, updateAgentData, updateMetadata]);

  const addSchedule = useCallback(() => {
    const newSchedule: AgentSchedule = {
      id: generateNewId('schedule', agentData.schedules || []),
      name: `Schedule${(agentData.schedules?.length || 0) + 1}`,
      emoji: '⏰', // Default emoji, will be auto-generated by AI
      description: '',
      type: 'Create',
      role: 'admin',
      interval: {
        pattern: '0 0 * * *',
        timezone: 'UTC',
        active: false
      },
      dataSource: {
        type: 'database',
        database: { models: [] }
      },
      execute: {
        type: 'code',
        code: { script: '' }
      },
      results: {
        actionType: 'Create',
        model: ''
      }
    };
    
    // Add to top of list and set to editing mode
    updateAgentData({
      ...agentData,
      schedules: [newSchedule, ...(agentData.schedules || [])]
    });
    updateMetadata({ editingSchedule: newSchedule.id });
  }, [agentData, updateAgentData, updateMetadata]);

  const addAction = useCallback(() => {
    const newAction: AgentAction = {
      id: generateNewId('action', agentData.actions || []),
      name: `Action${(agentData.actions?.length || 0) + 1}`,
      emoji: '⚡', // Default emoji, will be auto-generated by AI
      description: '',
      role: 'admin',
      dataSource: {
        type: 'database',
        database: {
          models: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: '',
          envVars: []
        }
      },
      results: {
        actionType: 'Create',
        model: '',
        fields: {}
      },
      uiComponents: {
        stepForms: [],
        resultView: {
          title: 'Action Results',
          description: 'View the results of the action execution',
          reactCode: '',
          propsInterface: {}
        }
      }
    };
    
    // Add to top of list and set to editing mode
    const updatedActions = [newAction, ...(agentData.actions || [])];
    updateAgentData({
      ...agentData,
      actions: updatedActions
    });
    updateMetadata({ editingAction: newAction.id }); // Use actual action ID instead of '0'
  }, [agentData, updateAgentData, updateMetadata]);

  return { addModel, addSchedule, addAction };
};

const useModalHandlers = (safeMetadata: AgentArtifactMetadata, setMetadata: (metadata: AgentArtifactMetadata) => void) => {
  // Add explanation modal handlers
  const openExplanationModal = useCallback((type: 'models' | 'actions' | 'schedules') => {
    setMetadata({ ...safeMetadata, showExplanationModal: type });
  }, [safeMetadata, setMetadata]);

  const closeExplanationModal = useCallback(() => {
    setMetadata({ ...safeMetadata, showExplanationModal: null });
  }, [safeMetadata, setMetadata]);

  return { openExplanationModal, closeExplanationModal };
};

// Main Agent Builder Component
const AgentBuilderContent = memo(({
  content,
  onSaveContent,
  status,
  mode,
  isCurrentVersion,
  currentVersionIndex,
  getDocumentContentById,
  isLoading,
  metadata,
  setMetadata,
  setMessages,
}: {
  content: string;
  onSaveContent: (content: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  mode: 'edit' | 'diff';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: AgentArtifactMetadata | null;
  setMetadata: (metadata: AgentArtifactMetadata) => void;
  setMessages?: UseChatHelpers['setMessages'];
}) => {
  // ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL BEFORE ANY CONDITIONAL LOGIC
  const [agentData, setAgentData] = useAgentData(content);
  const { artifact, setArtifact } = useArtifact();
  const router = useRouter();
  const params = useParams();
  
  // Safe metadata with defaults to prevent crashes
  const safeMetadata: AgentArtifactMetadata = useMemo(() => ({
    selectedTab: metadata?.selectedTab || 'onboard',
    editingModel: metadata?.editingModel || null,
    editingAction: metadata?.editingAction || null,
    editingSchedule: metadata?.editingSchedule || null,
    viewingModelData: metadata?.viewingModelData || null,
    editingRecord: metadata?.editingRecord || null,
    currentStep: metadata?.currentStep,
    stepProgress: metadata?.stepProgress || {},
    stepMessages: metadata?.stepMessages || {},
    dataManagement: metadata?.dataManagement || null,
    showExplanationModal: metadata?.showExplanationModal || null
  }), [metadata]);

  // Add completion detection for page refreshes
  useEffect(() => {
    // Only run completion detection if:
    // 1. We have content and the artifact is currently streaming
    // 2. We don't have any current step progress (indicating this is a page refresh, not active generation)
    // 3. The stepProgress is empty or indicates completion
    if (content && artifact?.status === 'streaming') {
      const hasActiveStepProgress = safeMetadata.stepProgress && 
        Object.values(safeMetadata.stepProgress).some(status => status === 'processing');
      
      // If we have active step progress, don't run completion detection
      // This prevents premature completion during secondary edits
      if (hasActiveStepProgress) {
        console.log('⚠️ Skipping completion detection - active step progress detected:', safeMetadata.stepProgress);
        return;
      }
      
      try {
        const parsedAgent = JSON.parse(content);
        
        // Check if this looks like a completed agent
        const hasModels = parsedAgent.models && Array.isArray(parsedAgent.models) && parsedAgent.models.length > 0;
        const hasActions = parsedAgent.actions && Array.isArray(parsedAgent.actions) && parsedAgent.actions.length > 0;
        const hasSchedules = parsedAgent.schedules && Array.isArray(parsedAgent.schedules) && parsedAgent.schedules.length > 0;
        const hasName = parsedAgent.name && typeof parsedAgent.name === 'string' && parsedAgent.name.trim().length > 0 && parsedAgent.name !== 'New Agent';
        
        // Check if step progress indicates completion
        const stepProgress = safeMetadata.stepProgress;
        const hasCompleteStep = (stepProgress?.complete as string) === 'complete' || 
                               (stepProgress?.['complete'] as string) === 'complete';
        
        // Check if all major steps are complete
        const majorSteps = ['analysis', 'models', 'actions', 'schedules'];
        const allMajorStepsComplete = stepProgress && majorSteps.every(step => 
          (stepProgress[step as keyof typeof stepProgress] as string) === 'complete'
        );

        console.log('🔍 Completion detection on page refresh:', {
          hasModels,
          hasActions, 
          hasSchedules,
          hasName,
          hasCompleteStep,
          allMajorStepsComplete,
          stepProgress,
          currentStatus: artifact.status,
          hasActiveStepProgress
        });

        // If agent looks complete OR step progress indicates completion, set to idle
        if ((hasName && (hasModels || hasActions || hasSchedules)) || hasCompleteStep || allMajorStepsComplete) {
          console.log('✅ Detected completed agent on page refresh - setting status to idle');
          setArtifact((draftArtifact) => ({
            ...draftArtifact,
            status: 'idle',
            isVisible: true,
          }));
        } else {
          console.log('⚠️ Agent appears incomplete on page refresh - keeping streaming status');
        }
      } catch (error) {
        console.log('⚠️ Failed to parse agent content for completion detection:', error);
      }
    }
  }, [content, artifact?.status, safeMetadata.stepProgress, setArtifact]);

  // All state hooks
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState('');
  
  // Introduction state hooks
  const {
    isModelsIntroExpanded,
    setIsModelsIntroExpanded,
    isActionsIntroExpanded,
    setIsActionsIntroExpanded,
    isSchedulesIntroExpanded,
    setIsSchedulesIntroExpanded
  } = useIntroductionState();

  // Get derived values
  const documentId = artifact?.documentId;
  const chatId = params.id as string;

  // DEBUG: Track documentId values
  useEffect(() => {
    console.log('🔍 CLIENT DEBUG - Document ID tracking:', {
      documentId,
      hasDocumentId: !!documentId,
      documentIdType: typeof documentId,
      artifactExists: !!artifact,
      artifactStatus: artifact?.status,
      chatId,
      hasChatId: !!chatId
    });
  }, [documentId, artifact?.status, chatId]);

  // Extract deployment information from agent data
  const deploymentInfo = agentData.deployment || null;
  
  // DEBUG: Track deployment info changes
  useEffect(() => {
    console.log('🔍 UI DEBUG - Deployment info updated:', {
      hasDeploymentInfo: !!deploymentInfo,
      deploymentUrl: deploymentInfo?.deploymentUrl || 'none',
      deploymentStatus: deploymentInfo?.status || 'none',
      showViewLiveButton: !!(deploymentInfo && deploymentInfo.deploymentUrl),
      agentName: agentData.name,
      agentId: agentData.id
    });
  }, [deploymentInfo, agentData.name, agentData.id]);

  // Update metadata safely
  const updateMetadata = useCallback((updates: Partial<AgentArtifactMetadata>) => {
    if (setMetadata) {
      setMetadata({ ...safeMetadata, ...updates });
    }
  }, [safeMetadata, setMetadata]);

  // Update content when agent data changes
  const updateAgentData = useCallback((newData: AgentData) => {
    console.log('🔄 updateAgentData called with:', {
      currentModels: agentData.models?.length || 0,
      currentActions: agentData.actions?.length || 0,
      currentSchedules: agentData.schedules?.length || 0,
      currentTheme: agentData.theme,
      currentExternalApis: agentData.externalApis?.map(api => api.provider).join(', ') || 'none',
      newModels: newData.models?.length || 0,
      newActions: newData.actions?.length || 0,
      newSchedules: newData.schedules?.length || 0,
      newTheme: newData.theme,
      newExternalApis: newData.externalApis?.map(api => api.provider).join(', ') || 'none',
      currentModelNames: (agentData.models || []).map(m => m.name).join(', ') || 'none',
      newModelNames: (newData.models || []).map(m => m.name).join(', ') || 'none',
      callStack: new Error().stack?.split('\n').slice(1, 4).join(' -> ') // Show call stack
    });

    // Check for avatar/theme changes and save immediately to prevent orchestrator override  
    const avatarChanged = JSON.stringify(agentData.avatar) !== JSON.stringify(newData.avatar);
    const themeChanged = agentData.theme !== newData.theme;
    
    if (avatarChanged || themeChanged) {
      console.log('🎨 CRITICAL: Avatar or theme change detected - saving immediately to prevent loss:', {
        avatarChanged,
        themeChanged,
        oldTheme: agentData.theme,
        newTheme: newData.theme,
        oldAvatar: !!agentData.avatar,
        newAvatar: !!newData.avatar,
        willSaveContent: true,
        documentId
      });
      
      // Immediately save when avatar/theme changes to prevent orchestrator from overriding
      const agentContent = JSON.stringify(newData, null, 2);
      console.log('💾 IMMEDIATE SAVE: Calling onSaveContent with theme data:', {
        contentHasTheme: agentContent.includes('"theme":'),
        themeInContent: newData.theme,
        contentPreview: agentContent.substring(0, 200)
      });
      
      onSaveContent(agentContent, false); // No debounce - immediate save
      
      console.log('✅ Theme/avatar save triggered - should now be in database');
    }
    
    setAgentData(newData);
    setHasUnsavedChanges(true);
  }, [agentData, onSaveContent, documentId]);

  // Enhanced save function
  const saveAgentToConversation = useCallback(async () => {
    setIsSaving(true);
    try {
      console.log('💾 Saving agent data:', {
        hasAvatar: !!agentData.avatar,
        avatarType: agentData.avatar?.type,
        hasTheme: !!agentData.theme,
        currentTheme: agentData.theme, // ADDED: Show exact theme being saved
        hasExternalApis: !!agentData.externalApis?.length,
        modelCount: agentData.models?.length || 0,
        actionCount: agentData.actions?.length || 0,
        scheduleCount: agentData.schedules?.length || 0,
        avatarData: agentData.avatar, // Log full avatar data
        themeData: agentData.theme
      });
      
      const agentContent = JSON.stringify(agentData, null, 2);
      onSaveContent(agentContent, true); // FIXED: No debounce/autosave - immediate save
      
      setHasUnsavedChanges(false);
      console.log('✅ Agent data saved immediately without autosave');
      console.log('📄 Saved content includes:', {
        avatarData: !!agentData.avatar,
        themeData: !!agentData.theme,
        externalApiData: !!agentData.externalApis,
        fullAvatarData: agentData.avatar,
        fullThemeData: agentData.theme
      });
      
      setShowDeploymentModal(true);
    } catch (error) {
      console.error('❌ Failed to save agent data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [agentData, onSaveContent]);

  // Deploy agent function
  const deployAgent = useCallback(async () => {
    if (!documentId) return;
    
    setIsDeploying(true);
    setDeploymentProgress('Initializing deployment...');
    
    try {
      const response = await fetch('/api/agent/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentData,
          documentId,
          projectName: agentData.name,
          description: agentData.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Deployment successful:', result.deploymentResult);
        console.log('🔍 MANUAL DEPLOYMENT DEBUG - Result details:', {
          hasAgentData: !!result.agentData,
          hasDeploymentResult: !!result.deploymentResult,
          deploymentUrl: result.deploymentResult?.deploymentUrl || 'none',
          agentHasDeployment: !!result.agentData?.deployment,
          agentDeploymentUrl: result.agentData?.deployment?.deploymentUrl || 'none'
        });
        
        // Update agent data with deployment info
        const updatedAgentData = result.agentData;
        setAgentData(updatedAgentData);
        
        console.log('🔄 MANUAL DEPLOYMENT DEBUG - Agent data updated:', {
          deploymentAdded: !!updatedAgentData.deployment,
          deploymentUrl: updatedAgentData.deployment?.deploymentUrl || 'none',
          deploymentStatus: updatedAgentData.deployment?.status || 'none'
        });
        
        // Save updated agent data
        const agentContent = JSON.stringify(updatedAgentData, null, 2);
        onSaveContent(agentContent, true);
        
        console.log('💾 MANUAL DEPLOYMENT DEBUG - Content saved to document');
        
        setDeploymentProgress('Deployment completed successfully!');
        
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          setShowDeploymentModal(false);
          setIsDeploying(false);
          setDeploymentProgress('');
        }, 2000);
      } else {
        throw new Error(result.details || 'Deployment failed');
      }
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      setDeploymentProgress(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        setIsDeploying(false);
        setDeploymentProgress('');
      }, 3000);
    }
  }, [agentData, documentId, onSaveContent]);

  // Agent actions hooks
  const { addModel, addSchedule, addAction } = useAgentActions(agentData, updateAgentData, updateMetadata);

  // Modal handlers
  const { openExplanationModal, closeExplanationModal } = useModalHandlers(safeMetadata, setMetadata);

  // Tab configuration
  const tabs = useMemo(() => [
    {
      id: 'onboard' as const,
      label: 'Onboard',
      count: 0
    },
    {
      id: 'models' as const,
      label: 'Models',
      count: agentData.models?.length || 0
    },
    {
      id: 'actions' as const,
      label: 'Actions',
      count: agentData.actions?.length || 0
    },
    {
      id: 'schedules' as const,
      label: 'Schedules',
      count: agentData.schedules?.length || 0
    }
  ], [agentData.models?.length, agentData.actions?.length, agentData.schedules?.length]);

  // Monitor content changes from external sources
  useEffect(() => {
    // Skip if content is explicitly empty or just whitespace
    if (!content || content.trim() === '') {
      return;
    }

    try {
      const parsed = JSON.parse(content);
      
      // Check if this is meaningful agent data
      const hasRealData = (parsed.name && parsed.name !== 'New Agent' && parsed.name.trim() !== '') ||
                         (parsed.description && parsed.description.trim() !== '') ||
                         (parsed.domain && parsed.domain.trim() !== '') ||
                         (parsed.models && parsed.models.length > 0) ||
                         (parsed.actions && parsed.actions.length > 0) ||
                         (parsed.schedules && parsed.schedules.length > 0);

      // Only update if we have real data
      if (hasRealData) {
        // DEBUG: Track what we're merging
        console.log('🔍 MERGE DEBUG - Before merge:', {
          currentUserTheme: agentData?.theme,
          currentUserAvatar: !!agentData?.avatar,
          currentUserAvatarType: agentData?.avatar?.type,
          parsedTheme: parsed.theme,
          parsedAvatar: !!parsed.avatar,
          parsedAvatarType: parsed.avatar?.type,
          shouldPreserveTheme: !!agentData?.theme,
          shouldPreserveAvatar: !!agentData?.avatar
        });
        
        // Intelligently merge data - preserve user-configured data while allowing orchestrator updates
        const updatedData = {
          id: parsed.id,
          name: parsed.name || agentData?.name || 'New Agent',
          description: parsed.description || agentData?.description || '',
          domain: parsed.domain || agentData?.domain || '',
          models: Array.isArray(parsed.models) ? parsed.models : [],
          enums: parsed.enums || agentData?.enums || [], // Preserve generated enums
          actions: Array.isArray(parsed.actions) ? parsed.actions : [],
          schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
          prismaSchema: parsed.prismaSchema || agentData?.prismaSchema || '', // Preserve generated schema
          createdAt: parsed.createdAt || new Date().toISOString(),
          // PRESERVE USER-CONFIGURED DATA: More aggressive preservation
          // Only use parsed data if current agentData doesn't have user-configured values
          theme: agentData?.theme || parsed.theme, // User data takes absolute priority
          avatar: agentData?.avatar || parsed.avatar, // User data takes absolute priority
          externalApis: parsed.externalApis || agentData?.externalApis, // Use parsed for external APIs (orchestrator manages this)
          deployment: agentData?.deployment || parsed.deployment, // User deployment takes priority
          metadata: agentData?.metadata || parsed.metadata, // User metadata takes priority
          oauthTokens: agentData?.oauthTokens || parsed.oauthTokens, // User auth takes priority
          apiKeys: agentData?.apiKeys || parsed.apiKeys, // User API keys take priority
          credentials: agentData?.credentials || parsed.credentials, // User credentials take priority
          authConfig: agentData?.authConfig || parsed.authConfig, // User auth config takes priority
          integrations: agentData?.integrations || parsed.integrations, // User integrations take priority
          settings: agentData?.settings || parsed.settings // User settings take priority
        };
        
        console.log('🔄 Content update with intelligent merge:', {
          preservedTheme: updatedData.theme === agentData?.theme ? 'user-priority' : 'orchestrator',
          preservedAvatar: updatedData.avatar === agentData?.avatar ? 'user-priority' : 'orchestrator',
          preservedOAuth: updatedData.oauthTokens === agentData?.oauthTokens ? 'user-priority' : 'orchestrator',
          preservedApiKeys: updatedData.apiKeys === agentData?.apiKeys ? 'user-priority' : 'orchestrator',
          hasExternalApis: !!updatedData.externalApis?.length,
          providers: updatedData.externalApis?.map((api: any) => api.provider).join(', ') || 'none',
          requiresConnection: updatedData.externalApis?.some((api: any) => api.requiresConnection) || false,
          hasDeployment: !!updatedData.deployment,
          finalTheme: updatedData.theme,
          hasAvatar: !!updatedData.avatar,
          hasPrismaSchema: !!updatedData.prismaSchema,
          hasEnums: !!updatedData.enums?.length
        });
        
        // DEBUG: Post-merge verification
        console.log('🔍 MERGE DEBUG - After merge:', {
          finalTheme: updatedData.theme,
          finalAvatar: !!updatedData.avatar,
          finalAvatarType: updatedData.avatar?.type,
          themeSuccessfullyPreserved: agentData?.theme ? updatedData.theme === agentData.theme : 'no-user-theme',
          avatarSuccessfullyPreserved: agentData?.avatar ? JSON.stringify(updatedData.avatar) === JSON.stringify(agentData.avatar) : 'no-user-avatar'
        });
        
        // Use a more stable comparison approach - Include all relevant properties
        setAgentData(prevData => {
          const currentDataString = JSON.stringify({
            name: prevData.name,
            description: prevData.description,
            domain: prevData.domain,
            models: prevData.models,
            enums: prevData.enums,
            actions: prevData.actions,
            schedules: prevData.schedules,
            prismaSchema: prevData.prismaSchema,
            theme: prevData.theme,
            avatar: prevData.avatar,
            externalApis: prevData.externalApis,
            oauthTokens: prevData.oauthTokens,
            apiKeys: prevData.apiKeys,
            credentials: prevData.credentials,
            authConfig: prevData.authConfig,
            integrations: prevData.integrations,
            settings: prevData.settings
          });
          const newDataString = JSON.stringify({
            name: updatedData.name,
            description: updatedData.description,
            domain: updatedData.domain,
            models: updatedData.models,
            enums: updatedData.enums,
            actions: updatedData.actions,
            schedules: updatedData.schedules,
            prismaSchema: updatedData.prismaSchema,
            theme: updatedData.theme,
            avatar: updatedData.avatar,
            externalApis: updatedData.externalApis,
            oauthTokens: updatedData.oauthTokens,
            apiKeys: updatedData.apiKeys,
            credentials: updatedData.credentials,
            authConfig: updatedData.authConfig,
            integrations: updatedData.integrations,
            settings: updatedData.settings
          });
          
          // Only update if data has actually changed
          if (currentDataString !== newDataString) {
            console.log('📥 Updating agent data from content change with preservation:', {
              preservedUserTheme: updatedData.theme === agentData?.theme,
              preservedUserAvatar: updatedData.avatar === agentData?.avatar,
              preservedUserAuth: updatedData.oauthTokens === agentData?.oauthTokens,
              preservedUserApiKeys: updatedData.apiKeys === agentData?.apiKeys,
              previousExternalApis: agentData?.externalApis?.map((api: any) => api.provider).join(', ') || 'none',
              newExternalApis: updatedData.externalApis?.map((api: any) => api.provider).join(', ') || 'none',
              hasPrismaSchema: !!updatedData.prismaSchema,
              hasEnums: !!updatedData.enums?.length,
              dataChanged: true
            });
            
            // Save the updated data to persist changes (including prismaSchema)
            const agentContent = JSON.stringify(updatedData, null, 2);
            // onSaveContent(agentContent, true); // Use debounced save to avoid excessive saves during streaming
            console.log('💾 Saved updated agent data with preserved prismaSchema and enums');
            
            return updatedData;
          }
          
          console.log('⚪ No agent data update needed (content unchanged after intelligent merge)');
          return prevData;
        });
      }
    } catch (e) {
      console.warn('❌ Failed to parse updated content:', e);
      console.warn('📄 Problematic content (first 200 chars):', content ? content.substring(0, 200) : 'none');
    }
  }, [content]); // Only depend on content to prevent infinite loops - preservation logic handles user data correctly

  // NOW ALL HOOKS ARE DECLARED - we can safely do early returns
  if (isLoading) {
    return <DocumentSkeleton artifactKind="agent" />;
  }

  if (mode === 'diff') {
    const oldContent = getDocumentContentById(currentVersionIndex - 1);
    const newContent = getDocumentContentById(currentVersionIndex);
    return <DiffView oldContent={oldContent} newContent={newContent} />;
  }

  return (
    <div className="h-full bg-black text-green-200 flex flex-col relative overflow-hidden font-mono">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-600/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative border-b border-green-500/20 backdrop-blur-xl bg-black/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <div className="text-black text-lg">🤖</div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-matrix-gradient bg-clip-text font-mono">
                    Agent Builder
                  </h1>
                  <p className="text-green-400 text-xs sm:text-sm font-medium font-mono">
                    Design and configure your AI agent system
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-row items-center justify-between sm:justify-start gap-3 sm:gap-4">
              {/* Status Indicator */}
              <div className="flex items-center gap-3 px-3 sm:px-4 py-2 rounded-xl bg-black/50 border border-green-500/20 backdrop-blur-sm">
                <div className="status-indicator status-online">
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    status === 'streaming'
                      ? "bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50"
                      : "bg-green-400 animate-matrix-pulse shadow-lg shadow-green-400/50"
                  )} />
                </div>
                <span className="text-sm font-medium text-green-400 font-mono">
                  {status === 'streaming' ? 'Building...' : 'Ready'}
                </span>
              </div>
              
              {/* Deployment Button */}
              {deploymentInfo && deploymentInfo.deploymentUrl && (
                <Button
                  onClick={() => window.open(deploymentInfo.deploymentUrl, '_blank')}
                  className="px-4 sm:px-6 py-2.5 text-sm font-medium font-mono transition-all duration-200 btn-matrix bg-blue-600 hover:bg-blue-700 text-white border-blue-500/50"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4">🌐</div>
                    <span>View Live App</span>
                  </div>
                </Button>
              )}

              {/* Save Button - Hide during building */}
              {status !== 'streaming' && (
                <Button
                  onClick={saveAgentToConversation}
                  disabled={isSaving}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 text-sm font-medium font-mono transition-all duration-200",
                    hasUnsavedChanges 
                      ? "btn-matrix border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300" 
                      : "btn-matrix"
                  )}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4">
                      {isSaving ? '⏳' : hasUnsavedChanges ? '📝' : '💾'}
                    </div>
                    <span>
                      {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save Agent'}
                    </span>
                  </div>
                </Button>
              )}
            </div>
          </div>
          
          {/* Enhanced Progress Indicator - Only show when AI is actually running */}
          {status === 'streaming' && (
            <div className="mt-2 sm:mt-6">
              {/* Mobile: Compact with all steps */}
              <div className="sm:hidden p-3 rounded-lg bg-black/50 border border-green-500/20 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-xs font-mono text-green-200">
                      {(() => {
                        const currentStepMessage = safeMetadata.stepMessages?.[safeMetadata.currentStep || ''];
                        if (currentStepMessage) {
                          // Truncate long messages for mobile
                          return currentStepMessage.length > 40 
                            ? currentStepMessage.substring(0, 37) + '...'
                            : currentStepMessage;
                        }
                        return 'Building Agent';
                      })()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-blue-600">{Math.round(calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData))}%</div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative h-1 bg-green-500/10 rounded-full overflow-hidden mb-2">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData)}%` }}
                  />
                </div>
                
                {/* Mobile Steps - Horizontal dots */}
                <div className="flex items-center justify-center gap-1">
                  {(() => {
                    const steps = [
                      { id: 'analysis', label: 'Analysis' },
                      { id: 'models', label: 'Models' },
                      { id: 'actions', label: 'Actions' },
                      { id: 'schedules', label: 'Schedules' }
                    ];
                    
                    const getEnhancedStepStatus = (stepId: string) => {
                      const stepIdMapping: Record<string, string> = {
                        'step0': 'analysis',
                        'step1': 'models',
                        'step2': 'actions',
                        'step3': 'schedules',
                        'complete': 'complete'
                      };
                      
                      const orchestratorStepId = Object.keys(stepIdMapping).find(key => stepIdMapping[key] === stepId) || stepId;
                      
                      if (safeMetadata.stepProgress) {
                        if (safeMetadata.stepProgress[stepId as keyof typeof safeMetadata.stepProgress]) {
                          return safeMetadata.stepProgress[stepId as keyof typeof safeMetadata.stepProgress];
                        }
                        if (orchestratorStepId && safeMetadata.stepProgress[orchestratorStepId as keyof typeof safeMetadata.stepProgress]) {
                          return safeMetadata.stepProgress[orchestratorStepId as keyof typeof safeMetadata.stepProgress];
                        }
                      }
                      
                      if (safeMetadata.currentStep === stepId || safeMetadata.currentStep === orchestratorStepId) {
                        return 'processing';
                      }
                      
                      return getStepStatus(stepId, safeMetadata.currentStep, safeMetadata.stepProgress, agentData);
                    };
                    
                    return steps.map((step, index) => {
                      const stepStatus = getEnhancedStepStatus(step.id);
                      return (
                        <div 
                          key={step.id}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            stepStatus === 'complete' 
                              ? 'bg-green-400 shadow-sm shadow-green-500/50' 
                              : stepStatus === 'processing' 
                              ? 'bg-yellow-400 shadow-sm shadow-yellow-500/50 animate-pulse'
                              : 'bg-green-500/20 border border-green-500/30'
                          }`} 
                          title={step.label}
                        />
                      );
                    });
                  })()}
                </div>
              </div>
              
              {/* Desktop: Full version with all steps */}
              <div className="hidden sm:block p-4 rounded-2xl bg-black/50 border border-green-500/20 backdrop-blur-sm shadow-lg shadow-green-500/10">
                <div className="flex items-center justify-between gap-0 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-green-200 font-mono">Build Progress</div>
                    <div className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-xs font-medium font-mono border border-green-500/30">
                      {agentData?.name || 'AI Agent System'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{Math.round(calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData))}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
                
                {/* Current Step Message */}
                {(() => {
                  const currentStepMessage = safeMetadata.stepMessages?.[safeMetadata.currentStep || ''];
                  if (currentStepMessage) {
                    return (
                      <div className="mb-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-xs font-mono text-blue-300">
                          🔄 {currentStepMessage}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Progress Bar */}
                <div className="relative h-2 bg-green-500/10 rounded-full overflow-hidden border border-green-500/20 mb-4">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-green-500/30"
                    style={{ width: `${calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData)}%` }}
                  />
                  {/* Animated shimmer effect for active progress */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
                
                {/* Desktop Steps - Show all steps */}
                <div className="flex items-center justify-between text-xs font-mono">
                  {(() => {
                    const steps = [
                      { id: 'analysis', label: 'Analysis' },
                      { id: 'models', label: 'Models' },
                      { id: 'actions', label: 'Actions' },
                      { id: 'schedules', label: 'Schedules' }
                    ];
                    
                    const getEnhancedStepStatus = (stepId: string) => {
                      const stepIdMapping: Record<string, string> = {
                        'step0': 'analysis',
                        'step1': 'models',
                        'step2': 'actions',
                        'step3': 'schedules',
                        'complete': 'complete'
                      };
                      
                      const orchestratorStepId = Object.keys(stepIdMapping).find(key => stepIdMapping[key] === stepId) || stepId;
                      
                      if (safeMetadata.stepProgress) {
                        if (safeMetadata.stepProgress[stepId as keyof typeof safeMetadata.stepProgress]) {
                          return safeMetadata.stepProgress[stepId as keyof typeof safeMetadata.stepProgress];
                        }
                        if (orchestratorStepId && safeMetadata.stepProgress[orchestratorStepId as keyof typeof safeMetadata.stepProgress]) {
                          return safeMetadata.stepProgress[orchestratorStepId as keyof typeof safeMetadata.stepProgress];
                        }
                      }
                      
                      if (safeMetadata.currentStep === stepId || safeMetadata.currentStep === orchestratorStepId) {
                        return 'processing';
                      }
                      
                      return getStepStatus(stepId, safeMetadata.currentStep, safeMetadata.stepProgress, agentData);
                    };
                    
                    return steps.map((step, index) => {
                      const stepStatus = getEnhancedStepStatus(step.id);
                      const isComplete = stepStatus === 'complete';
                      const isProcessing = stepStatus === 'processing';
                      
                      return (
                        <div key={step.id} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            isComplete 
                              ? 'bg-green-400 shadow-lg shadow-green-500/50' 
                              : isProcessing 
                              ? 'bg-yellow-400 shadow-lg shadow-yellow-500/50 animate-pulse'
                              : 'bg-green-500/20 border border-green-500/30'
                          }`} />
                          <span className={`font-medium transition-colors duration-300 whitespace-nowrap ${
                            isComplete 
                              ? 'text-green-400' 
                              : isProcessing 
                              ? 'text-yellow-400'
                              : 'text-green-500/50'
                          }`}>
                            {step.label}
                          </span>
                          {index < steps.length - 1 && (
                            <div className={`w-8 h-0.5 transition-colors duration-300 ${
                              isComplete ? 'bg-green-400/50' : 'bg-green-500/20'
                            }`} />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="relative border-b border-green-500/20 backdrop-blur-xl bg-black/50 sticky top-0 z-50 md:static md:z-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => updateMetadata({ 
                  selectedTab: tab.id,
                  dataManagement: null // Clear dataManagement when switching tabs
                })}
                className={cn(
                  "relative px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium font-mono transition-all duration-300 border-b-2 group whitespace-nowrap flex-shrink-0",
                  safeMetadata.selectedTab === tab.id
                    ? "text-green-300 border-green-400 bg-green-500/10"
                    : "text-green-500 border-transparent hover:text-green-300 hover:bg-green-500/5"
                )}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-medium">{tab.label}</span>
                  {tab.id !== 'onboard' && (
                    <div className={cn(
                      "px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold font-mono transition-colors border",
                      safeMetadata.selectedTab === tab.id
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-green-500/10 text-green-400 border-green-500/20 group-hover:bg-green-500/20 group-hover:text-green-300"
                    )}>
                      {tab.count}
                    </div>
                  )}
                </div>
                
                {/* Active tab indicator */}
                {safeMetadata.selectedTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-t-lg -z-10" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {(() => {
              console.log('🔍 Render - dataManagement:', safeMetadata.dataManagement);
              
              // Check if we should show ModelDataViewer
              const viewingModelId = safeMetadata.dataManagement?.viewingModelId;
              if (viewingModelId) {
                const viewingModel = (agentData.models || []).find(m => m.id === viewingModelId);
                
                if (viewingModel) {
                  console.log('✅ Rendering ModelDataViewer for model:', viewingModel.name);
                  return (
                    <ModelDataViewer
                      key={viewingModel.id}
                      model={viewingModel}
                      allModels={agentData.models || []}
                      onUpdateModel={(updatedModel) => {
                        console.log('🔄 Updating model:', updatedModel);
                        const updatedModels = (agentData.models || []).map((m: AgentModel) => 
                          m.id === updatedModel.id ? updatedModel : m
                        );
                              updateAgentData({ ...agentData, models: updatedModels });
                            }}
                      onBack={() => {
                        console.log('🔙 Going back from ModelDataViewer');
                        updateMetadata({ dataManagement: null });
                      }}
                    />
                  );
                } else {
                  console.log('❌ No model found for viewingModelId:', viewingModelId);
                }
              }
              
              // Show appropriate tab content
              if (safeMetadata.selectedTab === 'onboard') {
                return (
                  <OnboardContent 
                    onTabChange={(tab) => setMetadata({ 
                      ...safeMetadata, 
                      selectedTab: tab 
                    })} 
                    models={agentData.models || []}
                    agentData={agentData}
                    onThemeChange={(theme) => {
                      console.log('🎨 Main client received theme change:', theme);
                      updateAgentData({ ...agentData, theme });
                    }}
                    onDataChange={updateAgentData}
                    documentId={documentId}
                  />
                );
              }
              
              if (safeMetadata.selectedTab === 'models') {
                console.log('🗂️ Rendering ModelsListEditor');
                console.log('🗂️ Models data:', {
                  modelsCount: agentData.models?.length || 0,
                  modelNames: (agentData.models || []).map((m: AgentModel) => m.name),
                  editingId: safeMetadata.editingModel
                });
                return (
                  <div className="space-y-6">
                    {/* Introduction Section */}
                    <div className="p-4 sm:p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                <span className="text-lg">🗃️</span>
                              </div>
                              <h2 className="text-xl font-bold text-blue-200 font-mono">Data Models</h2>
                            </div>
                            <button
                              onClick={() => setIsModelsIntroExpanded(!isModelsIntroExpanded)}
                              className="md:hidden p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-colors"
                              aria-label={isModelsIntroExpanded ? "Minimize introduction" : "Expand introduction"}
                            >
                              <span className="text-blue-200 text-sm">
                                {isModelsIntroExpanded ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                          <div className={cn(
                            "transition-all duration-300 overflow-hidden",
                            isModelsIntroExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 md:max-h-96 md:opacity-100"
                          )}>
                            <p className="text-blue-300 text-sm font-mono leading-relaxed mb-3">
                              Define the structure of your data with custom models. Each model represents a table in your database with fields, types, and relationships. Models store and organize all the information your agent will work with.
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-mono">
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">📊 Database Tables</span>
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">🔗 Relationships</span>
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">✅ Validation</span>
                            </div>
                          </div>
                          {/* Truncated description for mobile when collapsed */}
                          <div className={cn(
                            "md:hidden transition-all duration-300",
                            !isModelsIntroExpanded ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
                          )}>
                            <p className="text-blue-300 text-sm font-mono leading-relaxed">
                              Define the structure of your data with custom models...
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "transition-all duration-300",
                          isModelsIntroExpanded ? "opacity-100" : "opacity-0 md:opacity-100"
                        )}>
                          <Button
                            onClick={() => openExplanationModal('models')}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-base"
                          >
                            <span>📖</span>
                            <span>How Models Work</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <ModelsListEditor
                      models={agentData.models || []}
                      onModelsChange={(models) => updateAgentData({ ...agentData, models })}
                      updateMetadata={(updates) => {
                        setMetadata({ 
                          ...safeMetadata, 
                          ...updates
                        });
                      }}
                      status={'idle'}
                    />
                  </div>
                );
              }
              
              if (safeMetadata.selectedTab === 'actions') {
                console.log('⚡ Rendering ActionsListEditor');
                console.log('⚡ Actions data:', {
                  actionsCount: agentData.actions?.length || 0,
                  actionNames: (agentData.actions || []).map((a: AgentAction) => a.name),
                  editingId: safeMetadata.editingAction
                });
                return (
                  <div className="space-y-6">
                    {/* Introduction Section */}
                    <div className="p-4 sm:p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                <span className="text-lg">⚡</span>
                              </div>
                              <h2 className="text-xl font-bold text-purple-200 font-mono">Actions</h2>
                            </div>
                            <button
                              onClick={() => setIsActionsIntroExpanded(!isActionsIntroExpanded)}
                              className="md:hidden p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-colors"
                              aria-label={isActionsIntroExpanded ? "Minimize introduction" : "Expand introduction"}
                            >
                              <span className="text-purple-200 text-sm">
                                {isActionsIntroExpanded ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                          <div className={cn(
                            "transition-all duration-300 overflow-hidden",
                            isActionsIntroExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 md:max-h-96 md:opacity-100"
                          )}>
                            <p className="text-purple-300 text-sm font-mono leading-relaxed mb-3">
                              Create interactive actions that users can trigger to manipulate data. Actions can collect user input, process information, and create or update records in your models. Perfect for forms, workflows, and user interactions.
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-mono">
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">🎯 User Triggered</span>
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">📝 Data Input</span>
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">🔄 Processing</span>
                            </div>
                          </div>
                          {/* Truncated description for mobile when collapsed */}
                          <div className={cn(
                            "md:hidden transition-all duration-300",
                            !isActionsIntroExpanded ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
                          )}>
                            <p className="text-purple-300 text-sm font-mono leading-relaxed">
                              Create interactive actions that users can trigger...
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "transition-all duration-300",
                          isActionsIntroExpanded ? "opacity-100" : "opacity-0 md:opacity-100"
                        )}>
                          <Button
                            onClick={() => openExplanationModal('actions')}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-base"
                          >
                            <span>⚡</span>
                            <span>How Actions Work</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <ActionsListEditor
                      actions={agentData.actions || []}
                      onUpdate={(actions) => updateAgentData({ ...agentData, actions })}
                      allModels={agentData.models || []}
                      documentId={documentId}
                    />
                  </div>
                );
              }
              
              if (safeMetadata.selectedTab === 'schedules') {
                console.log('⏰ Rendering SchedulesListEditor');
                console.log('⏰ Schedules data:', {
                  schedulesCount: agentData.schedules?.length || 0,
                  scheduleNames: (agentData.schedules || []).map((s: AgentSchedule) => s.name),
                  editingId: safeMetadata.editingSchedule
                });
                return (
                  <div className="space-y-6">
                    {/* Introduction Section */}
                    <div className="p-4 sm:p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                <span className="text-lg">⏰</span>
                              </div>
                              <h2 className="text-xl font-bold text-orange-200 font-mono">Schedules</h2>
                            </div>
                            <button
                              onClick={() => setIsSchedulesIntroExpanded(!isSchedulesIntroExpanded)}
                              className="md:hidden p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 transition-colors"
                              aria-label={isSchedulesIntroExpanded ? "Minimize introduction" : "Expand introduction"}
                            >
                              <span className="text-orange-200 text-sm">
                                {isSchedulesIntroExpanded ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                          <div className={cn(
                            "transition-all duration-300 overflow-hidden",
                            isSchedulesIntroExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 md:max-h-96 md:opacity-100"
                          )}>
                            <p className="text-orange-300 text-sm font-mono leading-relaxed mb-3">
                              Automate recurring tasks with scheduled actions that run at specific intervals. Perfect for data syncing, regular maintenance, reports, or any automated workflow that needs to happen on a timer.
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-mono">
                              <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🤖 Automated</span>
                              <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">⏱️ Time-based</span>
                              <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🔄 Recurring</span>
                            </div>
                          </div>
                          {/* Truncated description for mobile when collapsed */}
                          <div className={cn(
                            "md:hidden transition-all duration-300",
                            !isSchedulesIntroExpanded ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
                          )}>
                            <p className="text-orange-300 text-sm font-mono leading-relaxed">
                              Automate recurring tasks with scheduled actions...
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "transition-all duration-300",
                          isSchedulesIntroExpanded ? "opacity-100" : "opacity-0 md:opacity-100"
                        )}>
                          <Button
                            onClick={() => openExplanationModal('schedules')}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-orange-500/25"
                          >
                            <span>📅</span>
                            How Schedules Work
                          </Button>
                        </div>
                      </div>
                    </div>

                    <SchedulesListEditor
                      schedules={agentData.schedules || []}
                      onUpdate={(schedules) => updateAgentData({ ...agentData, schedules })}
                      availableActions={agentData.actions || []}
                      allModels={agentData.models || []}
                      documentId={documentId}
                    />
                  </div>
                );
              }
              
              console.log('❓ No matching tab or condition');
              return null;
            })()}
          </div>
        </div>
      </div>
      
      {/* Deployment Modal */}
      <Dialog open={showDeploymentModal} onOpenChange={setShowDeploymentModal}>
        <DialogContent className="sm:max-w-[500px] bg-black/95 border-green-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-green-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
                <span className="text-black text-lg">🚀</span>
              </div>
              Agent Saved Successfully!
            </DialogTitle>
            <DialogDescription className="text-green-400 font-mono">
              Your agent "<span className="text-green-200 font-semibold">{agentData.name}</span>" has been saved.
            </DialogDescription>
          </DialogHeader>
          
          {/* Deployment Progress */}
          {isDeploying && (
            <div className="flex flex-col gap-4 mt-6">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <span className="text-blue-200 font-medium font-mono">Deploying Agent...</span>
                </div>
                <div className="text-sm text-blue-400 font-mono ml-7">
                  {deploymentProgress}
                </div>
              </div>
            </div>
          )}

          {/* Show different content based on deployment state */}
          {!isDeploying && (
            <div className="flex flex-col gap-4 mt-6">
              {deploymentInfo?.deploymentUrl ? (
                // Agent is already deployed
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                    <span className="text-green-200 font-medium font-mono">Already Deployed</span>
                  </div>
                  <div className="text-sm text-green-400 font-mono mb-3 ml-4">
                    Your agent is live at: <span className="text-green-200 break-all">{deploymentInfo.deploymentUrl}</span>
                  </div>
                  <ul className="text-sm text-green-400 font-mono space-y-1 ml-4">
                    <li>• Redeploy with latest changes</li>
                    <li>• Manage deployment settings</li>
                    <li>• Monitor performance</li>
                  </ul>
                </div>
              ) : (
                // Agent is being auto-deployed in background
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full animate-pulse" />
                    <span className="text-blue-200 font-medium font-mono">Auto-Deploying</span>
                  </div>
                  <ul className="text-sm text-blue-400 font-mono space-y-1 ml-4">
                    <li>• Configuring deployment environment</li>
                    <li>• Setting up database connections</li>
                    <li>• Deploying agent to production</li>
                    <li>• Setting up monitoring</li>
                  </ul>
                  <div className="flex items-center gap-2 text-blue-300/60 text-xs font-mono mt-3">
                    <span className="animate-spin">⚡</span>
                    <span>Deployment happens automatically after database generation</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!isDeploying && (
            <DialogFooter className="gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeploymentModal(false)}
                className="btn-matrix border-green-500/30 hover:border-green-500/50 text-white hover:text-green-200 bg-transparent hover:bg-green-500/10"
              >
                <span className="font-mono">Close</span>
              </Button>
              
              {deploymentInfo?.deploymentUrl ? (
                // Show publish button for deployed agents
                <Button
                  onClick={() => {
                    setShowDeploymentModal(false);
                    // Navigate to deployment page with chatId
                    const deploymentUrl = chatId 
                      ? `/deployment?chatId=${chatId}`
                      : '/deployment';
                    router.push(deploymentUrl);
                  }}
                  className="btn-matrix bg-green-600 hover:bg-green-700 text-black font-bold"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono">Publish Agent</span>
                    <span>🚀</span>
                  </div>
                </Button>
              ) : (
                // Auto-deployment info for new agents
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-blue-300 text-sm font-mono">
                    <span className="animate-pulse">🤖</span>
                    <span>Auto-deploying after database setup...</span>
                  </div>
                </div>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Explanation Modals */}
      {/* Models Explanation Modal */}
      <Dialog open={safeMetadata.showExplanationModal === 'models'} onOpenChange={closeExplanationModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-blue-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-blue-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <span className="text-lg">🗃️</span>
              </div>
              Data Models Explained
            </DialogTitle>
            <DialogDescription className="text-blue-400 font-mono">
              Learn how to structure and organize your data with powerful models
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* What are Models */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-blue-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-blue-400">📊</span> What are Data Models?
              </h3>
              <p className="text-blue-300 text-sm font-mono leading-relaxed mb-3">
                Data models define the structure of information in your agent. Think of them as blueprints for database tables that specify what fields exist, their types, and how they relate to each other. Models store and organize all the information your agent will work with.
              </p>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <div className="text-xs font-mono text-blue-400 mb-2">Example Model: "User"</div>
                <div className="space-y-1 text-xs font-mono text-blue-300">
                  <div className="flex justify-between"><span>📝 name</span><span>String (required)</span></div>
                  <div className="flex justify-between"><span>📧 email</span><span>String (unique)</span></div>
                  <div className="flex justify-between"><span>🎂 age</span><span>Integer</span></div>
                  <div className="flex justify-between"><span>✅ published</span><span>Boolean</span></div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-blue-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-blue-400">🔗</span> Relationships
                </h4>
                <p className="text-blue-300 text-xs font-mono leading-relaxed">
                  Connect models together. A "Post" can belong to a "User", creating powerful data relationships.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-blue-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-blue-400">✅</span> Validation
                </h4>
                <p className="text-blue-300 text-xs font-mono leading-relaxed">
                  Set required fields, unique constraints, and default values to ensure data integrity.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-blue-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-blue-400">🎨</span> Custom Forms
                </h4>
                <p className="text-blue-300 text-xs font-mono leading-relaxed">
                  Group fields into forms for better user experience when creating or editing records.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-blue-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-blue-400">📊</span> Data Management
                </h4>
                <p className="text-blue-300 text-xs font-mono leading-relaxed">
                  View, edit, and manage actual records stored in your models with built-in interfaces.
                </p>
              </div>
            </div>

            {/* Visual Example */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-blue-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-blue-400">🎯</span> Example: Blog System
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="text-sm font-mono text-blue-200 mb-2">📝 Post Model</div>
                  <div className="space-y-1 text-xs font-mono text-blue-300">
                    <div>• title (String, required)</div>
                    <div>• content (Text)</div>
                    <div>• published (Boolean)</div>
                    <div>• author → User</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="text-sm font-mono text-blue-200 mb-2">👤 User Model</div>
                  <div className="space-y-1 text-xs font-mono text-blue-300">
                    <div>• name (String, required)</div>
                    <div>• email (String, unique)</div>
                    <div>• role (Enum: admin/user)</div>
                    <div>• posts ← Post[]</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actions Explanation Modal */}
      <Dialog open={safeMetadata.showExplanationModal === 'actions'} onOpenChange={closeExplanationModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-purple-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-purple-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <span className="text-lg">⚡</span>
              </div>
              Actions Explained
            </DialogTitle>
            <DialogDescription className="text-purple-400 font-mono">
              Create powerful user-triggered workflows and data processing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* What are Actions */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h3 className="text-purple-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-purple-400">⚡</span> What are Actions?
              </h3>
              <p className="text-purple-300 text-sm font-mono leading-relaxed mb-3">
                Actions are interactive workflows that users can trigger to process data. They collect input from users, execute custom logic, and create or update records in your models.
              </p>
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <div className="text-xs font-mono text-purple-400 mb-2">Action Flow:</div>
                <div className="flex items-center gap-2 text-xs font-mono text-purple-300 flex-wrap">
                  <span className="px-2 py-1 rounded bg-purple-500/20">📥 User Input</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-purple-500/20">🔄 Processing</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-purple-500/20">💾 Database Update</span>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-purple-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-purple-400">📝</span> Input Forms
                </h4>
                <p className="text-purple-300 text-xs font-mono leading-relaxed">
                  Collect data from users with custom forms that validate input and provide great UX.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-purple-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-purple-400">🤖</span> AI Processing
                </h4>
                <p className="text-purple-300 text-xs font-mono leading-relaxed">
                  Use AI prompts to analyze, transform, or enhance user input before saving to models.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-purple-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-purple-400">🔧</span> Custom Code
                </h4>
                <p className="text-purple-300 text-xs font-mono leading-relaxed">
                  Write custom JavaScript to handle complex business logic and data transformations.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-purple-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-purple-400">🎯</span> Role-based
                </h4>
                <p className="text-purple-300 text-xs font-mono leading-relaxed">
                  Control who can trigger actions with admin or member role permissions.
                </p>
              </div>
            </div>

            {/* Visual Example */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h3 className="text-purple-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-purple-400">🎯</span> Example: "Create Blog Post"
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="text-sm font-mono text-purple-200 mb-2">Step 1: Collect Input</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-purple-300">
                    <div>• Title (required)</div>
                    <div>• Content (required)</div>
                    <div>• Category (dropdown)</div>
                    <div>• Tags (multi-select)</div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="text-sm font-mono text-purple-200 mb-2">Step 2: AI Enhancement</div>
                  <div className="text-xs font-mono text-purple-300">
                    "Generate SEO-friendly slug and meta description from the title and content"
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="text-sm font-mono text-purple-200 mb-2">Step 3: Save to Model</div>
                  <div className="text-xs font-mono text-purple-300">
                    Create new Post record with processed data + current user as author
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedules Explanation Modal */}
      <Dialog open={safeMetadata.showExplanationModal === 'schedules'} onOpenChange={closeExplanationModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-orange-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-orange-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                <span className="text-lg">⏰</span>
              </div>
              Schedules Explained
            </DialogTitle>
            <DialogDescription className="text-orange-400 font-mono">
              Automate recurring tasks and workflows with intelligent scheduling
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* What are Schedules */}
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h3 className="text-orange-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-orange-400">⏰</span> What are Schedules?
              </h3>
              <p className="text-orange-300 text-sm font-mono leading-relaxed mb-3">
                Schedules automate tasks that need to run regularly without user intervention. Perfect for data syncing, maintenance, reports, or any workflow that should happen on a timer.
              </p>
              <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <div className="text-xs font-mono text-orange-400 mb-2">Schedule Flow:</div>
                <div className="flex items-center gap-2 text-xs font-mono text-orange-300 flex-wrap">
                  <span className="px-2 py-1 rounded bg-orange-500/20">⏱️ Timer Triggers</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-orange-500/20">🔄 Execute Code</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-orange-500/20">💾 Update Data</span>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <h4 className="text-orange-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-orange-400">📅</span> Flexible Timing
                </h4>
                <p className="text-orange-300 text-xs font-mono leading-relaxed">
                  Run every minute, hour, day, week, or with custom cron expressions for precise timing.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <h4 className="text-orange-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-orange-400">🤖</span> AI Processing
                </h4>
                <p className="text-orange-300 text-xs font-mono leading-relaxed">
                  Use AI to analyze data, generate content, or make decisions during scheduled runs.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <h4 className="text-orange-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-orange-400">🔄</span> Data Sync
                </h4>
                <p className="text-orange-300 text-xs font-mono leading-relaxed">
                  Automatically sync with external APIs, update records, or perform maintenance tasks.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <h4 className="text-orange-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-orange-400">🛡️</span> Safe Testing
                </h4>
                <p className="text-orange-300 text-xs font-mono leading-relaxed">
                  Test schedules safely without affecting real data before activating them.
                </p>
              </div>
            </div>

            {/* Timing Examples */}
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h3 className="text-orange-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-orange-400">⏱️</span> Common Schedule Patterns
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Every 5 minutes:</span> Real-time data sync
                  </div>
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Every hour:</span> Update statistics
                  </div>
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Daily at 2 AM:</span> Generate reports
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Weekly on Monday:</span> Send newsletters
                  </div>
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Monthly:</span> Archive old data
                  </div>
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Custom cron:</span> Complex timing
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Example */}
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h3 className="text-orange-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-orange-400">🎯</span> Example: "Daily Report Generator"
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-mono text-orange-200 mb-2">⏰ Timing: Every day at 8:00 AM</div>
                  <div className="text-xs font-mono text-orange-300">
                    Automatically runs every morning to prepare daily insights
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-mono text-orange-200 mb-2">📊 Data Processing</div>
                  <div className="text-xs font-mono text-orange-300">
                    Analyze yesterday's Posts, count views, calculate engagement metrics
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-mono text-orange-200 mb-2">🤖 AI Analysis</div>
                  <div className="text-xs font-mono text-orange-300">
                    "Generate insights and recommendations based on yesterday's performance data"
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-mono text-orange-200 mb-2">💾 Save Results</div>
                  <div className="text-xs font-mono text-orange-300">
                    Create new Report record with AI-generated insights and metrics
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export const agentArtifact = new Artifact<'agent', AgentArtifactMetadata>({
  kind: 'agent',
  description: 'AI Agent Builder for creating database-driven automation systems',
  
  initialize: ({ setMetadata }) => {
    setMetadata({
      selectedTab: 'onboard',
      editingModel: null,
      editingAction: null,
      editingSchedule: null,
      viewingModelData: null,
      editingRecord: null,
      dataManagement: null,
      showExplanationModal: null
    });
  },
  
  onStreamPart: ({ streamPart, setArtifact, setMetadata }) => {
    if (streamPart.type === 'agent-data') {
      const agentData = typeof streamPart.content === 'string' 
        ? streamPart.content 
        : JSON.stringify(streamPart.content);
      
      // DEBUG: Check if deployment data is in the stream
      try {
        const parsedData = typeof streamPart.content === 'string' 
          ? JSON.parse(streamPart.content)
          : streamPart.content;
        
        console.log('🔍 STREAM DEBUG - Received agent-data:', {
          hasDeployment: !!parsedData.deployment,
          deploymentUrl: parsedData.deployment?.deploymentUrl || 'none',
          deploymentStatus: parsedData.deployment?.status || 'none',
          agentName: parsedData.name,
          contentLength: agentData.length
        });
      } catch (error) {
        console.warn('⚠️ STREAM DEBUG - Failed to parse agent data for debugging:', error);
      }
      
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: agentData,
        isVisible: true,
        status: 'streaming',
      }));
    }

    if (streamPart.type === 'agent-step') {
      const stepData = typeof streamPart.content === 'string' 
        ? JSON.parse(streamPart.content) 
        : streamPart.content;
      
      // Map orchestrator step IDs to UI step IDs for consistency
      const stepIdMapping: Record<string, string> = {
        'step0': 'analysis',
        'step1': 'models',
        'step2': 'actions',
        'step3': 'schedules',
        'step4': 'deployment',
        'complete': 'complete'
      };
      
      const mappedStepId = stepIdMapping[stepData.step] || stepData.step;
        
      setMetadata((draftMetadata) => {
        const newMetadata: AgentArtifactMetadata = {
          ...(draftMetadata || {}),
          selectedTab: draftMetadata?.selectedTab || 'models',
          editingModel: draftMetadata?.editingModel || null,
          editingAction: draftMetadata?.editingAction || null,
          editingSchedule: draftMetadata?.editingSchedule || null,
          currentStep: mappedStepId,
          stepProgress: {
            ...(draftMetadata?.stepProgress || {}),
            [mappedStepId]: stepData.status,
            // Also store the original step ID for compatibility
            [stepData.step]: stepData.status
          },
          stepMessages: {
            ...(draftMetadata?.stepMessages || {}),
            [mappedStepId]: stepData.message || '',
            // Also store the original step ID for compatibility
            [stepData.step]: stepData.message || ''
          }
        };
        return newMetadata;
      });
      
      if (stepData.status === 'processing') {
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          isVisible: true,
          status: 'streaming',
        }));
      }
      
      // Handle any step completion to ensure visibility (but not for the final complete step)
      if (stepData.status === 'complete' && stepData.step !== 'complete' && mappedStepId !== 'complete') {
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          isVisible: true,
          status: 'streaming',
        }));
      }
      
      // Handle final completion - immediately set to idle when complete step is received
      if (stepData.status === 'complete' && (stepData.step === 'complete' || mappedStepId === 'complete')) {
        console.log('🎉 Agent build completed! Setting status to idle...');
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          isVisible: true,
          status: 'idle', // Immediately set to idle
        }));
      }
    }
    
    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        const newContent = draftArtifact.content + (streamPart.content as string);
        
        return {
          ...draftArtifact,
          content: newContent,
          isVisible: draftArtifact.status === 'streaming' && newContent.length > 200,
          // Don't change status here - let the completion handler manage it
        };
      });
    }
  },

  content: AgentBuilderContent,

  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy agent configuration',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Agent configuration copied to clipboard!');
      },
    },
  ],

  toolbar: [
    {
      icon: <CodeIcon />,
      description: 'Generate code from agent',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Generate the implementation code for this agent system including database schema, API endpoints, and business logic.',
        });
      },
    },
    {
      icon: <PlayIcon />,
      description: 'Deploy agent',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Help me deploy this agent system. What are the next steps and requirements?',
        });
      },
    },
  ],
}); 