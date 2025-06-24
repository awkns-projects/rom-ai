import * as React from 'react';
import { memo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepProgressIndicator } from './progress/StepProgressIndicator';
import { ModelsListEditor } from './lists/ModelsListEditor';
import { ActionsListEditor } from './lists/ActionsListEditor';
import { SchedulesListEditor } from './lists/SchedulesListEditor';
import { ModelDataViewer } from './editors/ModelDataViewer';
import type { AgentData, AgentArtifactMetadata } from '../types';

interface AgentBuilderContentProps {
  agentData: AgentData;
  metadata: AgentArtifactMetadata;
  onUpdate: (data: AgentData) => void;
  onMetadataUpdate: (metadata: AgentArtifactMetadata) => void;
  currentStep?: string;
  stepProgress?: Record<string, 'processing' | 'complete'>;
  stepMessages?: Record<string, string>;
}

export const AgentBuilderContent = memo(({
  agentData,
  metadata,
  onUpdate,
  onMetadataUpdate,
  currentStep,
  stepProgress,
  stepMessages
}: AgentBuilderContentProps) => {
  const handleTabChange = useCallback((value: string) => {
    if (value === 'models' || value === 'actions' || value === 'schedules') {
      onMetadataUpdate({
        ...metadata,
        selectedTab: value,
        dataManagement: null // Clear dataManagement when switching tabs
      });
    }
  }, [metadata, onMetadataUpdate]);

  const updateModels = useCallback((models: typeof agentData.models) => {
    onUpdate({
      ...agentData,
      models
    });
  }, [agentData, onUpdate]);

  const updateActions = useCallback((actions: typeof agentData.actions) => {
    onUpdate({
      ...agentData,
      actions
    });
  }, [agentData, onUpdate]);

  const updateSchedules = useCallback((schedules: typeof agentData.schedules) => {
    onUpdate({
      ...agentData,
      schedules
    });
  }, [agentData, onUpdate]);

  return (
    <div className="space-y-8">
      {/* Step Progress */}
      {currentStep && (
        <StepProgressIndicator
          currentStep={currentStep}
          agentData={agentData}
          stepMessages={stepMessages || {}}
          stepProgress={stepProgress || {}}
        />
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-8">
        {(() => {
          // Check if we should show ModelDataViewer
          const viewingModelId = metadata.dataManagement?.viewingModelId;
          if (viewingModelId) {
            const viewingModel = (agentData.models || []).find(m => m.id === viewingModelId);
            
            if (viewingModel) {
              return (
                <ModelDataViewer
                  key={viewingModel.id}
                  model={viewingModel}
                  allModels={agentData.models || []}
                  onUpdateModel={(updatedModel) => {
                    const updatedModels = (agentData.models || []).map(m => 
                      m.id === updatedModel.id ? updatedModel : m
                    );
                    onUpdate({ ...agentData, models: updatedModels });
                  }}
                  onBack={() => {
                    onMetadataUpdate({ ...metadata, dataManagement: null });
                  }}
                />
              );
            }
          }
          
          // Show tabbed content
          return (
            <Tabs 
              value={metadata.selectedTab} 
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="models" className="font-mono">
                  🗃️ Models ({agentData.models.length})
                </TabsTrigger>
                <TabsTrigger value="actions" className="font-mono">
                  ⚡ Actions ({agentData.actions.length})
                </TabsTrigger>
                <TabsTrigger value="schedules" className="font-mono">
                  ⏰ Schedules ({agentData.schedules.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="models" className="mt-8">
                <ModelsListEditor
                  models={agentData.models}
                  onModelsChange={updateModels}
                  updateMetadata={(updates) => {
                    onMetadataUpdate({
                      ...metadata,
                      ...updates
                    });
                  }}
                  status={'idle'}
                />
              </TabsContent>

              <TabsContent value="actions" className="mt-8">
                <ActionsListEditor
                  actions={agentData.actions}
                  onUpdate={updateActions}
                  allModels={agentData.models}
                />
              </TabsContent>

              <TabsContent value="schedules" className="mt-8">
                <SchedulesListEditor
                  schedules={agentData.schedules}
                  onUpdate={updateSchedules}
                  allModels={agentData.models}
                />
              </TabsContent>
            </Tabs>
          );
        })()}
      </div>
    </div>
  );
}); 