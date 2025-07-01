import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepProgressIndicator } from './progress/StepProgressIndicator';
import { ModelDataViewer } from './editors/ModelDataViewer';
import { RecordEditor } from './editors/RecordEditor';
import type { AgentData, AgentArtifactMetadata, AgentModel, AgentEnum } from '../types';
import type { AgentAction } from '../types/action';
import type { AgentSchedule } from '../types/schedule';
import type { UseChatHelpers } from '@ai-sdk/react';
import { cn } from '@/lib/utils';

import { useState, useCallback, useEffect, memo, useMemo } from 'react';

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
import { useArtifact } from '@/hooks/use-artifact';
import { generateNewId, calculateProgressPercentage, getStepStatus } from '../utils';
import { ModelsListEditor } from './lists/ModelsListEditor';
import { ActionsListEditor } from './lists/ActionsListEditor';
import { SchedulesListEditor } from './lists/SchedulesListEditor';
import { OnboardContent } from './OnboardContent';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';


interface ModelRecord {
  id: string;
  modelId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface AgentBuilderContentProps {
  agentData: AgentData;
  metadata: AgentArtifactMetadata;
  onUpdate: (data: AgentData) => void;
  onMetadataUpdate: (metadata: AgentArtifactMetadata) => void;
  currentStep?: string;
  stepProgress?: Record<string, 'processing' | 'complete'>;
  stepMessages?: Record<string, string>;
  models: AgentModel[];
  enums: AgentEnum[];
  records: ModelRecord[];
  onRecordCreate: (modelId: string, data: Record<string, any>) => void;
  onRecordUpdate: (recordId: string, data: Record<string, any>) => void;
  onRecordDelete: (recordId: string) => void;
}

export const AgentBuilderContent = memo(({
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
  const { artifact } = useArtifact();
  const documentId = artifact?.documentId; // Get documentId from artifact
  const router = useRouter();
  const params = useParams();
  
  // Get chatId from router query parameters
  const chatId = params.id as string;
  
  // Initialize metadata with defaults if null
  const safeMetadata: AgentArtifactMetadata = metadata || {
    selectedTab: 'onboard',
    editingModel: null,
    editingAction: null,
    editingSchedule: null,
    viewingModelData: null,
    editingRecord: null,
    dataManagement: null,
    showExplanationModal: null
  };

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);

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

  const [agentData, setAgentData] = useState<AgentData>(() => {
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
          actions: [],
          schedules: [],
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
          actions,
          schedules,
          createdAt: parsed.createdAt || new Date().toISOString(),
          metadata: parsed.metadata // Keep metadata if it exists (from orchestrator)
        };

        console.log('📥 Initialized agent data from content:', {
          id: initialData.id,
          name: initialData.name,
          modelCount: initialData.models.length,
          actionCount: initialData.actions.length,
          hasMetadata: !!initialData.metadata
        });

        return initialData;
      } else {
        console.warn('⚠️ Parsed content is not an object, using defaults');
        return {
          name: 'New Agent',
          description: '',
          domain: '',
          models: [],
          actions: [],
          schedules: [],
          createdAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse initial content, using defaults. Error:', (e as Error).message);
      console.warn('📄 Problematic content (first 200 chars):', content ? content.substring(0, 200) : 'none');
      return {
        name: 'New Agent',
        description: '',
        domain: '',
        models: [],
        actions: [],
        schedules: [],
        createdAt: new Date().toISOString()
      };
    }
  });

  // Update metadata safely - moved before other callbacks to maintain hook order
  const updateMetadata = useCallback((updates: Partial<AgentArtifactMetadata>) => {
    if (setMetadata) {
      setMetadata({ ...safeMetadata, ...updates });
    }
  }, [safeMetadata, setMetadata]);

  // Update content when agent data changes - moved to maintain hook order
  const updateAgentData = useCallback((newData: AgentData) => {
    console.log('🔄 updateAgentData called with:', {
      currentModels: agentData.models?.length || 0,
      currentActions: agentData.actions?.length || 0,
      currentSchedules: agentData.schedules?.length || 0,
      newModels: newData.models?.length || 0,
      newActions: newData.actions?.length || 0,
      newSchedules: newData.schedules?.length || 0,
      currentModelNames: (agentData.models || []).map((m: AgentModel) => m.name),
      newModelNames: (newData.models || []).map((m: AgentModel) => m.name),
      currentActionNames: (agentData.actions || []).map((a: AgentAction) => a.name),
      newActionNames: (newData.actions || []).map((a: AgentAction) => a.name),
      currentScheduleNames: (agentData.schedules || []).map((s: AgentSchedule) => s.name),
      newScheduleNames: (newData.schedules || []).map((s: AgentSchedule) => s.name)
    });
    
    setAgentData(newData);
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    // Removed auto-save - only save when user explicitly clicks "Save Agent"
    // const serializedData = JSON.stringify(newData, null, 2);
    // onSaveContent(serializedData, true);
  }, [agentData.models, agentData.actions, agentData.schedules]);

  // Enhanced save function - moved to maintain consistent hook order
  const saveAgentToConversation = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save the current agent data using the standard document saving mechanism
      const agentContent = JSON.stringify(agentData, null, 2);
      onSaveContent(agentContent, false);
      
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      console.log('✅ Agent data saved through standard document mechanism');
      
      // Show deployment modal after successful save
      setShowDeploymentModal(true);
    } catch (error) {
      console.error('❌ Failed to save agent data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [agentData, onSaveContent]);

  // Monitor content changes from external sources (like when opening from chat or refreshing page)
  useEffect(() => {
    // Skip if content is explicitly empty or just whitespace
    if (!content || content.trim() === '') {
      return;
    }

    try {
      const parsed = JSON.parse(content);
      
      // Check if this is meaningful agent data (not just empty default structure)
      const hasRealData = (parsed.name && parsed.name !== 'New Agent' && parsed.name.trim() !== '') ||
                         (parsed.description && parsed.description.trim() !== '') ||
                         (parsed.domain && parsed.domain.trim() !== '') ||
                         (parsed.models && parsed.models.length > 0) ||
                         (parsed.actions && parsed.actions.length > 0) ||
                         (parsed.schedules && parsed.schedules.length > 0);

      // Only update if we have real data
      if (hasRealData) {
        const updatedData = {
          id: parsed.id, // Keep id if it exists (from orchestrator)
          name: parsed.name || 'New Agent',
          description: parsed.description || '',
          domain: parsed.domain || '',
          models: Array.isArray(parsed.models) ? parsed.models : [],
          actions: Array.isArray(parsed.actions) ? parsed.actions : [],
          schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
          createdAt: parsed.createdAt || new Date().toISOString(),
          metadata: parsed.metadata // Keep metadata if it exists (from orchestrator)
        };
        
        // Only update if data has actually changed
        const currentDataString = JSON.stringify({
          name: agentData.name,
          description: agentData.description,
          domain: agentData.domain,
          models: agentData.models,
          actions: agentData.actions,
          schedules: agentData.schedules
        });
        const newDataString = JSON.stringify(updatedData);
        
        if (currentDataString !== newDataString) {
          setAgentData(updatedData);
        }
      }
    } catch (e) {
      console.warn('Failed to parse updated content:', e);
    }
  }, [content]); // Remove updateMetadata and agentData from dependencies to prevent loops


  if (isLoading) {
    return <DocumentSkeleton artifactKind="agent" />;
  }

  if (mode === 'diff') {
    const oldContent = getDocumentContentById(currentVersionIndex - 1);
    const newContent = getDocumentContentById(currentVersionIndex);
    return <DiffView oldContent={oldContent} newContent={newContent} />;
  }

  const addModel = () => {
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
  };

  const addSchedule = () => {
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
  };

  const addAction = () => {
    const newAction: AgentAction = {
      id: generateNewId('action', agentData.actions || []),
      name: `Action${(agentData.actions?.length || 0) + 1}`,
      emoji: '⚡', // Default emoji, will be auto-generated by AI
      description: '',
      type: 'Create',
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
  };

  // Tab configuration
  const tabs = [
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
  ];

  // Debug logging for tab counts
  console.log('📊 Tab counts:', {
    models: agentData.models?.length || 0,
    actions: agentData.actions?.length || 0,
    schedules: agentData.schedules?.length || 0,
    modelNames: (agentData.models || []).map((m: AgentModel) => m.name),
    actionNames: (agentData.actions || []).map((a: AgentAction) => a.name),
    scheduleNames: (agentData.schedules || []).map((s: AgentSchedule) => s.name)
  });

  // Add explanation modal handlers
  const openExplanationModal = useCallback((type: 'models' | 'actions' | 'schedules') => {
    setMetadata({ ...safeMetadata, showExplanationModal: type });
  }, [safeMetadata]);

  const closeExplanationModal = useCallback(() => {
    setMetadata({ ...safeMetadata, showExplanationModal: null });
  }, [safeMetadata]);

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
              
              {/* Save Button */}
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
            </div>
          </div>
          
          {/* Enhanced Progress Indicator - Only show when AI is actually running */}
          {status === 'streaming' && (
            <div className="mt-3 sm:mt-6 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-black/50 border border-green-500/20 backdrop-blur-sm shadow-lg shadow-green-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="text-xs sm:text-sm font-medium text-green-200 font-mono">Build Progress</div>
                  <div className="px-2 py-0.5 sm:py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium font-mono border border-green-500/30 self-start">
                    {agentData?.name || 'AI Agent System'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{Math.round(calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData))}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-1.5 sm:h-2 bg-green-500/10 rounded-full overflow-hidden border border-green-500/20">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-green-500/30"
                  style={{ width: `${calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData)}%` }}
                />
                {/* Animated shimmer effect for active progress */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              
              {/* Progress Steps */}
               <div className="flex justify-center mt-2 sm:mt-4 text-xs font-mono">
                {(() => {
                  const steps = [
                    { id: 'prompt-understanding', label: 'Analysis' },
                    { id: 'overview', label: 'Overview' },
                    { id: 'models', label: 'Models' },
                    { id: 'actions', label: 'Actions' },
                    { id: 'schedules', label: 'Schedules' },
                    { id: 'complete', label: 'Complete' }
                  ];
                  
                  // Use the enhanced step status function to properly handle API sync
                  const getEnhancedStepStatus = (stepId: string) => {
                    // Map orchestrator step IDs to UI step IDs
                    const stepIdMapping: Record<string, string> = {
                      'step0': 'prompt-understanding',
                      'step1': 'analysis',
                      'step2': 'overview',
                      'step3': 'models',
                      'step4': 'actions',
                      'step5': 'schedules',
                      'complete': 'complete'
                    };
                    
                    // Check both the UI step ID and orchestrator step ID
                    const orchestratorStepId = Object.keys(stepIdMapping).find(key => stepIdMapping[key] === stepId) || stepId;
                    const uiStepId = stepIdMapping[stepId] || stepId;
                    
                    // Check stepProgress for both IDs
                    if (safeMetadata.stepProgress) {
                      if (safeMetadata.stepProgress[stepId as keyof typeof safeMetadata.stepProgress]) {
                        return safeMetadata.stepProgress[stepId as keyof typeof safeMetadata.stepProgress];
                      }
                      if (orchestratorStepId && safeMetadata.stepProgress[orchestratorStepId as keyof typeof safeMetadata.stepProgress]) {
                        return safeMetadata.stepProgress[orchestratorStepId as keyof typeof safeMetadata.stepProgress];
                      }
                      if (uiStepId && safeMetadata.stepProgress[uiStepId as keyof typeof safeMetadata.stepProgress]) {
                        return safeMetadata.stepProgress[uiStepId as keyof typeof safeMetadata.stepProgress];
                      }
                    }
                    
                    // Check if this is the current step
                    if (safeMetadata.currentStep === stepId || safeMetadata.currentStep === orchestratorStepId || safeMetadata.currentStep === uiStepId) {
                      return 'processing';
                    }
                    
                    // Use the existing getStepStatus function as fallback
                    return getStepStatus(stepId, safeMetadata.currentStep, safeMetadata.stepProgress);
                  };
                  
                  // Find the current step
                  const currentStep = steps.find(step => {
                    const stepStatus = getEnhancedStepStatus(step.id);
                    return stepStatus === 'processing';
                  }) || steps.find(step => step.id === 'complete') || steps[0]; // Fallback to first step
                  
                  // Don't return null, instead handle gracefully
                  const stepStatus = getEnhancedStepStatus(currentStep.id);
                  const isComplete = stepStatus === 'complete';
                  const isProcessing = stepStatus === 'processing';
                  
                  return (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isComplete 
                          ? 'bg-green-400 shadow-lg shadow-green-500/50 animate-matrix-glow' 
                          : isProcessing 
                          ? 'bg-yellow-400 shadow-lg shadow-yellow-500/50 animate-pulse'
                          : 'bg-green-500/20 border border-green-500/30'
                      }`} />
                      <span className={`font-medium transition-colors duration-300 ${
                        isComplete 
                          ? 'text-green-400' 
                          : isProcessing 
                          ? 'text-yellow-400'
                          : 'text-green-500/50'
                      }`}>
                        {currentStep.label}
                      </span>
                    </div>
                  );
                })()}
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
                      allModels={agentData.models || []}
                      documentId={documentId}
                    />
                  </div>
                );
              }
              
              console.log('❓ No matching tab or condition');
              // Don't return null after hooks have been called - provide fallback UI instead
              return (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-gray-500/10 border border-gray-500/20 backdrop-blur-sm text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center border border-gray-500/30">
                        <span className="text-lg">🤖</span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-200 font-mono">Agent Builder</h2>
                    </div>
                    <p className="text-gray-400 text-sm font-mono">
                      Welcome to the AI Agent Builder. Select a tab above to begin building your agent.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      
      {/* Deployment Modal */}
      <Dialog open={showDeploymentModal} onOpenChange={setShowDeploymentModal}>
        <DialogContent className="sm:max-w-[425px] bg-black/95 border-green-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-green-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
                <span className="text-black text-lg">🚀</span>
              </div>
              Agent Saved Successfully!
            </DialogTitle>
            <DialogDescription className="text-green-400 font-mono">
              Your agent "<span className="text-green-200 font-semibold">{agentData.name}</span>" has been saved. 
              Would you like to proceed to the deployment page to make it live?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 mt-6">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                <span className="text-green-200 font-medium font-mono">What happens next?</span>
              </div>
              <ul className="text-sm text-green-400 font-mono space-y-1 ml-4">
                <li>• Configure deployment environment</li>
                <li>• Set up database connections</li>
                <li>• Deploy agent to production</li>
                <li>• Monitor and manage your agent</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeploymentModal(false)}
              className="btn-matrix border-green-500/30 hover:border-green-500/50 text-white hover:text-green-200 bg-transparent hover:bg-green-500/10"
            >
              <span className="font-mono">Maybe Later</span>
            </Button>
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
                <span className="font-mono">Deploy Agent</span>
                <span>🚀</span>
              </div>
            </Button>
          </DialogFooter>
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
                Data models define the structure of information in your agent. Think of them as blueprints for database tables that specify what fields exist, their types, and how they relate to each other.
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