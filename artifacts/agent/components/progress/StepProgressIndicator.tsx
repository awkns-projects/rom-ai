import * as React from 'react';
import { calculateProgressPercentage } from '../../utils';

interface StepProgressIndicatorProps {
  currentStep?: string;
  agentData: any;
  stepMessages?: Record<string, string>;
  stepProgress?: {
    'prompt-understanding'?: 'processing' | 'complete';
    'granular-analysis'?: 'processing' | 'complete';
    analysis?: 'processing' | 'complete';
    'change-analysis'?: 'processing' | 'complete';
    overview?: 'processing' | 'complete';
    models?: 'processing' | 'complete';
    actions?: 'processing' | 'complete';
    schedules?: 'processing' | 'complete';
    complete?: 'processing' | 'complete';
  };
}

// Progress Indicator Component
export const StepProgressIndicator = ({ 
  currentStep = '', 
  agentData, 
  stepMessages = {}, 
  stepProgress 
}: StepProgressIndicatorProps) => {
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

  // Reverse mapping for getting orchestrator step from UI step
  const reverseStepMapping: Record<string, string> = {
    'prompt-understanding': 'step0',
    'analysis': 'step1',
    'overview': 'step2',
    'models': 'step3',
    'actions': 'step4',
    'schedules': 'step5',
    'complete': 'complete'
  };

  const steps = [
    { 
      id: 'prompt-understanding', 
      title: 'Understanding Requirements', 
      description: 'Analyzing your business requirements and goals',
      icon: '🎯' 
    },
    { 
      id: 'analysis', 
      title: 'Analysis', 
      description: 'Breaking down the requirements into actionable components',
      icon: '🔍' 
    },
    { 
      id: 'overview', 
      title: 'Overview', 
      description: 'Creating a high-level system architecture',
      icon: '📋' 
    },
    { 
      id: 'models', 
      title: 'Data Models', 
      description: 'Defining the data structures and relationships',
      icon: '🗃️' 
    },
    { 
      id: 'actions', 
      title: 'Automated Actions', 
      description: 'Creating automated workflows and business logic',
      icon: '⚡' 
    },
    { 
      id: 'schedules', 
      title: 'Schedules', 
      description: 'Setting up automated timing and recurring tasks',
      icon: '⏰' 
    },
    { 
      id: 'complete', 
      title: 'Complete', 
      description: 'Your agent is ready to deploy',
      icon: '✅' 
    }
  ];

  // Enhanced getStepStatus function that handles both naming conventions
  const getEnhancedStepStatus = (stepId: string) => {
    // Check both the UI step ID and orchestrator step ID
    const orchestratorStepId = reverseStepMapping[stepId] || stepId;
    const uiStepId = stepIdMapping[stepId] || stepId;
    
    // Check stepProgress for both IDs
    if (stepProgress) {
      if (stepProgress[stepId as keyof typeof stepProgress]) {
        return stepProgress[stepId as keyof typeof stepProgress];
      }
      if (orchestratorStepId && stepProgress[orchestratorStepId as keyof typeof stepProgress]) {
        return stepProgress[orchestratorStepId as keyof typeof stepProgress];
      }
      if (uiStepId && stepProgress[uiStepId as keyof typeof stepProgress]) {
        return stepProgress[uiStepId as keyof typeof stepProgress];
      }
    }
    
    // Check if this is the current step
    if (currentStep === stepId || currentStep === orchestratorStepId || currentStep === uiStepId) {
      return 'processing';
    }
    
    // Determine based on step order
    const stepOrder = steps.map(s => s.id);
    const currentStepIndex = currentStep ? stepOrder.findIndex(s => s === currentStep || 
      stepIdMapping[currentStep] === s || 
      reverseStepMapping[currentStep] === s) : -1;
    const thisStepIndex = stepOrder.indexOf(stepId);
    
    if (currentStepIndex >= 0 && thisStepIndex < currentStepIndex) {
      return 'complete';
    }
    if (currentStepIndex >= 0 && thisStepIndex > currentStepIndex) {
      return 'pending';
    }
    
    return 'pending';
  };

  const getEnhancedStepMessage = (stepId: string) => {
    // Check both the UI step ID and orchestrator step ID
    const orchestratorStepId = reverseStepMapping[stepId] || stepId;
    const uiStepId = stepIdMapping[stepId] || stepId;
    
    // Check stepMessages for both IDs
    if (stepMessages) {
      if (stepMessages[stepId]) {
        return stepMessages[stepId];
      }
      if (orchestratorStepId && stepMessages[orchestratorStepId]) {
        return stepMessages[orchestratorStepId];
      }
      if (uiStepId && stepMessages[uiStepId]) {
        return stepMessages[uiStepId];
      }
    }
    
    return null;
  };

  const progressPercentage = calculateProgressPercentage(currentStep, stepProgress, agentData);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-black/50 border border-green-500/20 rounded-xl backdrop-blur-sm">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-green-200 font-mono">Agent Creation Progress</h3>
          <span className="text-green-400 text-sm font-mono">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="w-full bg-green-900/30 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {steps.map((step, index) => {
          const status = getEnhancedStepStatus(step.id);
          const message = getEnhancedStepMessage(step.id);
          
          return (
            <div key={step.id} className="flex flex-col items-center text-center space-y-2">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-300
                ${status === 'complete' 
                  ? 'bg-green-500/20 border-2 border-green-500 text-green-400' 
                  : status === 'processing'
                  ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 animate-pulse'
                  : 'bg-gray-500/20 border-2 border-gray-600 text-gray-400'
                }
              `}>
                {status === 'complete' ? '✓' : 
                 status === 'processing' ? '⟳' : 
                 step.icon}
              </div>
              <div className="space-y-1">
                <h4 className={`text-xs font-medium font-mono leading-tight
                  ${status === 'complete' ? 'text-green-300' : 
                    status === 'processing' ? 'text-yellow-300' : 
                    'text-gray-400'}
                `}>
                  {step.title}
                </h4>
                {message && (
                  <p className="text-xs text-green-400/80 font-mono leading-tight">
                    {message.length > 40 ? `${message.substring(0, 40)}...` : message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 