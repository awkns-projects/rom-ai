import * as React from 'react';
import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MobileAppDemoWrapper, MobileAppDemo, themes } from './MobileAppDemo';

interface OnboardContentProps {
  onTabChange?: (tab: 'models' | 'actions' | 'schedules' | 'chat') => void;
  models?: any[]; // Array of models to determine default view
  agentData?: any; // Add agentData prop
  onThemeChange?: (theme: string) => void; // Add theme change callback
  onDataChange?: (agentData: any) => void; // Add data change callback
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

  // Force re-render when targetTab changes to reset the component state
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [targetTab]);

  // Set the correct tab after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // Look for tab buttons within this specific demo instance
        const tabButtons = containerRef.current.querySelectorAll('button');
        // Find the tab button by looking for the one that contains the tab content we want
        const targetButton = Array.from(tabButtons).find((button, index) => {
          // The tab buttons are typically in a specific order: Dashboard(0), Models(1), Schedules(2), Chat(3)
          const buttonText = button.textContent?.toLowerCase() || '';
          if (targetTab === 0 && buttonText.includes('dashboard')) return true;
          if (targetTab === 1 && buttonText.includes('models')) return true;
          if (targetTab === 2 && buttonText.includes('schedules')) return true;
          if (targetTab === 3 && buttonText.includes('chat')) return true;
          return false;
        });
        
        if (targetButton) {
          targetButton.click();
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [targetTab, key]);

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

export const OnboardContent = memo(({ onTabChange, models = [], agentData, onThemeChange, onDataChange }: OnboardContentProps) => {
  // Determine initial view based on models length
  const hasModels = models.length > 0;
  const [showDemo, setShowDemo] = useState(hasModels);
  const [currentSlide, setCurrentSlide] = useState(0);

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
      title: 'Data Models & Structures',
      description: 'Define your data architecture with custom models, fields, relationships, and validation rules. Create the foundation for your agent\'s knowledge base.',
      icon: '📊',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Start Building Models',
      demoTab: 1, // Models tab
      features: [
        'Schema Design - Build custom data structures with fields, types, and relationships',
        'Data Management - Store, query, and manipulate your agent\'s knowledge data',
        'Relationships - Connect models with foreign keys and complex associations'
      ]
    },
    {
      id: 'actions' as const,
      title: 'Automated Actions & Workflows',
      description: 'Design intelligent workflows that respond to events and execute complex operations. Connect to APIs, databases, and external services with custom actions.',
      icon: '⚡',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Create Actions',
      demoTab: 0, // Dashboard tab to show actions in use
      features: [
        'Event Triggers - Automatically respond to data changes and user interactions',
        'API Integration - Connect to external services and REST APIs seamlessly',
        'Custom Logic - Build complex workflows with conditional logic and loops'
      ]
    },
    {
      id: 'schedules' as const,
      title: 'Scheduled Automation & Timing',
      description: 'Create time-based triggers and recurring workflows that execute automatically. Set up cron schedules, intervals, and event-driven timing for your actions.',
      icon: '⏰',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Setup Schedules',
      demoTab: 2, // Schedules tab
      features: [
        'Cron Scheduling - Set precise timing with cron expressions and intervals',
        'Recurring Tasks - Execute actions on regular intervals automatically',
        'Monitoring - Track execution history and performance metrics'
      ]
    },
    {
      id: 'chat' as const,
      title: 'AI Assistant & Chat Interface',
      description: 'Interact with your intelligent AI assistant that understands your data, executes actions, and provides insights. Get help, run queries, and manage your agent through natural conversation.',
      icon: '🤖',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Try AI Chat',
      demoTab: 3, // Chat tab
      features: [
        'Natural Language - Ask questions and give commands in plain English',
        'Data Insights - Get analytics and reports about your models and actions',
        'Smart Actions - Execute workflows and automations through conversation'
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
      {/* Switch Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className={`text-2xl font-bold ${currentTheme.light} font-mono`}>Getting Started</h2>
          <div className="flex gap-2 hidden md:flex">
            {!showDemo && slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide 
                    ? `bg-${currentTheme.primary}-400` 
                    : `bg-${currentTheme.primary}-400/30 hover:bg-${currentTheme.primary}-400/60`
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* View Switch */}
        <div className="flex items-center gap-2">
          <div className={`flex ${currentTheme.bg} border ${currentTheme.border} rounded-lg p-1`}>
            <button
              onClick={() => setShowDemo(false)}
              className={`px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 ${
                !showDemo
                  ? `${currentTheme.bgActive} ${currentTheme.light} border ${currentTheme.borderActive}`
                  : `${currentTheme.accent} ${currentTheme.bgHover}`
              }`}
            >
              Tutorial
            </button>
            <button
              onClick={() => setShowDemo(true)}
              className={`px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 ${
                showDemo
                  ? `${currentTheme.bgActive} ${currentTheme.light} border ${currentTheme.borderActive}`
                  : `${currentTheme.accent} ${currentTheme.bgHover}`
              }`}
            >
              Demo App
            </button>
          </div>
          
          {!showDemo && (
            <div className="flex gap-2">
              <Button
                onClick={prevSlide}
                className="btn-matrix px-3 py-2"
                size="sm"
              >
                ←
              </Button>
              <Button
                onClick={nextSlide}
                className="btn-matrix px-3 py-2"
                size="sm"
              >
                →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {showDemo ? (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h3 className={`text-xl font-bold ${currentTheme.light} font-mono`}>
              Your AI App Demo
            </h3>
            <p className={`${currentTheme.dim} font-mono text-sm max-w-2xl mx-auto leading-relaxed`}>
              This is what your agent builds - a fully functional cart recovery system with real-time data, 
              automated workflows, and intelligent AI assistance. Built from simple prompts like "help me recover abandoned shopping carts".
            </p>
          </div>
          
          <div className="flex justify-center">
            <MobileAppDemoWrapper agentData={agentData} onThemeChange={onThemeChange} onDataChange={onDataChange} />
          </div>
          
          <div className="text-center space-y-4 pt-4">
            <p className={`${currentTheme.dim} font-mono text-xs`}>
              ✨ This demo shows what's possible when you describe your business needs to our AI
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs font-mono">
              <span className={`px-2 py-1 rounded ${currentTheme.bg} ${currentTheme.accent}`}>📊 Real-time Dashboard</span>
              <span className={`px-2 py-1 rounded ${currentTheme.bg} ${currentTheme.accent}`}>🤖 AI Assistant</span>
              <span className={`px-2 py-1 rounded ${currentTheme.bg} ${currentTheme.accent}`}>⏰ Smart Scheduling</span>
              <span className={`px-2 py-1 rounded ${currentTheme.bg} ${currentTheme.accent}`}>📧 Email Automation</span>
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
                              onClick={() => {
                                if (slide.id === 'chat') {
                                  // For chat slide, switch to demo app mode
                                  setShowDemo(true);
                                } else {
                                  // For other slides, navigate to the specific tab
                                  handleTabNavigation(slide.id);
                                }
                              }}
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

          {/* Slide Counter */}
          <div className="text-center">
            <span className={`${currentTheme.accent} text-sm font-mono`}>
              {currentSlide + 1} of {slides.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}); 