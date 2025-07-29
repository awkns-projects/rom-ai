import * as React from 'react';
import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MobileAppDemo, themes } from './MobileAppDemo';
// Import the avatar creator component
import AvatarCreator from '../../../avatar-creator/avatar-creator';

interface OnboardContentProps {
  onTabChange?: (tab: 'models' | 'actions' | 'schedules' | 'chat') => void;
  models?: any[]; // Array of models to determine default view
  agentData?: any; // Add agentData prop
  onThemeChange?: (theme: string) => void; // Add theme change callback
  onDataChange?: (agentData: any) => void; // Add data change callback
  documentId?: string; // Add documentId prop
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

export const OnboardContent = memo(({ onTabChange, models = [], agentData, onThemeChange, onDataChange, documentId }: OnboardContentProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  // Add state for onboard tab - changed default to true
  const [showOnboard, setShowOnboard] = useState(true);

  // Get the current theme from agent data or default to green
  const currentAgentTheme = agentData?.theme || 'green';
  const currentTheme = themes[currentAgentTheme as keyof typeof themes] || themes.green;

  // Sample data for each tutorial slide
  const getSampleDataForSlide = (slideId: 'models' | 'actions' | 'schedules' | 'chat') => {
    const baseData = {
      id: 'tutorial-agent-' + slideId,
      name: 'Tutorial Agent',
      description: 'Interactive tutorial demonstration agent',
      domain: 'E-commerce',
      theme: currentAgentTheme, // Use the actual agent theme
      createdAt: new Date().toISOString(),
      models: [] as any[],
      actions: [] as any[],
      schedules: [] as any[]
    };

    switch (slideId) {
      case 'models':
        return {
          ...baseData,
          theme: currentAgentTheme, // Use the actual agent theme
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
                { id: '3', name: 'name', type: 'String', description: 'Full name', isId: false, unique: false, list: false, required: true, kind: 'scalar', relationField: false, title: 'Name', sort: true, order: 3 },
                { id: '4', name: 'status', type: 'String', description: 'Customer status', isId: false, unique: false, list: false, required: false, kind: 'enum', relationField: false, title: 'Status', sort: true, order: 4 }
              ],
              enums: [],
              records: [
                { id: '1', modelId: 'customer-model', data: { id: '1', email: 'john@example.com', name: 'John Doe', status: 'active' }, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
                { id: '2', modelId: 'customer-model', data: { id: '2', email: 'jane@example.com', name: 'Jane Smith', status: 'pending' }, createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' },
                { id: '3', modelId: 'customer-model', data: { id: '3', email: 'bob@example.com', name: 'Bob Wilson', status: 'active' }, createdAt: '2024-01-17T10:00:00Z', updatedAt: '2024-01-17T10:00:00Z' }
              ]
            },
            {
              id: 'cart-model',
              name: 'Shopping Cart',
              emoji: '🛒',
              hasPublishedField: false,
              idField: 'id',
              displayFields: ['customer_email', 'total'],
              fields: [
                { id: '1', name: 'id', type: 'String', description: 'Unique identifier', isId: true, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'ID', sort: true, order: 1 },
                { id: '2', name: 'customer_email', type: 'String', description: 'Customer email', isId: false, unique: false, list: false, required: true, kind: 'scalar', relationField: false, title: 'Customer', sort: true, order: 2 },
                { id: '3', name: 'total', type: 'Float', description: 'Cart total', isId: false, unique: false, list: false, required: false, kind: 'scalar', relationField: false, title: 'Total', sort: true, order: 3 },
                { id: '4', name: 'abandoned_at', type: 'DateTime', description: 'When abandoned', isId: false, unique: false, list: false, required: false, kind: 'scalar', relationField: false, title: 'Abandoned At', sort: true, order: 4 }
              ],
              enums: [],
              records: [
                { id: '1', modelId: 'cart-model', data: { id: '1', customer_email: 'john@example.com', total: 299.99, abandoned_at: '2024-01-18T10:00:00Z' }, createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-18T10:00:00Z' },
                { id: '2', modelId: 'cart-model', data: { id: '2', customer_email: 'jane@example.com', total: 149.50, abandoned_at: '2024-01-19T10:00:00Z' }, createdAt: '2024-01-19T10:00:00Z', updatedAt: '2024-01-19T10:00:00Z' }
              ]
            }
          ]
        };

      case 'actions':
        return {
          ...baseData,
          theme: currentAgentTheme, // Use the actual agent theme
          models: [
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
              records: [
                { id: '1', modelId: 'customer-model', data: { id: '1', email: 'john@example.com', name: 'John Doe' }, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' }
              ]
            }
          ],
          actions: [
            {
              id: 'send-email-action',
              name: 'Send Recovery Email',
              description: 'Send automated cart recovery email to customers',
              results: { actionType: 'Email Automation', status: 'Active', lastRun: '2024-01-20T10:00:00Z', successRate: '94%' }
            },
            {
              id: 'update-customer-action',
              name: 'Update Customer Status',
              description: 'Automatically update customer engagement status',
              results: { actionType: 'Data Update', status: 'Ready', lastRun: '2024-01-20T09:30:00Z', successRate: '100%' }
            },
            {
              id: 'slack-notification-action',
              name: 'Slack Notification',
              description: 'Send alerts to team when high-value carts are abandoned',
              results: { actionType: 'Notification', status: 'Active', lastRun: '2024-01-20T11:15:00Z', successRate: '98%' }
            }
          ]
        };

      case 'schedules':
        return {
          ...baseData,
          theme: currentAgentTheme, // Use the actual agent theme
          models: [
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
          actions: [
            {
              id: 'send-email-action',
              name: 'Send Recovery Email',
              results: { actionType: 'Email Automation' }
            }
          ],
          schedules: [
            {
              id: 'daily-email-schedule',
              name: 'Daily Email Campaign',
              description: 'Send cart recovery emails every day at 10 AM',
              interval: { pattern: '0 10 * * *', active: true },
              nextRun: '2024-01-21T10:00:00Z',
              lastRun: '2024-01-20T10:00:00Z',
              status: 'Active'
            },
            {
              id: 'weekly-report-schedule',
              name: 'Weekly Analytics Report',
              description: 'Generate and send weekly performance reports',
              interval: { pattern: '0 9 * * 1', active: true },
              nextRun: '2024-01-22T09:00:00Z',
              lastRun: '2024-01-15T09:00:00Z',
              status: 'Active'
            },
            {
              id: 'hourly-check-schedule',
              name: 'Abandoned Cart Check',
              description: 'Check for new abandoned carts every hour',
              interval: { pattern: '0 * * * *', active: false },
              nextRun: null,
              lastRun: '2024-01-20T11:00:00Z',
              status: 'Paused'
            }
          ]
        };

      case 'chat':
        return {
          ...baseData,
          theme: currentAgentTheme, // Use the actual agent theme
          models: [
            {
              id: 'customer-model',
              name: 'Customer',
              emoji: '👤',
              idField: 'id',
              displayFields: ['name', 'email'],
              fields: [
                { id: '1', name: 'id', type: 'String', description: 'Unique identifier', isId: true, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'ID', sort: true, order: 1 },
                { id: '2', name: 'email', type: 'String', description: 'Customer email', isId: false, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'Email', sort: true, order: 2 },
                { id: '3', name: 'name', type: 'String', description: 'Full name', isId: false, unique: false, list: false, required: true, kind: 'scalar', relationField: false, title: 'Name', sort: true, order: 3 }
              ],
              enums: [],
              records: [
                { id: '1', modelId: 'customer-model', data: { id: '1', email: 'john@example.com', name: 'John Doe' }, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
                { id: '2', modelId: 'customer-model', data: { id: '2', email: 'jane@example.com', name: 'Jane Smith' }, createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' }
              ]
            }
          ],
          actions: [
            {
              id: 'send-email-action',
              name: 'Send Recovery Email',
              description: 'Send automated cart recovery email to customers',
              results: { actionType: 'Email Automation', status: 'Active', lastRun: '2024-01-20T10:00:00Z', successRate: '94%' }
            }
          ],
          schedules: [
            {
              id: 'daily-email-schedule',
              name: 'Daily Email Campaign',
              description: 'Send cart recovery emails every day at 10 AM',
              interval: { pattern: '0 10 * * *', active: true },
              nextRun: '2024-01-21T10:00:00Z',
              lastRun: '2024-01-20T10:00:00Z',
              status: 'Active'
            }
          ]
        };

      default:
        return baseData;
    }
  };

  const slides = [
    {
      id: 'models' as const,
      title: 'Your Data & Information',
      description: 'Set up what information your AI assistant knows about - like customer details, products, or any data that matters to your business. Think of it as organizing your digital filing cabinet.',
      icon: '📊',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Organize My Data',
      demoTab: 1, // Models tab
      features: [
        'Information Setup - Tell your AI what customer info, products, or business data to track',
        'Smart Organization - Store and find your important business information easily',
        'Connect the Dots - Link related information together (like customers to their orders)'
      ]
    },
    {
      id: 'actions' as const,
      title: 'Smart Actions & Helpers',
      description: 'Create helpful automations that do things for you automatically - like sending emails, updating information, or connecting with your favorite apps and tools.',
      icon: '⚡',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Add Smart Actions',
      demoTab: 0, // Dashboard tab to show actions in use
      features: [
        'Auto-Responses - Your AI automatically reacts when things happen in your business',
        'App Connections - Connect to email, Slack, spreadsheets, and other tools you use',
        'Smart Decisions - Set up "if this, then that" logic to handle different situations'
      ]
    },
    {
      id: 'schedules' as const,
      title: 'Timing & Reminders',
      description: 'Set up when things should happen automatically - like sending weekly reports, daily check-ins, or reminders. Your AI assistant works around the clock, even when you\'re sleeping.',
      icon: '⏰',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Set Up Timing',
      demoTab: 2, // Schedules tab
      features: [
        'Perfect Timing - Choose exactly when things should happen (daily, weekly, or custom)',
        'Repeat Tasks - Set up things to happen automatically on a regular schedule',
        'Stay Informed - See what happened and when, so you\'re always in the loop'
      ]
    },
    {
      id: 'chat' as const,
      title: 'Your AI Assistant & Chat',
      description: 'Talk to your intelligent AI helper that knows your business inside and out. Ask questions, get insights, and tell it what to do - all in plain English, just like texting a friend.',
      icon: '🤖',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Chat with My AI',
      demoTab: 3, // Chat tab
      features: [
        'Talk Naturally - Just type what you want, no special commands or technical language needed',
        'Business Insights - Ask about your customers, sales, or trends and get smart answers',
        'Easy Commands - Tell your AI to send emails, update info, or run tasks through chat'
      ]
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const handleTabNavigation = useCallback((tabId: 'models' | 'actions' | 'schedules' | 'chat') => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  }, [onTabChange]);

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative space-y-6">
      {/* Streamlined Header */}
      <div className="space-y-3">
        {/* Main Row - Compact layout */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Title and Switch in one row on desktop, stacked on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${currentTheme.light} font-mono`}>Getting Started</h2>
            </div>
            
            {/* Enhanced View Switch with Onboard tab */}
            <div className="flex justify-center sm:justify-end">
              <div className={`inline-flex ${currentTheme.bg} border ${currentTheme.border} rounded-lg p-0.5 shadow-sm`}>
                <button
                  onClick={() => {
                    setShowOnboard(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    showOnboard
                      ? `${currentTheme.bgActive} ${currentTheme.light} shadow-sm`
                      : `${currentTheme.accent} hover:${currentTheme.light}`
                  }`}
                >
                  <span>👤</span>
                  <span>Onboard</span>
                </button>
                <button
                  onClick={() => {
                    setShowOnboard(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    !showOnboard
                      ? `${currentTheme.bgActive} ${currentTheme.light} shadow-sm`
                      : `${currentTheme.accent} hover:${currentTheme.light}`
                  }`}
                >
                  <span>📚</span>
                  <span>Tutorial</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Tutorial Navigation - Compact single row */}
          {!showOnboard && (
            <div className="flex items-center justify-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Compact slide indicators */}
                <div className="flex items-center gap-1.5">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentSlide 
                          ? `bg-${currentTheme.primary}-400 scale-125` 
                          : `bg-${currentTheme.primary}-400/30 hover:bg-${currentTheme.primary}-400/60 hover:scale-110`
                      }`}
                    />
                  ))}
                </div>
                <div className={`${currentTheme.accent} text-xs font-mono px-2 py-0.5 rounded-full ${currentTheme.bg} border ${currentTheme.border}`}>
                  {currentSlide + 1}/{slides.length}
                </div>
              </div>
              
              {/* Compact navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={prevSlide}
                  className={`w-8 h-8 rounded-full ${currentTheme.bg} border ${currentTheme.border} ${currentTheme.accent} hover:${currentTheme.light} transition-all duration-200 flex items-center justify-center text-sm font-mono hover:shadow-sm`}
                >
                  ←
                </button>
                <button
                  onClick={nextSlide}
                  className={`w-8 h-8 rounded-full ${currentTheme.bg} border ${currentTheme.border} ${currentTheme.accent} hover:${currentTheme.light} transition-all duration-200 flex items-center justify-center text-sm font-mono hover:shadow-sm`}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {showOnboard ? (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h3 className={`text-xl font-bold ${currentTheme.light} font-mono`}>
              Create Your Avatar
            </h3>
            <p className={`${currentTheme.dim} font-mono text-sm max-w-2xl mx-auto leading-relaxed`}>
              Design a personalized avatar for your AI agent. Choose from ROM unicorns or upload your own custom image.
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              {(() => {
                console.log('🎨 OnboardContent rendering AvatarCreator with:', {
                  documentId,
                  agentDataExists: !!agentData,
                  agentDataName: agentData?.name || 'none',
                  agentDataDomain: agentData?.domain || 'none',
                  externalApisMetadata: agentData?.externalApis,
                  hasExternalApis: !!(agentData?.externalApis?.length),
                  providers: agentData?.externalApis?.map((api: any) => api.provider).join(', ') || 'none',
                  requiresConnection: agentData?.externalApis?.some((api: any) => api.requiresConnection) || false,
                  agentDataKeys: agentData ? Object.keys(agentData) : [],
                  fullAgentData: agentData ? {
                    name: agentData.name,
                    domain: agentData.domain,
                    hasExternalApis: !!(agentData.externalApis?.length),
                    externalApiProviders: agentData.externalApis?.map((api: any) => api.provider).join(', ') || 'none'
                  } : null,
                  // Raw debugging
                  rawAgentData: agentData
                });

                // Additional check for debugging
                if (!(agentData?.externalApis?.length) && agentData?.name && agentData.name.toLowerCase().includes('instagram')) {
                  console.warn('🚨 ISSUE DETECTED: Agent name suggests Instagram but no externalApis metadata found!', {
                    agentName: agentData.name,
                    agentDescription: agentData.description,
                    agentDomain: agentData.domain,
                    allKeys: Object.keys(agentData),
                    externalApis: agentData.externalApis
                  });
                }

                return (
                  <AvatarCreator 
                    documentId={documentId} 
                    externalApisMetadata={agentData?.externalApis || []}
                    agentData={agentData}
                    onAvatarChange={(avatarData: any) => {
                      console.log('🎨 OnboardContent - Avatar change:', {
                        documentId,
                        hasDocumentId: !!documentId,
                        documentIdType: typeof documentId,
                        avatarData: !!avatarData
                      });
                      
                      if (onDataChange && agentData) {
                        const updatedAgent = {
                          ...agentData,
                          avatar: avatarData
                        };
                        onDataChange(updatedAgent);
                      }
                    }}
                    onThemeChange={(theme: string) => {
                      console.log('🎨 OnboardContent - Theme change:', {
                        documentId,
                        hasDocumentId: !!documentId,
                        documentIdType: typeof documentId,
                        theme,
                        hasAgentData: !!agentData,
                        currentAgentTheme: agentData?.theme
                      });
                      
                      // CRITICAL FIX: Update agentData with theme (same pattern as avatar)
                      if (onDataChange && agentData) {
                        const updatedAgent = {
                          ...agentData,
                          theme: theme  // Save theme to main agentData content
                        };
                        console.log('🎨 OnboardContent - Updating agentData with theme:', {
                          previousTheme: agentData.theme,
                          newTheme: theme,
                          updatedAgent: !!updatedAgent
                        });
                        onDataChange(updatedAgent);
                      }
                      
                      // REMOVED: Don't call onThemeChange to avoid race condition
                      // The agentData update above is sufficient
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tutorial Carousel Content */}
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div 
                  key={slide.id}
                  className="w-full flex-shrink-0"
                >
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${slide.gradient} border ${slide.border} backdrop-blur-sm`}>
                    <div className="relative p-6">
                      {/* Two Column Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        
                        {/* Left Column - Text Content */}
                        <div className="space-y-6">
                          {/* Icon and Title */}
                          <div className="text-center lg:text-left space-y-4">
                            <div className={`w-16 h-16 mx-auto lg:mx-0 rounded-2xl ${currentTheme.bg} flex items-center justify-center border ${currentTheme.borderActive}`}>
                              <span className="text-3xl">{slide.icon}</span>
                            </div>
                            
                            <div className="space-y-3">
                              <h3 className={`text-2xl font-bold font-mono ${currentTheme.light}`}>
                                {slide.title}
                              </h3>
                              <p className={`font-mono text-sm leading-relaxed ${currentTheme.dim}`}>
                                {slide.description}
                              </p>
                            </div>
                          </div>

                          {/* Feature List */}
                          <div className="space-y-3">
                            {slide.features.map((feature, featureIndex) => {
                              const [title, description] = feature.split(' - ');
                              return (
                                <div key={featureIndex} className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 bg-${currentTheme.primary}-400`}></div>
                                  <div>
                                    <div className={`font-mono font-semibold text-sm ${currentTheme.light}`}>
                                      {title}
                                    </div>
                                    <div className={`font-mono text-xs mt-1 ${currentTheme.dim}`}>
                                      {description}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Get Started Button */}
                          <div className="pt-4">
                            <Button
                              onClick={() => handleTabNavigation(slide.id)}
                              className={`px-6 py-3 font-mono text-sm font-semibold transition-all duration-200 ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.light} border ${currentTheme.borderActive} backdrop-blur-sm`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{slide.buttonText}</span>
                                <span className="text-lg">→</span>
                              </div>
                            </Button>
                          </div>
                        </div>

                        {/* Right Column - Interactive Demo */}
                        <div className="flex justify-center">
                          <div className="w-full max-w-sm">
                            <div className="text-center mb-4">
                              <h4 className={`font-mono text-sm font-semibold mb-2 ${currentTheme.light}`}>
                                Interactive Demo
                              </h4>
                              <p className={`font-mono text-xs ${currentTheme.dim}`}>
                                Try the {slide.title.split(' ')[0].toLowerCase()} features
                              </p>
                            </div>
                            
                            {/* Interactive Demo Component */}
                            <DemoWithTab
                              agentData={getSampleDataForSlide(slide.id)}
                              currentTheme={currentAgentTheme} // Use the actual agent theme
                              viewMode="mobile"
                              targetTab={slide.demoTab}
                              onDataChange={onDataChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}); 