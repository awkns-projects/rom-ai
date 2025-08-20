import * as React from 'react';
import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MobileAppDemo, themes } from '@/artifacts/agent/components/MobileAppDemo';
// Import the avatar creator component
import AvatarCreator from '../avatar-creator/avatar-creator';

interface AgentCreatorProps {
  onComplete?: (agentData: any) => void;
  initialAgentData?: any;
  documentId?: string;
}

// Simple wrapper to set the correct tab for the demo
const DemoWithTab = memo(({ agentData, currentTheme, viewMode, targetTab, onDataChange }: {
  agentData: any;
  currentTheme: string;
  viewMode: string;
  targetTab: number;
  onDataChange?: (agentData: any) => void;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Force re-render when targetTab changes to reset the component state
  useEffect(() => {
    setKey(prev => prev + 1);
    setHasInitialized(false);
  }, [targetTab]);

  // Set the correct tab after component mounts - but only once and more safely
  useEffect(() => {
    if (hasInitialized) return;
    
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // Look for tab buttons ONLY within the MobileAppDemo component
        // Use a more specific selector to avoid affecting main app tabs
        let demoContainer = containerRef.current.querySelector('[data-mobile-demo]');
        
        // Fallback: if no data-mobile-demo found, look for the demo container by class patterns
        if (!demoContainer) {
          demoContainer = containerRef.current.querySelector('.relative.bg-gradient-to-br, .bg-gradient-to-br');
        }
        
        if (!demoContainer) return;
        
        const tabButtons = demoContainer.querySelectorAll('button[role="tab"], button[data-tab]');
        if (tabButtons.length === 0) {
          // Fallback: look for buttons that look like tabs within the demo
          const allButtons = demoContainer.querySelectorAll('button');
          const tabLikeButtons = Array.from(allButtons).filter(button => {
            const text = button.textContent?.toLowerCase() || '';
            return text.includes('dashboard') || text.includes('models') || 
                   text.includes('schedules') || text.includes('chat');
          });
          
          if (tabLikeButtons.length > targetTab) {
            (tabLikeButtons[targetTab] as HTMLButtonElement).click();
            setHasInitialized(true);
          }
        } else {
          // Use the role-based tab buttons
          if (tabButtons.length > targetTab) {
            (tabButtons[targetTab] as HTMLButtonElement).click();
            setHasInitialized(true);
          }
        }
      }
    }, 300); // Slightly longer delay to ensure demo is fully rendered

    return () => clearTimeout(timer);
  }, [targetTab, key, hasInitialized]);

  return (
    <div ref={containerRef} key={`${key}-${targetTab}`}>
      <MobileAppDemo
        agentData={agentData}
        currentTheme={currentTheme as any}
        viewMode={viewMode as any}
        onDataChange={onDataChange}
      />
    </div>
  );
});

export const AgentCreator = memo(({ onComplete, initialAgentData, documentId }: AgentCreatorProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [agentData, setAgentData] = useState(() => {
    return initialAgentData || {
      id: documentId || `agent-${Date.now()}`,
      name: '',
      description: '',
      domain: '',
      theme: 'green',
      avatar: null,
      models: [],
      actions: [],
      schedules: [],
      externalApis: []
    };
  });

  // Get the current theme from agent data or default to green
  const currentAgentTheme = agentData?.theme || 'green';
  const currentTheme = themes[currentAgentTheme as keyof typeof themes] || themes.green;

  // Update agent data handler
  const handleDataChange = useCallback((updatedData: any) => {
    setAgentData((prevData: any) => {
      const newData = { ...prevData, ...updatedData };
      return newData;
    });
  }, []);

  // Sample data for each step
  const getSampleDataForStep = (stepId: 'setup' | 'models' | 'actions' | 'schedules' | 'complete') => {
    const baseData = {
      ...agentData,
      name: agentData.name || 'My AI Agent',
      description: agentData.description || 'An intelligent assistant for my business',
      domain: agentData.domain || 'Business',
      theme: currentAgentTheme,
    };

    switch (stepId) {
      case 'models':
        return {
          ...baseData,
          models: [
            {
              id: 'customer-model',
              name: 'Customer',
              emoji: '👤',
              hasPublishedField: true,
              idField: 'id',
              displayFields: ['name', 'email'],
              fields: [
                { id: '1', name: 'id', type: 'String', description: 'Unique identifier', isId: true, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'ID', sort: true, order: 1 },
                { id: '2', name: 'email', type: 'String', description: 'Customer email', isId: false, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'Email', sort: true, order: 2 },
                { id: '3', name: 'name', type: 'String', description: 'Full name', isId: false, unique: false, list: false, required: true, kind: 'scalar', relationField: false, title: 'Name', sort: true, order: 3 }
              ],
              enums: [],
              records: [
                { id: '1', modelId: 'customer-model', data: { id: '1', email: 'john@example.com', name: 'John Doe' }, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' }
              ]
            }
          ]
        };

      case 'actions':
        return {
          ...baseData,
          models: agentData.models?.length ? agentData.models : [
            {
              id: 'customer-model',
              name: 'Customer',
              emoji: '👤',
              idField: 'id',
              displayFields: ['name', 'email'],
              fields: [
                { id: '1', name: 'id', type: 'String', description: 'Unique identifier', isId: true, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'ID', sort: true, order: 1 },
                { id: '2', name: 'email', type: 'String', description: 'Customer email', isId: false, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'Email', sort: true, order: 2 }
              ],
              enums: [],
              records: []
            }
          ],
          actions: [
            {
              id: 'send-email-action',
              name: 'Send Welcome Email',
              description: 'Send automated welcome email to new customers',
              results: { actionType: 'Email Automation', status: 'Ready', lastRun: 'Never', successRate: 'New' }
            }
          ]
        };

      case 'schedules':
        return {
          ...baseData,
          models: agentData.models?.length ? agentData.models : [
            {
              id: 'customer-model',
              name: 'Customer',
              emoji: '👤',
              idField: 'id',
              displayFields: ['name', 'email'],
              fields: [
                { id: '1', name: 'id', type: 'String', description: 'Unique identifier', isId: true, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'ID', sort: true, order: 1 }
              ],
              enums: [],
              records: []
            }
          ],
          actions: agentData.actions?.length ? agentData.actions : [
            {
              id: 'send-email-action',
              name: 'Send Welcome Email',
              results: { actionType: 'Email Automation' }
            }
          ],
          schedules: [
            {
              id: 'daily-check-schedule',
              name: 'Daily Customer Check',
              description: 'Check for new customers and send welcome emails',
              interval: { pattern: '0 9 * * *', active: true },
              nextRun: '2024-01-21T09:00:00Z',
              lastRun: 'Never',
              status: 'Ready'
            }
          ]
        };

      case 'complete':
        return baseData;

      default:
        return baseData;
    }
  };

  const steps = [
    {
      id: 'setup' as const,
      title: 'Create Your AI Avatar',
      description: 'Design a personalized avatar and choose the visual theme for your AI agent. This will be how your agent appears when interacting with users.',
      icon: '🎨',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Continue to Models',
      demoTab: 0,
      component: 'avatar'
    },
    {
      id: 'models' as const,
      title: 'Your Data & Information',
      description: 'Set up what information your AI assistant knows about - like customer details, products, or any data that matters to your business.',
      icon: '📊',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Continue to Actions',
      demoTab: 1,
      component: 'demo'
    },
    {
      id: 'actions' as const,
      title: 'Smart Actions & Helpers',
      description: 'Create helpful automations that do things for you automatically - like sending emails, updating information, or connecting with your favorite apps.',
      icon: '⚡',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Continue to Schedules',
      demoTab: 0,
      component: 'demo'
    },
    {
      id: 'schedules' as const,
      title: 'Timing & Reminders',
      description: 'Set up when things should happen automatically - like sending weekly reports, daily check-ins, or reminders.',
      icon: '⏰',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Complete Setup',
      demoTab: 2,
      component: 'demo'
    }
  ];

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete the setup
      if (onComplete) {
        onComplete(agentData);
      }
    }
  }, [currentStep, steps.length, onComplete, agentData]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStep(Math.max(0, Math.min(index, steps.length - 1)));
  }, [steps.length]);

  const currentStepData = steps[currentStep];

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className={`text-2xl sm:text-3xl font-bold ${currentTheme.light} font-mono`}>
            Create Your AI Agent
          </h2>
          <p className={`${currentTheme.dim} font-mono text-sm mt-2`}>
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => goToStep(index)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 font-mono text-sm
                  ${index === currentStep 
                    ? `bg-${currentTheme.primary}-500 text-white shadow-lg` 
                    : index < currentStep
                    ? `bg-${currentTheme.primary}-500/80 text-white`
                    : `bg-gray-700 text-gray-400 hover:bg-gray-600`
                  }
                `}
              >
                {index < currentStep ? '✓' : index + 1}
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${index < currentStep ? `bg-${currentTheme.primary}-500` : 'bg-gray-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentStepData.gradient} border ${currentStepData.border} backdrop-blur-sm`}>
        <div className="relative p-6">
          {/* Step Content */}
          {currentStepData.component === 'avatar' ? (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${currentTheme.bg} flex items-center justify-center border ${currentTheme.borderActive}`}>
                  <span className="text-3xl">{currentStepData.icon}</span>
                </div>
                <div className="space-y-3">
                  <h3 className={`text-2xl font-bold font-mono ${currentTheme.light}`}>
                    {currentStepData.title}
                  </h3>
                  <p className={`font-mono text-sm leading-relaxed ${currentTheme.dim} max-w-2xl mx-auto`}>
                    {currentStepData.description}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="w-full max-w-4xl">
                  <AvatarCreator 
                    documentId={documentId} 
                    externalApisMetadata={agentData?.externalApis || []}
                    agentData={agentData}
                    onAvatarChange={(avatarData: any) => {
                      handleDataChange({ avatar: avatarData });
                    }}
                    onThemeChange={(theme: string) => {
                      handleDataChange({ theme: theme });
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Column - Text Content */}
              <div className="space-y-6">
                <div className="text-center lg:text-left space-y-4">
                  <div className={`w-16 h-16 mx-auto lg:mx-0 rounded-2xl ${currentTheme.bg} flex items-center justify-center border ${currentTheme.borderActive}`}>
                    <span className="text-3xl">{currentStepData.icon}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className={`text-2xl font-bold font-mono ${currentTheme.light}`}>
                      {currentStepData.title}
                    </h3>
                    <p className={`font-mono text-sm leading-relaxed ${currentTheme.dim}`}>
                      {currentStepData.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Interactive Demo */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <div className="text-center mb-4">
                    <h4 className={`font-mono text-sm font-semibold mb-2 ${currentTheme.light}`}>
                      Interactive Preview
                    </h4>
                    <p className={`font-mono text-xs ${currentTheme.dim}`}>
                      See how your agent will look
                    </p>
                  </div>
                  
                  <DemoWithTab
                    agentData={getSampleDataForStep(currentStepData.id)}
                    currentTheme={currentAgentTheme}
                    viewMode="mobile"
                    targetTab={currentStepData.demoTab}
                    onDataChange={handleDataChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
              className={`px-6 py-3 font-mono text-sm ${currentTheme.bg} ${currentTheme.border} ${currentTheme.accent} hover:${currentTheme.light} disabled:opacity-50`}
            >
              ← Previous
            </Button>

            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentStep 
                      ? `bg-${currentTheme.primary}-400 scale-125` 
                      : `bg-${currentTheme.primary}-400/30`
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              className={`px-6 py-3 font-mono text-sm font-semibold transition-all duration-200 ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.light} border ${currentTheme.borderActive} backdrop-blur-sm`}
            >
              {currentStep === steps.length - 1 ? 'Complete Setup →' : currentStepData.buttonText + ' →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}); 