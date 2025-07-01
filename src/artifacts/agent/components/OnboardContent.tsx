import * as React from 'react';
import { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface OnboardContentProps {
  onTabChange?: (tab: 'models' | 'actions' | 'schedules') => void;
}

export const OnboardContent = memo(({ onTabChange }: OnboardContentProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'models' as const,
      title: 'Data Models & Structures',
      description: 'Define your data architecture with custom models, fields, relationships, and validation rules. Create the foundation for your agent\'s knowledge base.',
      icon: '🗃️',
      gradient: 'from-green-500/20 via-green-600/10 to-green-700/20',
      border: 'border-green-500/30',
      buttonText: 'Start Building Models',
      visualItems: [
        { icon: '📋', color: 'green', label: 'Schema Design', description: 'Build custom data structures with fields, types, and relationships' },
        { icon: '💾', color: 'blue', label: 'Data Management', description: 'Store, query, and manipulate your agent\'s knowledge data' },
        { icon: '🔗', color: 'purple', label: 'Relationships', description: 'Connect models with foreign keys and complex associations' }
      ]
    },
    {
      id: 'actions' as const,
      title: 'Automated Actions & Workflows',
      description: 'Design intelligent workflows that respond to events and execute complex operations. Connect to APIs, databases, and external services with custom actions.',
      icon: '⚡',
      gradient: 'from-blue-500/20 via-blue-600/10 to-blue-700/20',
      border: 'border-blue-500/30',
      buttonText: 'Create Actions',
      visualItems: [
        { icon: '🔄', color: 'blue', label: 'Event Triggers', description: 'Automatically respond to data changes and user interactions' },
        { icon: '🌐', color: 'orange', label: 'API Integration', description: 'Connect to external services and REST APIs seamlessly' },
        { icon: '⚙️', color: 'purple', label: 'Custom Logic', description: 'Build complex workflows with conditional logic and loops' }
      ]
    },
    {
      id: 'schedules' as const,
      title: 'Scheduled Automation & Timing',
      description: 'Create time-based triggers and recurring workflows that execute automatically. Set up cron schedules, intervals, and event-driven timing for your actions.',
      icon: '⏰',
      gradient: 'from-purple-500/20 via-purple-600/10 to-purple-700/20',
      border: 'border-purple-500/30',
      buttonText: 'Setup Schedules',
      visualItems: [
        { icon: '⏰', color: 'purple', label: 'Cron Scheduling', description: 'Set precise timing with cron expressions and intervals' },
        { icon: '🔄', color: 'blue', label: 'Recurring Tasks', description: 'Execute actions on regular intervals automatically' },
        { icon: '📊', color: 'green', label: 'Monitoring', description: 'Track execution history and performance metrics' }
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

  const handleTabNavigation = useCallback((tabId: 'models' | 'actions' | 'schedules') => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  }, [onTabChange]);

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: 'bg-green-500/20 border-green-500/30 text-green-200',
      blue: 'bg-blue-500/20 border-blue-500/30 text-blue-200',
      purple: 'bg-purple-500/20 border-purple-500/30 text-purple-200',
      orange: 'bg-orange-500/20 border-orange-500/30 text-orange-200',
      yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200',
      red: 'bg-red-500/20 border-red-500/30 text-red-200',
      cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.green;
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative space-y-6">
      {/* Carousel Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-green-200 font-mono">Getting Started</h2>
          <div className="flex gap-2 hidden md:flex">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide 
                    ? 'bg-green-400' 
                    : 'bg-green-400/30 hover:bg-green-400/60'
                }`}
              />
            ))}
          </div>
        </div>
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
      </div>

      {/* Carousel Content */}
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
                <div className="relative p-8">
                  <div className="text-center space-y-6">
                    {/* Main Icon and Decorative Elements */}
                    <div className="flex justify-center items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-${slide.id === 'models' ? 'green' : slide.id === 'actions' ? 'blue' : 'purple'}-500/30 flex items-center justify-center border border-${slide.id === 'models' ? 'green' : slide.id === 'actions' ? 'blue' : 'purple'}-400/40`}>
                        <span className="text-3xl">{slide.icon}</span>
                      </div>
                      
                      {/* Decorative visual elements specific to each slide */}
                      {slide.id === 'models' && (
                        <>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-transparent"></div>
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="w-12 h-8 rounded-lg bg-green-400/20 border border-green-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-green-300">📋</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-blue-400/20 border border-blue-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-blue-300">💾</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-purple-400/20 border border-purple-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-purple-300">🔗</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-yellow-300">📊</span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {slide.id === 'actions' && (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-8 h-8 rounded-lg bg-blue-400/20 border border-blue-400/40 flex items-center justify-center">
                                <span className="text-xs">🔄</span>
                              </div>
                              <div className="w-0.5 h-6 bg-blue-400/50"></div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-8 h-8 rounded-lg bg-green-400/20 border border-green-400/40 flex items-center justify-center">
                                <span className="text-xs">🎯</span>
                              </div>
                              <div className="w-0.5 h-6 bg-green-400/50"></div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-8 h-8 rounded-lg bg-purple-400/20 border border-purple-400/40 flex items-center justify-center">
                                <span className="text-xs">✅</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="w-12 h-8 rounded-lg bg-orange-400/20 border border-orange-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-orange-300">API</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-yellow-300">DB</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-red-400/20 border border-red-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-red-300">MSG</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-cyan-300">CMD</span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {slide.id === 'schedules' && (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full border-2 border-purple-400/40 bg-purple-500/10 flex items-center justify-center relative">
                              <div className="w-0.5 h-4 bg-purple-400 absolute transform rotate-45 origin-bottom"></div>
                              <div className="w-0.5 h-3 bg-purple-300 absolute transform rotate-90 origin-bottom"></div>
                              <div className="w-1 h-1 rounded-full bg-purple-400 absolute"></div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                <div className="w-2 h-2 rounded-full bg-purple-300"></div>
                                <div className="w-2 h-2 rounded-full bg-purple-200"></div>
                              </div>
                              <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-purple-200"></div>
                                <div className="w-2 h-2 rounded-full bg-purple-300"></div>
                                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="w-12 h-8 rounded-lg bg-blue-400/20 border border-blue-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-blue-300">1h</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-green-400/20 border border-green-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-green-300">24h</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-yellow-300">@</span>
                            </div>
                            <div className="w-12 h-8 rounded-lg bg-red-400/20 border border-red-400/40 flex items-center justify-center">
                              <span className="text-xs font-mono text-red-300">∞</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Title and Description */}
                    <div className="space-y-3">
                      <h3 className={`text-2xl font-bold font-mono ${
                        slide.id === 'models' ? 'text-green-200' : 
                        slide.id === 'actions' ? 'text-blue-200' : 
                        'text-purple-200'
                      }`}>
                        {slide.title}
                      </h3>
                      <p className={`font-mono text-sm max-w-2xl mx-auto leading-relaxed ${
                        slide.id === 'models' ? 'text-green-300' : 
                        slide.id === 'actions' ? 'text-blue-300' : 
                        'text-purple-300'
                      }`}>
                        {slide.description}
                      </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                      {slide.visualItems.map((item, itemIndex) => (
                        <div key={itemIndex} className={`p-4 rounded-xl backdrop-blur-sm ${getColorClasses(item.color)} border`}>
                          <div className="text-center space-y-2">
                            <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center ${getColorClasses(item.color).replace('border-', 'bg-').replace('/30', '/30')}`}>
                              <span className="text-lg">{item.icon}</span>
                            </div>
                            <h4 className="font-mono font-semibold text-sm">{item.label}</h4>
                            <p className="text-xs font-mono opacity-80">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Get Started Button */}
                    <div className="pt-4">
                      <Button
                        onClick={() => handleTabNavigation(slide.id)}
                        className={`px-6 py-3 font-mono text-sm font-semibold transition-all duration-200 ${
                          slide.id === 'models' 
                            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-200 border-green-500/40 hover:border-green-400'
                            : slide.id === 'actions'
                            ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/40 hover:border-blue-400'
                            : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-500/40 hover:border-purple-400'
                        } border backdrop-blur-sm`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{slide.buttonText}</span>
                          <span className="text-lg">→</span>
                        </div>
                      </Button>
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
        <span className="text-green-400 text-sm font-mono">
          {currentSlide + 1} of {slides.length}
        </span>
      </div>
    </div>
  );
}); 