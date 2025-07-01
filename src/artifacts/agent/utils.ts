// Helper function to generate new IDs
export function generateNewId(type: string, existingEntities: any[]): string {
  const prefixMap: Record<string, string> = {
    'model': 'mdl',
    'field': 'fld',
    'enum': 'enm',
    'enumField': 'enf',
    'action': 'act',
    'form': 'frm',
    'formField': 'ff',
    'record': 'rec'
  };
  
  const prefix = prefixMap[type] || type.charAt(0);
  
  const highestId = existingEntities.reduce((max, entity) => {
    if (entity.id?.startsWith(prefix)) {
      const idNumber = Number.parseInt(entity.id.slice(prefix.length), 10);
      return Number.isNaN(idNumber) ? max : Math.max(max, idNumber);
    }
    return max;
  }, 0);
  
  return `${prefix}${highestId + 1}`;
}

// Export getStepStatus function separately for use in components
export const getStepStatus = (stepId: string, currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>) => {
  // Map orchestrator step IDs to UI step IDs
  const stepIdMapping: Record<string, string> = {
    'step0': 'prompt-understanding',
    'step1': 'analysis',
    'step2': 'overview',
    'step3': 'models',
    'step4': 'actions',
    'step5': 'schedules',
    'complete': 'complete',
    'error': 'complete'
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

// Helper function to calculate progress percentage consistently
export const calculateProgressPercentage = (currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>, agentData?: any) => {
  const steps = [
    { id: 'prompt-understanding', name: 'Understanding Requirements' },
    { id: 'analysis', name: 'Analysis' },
    { id: 'overview', name: 'Overview' },
    { id: 'models', name: 'Data Models' },
    { id: 'actions', name: 'Automated Actions' },
    { id: 'schedules', name: 'Schedules' },
    { id: 'complete', name: 'Complete' }
  ];
  
  const completedSteps = steps.filter(step => getStepStatus(step.id, currentStep, stepProgress) === 'complete').length;
  
  return (completedSteps / steps.length) * 100;
};

export const FIELD_TYPES = [
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'Json',
  'Bytes'
];

export const FIELD_KINDS = [
  { value: 'scalar', label: 'Scalar' },
  { value: 'object', label: 'Object' },
  { value: 'enum', label: 'Enum' }
]; 