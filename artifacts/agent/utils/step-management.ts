// Helper function to determine step status consistently across all progress indicators
export const getStepStatus = (stepId: string, currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>, agentData?: any) => {
  // If we have explicit step progress for this step, use it
  if (stepProgress?.[stepId as keyof typeof stepProgress]) {
    return stepProgress[stepId as keyof typeof stepProgress];
  }

  // If this is the current step, it's processing
  if (currentStep === stepId) {
    return 'processing';
  }

  // For schedules, check if they exist
  if (stepId === 'schedules') {
    return agentData?.schedules && agentData.schedules?.length > 0 ? 'complete' : 'pending';
  }
  
  // For models, check if they exist 
  if (stepId === 'models') {
    return agentData?.models && agentData.models?.length > 0 ? 'complete' : 'pending';
  }
  
  // For examples, check if they exist (only for new models)
  if (stepId === 'examples') {
    return agentData?.models?.some((model: any) => model.records && model.records.length > 0) ? 'complete' : 'pending';
  }
  
  // For actions, check if they exist
  if (stepId === 'actions') {
    return agentData?.actions && agentData.actions?.length > 0 ? 'complete' : 'pending';
  }
  
  // For overview, check if basic info exists
  if (stepId === 'overview') {
    return agentData?.name && agentData?.description && agentData?.domain ? 'complete' : 'pending';
  }
  
  // For complete step, check if all components are complete
  if (stepId === 'complete') {
    const hasBasicInfo = agentData?.name && agentData?.description && agentData?.domain;
    const hasModels = agentData?.models && agentData.models?.length > 0;
    const hasActions = agentData?.actions && agentData.actions?.length > 0;
    return hasBasicInfo && hasModels && hasActions ? 'complete' : 'pending';
  }
  
  // For early analysis steps, we rely on stepProgress or currentStep
  return 'pending';
};

// Helper function to calculate progress percentage consistently
export const calculateProgressPercentage = (currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>, agentData?: any) => {
  // Map orchestrator step IDs to UI step IDs
  const stepIdMapping: Record<string, string> = {
    'step0': 'prompt-understanding',
    'step1': 'analysis',
    'step2': 'overview',
    'step3': 'models',
    'step4': 'actions',
    'step5': 'schedules',
    'complete': 'complete', // Direct mapping for complete step
    'error': 'complete' // Map errors to complete step as well
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
    { id: 'prompt-understanding', name: 'Understanding Requirements' },
    { id: 'analysis', name: 'Analysis' },
    { id: 'overview', name: 'Overview' },
    { id: 'models', name: 'Data Models' },
    { id: 'actions', name: 'Automated Actions' },
    { id: 'schedules', name: 'Schedules' },
    { id: 'complete', name: 'Complete' }
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
  
  const completedSteps = steps.filter(step => getEnhancedStepStatus(step.id) === 'complete').length;
  
  return (completedSteps / steps.length) * 100;
}; 