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
import { TutorialContent } from './components/TutorialContent';
import { ModelDataViewer } from './components/editors/ModelDataViewer';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
// Import proper types
import type { AgentData, AgentArtifactMetadata } from './types/agent';
import type { AgentModel } from './types/model';
import type { AgentAction } from './types/action';
import type { AgentSchedule } from './types/schedule';

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
      name: `schedule${(agentData.schedules?.length || 0) + 1}`,
      title: `Schedule ${(agentData.schedules?.length || 0) + 1}`,
      emoji: '⏰', // Default emoji, will be auto-generated by AI
      description: '',
      trigger: {
        type: 'cron',
        pattern: '0 0 * * *',
        timezone: 'UTC',
        active: false
      },
      steps: []
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
        model: '',
        fields: {},
        fieldsToUpdate: {}
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

// Simple draggable progress button
const DraggableProgressButton = memo(({
  status,
  currentStep,
  stepProgress,
  stepMessages,
  agentData,
  calculateProgressPercentage
}: {
  status: 'streaming' | 'idle';
  currentStep?: string;
  stepProgress?: Record<string, 'processing' | 'complete'>;
  stepMessages?: Record<string, string>;
  agentData: AgentData;
  calculateProgressPercentage: (currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>, agentData?: any) => number;
}) => {
  const [position, setPosition] = useState({ x: 20, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const maxWidth = isMobile ? 280 : 320;
      setPosition({
        x: Math.max(10, Math.min(e.clientX - startX, window.innerWidth - maxWidth)),
        y: Math.max(10, Math.min(e.clientY - startY, window.innerHeight - 200))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const touch = e.touches[0];
    const startX = touch.clientX - position.x;
    const startY = touch.clientY - position.y;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const maxWidth = isMobile ? 280 : 320;
        setPosition({
          x: Math.max(10, Math.min(touch.clientX - startX, window.innerWidth - maxWidth)),
          y: Math.max(10, Math.min(touch.clientY - startY, window.innerHeight - 200))
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  // Handle tap to expand on mobile
  const handleTap = () => {
    if (isMobile && !isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  if (status !== 'streaming') return null;

  const progress = Math.round(calculateProgressPercentage(currentStep, stepProgress, agentData));
  const currentStepMessage = stepMessages?.[currentStep || ''] || 'Building Agent';

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleTap}
      onMouseEnter={() => !isDragging && !isMobile && setIsExpanded(true)}
      onMouseLeave={() => !isDragging && !isMobile && setIsExpanded(false)}
    >
      <div
        className={`bg-black/95 border-2 border-green-500/40 rounded-2xl backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          isExpanded ? (isMobile ? 'w-72 p-3' : 'w-80 p-4') : 'w-14 h-14 sm:w-16 sm:h-16'
        }`}
      >
        {/* Compact circle */}
        <div className={`flex items-center justify-center ${isExpanded ? (isMobile ? 'w-14 h-14 absolute top-2 left-2' : 'w-16 h-16 absolute top-2 left-2') : 'w-14 h-14 sm:w-16 sm:h-16'}`}>
          <div className="relative">
            <svg className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} transform -rotate-90`} viewBox="0 0 36 36">
              <path
                className="text-green-500/20"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-green-400"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-green-200 font-mono`}>{progress}%</span>
            </div>
          </div>
        </div>

        {/* Expanded view */}
        {isExpanded && (
          <div className={`${isMobile ? 'ml-10 space-y-2' : 'ml-12 space-y-3'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-green-200 font-mono`}>Build Progress</div>
                <div className="text-xs text-green-400 font-mono truncate max-w-[120px]">{agentData?.name || 'AI Agent'}</div>
              </div>
              <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-blue-400 font-mono`}>{progress}%</div>
            </div>
            
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs font-mono text-blue-300">
                🔄 {isMobile ? currentStepMessage.substring(0, 30) + (currentStepMessage.length > 30 ? '...' : '') : currentStepMessage}
              </div>
            </div>
            
            <div className="relative h-2 bg-green-500/10 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Mobile-specific tap hint */}
            {isMobile && (
              <div className="text-xs text-green-400/60 font-mono text-center">
                Tap to {isExpanded ? 'minimize' : 'expand'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

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
    selectedBrainTab: metadata?.selectedBrainTab || 'overview',
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
  const [deploymentEnvVars, setDeploymentEnvVars] = useState<Record<string, Record<string, string>>>({});
  const [isSavingEnvVars, setIsSavingEnvVars] = useState(false);
  const [collapsedActions, setCollapsedActions] = useState<Set<string>>(new Set());
  const [deploymentStep, setDeploymentStep] = useState<'confirm' | 'configure' | 'deploying'>('confirm');
  
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

  // Reusable function to update actions with environment variables
  const updateActionsWithEnvVars = useCallback((agentData: AgentData, deploymentEnvVars: Record<string, Record<string, string>>) => {
    return agentData.actions?.map(action => {
      const actionEnvVars = deploymentEnvVars[action.id];
      if (actionEnvVars && action.execute?.code?.envVars) {
        const updatedEnvVars = action.execute.code.envVars.map(envVar => ({
          ...envVar,
          savedValue: actionEnvVars[envVar.name] || envVar.savedValue || undefined
        }));
        
        console.log(`Updating action ${action.name} with env vars:`, updatedEnvVars);
        
        return {
          ...action,
          execute: {
            ...action.execute,
            code: {
              ...action.execute.code,
              envVars: updatedEnvVars
            }
          }
        };
      }
      return action;
    }) || [];
  }, []);

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

  // Deploy agent function (fresh deployment)
  const deployAgent = useCallback(async () => {
    if (!documentId) {
      console.error('❌ No documentId available for deployment');
      return;
    }
    
    setIsDeploying(true);
    setDeploymentStep('deploying');
    setDeploymentProgress('Initializing deployment...');
    
    try {
      // First, save environment variables to actions
      setDeploymentProgress('Saving environment variables...');
      console.log('💾 Saving environment variables before deployment...');
      console.log('Current deploymentEnvVars:', deploymentEnvVars);
      
      // Update actions with saved environment variables using reusable function
      const updatedActions = updateActionsWithEnvVars(agentData, deploymentEnvVars);

      // Update agent data with saved env vars
      const agentDataWithEnvVars = {
        ...agentData,
        actions: updatedActions
      };

      // Save immediately to document
      const agentContent = JSON.stringify(agentDataWithEnvVars, null, 2);
      onSaveContent(agentContent, false); // Immediate save, no debounce
      
      // Update local state (using updateAgentData like saveEnvVarsToActions)
      updateAgentData(agentDataWithEnvVars);
      
      console.log('✅ Environment variables saved to actions and document');
      
      // Prepare environment variables for deployment
      const deploymentEnvVarsFlat: Record<string, string> = {};
      Object.entries(deploymentEnvVars).forEach(([actionId, actionEnvVars]) => {
        Object.entries(actionEnvVars).forEach(([envVarName, value]) => {
          if (value.trim()) {
            // Use clean environment variable names without action prefixes
            deploymentEnvVarsFlat[envVarName] = value;
          }
        });
      });
      
      console.log('🔧 Deploying agent with:', {
        agentName: agentDataWithEnvVars.name,
        documentId,
        envVarsCount: Object.keys(deploymentEnvVarsFlat).length,
        envVarNames: Object.keys(deploymentEnvVarsFlat),
        isRedeploy: false
      });
      
      setDeploymentProgress('Contacting deployment service...');
      
      const response = await fetch('/api/agent/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentData: agentDataWithEnvVars, // This now includes the saved environment variables
          documentId,
          projectName: agentDataWithEnvVars.name,
          description: agentDataWithEnvVars.description,
          environmentVariables: deploymentEnvVarsFlat,
          isRedeploy: false,
          existingDeployment: null
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Deployment API error:', response.status, errorText);
        throw new Error(`Deployment failed: ${response.status} - ${errorText}`);
      }

      setDeploymentProgress('Processing deployment response...');
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Deployment successful:', result);
        
        setDeploymentProgress('Updating agent configuration...');
        
        // Update agent data with deployment info
        const updatedAgentData = {
          ...agentDataWithEnvVars,
          deployment: result.deploymentResult || result.deployment || {
            deploymentUrl: result.deploymentUrl,
            status: 'deployed',
            deployedAt: new Date().toISOString()
          }
        };
        
        console.log('🔄 Updated agent data with deployment:', {
          hasDeployment: !!updatedAgentData.deployment,
          deploymentUrl: updatedAgentData.deployment?.deploymentUrl,
          deploymentStatus: updatedAgentData.deployment?.status
        });
        
        // Update local state
        setAgentData(updatedAgentData);
        
        // Save updated agent data immediately
        const agentContent = JSON.stringify(updatedAgentData, null, 2);
        onSaveContent(agentContent, false); // No debounce for deployment updates
        
        setDeploymentProgress('Deployment completed successfully! 🎉');
        
        // Don't auto-close modal - let user manually close it
        setIsDeploying(false);
      } else {
        console.error('❌ Deployment failed:', result);
        throw new Error(result.error || result.details || 'Deployment failed');
      }
    } catch (error) {
      console.error('❌ Deployment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown deployment error';
      setDeploymentProgress(`❌ Deployment failed: ${errorMessage}`);
      
      // Keep error visible longer
      setTimeout(() => {
        setIsDeploying(false);
        setDeploymentProgress('');
        setDeploymentStep('confirm');
      }, 5000);
    }
  }, [agentData, documentId, deploymentEnvVars, onSaveContent, updateActionsWithEnvVars]);

  // Redeploy agent function (complete redeployment)
  const redeployAgent = useCallback(async () => {
    if (!documentId) {
      console.error('❌ No documentId available for redeployment');
      return;
    }
    
    setIsDeploying(true);
    setDeploymentStep('deploying');
    setDeploymentProgress('Initializing complete redeployment...');
    
    try {
      // First, save environment variables to actions
      setDeploymentProgress('Saving environment variables...');
      console.log('💾 Saving environment variables before redeployment...');
      console.log('Current deploymentEnvVars:', deploymentEnvVars);
      
      // Update actions with saved environment variables using reusable function
      const updatedActions = updateActionsWithEnvVars(agentData, deploymentEnvVars);

      // Update agent data with saved env vars
      const agentDataWithEnvVars = {
        ...agentData,
        actions: updatedActions
      };

      // Save immediately to document
      const agentContent = JSON.stringify(agentDataWithEnvVars, null, 2);
      onSaveContent(agentContent, false); // Immediate save, no debounce
      
      // Update local state (using updateAgentData like saveEnvVarsToActions)
      updateAgentData(agentDataWithEnvVars);
      
      console.log('✅ Environment variables saved to actions and document');
      
      // Prepare environment variables for deployment
      const deploymentEnvVarsFlat: Record<string, string> = {};
      Object.entries(deploymentEnvVars).forEach(([actionId, actionEnvVars]) => {
        Object.entries(actionEnvVars).forEach(([envVarName, value]) => {
          if (value.trim()) {
            // Use clean environment variable names without action prefixes
            deploymentEnvVarsFlat[envVarName] = value;
          }
        });
      });
      
      console.log('🔧 Redeploying agent with complete rebuild:', {
        agentName: agentDataWithEnvVars.name,
        documentId,
        envVarsCount: Object.keys(deploymentEnvVarsFlat).length,
        envVarNames: Object.keys(deploymentEnvVarsFlat),
        isRedeploy: true,
        existingUrl: deploymentInfo?.deploymentUrl
      });
      
      setDeploymentProgress('Contacting deployment service...');
      
      const response = await fetch('/api/agent/redeploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentData: agentDataWithEnvVars, // This now includes the saved environment variables
          documentId,
          projectName: agentDataWithEnvVars.name,
          description: agentDataWithEnvVars.description,
          environmentVariables: deploymentEnvVarsFlat,
          isRedeploy: true,
          existingDeployment: deploymentInfo
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Redeployment API error:', response.status, errorText);
        throw new Error(`Redeployment failed: ${response.status} - ${errorText}`);
      }

      setDeploymentProgress('Processing redeployment response...');
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Redeployment successful:', result);
        
        setDeploymentProgress('Updating agent configuration...');
        
        // Update agent data with deployment info
        const updatedAgentData = {
          ...agentDataWithEnvVars,
          deployment: result.deploymentResult || result.deployment || {
            deploymentUrl: result.deploymentUrl,
            status: 'deployed',
            deployedAt: new Date().toISOString()
          }
        };
        
        console.log('🔄 Updated agent data with redeployment:', {
          hasDeployment: !!updatedAgentData.deployment,
          deploymentUrl: updatedAgentData.deployment?.deploymentUrl,
          deploymentStatus: updatedAgentData.deployment?.status
        });
        
        // Update local state
        setAgentData(updatedAgentData);
        
        // Save updated agent data immediately
        const agentContent = JSON.stringify(updatedAgentData, null, 2);
        onSaveContent(agentContent, false); // No debounce for deployment updates
        
        setDeploymentProgress('Redeployment completed successfully! 🎉');
        
        // Don't auto-close modal - let user manually close it
        setIsDeploying(false);
      } else {
        console.error('❌ Redeployment failed:', result);
        throw new Error(result.error || result.details || 'Redeployment failed');
      }
    } catch (error) {
      console.error('❌ Redeployment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown redeployment error';
      setDeploymentProgress(`❌ Redeployment failed: ${errorMessage}`);
      
      // Keep error visible longer
      setTimeout(() => {
        setIsDeploying(false);
        setDeploymentProgress('');
        setDeploymentStep('confirm');
      }, 5000);
    }
  }, [agentData, documentId, deploymentEnvVars, deploymentInfo, onSaveContent, updateActionsWithEnvVars]);

  // Save environment variables to actions
  const saveEnvVarsToActions = useCallback(async () => {
    setIsSavingEnvVars(true);
    try {
      console.log('💾 Saving environment variables to actions...');
      console.log('Current deploymentEnvVars:', deploymentEnvVars);
      
      // Update actions with saved environment variables
      const updatedActions = updateActionsWithEnvVars(agentData, deploymentEnvVars);

      // Update agent data with saved env vars
      const updatedAgentData = {
        ...agentData,
        actions: updatedActions
      };

      // Save immediately to document
      const agentContent = JSON.stringify(updatedAgentData, null, 2);
      onSaveContent(agentContent, false); // Immediate save, no debounce
      
      // Update local state
      updateAgentData(updatedAgentData);
      
      console.log('✅ Environment variables saved to actions and document');
      toast.success('Environment variables saved successfully!');
      
    } catch (error) {
      console.error('❌ Failed to save environment variables:', error);
      toast.error('Failed to save environment variables');
    } finally {
      setIsSavingEnvVars(false);
    }
  }, [agentData, deploymentEnvVars, updateAgentData, onSaveContent, updateActionsWithEnvVars]);

  // Check if all required environment variables are filled
  const areAllEnvVarsFilled = useCallback(() => {
    const actionsWithEnvVars = agentData.actions?.filter(action => 
      action.execute?.code?.envVars?.some(envVar => envVar.required)
    ) || [];

    for (const action of actionsWithEnvVars) {
      const requiredEnvVars = action.execute?.code?.envVars?.filter(envVar => envVar.required) || [];
      for (const envVar of requiredEnvVars) {
        if (!deploymentEnvVars[action.id]?.[envVar.name]?.trim()) {
          return false;
        }
      }
    }
    return true;
  }, [agentData.actions, deploymentEnvVars]);

  // Helper functions for collapsible actions
  const toggleActionCollapsed = useCallback((actionId: string) => {
    setCollapsedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  }, []);

  const getUnfilledCount = useCallback((action: any) => {
    const requiredEnvVars = action.execute?.code?.envVars?.filter((envVar: any) => envVar.required) || [];
    return requiredEnvVars.filter((envVar: any) => !deploymentEnvVars[action.id]?.[envVar.name]?.trim()).length;
  }, [deploymentEnvVars]);

  // Initialize environment variables and reset deployment step when modal opens
  useEffect(() => {
    if (showDeploymentModal && agentData.actions) {
      // Only reset deployment state when modal first opens, not when agentData.actions changes during deployment
      const isModalJustOpened = deploymentStep === 'confirm' && !isDeploying;
      
      if (isModalJustOpened) {
        console.log('🔧 Initializing deployment modal environment variables');
        
        const initialEnvVars: Record<string, Record<string, string>> = {};
        
        agentData.actions.forEach(action => {
          if (action.execute?.code?.envVars?.length) {
            initialEnvVars[action.id] = {};
            action.execute.code.envVars.forEach(envVar => {
              // Use saved value if available, otherwise empty string
              initialEnvVars[action.id][envVar.name] = envVar.savedValue || '';
            });
          }
        });
        
        setDeploymentEnvVars(initialEnvVars);
        
        // Initially collapse all actions
        const actionIds = agentData.actions
          .filter(action => action.execute?.code?.envVars?.length)
          .map(action => action.id);
        setCollapsedActions(new Set(actionIds));
      } else {
        console.log('🔧 Updating deployment environment variables with saved values (deployment in progress)');
        
        // Update environment variables with newly saved values, but don't reset deployment state
        setDeploymentEnvVars(prevEnvVars => {
          const updatedEnvVars = { ...prevEnvVars };
          
          agentData.actions.forEach(action => {
            if (action.execute?.code?.envVars?.length) {
              if (!updatedEnvVars[action.id]) {
                updatedEnvVars[action.id] = {};
              }
              action.execute.code.envVars.forEach(envVar => {
                // Update with saved value if it exists, otherwise keep current value
                if (envVar.savedValue) {
                  updatedEnvVars[action.id][envVar.name] = envVar.savedValue;
                }
              });
            }
          });
          
          return updatedEnvVars;
        });
      }
    }
  }, [showDeploymentModal, agentData.actions, deploymentStep, isDeploying]);

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
      id: 'avatar' as const,
      label: 'Avatar',
      count: 0
    },
    {
      id: 'brain' as const,
      label: 'Brain',
      count: 0
    }
  ], [agentData.models?.length, agentData.actions?.length, agentData.schedules?.length]);

  // Brain sub-tabs configuration
  const brainTabs = useMemo(() => [
    {
      id: 'models' as const,
      label: 'Models',
      count: agentData.models?.length || 0,
      icon: '🗃️'
    },
    {
      id: 'actions' as const,
      label: 'Actions',
      count: agentData.actions?.length || 0,
      icon: '⚡'
    },
    {
      id: 'schedules' as const,
      label: 'Schedules',
      count: agentData.schedules?.length || 0,
      icon: '⏰'
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
    <>
      {/* Draggable Progress Button - Outside main container to avoid z-index issues */}
      {status === 'streaming' && (
        <DraggableProgressButton
          status={status}
          currentStep={safeMetadata.currentStep}
          stepProgress={safeMetadata.stepProgress}
          stepMessages={safeMetadata.stepMessages}
          agentData={agentData}
          calculateProgressPercentage={calculateProgressPercentage}
        />
      )}
      
      <div className="h-full bg-black text-green-200 flex flex-col relative overflow-hidden font-mono min-h-screen sm:min-h-0">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-600/5 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header - More Compact */}
        <div className="relative border-b border-green-500/20 backdrop-blur-xl bg-black/50">
          <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Left side - Logo and title */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <div className="text-black text-sm">🤖</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-matrix-gradient bg-clip-text font-mono truncate">
                    Agent Builder
                  </h1>
                  <p className="text-green-400 text-xs font-medium font-mono hidden lg:block">
                    Design and configure your AI agent system
                  </p>
                </div>
              </div>
              
              {/* Center - Status Indicator */}
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-black/50 border border-green-500/20 backdrop-blur-sm">
                <div className="status-indicator status-online">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    status === 'streaming'
                      ? "bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50"
                      : "bg-green-400 animate-matrix-pulse shadow-lg shadow-green-400/50"
                  )} />
                </div>
                <span className="text-xs font-medium text-green-400 font-mono">
                  {status === 'streaming' ? 'Building...' : 'Ready'}
                </span>
              </div>
              
              {/* Right side - Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Deployment Button */}
                {deploymentInfo && deploymentInfo.deploymentUrl && (
                  <Button
                    onClick={() => window.open(deploymentInfo.deploymentUrl, '_blank')}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium font-mono transition-all duration-200 btn-matrix bg-blue-600 hover:bg-blue-700 text-white border-blue-500/50 min-h-[32px] sm:min-h-[36px]"
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 justify-center">
                      <div className="w-3 h-3">🌐</div>
                      <span className="hidden sm:inline">View Live</span>
                      <span className="sm:hidden">Live</span>
                    </div>
                  </Button>
                )}

                {/* Save Button - Hide during building */}
                {status !== 'streaming' && (
                  <Button
                    onClick={saveAgentToConversation}
                    disabled={isSaving}
                    className={cn(
                      "px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium font-mono transition-all duration-200 min-h-[32px] sm:min-h-[36px]",
                      hasUnsavedChanges 
                        ? "btn-matrix border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300" 
                        : "btn-matrix"
                    )}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 justify-center">
                      <div className="w-3 h-3">
                        {isSaving ? '⏳' : hasUnsavedChanges ? '📝' : '💾'}
                      </div>
                      <span className="hidden sm:inline">
                        {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save & Deploy' : 'Save & Deploy'}
                      </span>
                      <span className="sm:hidden">Save & Deploy</span>
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Navigation - More Compact */}
      <div className="relative border-b border-green-500/20 backdrop-blur-xl bg-black/50 sticky top-0 z-50 md:static md:z-auto">
        <div className="px-3 sm:px-4 lg:px-6">
          {/* Main tabs */}
          <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => updateMetadata({ 
                  selectedTab: tab.id,
                  dataManagement: null // Clear dataManagement when switching tabs
                })}
                className={cn(
                  "relative px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium font-mono transition-all duration-300 border-b-2 group whitespace-nowrap flex-shrink-0 min-h-[40px] flex items-center justify-center",
                  safeMetadata.selectedTab === tab.id
                    ? "text-green-300 border-green-400 bg-green-500/10"
                    : "text-green-500 border-transparent hover:text-green-300 hover:bg-green-500/5 active:bg-green-500/10"
                )}
              >
                <span className="font-medium">{tab.label}</span>
                
                {/* Active tab indicator */}
                {safeMetadata.selectedTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-t-lg -z-10" />
                )}
              </button>
            ))}
          </div>

          {/* Brain navigation - horizontal scroll on mobile */}
          {safeMetadata.selectedTab === 'brain' && (
            <div className="border-t border-green-500/10 mt-0 pt-1.5 sm:pt-2 pb-1 sm:pb-1.5">
              <div className="flex items-center justify-start sm:justify-center overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="inline-flex bg-green-500/10 border border-green-500/20 rounded-lg p-0.5 shadow-sm min-w-max">
                  <button
                    onClick={() => updateMetadata({ 
                      selectedBrainTab: 'overview',
                      dataManagement: null 
                    })}
                    className={`px-2 py-1 text-xs font-mono rounded-lg transition-all duration-200 flex items-center gap-1 whitespace-nowrap min-h-[28px] flex-shrink-0 ${
                      safeMetadata.selectedBrainTab === 'overview' || !safeMetadata.selectedBrainTab
                        ? "bg-green-500/20 text-green-200 shadow-sm"
                        : "text-green-400 hover:text-green-200 active:bg-green-500/15"
                    }`}
                  >
                    <span className="text-xs">🧠</span>
                    <span className="text-xs">Overview</span>
                  </button>
                  {brainTabs.map((brainTab) => (
                    <button
                      key={brainTab.id}
                      onClick={() => updateMetadata({ 
                        selectedBrainTab: brainTab.id,
                        dataManagement: null 
                      })}
                      className={`px-2 py-1 text-xs font-mono rounded-lg transition-all duration-200 flex items-center gap-1 whitespace-nowrap min-h-[28px] flex-shrink-0 ${
                        safeMetadata.selectedBrainTab === brainTab.id
                          ? "bg-green-500/20 text-green-200 shadow-sm"
                          : "text-green-400 hover:text-green-200 active:bg-green-500/15"
                      }`}
                    >
                      <span className="text-xs">{brainTab.icon}</span>
                      <span className="text-xs">{brainTab.label}</span>
                      <span className="px-1 py-0.5 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30 ml-0.5">
                        {brainTab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
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
                  <TutorialContent 
                    onTabChange={(tab) => {
                      if (tab === 'models' || tab === 'actions' || tab === 'schedules') {
                        setMetadata({ 
                          ...safeMetadata, 
                          selectedTab: 'brain',
                          selectedBrainTab: tab
                        });
                      } else if (tab === 'avatar') {
                        setMetadata({ 
                          ...safeMetadata, 
                          selectedTab: 'avatar'
                        });
                      }
                    }} 
                    agentData={agentData}
                    onDataChange={updateAgentData}
                  />
                );
              }
              
              if (safeMetadata.selectedTab === 'avatar') {
                return (
                  <OnboardContent 
                    agentData={agentData}
                    onDataChange={updateAgentData}
                    documentId={documentId}
                  />
                );
              }
              
              // Brain Overview - Simple introduction to the Brain components
              if (safeMetadata.selectedTab === 'brain' && (safeMetadata.selectedBrainTab === 'overview' || !safeMetadata.selectedBrainTab)) {
                return (
                  <div className="space-y-8">
                    {/* Unified Header */}
                    <div className="text-center space-y-4">
                      {/* <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <span className="text-2xl sm:text-3xl">🧠</span>
                      </div> */}
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">Your Agent's Brain</h2>
                        <p className="text-green-400 font-mono text-sm max-w-2xl mx-auto leading-relaxed mt-2">
                          Your AI agent's intelligence comes from three simple components that work together.
                        </p>
                      </div>
                    </div>

                    {/* Simplified Three Components - No buttons, just clickable cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Models Card */}
                      <div 
                        className="group cursor-pointer p-4 sm:p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm hover:bg-blue-500/15 active:bg-blue-500/20 transition-all duration-300 min-h-[120px] sm:min-h-auto"
                        onClick={() => updateMetadata({ selectedBrainTab: 'models' })}
                      >
                        <div className="text-center space-y-2 sm:space-y-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                            <span className="text-xl sm:text-2xl">🗃️</span>
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-blue-200 font-mono mb-1">Models</h3>
                            <div className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs sm:text-sm font-mono mb-2 inline-block">
                              {agentData.models?.length || 0} created
                            </div>
                            <p className="text-blue-300 text-xs sm:text-sm font-mono leading-relaxed">
                              Store and organize your data
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions Card */}
                      <div 
                        className="group cursor-pointer p-4 sm:p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm hover:bg-purple-500/15 active:bg-purple-500/20 transition-all duration-300 min-h-[120px] sm:min-h-auto"
                        onClick={() => updateMetadata({ selectedBrainTab: 'actions' })}
                      >
                        <div className="text-center space-y-2 sm:space-y-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                            <span className="text-xl sm:text-2xl">⚡</span>
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-purple-200 font-mono mb-1">Actions</h3>
                            <div className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs sm:text-sm font-mono mb-2 inline-block">
                              {agentData.actions?.length || 0} created
                            </div>
                            <p className="text-purple-300 text-xs sm:text-sm font-mono leading-relaxed">
                              Let users interact with your data
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Schedules Card */}
                      <div 
                        className="group cursor-pointer p-4 sm:p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm hover:bg-orange-500/15 active:bg-orange-500/20 transition-all duration-300 min-h-[120px] sm:min-h-auto"
                        onClick={() => updateMetadata({ selectedBrainTab: 'schedules' })}
                      >
                        <div className="text-center space-y-2 sm:space-y-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30 group-hover:scale-110 transition-transform">
                            <span className="text-xl sm:text-2xl">⏰</span>
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-orange-200 font-mono mb-1">Schedules</h3>
                            <div className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs sm:text-sm font-mono mb-2 inline-block">
                              {agentData.schedules?.length || 0} created
                            </div>
                            <p className="text-orange-300 text-xs sm:text-sm font-mono leading-relaxed">
                              Automate tasks on a timer
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Simple Flow Explanation */}
                    <div className="p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                      <div className="text-center space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-bold text-green-200 font-mono">How it works</h3>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-mono">
                          <span className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 w-full sm:w-auto text-center">
                            📊 Models store data
                          </span>
                          <span className="text-green-400 rotate-90 sm:rotate-0">→</span>
                          <span className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 w-full sm:w-auto text-center">
                            ⚡ Actions process it
                          </span>
                          <span className="text-green-400 rotate-90 sm:rotate-0">→</span>
                          <span className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 w-full sm:w-auto text-center">
                            ⏰ Schedules automate it
                          </span>
                        </div>
                        <p className="text-green-400 font-mono text-xs sm:text-sm max-w-lg mx-auto">
                          Click any component above to start building, or use the tabs at the top to navigate.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              
              if (safeMetadata.selectedTab === 'brain' && safeMetadata.selectedBrainTab === 'models') {
                console.log('🗂️ Rendering ModelsListEditor');
                console.log('🗂️ Models data:', {
                  modelsCount: agentData.models?.length || 0,
                  modelNames: (agentData.models || []).map((m: AgentModel) => m.name),
                  editingId: safeMetadata.editingModel
                });
                return (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Introduction Section */}
                    <div className="p-3 sm:p-4 lg:p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                <span className="text-sm sm:text-lg">🗃️</span>
                              </div>
                              <h2 className="text-lg sm:text-xl font-bold text-blue-200 font-mono">Data Models</h2>
                            </div>
                            <button
                              onClick={() => setIsModelsIntroExpanded(!isModelsIntroExpanded)}
                              className="lg:hidden p-1.5 sm:p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 border border-blue-500/30 transition-colors"
                              aria-label={isModelsIntroExpanded ? "Minimize introduction" : "Expand introduction"}
                            >
                              <span className="text-blue-200 text-sm">
                                {isModelsIntroExpanded ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                          <div className={cn(
                            "transition-all duration-300 overflow-hidden",
                            isModelsIntroExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 lg:max-h-96 lg:opacity-100"
                          )}>
                            <p className="text-blue-300 text-xs sm:text-sm font-mono leading-relaxed mb-2 sm:mb-3">
                              Define the structure of your data with custom models. Each model represents a table in your database with fields, types, and relationships. Models store and organize all the information your agent will work with.
                            </p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs font-mono">
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">📊 Database Tables</span>
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">🔗 Relationships</span>
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">✅ Validation</span>
                            </div>
                          </div>
                          {/* Truncated description for mobile when collapsed */}
                          <div className={cn(
                            "lg:hidden transition-all duration-300",
                            !isModelsIntroExpanded ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
                          )}>
                            <p className="text-blue-300 text-xs sm:text-sm font-mono leading-relaxed">
                              Define the structure of your data with custom models...
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "transition-all duration-300 flex justify-center sm:justify-start",
                          isModelsIntroExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"
                        )}>
                          <Button
                            onClick={() => openExplanationModal('models')}
                            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
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
                        // Filter out invalid tab values that might come from ModelsListEditor
                        const filteredUpdates = { ...updates };
                        if ('selectedTab' in filteredUpdates) {
                          delete filteredUpdates.selectedTab;
                        }
                        setMetadata({ 
                          ...safeMetadata, 
                          ...filteredUpdates
                        });
                      }}
                      status={'idle'}
                    />
                  </div>
                );
              }
              
              if (safeMetadata.selectedTab === 'brain' && safeMetadata.selectedBrainTab === 'actions') {
                console.log('⚡ Rendering ActionsListEditor');
                console.log('⚡ Actions data:', {
                  actionsCount: agentData.actions?.length || 0,
                  actionNames: (agentData.actions || []).map((a: AgentAction) => a.name),
                  editingId: safeMetadata.editingAction
                });
                return (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Introduction Section */}
                    <div className="p-3 sm:p-4 lg:p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                <span className="text-sm sm:text-lg">⚡</span>
                              </div>
                              <h2 className="text-lg sm:text-xl font-bold text-purple-200 font-mono">Actions</h2>
                            </div>
                            <button
                              onClick={() => setIsActionsIntroExpanded(!isActionsIntroExpanded)}
                              className="lg:hidden p-1.5 sm:p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 border border-purple-500/30 transition-colors"
                              aria-label={isActionsIntroExpanded ? "Minimize introduction" : "Expand introduction"}
                            >
                              <span className="text-purple-200 text-sm">
                                {isActionsIntroExpanded ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                          <div className={cn(
                            "transition-all duration-300 overflow-hidden",
                            isActionsIntroExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 lg:max-h-96 lg:opacity-100"
                          )}>
                            <p className="text-purple-300 text-xs sm:text-sm font-mono leading-relaxed mb-2 sm:mb-3">
                              Create interactive actions that users can trigger to manipulate data. Actions can collect user input, process information, and create or update records in your models. Perfect for forms, workflows, and user interactions.
                            </p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs font-mono">
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">🎯 User Triggered</span>
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">📝 Data Input</span>
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">🔄 Processing</span>
                            </div>
                          </div>
                          {/* Truncated description for mobile when collapsed */}
                          <div className={cn(
                            "lg:hidden transition-all duration-300",
                            !isActionsIntroExpanded ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
                          )}>
                            <p className="text-purple-300 text-xs sm:text-sm font-mono leading-relaxed">
                              Create interactive actions that users can trigger...
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "transition-all duration-300 flex justify-center sm:justify-start",
                          isActionsIntroExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"
                        )}>
                          <Button
                            onClick={() => openExplanationModal('actions')}
                            className="bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
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
                      allEnums={agentData.enums || []}
                      prismaSchema={agentData.prismaSchema || ''}
                      documentId={documentId}
                    />
                  </div>
                );
              }
              
              if (safeMetadata.selectedTab === 'brain' && safeMetadata.selectedBrainTab === 'schedules') {
                console.log('⏰ Rendering SchedulesListEditor');
                console.log('⏰ Schedules data:', {
                  schedulesCount: agentData.schedules?.length || 0,
                  scheduleNames: (agentData.schedules || []).map((s: AgentSchedule) => s.name),
                  editingId: safeMetadata.editingSchedule
                });
                return (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Introduction Section */}
                    <div className="p-3 sm:p-4 lg:p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                <span className="text-sm sm:text-lg">⏰</span>
                              </div>
                              <h2 className="text-lg sm:text-xl font-bold text-orange-200 font-mono">Schedules</h2>
                            </div>
                            <button
                              onClick={() => setIsSchedulesIntroExpanded(!isSchedulesIntroExpanded)}
                              className="lg:hidden p-1.5 sm:p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 active:bg-orange-500/40 border border-orange-500/30 transition-colors"
                              aria-label={isSchedulesIntroExpanded ? "Minimize introduction" : "Expand introduction"}
                            >
                              <span className="text-orange-200 text-sm">
                                {isSchedulesIntroExpanded ? '−' : '+'}
                              </span>
                            </button>
                          </div>
                          <div className={cn(
                            "transition-all duration-300 overflow-hidden",
                            isSchedulesIntroExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 lg:max-h-96 lg:opacity-100"
                          )}>
                            <p className="text-orange-300 text-xs sm:text-sm font-mono leading-relaxed mb-2 sm:mb-3">
                              Automate recurring tasks with scheduled actions that run at specific intervals. Perfect for data syncing, regular maintenance, reports, or any automated workflow that needs to happen on a timer.
                            </p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs font-mono">
                              <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🤖 Automated</span>
                              <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">⏱️ Time-based</span>
                              <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🔄 Recurring</span>
                            </div>
                          </div>
                          {/* Truncated description for mobile when collapsed */}
                          <div className={cn(
                            "lg:hidden transition-all duration-300",
                            !isSchedulesIntroExpanded ? "opacity-100 max-h-20" : "opacity-0 max-h-0"
                          )}>
                            <p className="text-orange-300 text-xs sm:text-sm font-mono leading-relaxed">
                              Automate recurring tasks with scheduled actions...
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "transition-all duration-300 flex justify-center sm:justify-start",
                          isSchedulesIntroExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"
                        )}>
                          <Button
                            onClick={() => openExplanationModal('schedules')}
                            className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-orange-500/25 text-sm sm:text-base w-full sm:w-auto justify-center"
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
      
      {/* Enhanced Deployment Modal */}
      <Dialog open={showDeploymentModal} onOpenChange={setShowDeploymentModal}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[550px] max-h-[90vh] overflow-y-auto bg-black/95 border-green-500/20 backdrop-blur-xl z-[70]">
          <DialogHeader>
            <DialogTitle className="text-green-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
                <span className="text-black text-lg">🚀</span>
              </div>
              {deploymentStep === 'confirm' ? 'Deploy Your Agent' : 
               deploymentStep === 'configure' ? 'Configure Environment Variables' : 
               'Deploying Agent...'}
            </DialogTitle>
            <DialogDescription className="text-green-400 font-mono">
              {deploymentStep === 'confirm' ? `Ready to deploy "${agentData.name}" to production?` :
               deploymentStep === 'configure' ? `Configure required environment variables for "${agentData.name}".` :
               `Deploying "${agentData.name}" to production...`
              }
            </DialogDescription>
          </DialogHeader>
          
                    {/* Step 1: Deployment Confirmation */}
          {deploymentStep === 'confirm' && (
            <div className="space-y-4 mt-6">
              {/* Agent Saved Confirmation */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-green-200 font-medium">Agent Saved Successfully</span>
                </div>
                <p className="text-green-400/80 text-sm">
                  Your agent "{agentData.name}" has been saved and is ready for deployment.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-blue-200 font-medium">Ready for Deployment</span>
                </div>
                <p className="text-blue-400/80 text-sm">
                  Your agent will be deployed to production with all current configurations.
                </p>
              </div>

              {/* Show deployment info if already deployed */}
              {deploymentInfo?.deploymentUrl && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="text-emerald-200 font-medium">Currently Deployed</span>
                    </div>
                    <Button
                      onClick={() => setDeploymentStep('configure')}
                      className="px-3 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 rounded-md transition-colors"
                    >
                      Edit Variables
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-emerald-400/80 break-all">
                      Live at: <span className="text-emerald-200 font-mono">{deploymentInfo.deploymentUrl}</span>
                    </div>
                    <Button
                      onClick={() => window.open(deploymentInfo.deploymentUrl, '_blank')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Open Live Agent</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Deployment Progress */}
          {deploymentStep === 'deploying' && (
            <div className="flex flex-col gap-4 mt-6">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  {isDeploying ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                  )}
                  <span className="text-blue-200 font-medium font-mono">
                    {isDeploying ? 'Deploying Agent...' : 'Deployment Complete!'}
                  </span>
                </div>
                <div className="text-sm text-blue-400 font-mono ml-7">
                  {deploymentProgress}
                </div>
              </div>
              
              {/* Show deployment URL when complete */}
              {!isDeploying && agentData.deployment?.deploymentUrl && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span className="text-green-200 font-medium font-mono">Your Agent is Live!</span>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm text-green-400 font-mono break-all">
                      <span className="text-green-300">URL:</span> {agentData.deployment?.deploymentUrl}
                    </div>
                    <Button
                      onClick={() => agentData.deployment?.deploymentUrl && window.open(agentData.deployment.deploymentUrl, '_blank')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Open Agent in New Tab</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Environment Variables Configuration */}
          {deploymentStep === 'configure' && (
            <div className="space-y-4 mt-6">
              {(() => {
                const actionsWithEnvVars = agentData.actions?.filter(action => 
                  action.execute?.code?.envVars?.length
                ) || [];

                if (actionsWithEnvVars.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-emerald-200 font-medium">Ready to Deploy</span>
                      </div>
                      <p className="text-emerald-400/80 text-sm mt-2 ml-5">
                        No environment variables required. Your agent is ready for deployment.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="text-center py-2">
                      <h3 className="text-white font-medium text-lg">Environment Variables</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Configure required variables for your actions
                      </p>
                    </div>

                    {/* Actions List */}
                    <div className="space-y-2">
                      {actionsWithEnvVars.map(action => {
                        const isCollapsed = collapsedActions.has(action.id);
                        const unfilledCount = getUnfilledCount(action);
                        const totalRequired = action.execute?.code?.envVars?.filter((envVar: any) => envVar.required).length || 0;
                        const isComplete = unfilledCount === 0;
                        
                        return (
                          <div key={action.id} className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/50">
                            {/* Header */}
                            <div 
                              className="px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between"
                              onClick={() => toggleActionCollapsed(action.id)}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{action.emoji || '⚡'}</span>
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm">{action.name}</h4>
                                  <p className="text-gray-400 text-xs truncate max-w-[200px]">{action.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {/* Status indicator */}
                                <div className="flex items-center gap-2">
                                  {isComplete ? (
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                      <span className="text-emerald-400 text-xs font-medium">Complete</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                      <span className="text-amber-400 text-xs font-medium">{unfilledCount} missing</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Expand icon */}
                                <div className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}>
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            {!isCollapsed && (
                              <div className="px-4 pb-4 border-t border-gray-700/50">
                                <div className="space-y-3 pt-3">
                                  {action.execute?.code?.envVars?.map((envVar, index) => (
                                    <div key={index} className="space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <Label className="text-gray-300 text-sm font-medium">
                                          {envVar.name}
                                        </Label>
                                        {envVar.required && (
                                          <span className="text-red-400 text-xs">*</span>
                                        )}
                                        {envVar.sensitive && (
                                          <span className="px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                            Sensitive
                                          </span>
                                        )}
                                      </div>
                                      <Input
                                        type={envVar.sensitive ? 'password' : 'text'}
                                        value={deploymentEnvVars[action.id]?.[envVar.name] || ''}
                                        onChange={(e) => setDeploymentEnvVars(prev => ({
                                          ...prev,
                                          [action.id]: {
                                            ...prev[action.id],
                                            [envVar.name]: e.target.value
                                          }
                                        }))}
                                        placeholder={envVar.description}
                                        className="h-9 bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm"
                                      />
                                      {envVar.description && (
                                        <p className="text-xs text-gray-500">{envVar.description}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>


                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Footer Buttons */}
          {(deploymentStep !== 'deploying' || !isDeploying) && (
            <DialogFooter className="flex gap-3 mt-6 pt-4 border-t border-gray-700/50">
              <Button
                variant="outline"
                onClick={() => {
                  if (deploymentStep === 'confirm') {
                    setShowDeploymentModal(false);
                  } else if (deploymentStep === 'configure') {
                    setDeploymentStep('confirm');
                  } else if (deploymentStep === 'deploying' && !isDeploying) {
                    // When deployment is complete, close modal and reset state
                    setShowDeploymentModal(false);
                    setDeploymentStep('confirm');
                    setDeploymentProgress('');
                  }
                }}
                className="flex-1 h-10 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 hover:text-white transition-colors"
              >
                {deploymentStep === 'confirm' ? 'Cancel' : 
                 deploymentStep === 'configure' ? 'Back' :
                 deploymentStep === 'deploying' && !isDeploying ? 'Close' : 'Back'}
              </Button>
              
              {deploymentStep === 'confirm' && (
                <>
                  {(() => {
                    const actionsWithEnvVars = agentData.actions?.filter(action => 
                      action.execute?.code?.envVars?.some(envVar => envVar.required)
                    ) || [];
                    
                    if (actionsWithEnvVars.length > 0) {
                      return (
                        <Button
                          onClick={() => setDeploymentStep('configure')}
                          className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Deploy Agent</span>
                        </Button>
                      );
                    } else {
                      return (
                        <Button
                          onClick={deploymentInfo?.deploymentUrl ? redeployAgent : deployAgent}
                          className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>
                            {deploymentInfo?.deploymentUrl ? 'Redeploy Agent' : 'Deploy Agent'}
                          </span>
                        </Button>
                      );
                    }
                  })()}
                </>
              )}
              
              {deploymentStep === 'configure' && (
                <div className="flex gap-2">
                  {/* Save Only Button - always available */}
                  <Button
                    onClick={async () => {
                      await saveEnvVarsToActions();
                      // Go back to confirm step after saving
                      setDeploymentStep('confirm');
                    }}
                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Only</span>
                  </Button>
                  
                  {/* Deploy Button - only if required vars are filled */}
                  <Button
                    onClick={async () => {
                      // First save environment variables to actions
                      await saveEnvVarsToActions();
                      // Then deploy with the updated agent data
                      if (deploymentInfo?.deploymentUrl) {
                        await redeployAgent();
                      } else {
                        await deployAgent();
                      }
                    }}
                    disabled={!areAllEnvVarsFilled()}
                    className={cn(
                      "flex-1 h-10 font-medium transition-colors flex items-center justify-center gap-2",
                      areAllEnvVarsFilled()
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>
                      {deploymentInfo?.deploymentUrl ? 'Redeploy' : 'Deploy'}
                    </span>
                  </Button>
                </div>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Explanation Modals */}
      {/* Models Explanation Modal */}
      <Dialog open={safeMetadata.showExplanationModal === 'models'} onOpenChange={closeExplanationModal}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-blue-500/20 backdrop-blur-xl">
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
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-purple-500/20 backdrop-blur-xl">
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
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-orange-500/20 backdrop-blur-xl">
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
    </>
  );
});

export const agentArtifact = new Artifact<'agent', AgentArtifactMetadata>({
  kind: 'agent',
  description: 'AI Agent Builder for creating database-driven automation systems',
  
  initialize: ({ setMetadata }) => {
    setMetadata({
      selectedTab: 'onboard',
      selectedBrainTab: 'overview',
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