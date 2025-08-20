import * as React from 'react';
import { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompositeUnicorn } from '@/components/composite-unicorn';
import MatrixBox from '../avatar-creator/matrix-box';
import { generateNewId } from '@/artifacts/agent/utils/id-generation';

// Theme definitions (same as MobileAppDemo)
const themes = {
  green: {
    name: 'Matrix',
    primary: 'green',
    gradient: 'from-green-400/20 via-green-500/15 to-emerald-400/20',
    border: 'border-green-400/30',
    accent: 'text-green-400',
    light: 'text-green-200',
    dim: 'text-green-300/70',
    bg: 'bg-green-500/15',
    bgHover: 'hover:bg-green-500/25',
    borderActive: 'border-green-400/50',
    bgActive: 'bg-green-500/25'
  },
  blue: {
    name: 'Ocean',
    primary: 'blue',
    gradient: 'from-blue-400/20 via-sky-500/15 to-cyan-400/20',
    border: 'border-blue-400/30',
    accent: 'text-blue-400',
    light: 'text-blue-200',
    dim: 'text-blue-300/70',
    bg: 'bg-blue-500/15',
    bgHover: 'hover:bg-blue-500/25',
    borderActive: 'border-blue-400/50',
    bgActive: 'bg-blue-500/25'
  },
  purple: {
    name: 'Royal',
    primary: 'purple',
    gradient: 'from-purple-400/20 via-violet-500/15 to-indigo-400/20',
    border: 'border-purple-400/30',
    accent: 'text-purple-400',
    light: 'text-purple-200',
    dim: 'text-purple-300/70',
    bg: 'bg-purple-500/15',
    bgHover: 'hover:bg-purple-500/25',
    borderActive: 'border-purple-400/50',
    bgActive: 'bg-purple-500/25'
  },
  cyan: {
    name: 'Cyber',
    primary: 'cyan',
    gradient: 'from-cyan-300/20 via-teal-400/15 to-emerald-300/20',
    border: 'border-cyan-400/30',
    accent: 'text-cyan-300',
    light: 'text-cyan-100',
    dim: 'text-cyan-200/70',
    bg: 'bg-cyan-500/15',
    bgHover: 'hover:bg-cyan-500/25',
    borderActive: 'border-cyan-400/50',
    bgActive: 'bg-cyan-500/25'
  },
  orange: {
    name: 'Sunset',
    primary: 'orange',
    gradient: 'from-orange-400/20 via-amber-500/15 to-yellow-400/20',
    border: 'border-orange-400/30',
    accent: 'text-orange-300',
    light: 'text-orange-100',
    dim: 'text-orange-200/70',
    bg: 'bg-orange-500/15',
    bgHover: 'hover:bg-orange-500/25',
    borderActive: 'border-orange-400/50',
    bgActive: 'bg-orange-500/25'
  },
  pink: {
    name: 'Neon',
    primary: 'pink',
    gradient: 'from-pink-400/20 via-rose-500/15 to-fuchsia-400/20',
    border: 'border-pink-400/30',
    accent: 'text-pink-300',
    light: 'text-pink-100',
    dim: 'text-pink-200/70',
    bg: 'bg-pink-500/15',
    bgHover: 'hover:bg-pink-500/25',
    borderActive: 'border-pink-400/50',
    bgActive: 'bg-pink-500/25'
  }
};

interface UnicornParts {
  body: string;
  hair: string;
  eyes: string;
  mouth: string;
  accessory: string;
}

interface AgentSchedule {
  id: string;
  name: string;
  description: string;
  interval: {
    type: 'cron' | 'interval';
    pattern?: string;
    value?: number;
    unit?: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  active: boolean;
}

interface SimpleAgentCreatorProps {
  onComplete?: (agentData: any) => void;
  initialAgentData?: any;
  documentId?: string;
}

export const SimpleAgentCreator = memo(({ onComplete, initialAgentData, documentId }: SimpleAgentCreatorProps) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'personality' | 'schedules'>('avatar');
  const [agentData, setAgentData] = useState(() => {
    return initialAgentData || {
      id: documentId || `agent-${Date.now()}`,
      name: '',
      description: '',
      domain: '',
      theme: 'green',
      avatar: null,
      unicornParts: null,
      personality: '',
      models: [],
      actions: [],
      schedules: [],
      externalApis: []
    };
  });

  // Get the current theme
  const currentTheme = themes[agentData?.theme as keyof typeof themes] || themes.green;

  // Update agent data handler
  const handleDataChange = useCallback((updatedData: any) => {
    setAgentData((prevData: any) => {
      const newData = { ...prevData, ...updatedData };
      return newData;
    });
  }, []);

  // Avatar generation handler
  const handleUnicornGenerated = useCallback((unicornParts: UnicornParts) => {
    handleDataChange({ 
      avatar: {
        type: 'rom-unicorn',
        unicornParts
      },
      unicornParts
    });
  }, [handleDataChange]);

  // Theme change handler
  const handleThemeChange = useCallback((theme: string) => {
    handleDataChange({ theme });
  }, [handleDataChange]);

  // Schedule management
  const addSchedule = useCallback(() => {
    const newSchedule: AgentSchedule = {
      id: generateNewId('schedule', agentData.schedules || []),
      name: `Schedule ${(agentData.schedules?.length || 0) + 1}`,
      description: '',
      interval: {
        type: 'cron',
        pattern: '0 9 * * *' // Daily at 9 AM
      },
      active: false
    };
    handleDataChange({ 
      schedules: [...(agentData.schedules || []), newSchedule] 
    });
  }, [agentData.schedules, handleDataChange]);

  const updateSchedule = useCallback((scheduleId: string, updatedSchedule: AgentSchedule) => {
    const updatedSchedules = (agentData.schedules || []).map((schedule: AgentSchedule) => 
      schedule.id === scheduleId ? updatedSchedule : schedule
    );
    handleDataChange({ schedules: updatedSchedules });
  }, [agentData.schedules, handleDataChange]);

  const deleteSchedule = useCallback((scheduleId: string) => {
    const updatedSchedules = (agentData.schedules || []).filter((schedule: AgentSchedule) => 
      schedule.id !== scheduleId
    );
    handleDataChange({ schedules: updatedSchedules });
  }, [agentData.schedules, handleDataChange]);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete(agentData);
    }
  }, [onComplete, agentData]);

  const tabs = [
    { id: 'avatar', label: 'Avatar', icon: '🎨' },
    { id: 'personality', label: 'Personality', icon: '🧠' },
    { id: 'schedules', label: 'Schedules', icon: '⏰' }
  ];

  const renderAvatarTab = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className={`w-16 h-16 mx-auto rounded-2xl ${currentTheme.bg} flex items-center justify-center ${currentTheme.border}`}>
          <span className="text-3xl">🎨</span>
        </div>
        <div className="space-y-2">
          <h3 className={`text-xl font-bold ${currentTheme.light}`}>
            Create Your Avatar
          </h3>
          <p className={`${currentTheme.dim} text-sm max-w-md mx-auto`}>
            Generate a unique ROM unicorn avatar for your AI agent
          </p>
        </div>
      </div>

      {/* Theme Selector */}
      <div className="space-y-3">
        <Label className={`${currentTheme.light} font-medium`}>Choose Theme</Label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => handleThemeChange(key)}
              className={`group relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                agentData.theme === key 
                  ? `${theme.border} ${theme.bg}` 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`w-8 h-8 mx-auto rounded-lg bg-gradient-to-br ${theme.gradient} border ${theme.border}`} />
              <span className={`block text-xs mt-2 font-medium ${
                agentData.theme === key ? theme.accent : 'text-gray-400'
              }`}>
                {theme.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Avatar Generation */}
      {!agentData.unicornParts ? (
        <div className="space-y-4">
          <div className={`p-6 rounded-xl ${currentTheme.bg} ${currentTheme.border}`}>
            <MatrixBox onUnicornGenerated={handleUnicornGenerated} />
            <div className="mt-4 text-center">
              <p className={`text-sm ${currentTheme.dim}`}>
                Hold down the Matrix Box to generate your unique avatar
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`p-8 rounded-xl ${currentTheme.bg} ${currentTheme.border} text-center`}>
            <CompositeUnicorn parts={agentData.unicornParts} size={160} />
            <div className="mt-4 space-y-3">
              <p className={`${currentTheme.light} font-medium`}>Your Avatar is Ready!</p>
              <Button
                onClick={() => handleDataChange({ unicornParts: null, avatar: null })}
                variant="outline"
                className={`${currentTheme.bg} ${currentTheme.border} ${currentTheme.light} hover:${currentTheme.bgHover}`}
              >
                🔄 Regenerate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPersonalityTab = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className={`w-16 h-16 mx-auto rounded-2xl ${currentTheme.bg} flex items-center justify-center ${currentTheme.border}`}>
          <span className="text-3xl">🧠</span>
        </div>
        <div className="space-y-2">
          <h3 className={`text-xl font-bold ${currentTheme.light}`}>
            Define Your Agent
          </h3>
          <p className={`${currentTheme.dim} text-sm max-w-md mx-auto`}>
            Set the name, description and personality for your AI agent
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className={`${currentTheme.light} font-medium mb-2 block`}>
            Agent Name *
          </Label>
          <Input
            id="name"
            placeholder="Enter agent name..."
            value={agentData.name}
            onChange={(e) => handleDataChange({ name: e.target.value })}
            className={`bg-gray-900 border-gray-700 ${currentTheme.light} placeholder-gray-500 focus:${currentTheme.border}`}
          />
        </div>

        <div>
          <Label htmlFor="description" className={`${currentTheme.light} font-medium mb-2 block`}>
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Describe what your agent does..."
            value={agentData.description}
            onChange={(e) => handleDataChange({ description: e.target.value })}
            rows={3}
            className={`bg-gray-900 border-gray-700 ${currentTheme.light} placeholder-gray-500 focus:${currentTheme.border} resize-none`}
          />
        </div>

        <div>
          <Label htmlFor="personality" className={`${currentTheme.light} font-medium mb-2 block`}>
            Personality & Behavior
          </Label>
          <Textarea
            id="personality"
            placeholder="Describe your agent's personality (e.g., friendly, professional, helpful)..."
            value={agentData.personality}
            onChange={(e) => handleDataChange({ personality: e.target.value })}
            rows={4}
            className={`bg-gray-900 border-gray-700 ${currentTheme.light} placeholder-gray-500 focus:${currentTheme.border} resize-none`}
          />
        </div>

        <div>
          <Label htmlFor="domain" className={`${currentTheme.light} font-medium mb-2 block`}>
            Domain/Industry
          </Label>
          <Input
            id="domain"
            placeholder="e.g., E-commerce, Healthcare, Finance..."
            value={agentData.domain}
            onChange={(e) => handleDataChange({ domain: e.target.value })}
            className={`bg-gray-900 border-gray-700 ${currentTheme.light} placeholder-gray-500 focus:${currentTheme.border}`}
          />
        </div>
      </div>

      {/* Quick Personality Suggestions */}
      <div className={`p-4 rounded-xl ${currentTheme.bg} ${currentTheme.border}`}>
        <h5 className={`text-sm font-medium ${currentTheme.light} mb-3`}>
          💡 Quick Personality Ideas
        </h5>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Friendly & Approachable",
            "Professional & Confident", 
            "Creative & Artistic",
            "Tech-Savvy & Modern",
            "Wise & Thoughtful",
            "Energetic & Playful"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleDataChange({ personality: suggestion })}
              className={`text-xs p-2 ${currentTheme.bg} ${currentTheme.border} ${currentTheme.dim} hover:${currentTheme.bgHover} transition-all duration-150 text-left rounded`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSchedulesTab = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className={`w-16 h-16 mx-auto rounded-2xl ${currentTheme.bg} flex items-center justify-center ${currentTheme.border}`}>
          <span className="text-3xl">⏰</span>
        </div>
        <div className="space-y-2">
          <h3 className={`text-xl font-bold ${currentTheme.light}`}>
            Configure Schedules
          </h3>
          <p className={`${currentTheme.dim} text-sm max-w-md mx-auto`}>
            Set up automated tasks and schedules for your AI agent
          </p>
        </div>
      </div>

      {/* Add Schedule Button */}
      <div className="flex justify-center">
        <Button
          onClick={addSchedule}
          className={`${currentTheme.bg} ${currentTheme.border} ${currentTheme.light} hover:${currentTheme.bgHover}`}
        >
          <span className="mr-2">➕</span>
          Add Schedule
        </Button>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {(agentData.schedules || []).map((schedule: AgentSchedule) => (
          <Card key={schedule.id} className={`${currentTheme.bg} ${currentTheme.border}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className={`text-base ${currentTheme.light}`}>
                  <Input
                    value={schedule.name}
                    onChange={(e) => updateSchedule(schedule.id, { ...schedule, name: e.target.value })}
                    className={`bg-transparent border-none p-0 ${currentTheme.light} font-medium text-base h-auto focus:ring-0`}
                    placeholder="Schedule name..."
                  />
                </CardTitle>
                <Button
                  onClick={() => deleteSchedule(schedule.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  🗑️
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className={`${currentTheme.light} font-medium mb-2 block`}>
                  Description
                </Label>
                <Textarea
                  value={schedule.description}
                  onChange={(e) => updateSchedule(schedule.id, { ...schedule, description: e.target.value })}
                  placeholder="What should this schedule do? (e.g., Send daily reports, Check for new orders, Update customer data)"
                  rows={2}
                  className={`bg-gray-900 border-gray-700 ${currentTheme.light} placeholder-gray-500 focus:${currentTheme.border} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className={`${currentTheme.light} font-medium mb-2 block`}>
                    Interval Type
                  </Label>
                  <Select
                    value={schedule.interval.type}
                    onValueChange={(value: 'cron' | 'interval') => 
                      updateSchedule(schedule.id, { 
                        ...schedule, 
                        interval: { ...schedule.interval, type: value }
                      })
                    }
                  >
                    <SelectTrigger className={`bg-gray-900 border-gray-700 ${currentTheme.light}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cron">Cron (Specific times)</SelectItem>
                      <SelectItem value="interval">Interval (Every X time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {schedule.interval.type === 'cron' ? (
                  <div>
                    <Label className={`${currentTheme.light} font-medium mb-2 block`}>
                      Cron Pattern
                    </Label>
                    <Select
                      value={schedule.interval.pattern}
                      onValueChange={(value) => 
                        updateSchedule(schedule.id, { 
                          ...schedule, 
                          interval: { ...schedule.interval, pattern: value }
                        })
                      }
                    >
                      <SelectTrigger className={`bg-gray-900 border-gray-700 ${currentTheme.light}`}>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0 9 * * *">Daily at 9 AM</SelectItem>
                        <SelectItem value="0 */6 * * *">Every 6 hours</SelectItem>
                        <SelectItem value="0 0 * * 1">Weekly (Mondays)</SelectItem>
                        <SelectItem value="0 0 1 * *">Monthly</SelectItem>
                        <SelectItem value="*/30 * * * *">Every 30 minutes</SelectItem>
                        <SelectItem value="0 * * * *">Every hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className={`${currentTheme.light} font-medium mb-2 block text-xs`}>
                        Every
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={schedule.interval.value || 1}
                        onChange={(e) => 
                          updateSchedule(schedule.id, { 
                            ...schedule, 
                            interval: { 
                              ...schedule.interval, 
                              value: parseInt(e.target.value) || 1 
                            }
                          })
                        }
                        className={`bg-gray-900 border-gray-700 ${currentTheme.light}`}
                      />
                    </div>
                    <div>
                      <Label className={`${currentTheme.light} font-medium mb-2 block text-xs`}>
                        Unit
                      </Label>
                      <Select
                        value={schedule.interval.unit || 'hours'}
                        onValueChange={(value: 'minutes' | 'hours' | 'days' | 'weeks') => 
                          updateSchedule(schedule.id, { 
                            ...schedule, 
                            interval: { ...schedule.interval, unit: value }
                          })
                        }
                      >
                        <SelectTrigger className={`bg-gray-900 border-gray-700 ${currentTheme.light}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`active-${schedule.id}`}
                  checked={schedule.active}
                  onChange={(e) => 
                    updateSchedule(schedule.id, { ...schedule, active: e.target.checked })
                  }
                  className="rounded border-gray-600 bg-gray-900"
                />
                <Label 
                  htmlFor={`active-${schedule.id}`} 
                  className={`${currentTheme.light} text-sm`}
                >
                  Active schedule
                </Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(agentData.schedules || []).length === 0 && (
        <div className={`text-center p-8 rounded-xl ${currentTheme.bg} ${currentTheme.border}`}>
          <div className={`w-12 h-12 mx-auto rounded-lg ${currentTheme.bg} flex items-center justify-center mb-3`}>
            <span className="text-2xl">⏰</span>
          </div>
          <p className={`${currentTheme.dim} text-sm`}>
            No schedules yet. Add your first automated task above.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className={`text-3xl sm:text-4xl font-bold ${currentTheme.light} font-mono`}>
            Create Your AI Agent
          </h2>
          <p className={`${currentTheme.dim} font-mono text-lg max-w-2xl mx-auto leading-relaxed`}>
            Build a powerful AI agent with custom avatar, personality, and automated schedules
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className={`flex rounded-xl ${currentTheme.bg} ${currentTheme.border} p-1`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? `${currentTheme.bgActive} ${currentTheme.light}`
                    : `${currentTheme.dim} hover:${currentTheme.light}`
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <Card className={`${currentTheme.bg} ${currentTheme.border}`}>
          <CardContent className="p-6">
            {activeTab === 'avatar' && renderAvatarTab()}
            {activeTab === 'personality' && renderPersonalityTab()}
            {activeTab === 'schedules' && renderSchedulesTab()}
          </CardContent>
        </Card>

        {/* Complete Button */}
        <div className="text-center">
          <Button
            onClick={handleComplete}
            disabled={!agentData.name || (!agentData.unicornParts && !agentData.avatar)}
            className={`px-8 py-4 font-mono text-lg font-semibold transition-all duration-200 ${currentTheme.bg} hover:${currentTheme.bgHover} ${currentTheme.light} ${currentTheme.border} backdrop-blur-sm rounded-xl hover:scale-105 hover:shadow-lg flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>✨</span>
            <span>Create My Agent</span>
            <span>→</span>
          </Button>
          <p className={`${currentTheme.dim} font-mono text-xs mt-3`}>
            Your agent will be created and ready to deploy!
          </p>
        </div>
      </div>
    </div>
  );
});

SimpleAgentCreator.displayName = 'SimpleAgentCreator'; 