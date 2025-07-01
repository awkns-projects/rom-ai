import * as React from 'react';
import { memo, useState, useCallback } from 'react';
import type { AgentData, AgentModel, AgentAction, AgentSchedule } from '../types';

interface MobileAppDemoProps {
  agentData?: AgentData;
  currentTheme?: keyof typeof themes;
}

interface MobileAppDemoWrapperProps {
  agentData?: AgentData;
  onThemeChange?: (theme: string) => void; // Callback to save theme changes
}

// Theme color definitions
const themes = {
  green: {
    name: 'Matrix Green',
    primary: 'green',
    gradient: 'from-green-500/10 via-green-600/5 to-green-700/10',
    border: 'border-green-500/20',
    accent: 'text-green-400',
    light: 'text-green-200',
    dim: 'text-green-300/70',
    bg: 'bg-green-500/10',
    bgHover: 'hover:bg-green-500/20',
    borderActive: 'border-green-500/30',
    bgActive: 'bg-green-500/20'
  },
  blue: {
    name: 'Ocean Blue',
    primary: 'blue',
    gradient: 'from-blue-500/10 via-blue-600/5 to-blue-700/10',
    border: 'border-blue-500/20',
    accent: 'text-blue-400',
    light: 'text-blue-200',
    dim: 'text-blue-300/70',
    bg: 'bg-blue-500/10',
    bgHover: 'hover:bg-blue-500/20',
    borderActive: 'border-blue-500/30',
    bgActive: 'bg-blue-500/20'
  },
  purple: {
    name: 'Royal Purple',
    primary: 'purple',
    gradient: 'from-purple-500/10 via-purple-600/5 to-purple-700/10',
    border: 'border-purple-500/20',
    accent: 'text-purple-400',
    light: 'text-purple-200',
    dim: 'text-purple-300/70',
    bg: 'bg-purple-500/10',
    bgHover: 'hover:bg-purple-500/20',
    borderActive: 'border-purple-500/30',
    bgActive: 'bg-purple-500/20'
  },
  cyan: {
    name: 'Cyber Cyan',
    primary: 'cyan',
    gradient: 'from-cyan-500/10 via-cyan-600/5 to-cyan-700/10',
    border: 'border-cyan-500/20',
    accent: 'text-cyan-400',
    light: 'text-cyan-200',
    dim: 'text-cyan-300/70',
    bg: 'bg-cyan-500/10',
    bgHover: 'hover:bg-cyan-500/20',
    borderActive: 'border-cyan-500/30',
    bgActive: 'bg-cyan-500/20'
  },
  orange: {
    name: 'Sunset Orange',
    primary: 'orange',
    gradient: 'from-orange-500/10 via-orange-600/5 to-orange-700/10',
    border: 'border-orange-500/20',
    accent: 'text-orange-400',
    light: 'text-orange-200',
    dim: 'text-orange-300/70',
    bg: 'bg-orange-500/10',
    bgHover: 'hover:bg-orange-500/20',
    borderActive: 'border-orange-500/30',
    bgActive: 'bg-orange-500/20'
  },
  pink: {
    name: 'Neon Pink',
    primary: 'pink',
    gradient: 'from-pink-500/10 via-pink-600/5 to-pink-700/10',
    border: 'border-pink-500/20',
    accent: 'text-pink-400',
    light: 'text-pink-200',
    dim: 'text-pink-300/70',
    bg: 'bg-pink-500/10',
    bgHover: 'hover:bg-pink-500/20',
    borderActive: 'border-pink-500/30',
    bgActive: 'bg-pink-500/20'
  },
  yellow: {
    name: 'Golden Yellow',
    primary: 'yellow',
    gradient: 'from-yellow-500/10 via-yellow-600/5 to-yellow-700/10',
    border: 'border-yellow-500/20',
    accent: 'text-yellow-400',
    light: 'text-yellow-200',
    dim: 'text-yellow-300/70',
    bg: 'bg-yellow-500/10',
    bgHover: 'hover:bg-yellow-500/20',
    borderActive: 'border-yellow-500/30',
    bgActive: 'bg-yellow-500/20'
  },
  red: {
    name: 'Fire Red',
    primary: 'red',
    gradient: 'from-red-500/10 via-red-600/5 to-red-700/10',
    border: 'border-red-500/20',
    accent: 'text-red-400',
    light: 'text-red-200',
    dim: 'text-red-300/70',
    bg: 'bg-red-500/10',
    bgHover: 'hover:bg-red-500/20',
    borderActive: 'border-red-500/30',
    bgActive: 'bg-red-500/20'
  },
  indigo: {
    name: 'Deep Indigo',
    primary: 'indigo',
    gradient: 'from-indigo-500/10 via-indigo-600/5 to-indigo-700/10',
    border: 'border-indigo-500/20',
    accent: 'text-indigo-400',
    light: 'text-indigo-200',
    dim: 'text-indigo-300/70',
    bg: 'bg-indigo-500/10',
    bgHover: 'hover:bg-indigo-500/20',
    borderActive: 'border-indigo-500/30',
    bgActive: 'bg-indigo-500/20'
  },
  emerald: {
    name: 'Emerald Green',
    primary: 'emerald',
    gradient: 'from-emerald-500/10 via-emerald-600/5 to-emerald-700/10',
    border: 'border-emerald-500/20',
    accent: 'text-emerald-400',
    light: 'text-emerald-200',
    dim: 'text-emerald-300/70',
    bg: 'bg-emerald-500/10',
    bgHover: 'hover:bg-emerald-500/20',
    borderActive: 'border-emerald-500/30',
    bgActive: 'bg-emerald-500/20'
  },
  teal: {
    name: 'Teal Blue',
    primary: 'teal',
    gradient: 'from-teal-500/10 via-teal-600/5 to-teal-700/10',
    border: 'border-teal-500/20',
    accent: 'text-teal-400',
    light: 'text-teal-200',
    dim: 'text-teal-300/70',
    bg: 'bg-teal-500/10',
    bgHover: 'hover:bg-teal-500/20',
    borderActive: 'border-teal-500/30',
    bgActive: 'bg-teal-500/20'
  },
  rose: {
    name: 'Rose Gold',
    primary: 'rose',
    gradient: 'from-rose-500/10 via-rose-600/5 to-rose-700/10',
    border: 'border-rose-500/20',
    accent: 'text-rose-400',
    light: 'text-rose-200',
    dim: 'text-rose-300/70',
    bg: 'bg-rose-500/10',
    bgHover: 'hover:bg-rose-500/20',
    borderActive: 'border-rose-500/30',
    bgActive: 'bg-rose-500/20'
  }
};

// Wrapper component with theme selector
export const MobileAppDemoWrapper = memo(({ agentData, onThemeChange }: MobileAppDemoWrapperProps) => {
  // Initialize theme from agent data or default to 'green'
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>(
    (agentData?.theme as keyof typeof themes) || 'green'
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle theme change with persistence
  const handleThemeChange = useCallback((newTheme: keyof typeof themes) => {
    setCurrentTheme(newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  }, [onThemeChange]);

  // Display first 6 themes when collapsed, all when expanded
  const visibleThemes = isExpanded 
    ? Object.entries(themes) 
    : Object.entries(themes).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Theme Selector Outside the App */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h4 className="text-green-200 font-mono text-sm font-semibold mb-2">Customize Theme</h4>
          <p className="text-green-300/70 font-mono text-xs">Choose your app's color scheme</p>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-4 bg-green-500/5 border border-green-500/10 rounded-xl backdrop-blur-sm max-w-2xl">
            {visibleThemes.map(([key, themeOption]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key as keyof typeof themes)}
                className={`group flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                  currentTheme === key 
                    ? `bg-${themeOption.primary}-500/20 border-2 border-${themeOption.primary}-400 shadow-lg shadow-${themeOption.primary}-500/30` 
                    : `border-2 border-${themeOption.primary}-500/20 hover:border-${themeOption.primary}-400/60 hover:bg-${themeOption.primary}-500/10`
                }`}
                title={themeOption.name}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${themeOption.gradient} border border-${themeOption.primary}-500/30`}></div>
                <span className={`text-xs font-mono font-medium transition-colors ${
                  currentTheme === key 
                    ? themeOption.accent.replace('text-', 'text-')
                    : 'text-green-400/70 group-hover:text-green-300'
                }`}>
                  {themeOption.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
          
          {/* Expand/Collapse Button */}
          {Object.keys(themes).length > 6 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-green-400/70 hover:text-green-300 border border-green-500/20 hover:border-green-500/40 rounded-lg transition-all duration-200 hover:bg-green-500/10"
            >
              <span>{isExpanded ? 'Show Less' : `Show All ${Object.keys(themes).length} Colors`}</span>
              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile App Demo */}
      <MobileAppDemo agentData={agentData} currentTheme={currentTheme} />
    </div>
  );
});

// Main mobile app demo component
const MobileAppDemo = memo(({ agentData, currentTheme = 'green' }: MobileAppDemoProps) => {
  const [activeTab, setActiveTab] = useState(0);
  
  const theme = themes[currentTheme];
  
  // Use actual agent data or fallback defaults
  const agentName = agentData?.name || 'AI Agent';
  const models = agentData?.models || [];
  const actions = agentData?.actions || [];
  const schedules = agentData?.schedules || [];
  
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      color: theme.accent
    },
    { 
      id: 'models', 
      label: 'Models', 
      icon: '🗃️',
      color: theme.accent
    },
    { 
      id: 'schedules', 
      label: 'Schedules', 
      icon: '⏰',
      color: theme.accent
    },
    { 
      id: 'chat', 
      label: 'AI Chat', 
      icon: '🤖',
      color: theme.accent
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Dashboard
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-mono font-bold text-lg ${theme.light}`}>Dashboard</h3>
              <div className={`w-2 h-2 bg-${theme.primary}-400 rounded-full animate-pulse`}></div>
            </div>
            
            {/* Stats Grid - Shows total items for each model */}
            <div className="grid grid-cols-2 gap-3">
              {models.length > 0 ? (
                models.slice(0, 4).map((model, index) => (
                  <div key={model.id} className={`bg-black/30 border ${theme.border} rounded-lg p-3 text-center`}>
                    <div className={`text-xl font-bold font-mono ${theme.accent}`}>
                      {model.records?.length || 0}
                    </div>
                    <div className={`font-mono text-xs ${theme.dim}`}>{model.name}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-4">
                  <div className={`font-mono text-sm ${theme.dim}`}>No models created yet</div>
                </div>
              )}
            </div>

            {/* Quick Actions - Shows actual actions */}
            <div className="space-y-2">
              <h4 className={`font-mono text-sm font-semibold ${theme.light}`}>Quick Actions</h4>
              {actions.length > 0 ? (
                actions.slice(0, 3).map((action, index) => (
                  <div key={action.id} className={`flex items-center justify-between p-3 ${theme.bg} border ${theme.border} rounded-lg`}>
                    <div>
                      <div className={`font-mono text-sm ${theme.light}`}>{action.name}</div>
                      <div className={`font-mono text-xs ${theme.accent}`}>
                        {action.results?.actionType || 'Ready'}
                      </div>
                    </div>
                    <button className={`w-8 h-8 ${theme.bg} border ${theme.border} rounded-md flex items-center justify-center ${theme.bgHover}`}>
                      <span className={`text-xs ${theme.accent}`}>→</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <div className={`font-mono text-sm ${theme.dim}`}>No actions created yet</div>
                </div>
              )}
            </div>
          </div>
        );

      case 1: // Models
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-mono font-bold text-lg ${theme.light}`}>Models</h3>
              <span className={`font-mono text-xs ${theme.dim}`}>{models.length} models</span>
            </div>
            
            <div className="space-y-3">
              {models.length > 0 ? (
                models.map((model, index) => (
                  <div key={model.id} className={`${theme.bg} border ${theme.border} rounded-lg p-3`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{model.emoji || '🗃️'}</span>
                      <div className="flex-1">
                        <div className={`font-mono text-sm font-medium ${theme.light}`}>{model.name}</div>
                        <div className={`font-mono text-xs ${theme.dim}`}>
                          {model.fields?.length || 0} fields
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold ${theme.accent}`}>
                          {model.records?.length || 0} items
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs px-2 py-1 rounded ${theme.bgActive} ${theme.accent}`}>
                        {model.hasPublishedField ? 'Published' : 'Draft'}
                      </span>
                      <div className="flex gap-1">
                        <button className={`w-6 h-6 ${theme.bg} border ${theme.border} rounded text-xs`}>👁️</button>
                        <button className={`w-6 h-6 ${theme.bg} border ${theme.border} rounded text-xs`}>✏️</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className={`font-mono text-sm ${theme.dim}`}>No models created yet</div>
                  <div className={`font-mono text-xs mt-1 ${theme.dim}`}>
                    Create your first data model to get started
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2: // Schedules
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-mono font-bold text-lg ${theme.light}`}>Schedules</h3>
              <span className={`font-mono text-xs ${theme.dim}`}>{schedules.length} schedules</span>
            </div>
            
            <div className="space-y-3">
              {schedules.length > 0 ? (
                schedules.map((schedule, index) => (
                  <div key={schedule.id} className={`${theme.bg} border ${theme.border} rounded-lg p-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          schedule.interval?.active ? `bg-${theme.primary}-400 animate-pulse` : `bg-${theme.primary}-400/30`
                        }`}></div>
                        <span className={`font-mono text-sm font-bold ${theme.accent}`}>
                          {schedule.interval?.pattern || 'Manual'}
                        </span>
                      </div>
                      <span className={`font-mono text-xs ${theme.dim}`}>
                        {schedule.interval?.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={`font-mono text-sm ${theme.light}`}>{schedule.name}</div>
                    <div className={`font-mono text-xs mt-1 ${theme.dim}`}>
                      {schedule.description || 'No description'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className={`font-mono text-sm ${theme.dim}`}>No schedules created yet</div>
                  <div className={`font-mono text-xs mt-1 ${theme.dim}`}>
                    Set up automated tasks and workflows
                  </div>
                </div>
              )}
            </div>

            {/* Today's Progress */}
            {schedules.length > 0 && (
              <div className={`${theme.bg} border ${theme.border} rounded-lg p-3 mt-4`}>
                <h4 className={`font-mono text-sm font-semibold mb-2 ${theme.light}`}>Today's Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className={theme.dim}>Schedules Active</span>
                    <span className={`font-bold ${theme.accent}`}>
                      {schedules.filter(s => s.interval?.active).length}/{schedules.length}
                    </span>
                  </div>
                  <div className={`w-full bg-${theme.primary}-900/30 rounded-full h-2`}>
                    <div 
                      className={`bg-${theme.primary}-400 h-2 rounded-full`}
                      style={{ 
                        width: `${schedules.length > 0 ? (schedules.filter(s => s.interval?.active).length / schedules.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // AI Chat
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 ${theme.bg} border ${theme.border} rounded-lg flex items-center justify-center`}>
                <span className={`text-sm ${theme.accent}`}>🤖</span>
              </div>
              <h3 className={`font-mono font-bold text-lg ${theme.light}`}>AI Assistant</h3>
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {[
                { type: 'ai', message: `Welcome to ${agentName}! I can help you manage your data and workflows.` },
                { type: 'ai', message: `You currently have ${models.length} models, ${actions.length} actions, and ${schedules.length} schedules configured.` },
                { type: 'user', message: 'Show me the current status' },
                { type: 'ai', message: models.length > 0 
                  ? `Your models: ${models.slice(0, 3).map(m => m.name).join(', ')}${models.length > 3 ? '...' : ''}` 
                  : 'No models have been created yet. Would you like me to help you create one?'
                },
                ...(actions.length > 0 ? [
                  { type: 'user', message: 'What actions are available?' },
                  { type: 'ai', message: `Available actions: ${actions.slice(0, 2).map(a => a.name).join(', ')}${actions.length > 2 ? '...' : ''}` }
                ] : [])
              ].map((chat, index) => (
                <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-4 rounded-2xl font-mono text-sm leading-relaxed ${
                    chat.type === 'user' 
                      ? `${theme.bgActive} border ${theme.borderActive} ${theme.light}` 
                      : `${theme.bg} border ${theme.border} ${theme.light}`
                  }`}>
                    {chat.message}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`flex gap-3 mt-6 pt-4 border-t ${theme.border}`}>
              <input 
                type="text" 
                placeholder="Ask AI anything..." 
                className={`flex-1 ${theme.bg} border ${theme.border} rounded-xl px-4 py-3 ${theme.light} font-mono text-sm focus:outline-none focus:${theme.borderActive} placeholder:${theme.dim}`}
              />
              <button className={`w-12 h-12 ${theme.bg} ${theme.bgHover} border ${theme.border} rounded-xl flex items-center justify-center transition-colors duration-200`}>
                <span className={`text-lg ${theme.accent}`}>→</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-gradient-to-br ${theme.gradient} border ${theme.border} rounded-3xl backdrop-blur-sm shadow-2xl overflow-hidden w-full max-w-sm mx-auto flex flex-col`} style={{ height: 'min(700px, 80vh)', maxWidth: 'min(350px, calc(100vw - 2rem))' }}>
      {/* Mobile App Header */}
      <div className={`bg-black/40 border-b ${theme.border} p-4 flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${theme.bg} border ${theme.border} rounded-lg flex items-center justify-center`}>
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h3 className={`font-mono font-bold text-sm ${theme.light}`}>{agentName}</h3>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 bg-${theme.primary}-400 rounded-full animate-pulse`}></div>
                <span className={`font-mono text-xs ${theme.dim}`}>Live</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
            <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
            <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {renderTabContent()}
      </div>

      {/* Bottom Tab Navigation */}
      <div className={`bg-black/60 border-t ${theme.border} p-2 flex-shrink-0`}>
        <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                activeTab === index
                  ? `${theme.bgActive} border ${theme.borderActive}`
                  : theme.bgHover
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className={`text-xs font-mono font-medium ${
                activeTab === index 
                  ? theme.light
                  : theme.dim
              }`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// Export both components and themes for use in other files
export { MobileAppDemo, themes };