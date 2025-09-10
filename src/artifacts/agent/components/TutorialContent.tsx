import * as React from 'react';
import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MobileAppDemo, themes } from './MobileAppDemo';
import { CompositeUnicorn } from '@/components/composite-unicorn';

interface TutorialContentProps {
  onTabChange?: (tab: 'intro' | 'avatar' | 'models' | 'actions' | 'schedules' | 'chat') => void;
  agentData?: any;
  onDataChange?: (agentData: any) => void;
}

// Simple wrapper to set the correct tab for the demo using props
const DemoWithTab = memo(({ agentData, currentTheme, viewMode, targetTab, onDataChange }: {
  agentData: any;
  currentTheme: string;
  viewMode: string;
  targetTab: number;
  onDataChange?: (agentData: any) => void;
}) => {
  return (
    <MobileAppDemo
      agentData={agentData}
      currentTheme={currentTheme as any}
      viewMode={viewMode as any}
      onDataChange={onDataChange}
      initialTab={targetTab}
    />
  );
});

export const TutorialContent = memo(({ onTabChange, agentData, onDataChange }: TutorialContentProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Get the current theme from agent data or default to green
  const currentAgentTheme = agentData?.theme || 'green';
  const currentTheme = themes[currentAgentTheme as keyof typeof themes] || themes.green;

  // Sample unicorn for avatar tutorial
  const sampleUnicorn = {
    body: "body.png",
    hair: "hair_blue.png", 
    eyes: "eye_heart.png",
    mouth: "m_ice.png",
    accessory: "corn_ice1.png"
  };

  // Sample data for each tutorial slide
  const getSampleDataForSlide = (slideId: 'intro' | 'avatar' | 'models' | 'actions' | 'schedules' | 'chat') => {
    const baseData = {
      id: 'tutorial-agent-' + slideId,
      name: 'ShopBot Assistant',
      description: 'Your intelligent e-commerce AI assistant that helps manage customers, automate tasks, and grow your business',
      domain: 'E-commerce',
      theme: currentAgentTheme, // Use the actual agent theme
      createdAt: new Date().toISOString(),
      models: [] as any[],
      actions: [] as any[],
      schedules: [] as any[],
      avatar: {
        type: 'rom-unicorn',
        unicornParts: sampleUnicorn
      }
    };

    switch (slideId) {
      case 'intro':
        return {
          ...baseData,
          theme: currentAgentTheme,
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
                { id: '1', modelId: 'customer-model', data: { id: '1', email: 'sarah@example.com', name: 'Sarah Johnson' }, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
                { id: '2', modelId: 'customer-model', data: { id: '2', email: 'mike@example.com', name: 'Mike Chen' }, createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' }
              ]
            },
            {
              id: 'order-model',
              name: 'Order',
              emoji: '🛍️',
              hasPublishedField: false,
              idField: 'id',
              displayFields: ['customer_email', 'total'],
              fields: [
                { id: '1', name: 'id', type: 'String', description: 'Order ID', isId: true, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'ID', sort: true, order: 1 },
                { id: '2', name: 'customer_email', type: 'String', description: 'Customer email', isId: false, unique: false, list: false, required: true, kind: 'scalar', relationField: false, title: 'Customer', sort: true, order: 2 },
                { id: '3', name: 'total', type: 'Float', description: 'Order total', isId: false, unique: false, list: false, required: false, kind: 'scalar', relationField: false, title: 'Total', sort: true, order: 3 }
              ],
              enums: [],
              records: [
                { id: '1', modelId: 'order-model', data: { id: 'ORD-001', customer_email: 'sarah@example.com', total: 89.99 }, createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-18T10:00:00Z' },
                { id: '2', modelId: 'order-model', data: { id: 'ORD-002', customer_email: 'mike@example.com', total: 156.50 }, createdAt: '2024-01-19T10:00:00Z', updatedAt: '2024-01-19T10:00:00Z' }
              ]
            }
          ],
          actions: [
            {
              id: 'welcome-email-action',
              name: 'Welcome Email',
              description: 'Send welcome email to new customers',
              results: { status: 'Active', lastRun: '2024-01-20T10:00:00Z', successRate: '98%' }
            },
            {
              id: 'order-confirmation-action',
              name: 'Order Confirmation',
              description: 'Send order confirmation and tracking info',
              results: { status: 'Active', lastRun: '2024-01-20T11:15:00Z', successRate: '100%' }
            }
          ],
          schedules: [
            {
              id: 'daily-summary-schedule',
              name: 'Daily Sales Summary',
              description: 'Send daily sales report every evening',
              interval: { pattern: '0 18 * * *', active: true },
              nextRun: '2024-01-21T18:00:00Z',
              lastRun: '2024-01-20T18:00:00Z',
              status: 'Active'
            }
          ]
        };

      case 'avatar':
        return {
          ...baseData,
          theme: currentAgentTheme,
          models: [],
          actions: [],
          schedules: []
        };

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
              results: { status: 'Active', lastRun: '2024-01-20T10:00:00Z', successRate: '94%' }
            },
            {
              id: 'update-customer-action',
              name: 'Update Customer Status',
              description: 'Automatically update customer engagement status',
              results: { status: 'Ready', lastRun: '2024-01-20T09:30:00Z', successRate: '100%' }
            },
            {
              id: 'slack-notification-action',
              name: 'Slack Notification',
              description: 'Send alerts to team when high-value carts are abandoned',
              results: { status: 'Active', lastRun: '2024-01-20T11:15:00Z', successRate: '98%' }
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
              results: { status: 'Email Automation' }
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

      case 'avatar':
        return {
          ...baseData,
          theme: currentAgentTheme, // Use the actual agent theme
          models: [],
          actions: [],
          schedules: []
        };

      case 'chat':
        return {
          ...baseData,
          theme: currentAgentTheme,
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
                { id: '1', modelId: 'customer-model', data: { id: '1', email: 'sarah@example.com', name: 'Sarah Johnson' }, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
                { id: '2', modelId: 'customer-model', data: { id: '2', email: 'mike@example.com', name: 'Mike Chen' }, createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' }
              ]
            }
          ],
          actions: [
            {
              id: 'welcome-email-action',
              name: 'Welcome Email',
              description: 'Send welcome email to new customers',
              results: { status: 'Active', lastRun: '2024-01-20T10:00:00Z', successRate: '98%' }
            }
          ],
          schedules: [
            {
              id: 'daily-summary-schedule',
              name: 'Daily Sales Summary',
              description: 'Send daily sales report every evening',
              interval: { pattern: '0 18 * * *', active: true },
              nextRun: '2024-01-21T18:00:00Z',
              lastRun: '2024-01-20T18:00:00Z',
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
      id: 'intro' as const,
      title: 'What is an Agent App?',
      description: 'An Agent App is your personal AI assistant that understands your business and helps you automate tasks. Meet ShopBot - an e-commerce assistant that manages customers, sends emails, and tracks orders automatically.',
      icon: '🤖',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Explore ShopBot',
      demoTab: null, // Show home page of the example app
      features: [
        'Smart Assistant - Your AI understands your business and helps with daily tasks',
        'Real Example - See how ShopBot manages an e-commerce store automatically',
        'Always Learning - Your agent gets smarter as it works with your data'
      ]
    },
    {
      id: 'avatar' as const,
      title: 'Your Agent\'s Identity',
      description: 'Give your AI assistant a unique personality and appearance. Choose from ROM unicorns, upload custom images, or design a character that represents your brand and style.',
      icon: '🎨',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Design My Avatar',
      demoTab: null, // No mobile demo for avatar - we'll show a preview
      features: [
        'ROM Unicorns - Choose from a collection of unique, customizable unicorn avatars',
        'Custom Upload - Upload your own images, logos, or artwork to personalize your agent',
        'Theme Integration - Your avatar works seamlessly with your chosen color theme'
      ]
    },
    {
      id: 'models' as const,
      title: 'Data Models - Your Information',
      description: 'Models are like digital filing cabinets where your agent stores important information. Create models for customers, products, orders - anything your business needs to track and remember.',
      icon: '📊',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Organize My Data',
      demoTab: 1, // Models tab
      features: [
        'Smart Organization - Create structured storage for customers, orders, products, and more',
        'Easy Management - Add, edit, and view your business data with simple forms',
        'Connected Data - Link related information together (like customers to their orders)'
      ]
    },
    {
      id: 'actions' as const,
      title: 'Actions - Smart Automation',
      description: 'Actions are your agent\'s superpowers! They automatically send emails, update data, connect to other apps, and handle tasks for you. Set them up once, and they work 24/7.',
      icon: '⚡',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Add Smart Actions',
      demoTab: 2, // Actions tab - now the correct index
      features: [
        'Email Automation - Send welcome emails, order confirmations, and follow-ups automatically',
        'App Connections - Connect to Slack, spreadsheets, payment systems, and more',
        'Smart Triggers - Actions run when specific events happen in your business'
      ]
    },
    {
      id: 'schedules' as const,
      title: 'Schedules - Perfect Timing',
      description: 'Schedules control when things happen. Set up daily reports, weekly check-ins, monthly summaries - your agent works around the clock, even when you\'re sleeping.',
      icon: '⏰',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Set Up Timing',
      demoTab: 3, // Schedules tab - updated index
      features: [
        'Flexible Timing - Set daily, weekly, monthly, or custom schedules for any task',
        'Automated Reports - Get regular updates on sales, customers, and business metrics',
        'Never Miss Anything - Your agent handles routine tasks while you focus on growth'
      ]
    },
    {
      id: 'chat' as const,
      title: 'AI Chat - Talk to Your Agent',
      description: 'Chat directly with your AI assistant! Ask questions about your data, give commands, or get insights. Your agent understands your business and can help with tasks through natural conversation.',
      icon: '🤖',
      gradient: `from-${currentTheme.primary}-500/20 via-${currentTheme.primary}-600/10 to-${currentTheme.primary}-700/20`,
      border: `border-${currentTheme.primary}-500/30`,
      buttonText: 'Start Chatting',
      demoTab: 4, // AI Chat tab
      features: [
        'Natural Conversation - Talk to your agent like you would a human assistant',
        'Smart Insights - Ask questions about your data and get instant analysis',
        'Voice Commands - Tell your agent what to do and watch it execute tasks automatically'
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

  const handleTabNavigation = useCallback((tabId: 'intro' | 'avatar' | 'models' | 'actions' | 'schedules' | 'chat') => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  }, [onTabChange]);

  return (
    <div className="relative space-y-6">
      {/* Unified Header */}
      <div className="text-center space-y-4">
        {/* <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
          <span className="text-2xl sm:text-3xl">🎓</span>
        </div> */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold ${currentTheme.light} font-mono`}>Tutorial</h2>
          <p className={`${currentTheme.dim} font-mono text-sm max-w-2xl mx-auto leading-relaxed mt-2`}>
            Learn how to build your AI agent step by step with interactive examples and real-time previews.
          </p>
        </div>
      </div>

      {/* Streamlined Header */}
      <div className="space-y-3">
        {/* Main Row - Compact layout */}
        <div className="flex flex-col gap-3 sm:gap-4">
          
          {/* Tutorial Navigation - Compact single row */}
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
        </div>
      </div>

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

                      {/* Get Started Button - Only show for non-intro slides */}
                      {slide.id !== 'intro' && (
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
                      )}
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
                        
                        {/* Interactive Demo Component or Special Previews */}
                        {slide.id === 'intro' ? (
                          /* ShopBot Example App - Home Page */
                          <DemoWithTab
                            agentData={getSampleDataForSlide(slide.id)}
                            currentTheme={currentAgentTheme}
                            viewMode="mobile"
                            targetTab={-1} // Special value to show home page
                            onDataChange={onDataChange}
                          />
                        ) : slide.id === 'avatar' ? (
                          /* Avatar Preview with Composed Unicorn */
                          <div className={`w-full max-w-sm mx-auto p-6 rounded-2xl ${currentTheme.bg} border ${currentTheme.border} backdrop-blur-sm`}>
                            <div className="text-center space-y-4">
                              <div className={`w-32 h-32 mx-auto rounded-2xl ${currentTheme.bgActive} flex items-center justify-center border-2 ${currentTheme.borderActive} p-4`}>
                                <CompositeUnicorn parts={sampleUnicorn} size={96} />
                              </div>
                              <div className="space-y-2">
                                <h4 className={`font-mono text-sm font-semibold ${currentTheme.light}`}>
                                  ROM Unicorn Avatar
                                </h4>
                                <p className={`font-mono text-xs ${currentTheme.dim}`}>
                                  Customize every detail of your agent's appearance
                                </p>
                              </div>
                              <div className="flex justify-center gap-2 pt-2">
                                <div className={`w-8 h-8 rounded-lg ${currentTheme.bg} border ${currentTheme.border} flex items-center justify-center`}>
                                  <span className="text-sm">🦄</span>
                                </div>
                                <div className={`w-8 h-8 rounded-lg ${currentTheme.bg} border ${currentTheme.border} flex items-center justify-center`}>
                                  <span className="text-sm">🖼️</span>
                                </div>
                                <div className={`w-8 h-8 rounded-lg ${currentTheme.bg} border ${currentTheme.border} flex items-center justify-center`}>
                                  <span className="text-sm">🎭</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : slide.demoTab !== null ? (
                          /* Regular Demo with Specific Tab */
                          <DemoWithTab
                            agentData={getSampleDataForSlide(slide.id)}
                            currentTheme={currentAgentTheme}
                            viewMode="mobile"
                            targetTab={slide.demoTab}
                            onDataChange={onDataChange}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}); 