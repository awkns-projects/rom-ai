import * as React from 'react';
import { memo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossIcon, PlusIcon } from '@/components/icons';
import type { AgentSchedule, ActionChainStep, AgentAction, EnvVar, AgentModel } from '../../types';
import { generateNewId } from '../../utils';

interface ScheduleMindMapEditorProps {
  schedule: AgentSchedule;
  onUpdate: (schedule: AgentSchedule) => void;
  onDelete: () => void;
  availableActions?: AgentAction[];
  allModels?: AgentModel[];
  documentId?: string;
}

interface ScheduleCard {
  id: string;
  type: 'setup' | 'action' | 'add-action' | 'execute';
  icon: string;
  title: string;
  subtitle: string;
  status: 'complete' | 'incomplete' | 'ready' | 'active';
  content: React.ReactNode;
  actionButton?: React.ReactNode;
  position: {
    desktop: { x: number; y: number };
    mobile: { x: number; y: number };
  };
}

export const ScheduleMindMapEditor = memo(({
  schedule,
  onUpdate,
  onDelete,
  availableActions = [],
  allModels = [],
  documentId
}: ScheduleMindMapEditorProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>('setup');
    const [isMobile, setIsMobile] = useState(false);

  // Ensure schedule is properly initialized
  useEffect(() => {
    const needsUpdate = !schedule.trigger || !schedule.steps;
    
    if (needsUpdate) {
      onUpdate({
        ...schedule,
        trigger: schedule.trigger || {
          type: 'cron',
          pattern: '0 0 * * *',
          timezone: 'UTC',
          active: false
        },
        steps: schedule.steps || []
      });
    }
  }, [schedule, onUpdate]);

  // Detect mobile/desktop
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const executeSchedule = useCallback(async () => {
    if (!schedule.steps?.length || !documentId) return;

    setIsExecuting(true);

    try {
      const response = await fetch('/api/agent/execute-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          scheduleId: schedule.id,
          steps: schedule.steps,
          testMode: true,
          trigger: {
            pattern: schedule.trigger?.pattern || '0 0 * * *',
            timezone: schedule.trigger?.timezone || 'UTC',
            active: false
          }
        }),
      });

      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      console.error('Error executing schedule:', error);
      setExecutionResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsExecuting(false);
    }
  }, [schedule, documentId]);

  const addNewAction = () => {
    const newStep: ActionChainStep = {
      id: generateNewId('step', schedule.steps || []),
      actionId: '',
      name: `Action ${(schedule.steps || []).length + 1}`,
      description: '',
      condition: { type: 'always' },
      onError: { action: 'stop' }
    };
    const updatedSteps = [...(schedule.steps || []), newStep];
    onUpdate({ ...schedule, steps: updatedSteps });
    setExpandedCard(newStep.id);
  };

  const removeAction = (stepId: string) => {
    const updatedSteps = schedule.steps?.filter(s => s.id !== stepId) || [];
    onUpdate({ ...schedule, steps: updatedSteps });
    if (expandedCard === stepId) {
      setExpandedCard(null);
    }
  };

  const moveAction = (stepId: string, direction: 'up' | 'down') => {
    const steps = schedule.steps || [];
    const currentIndex = steps.findIndex(s => s.id === stepId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const updatedSteps = [...steps];
    [updatedSteps[currentIndex], updatedSteps[newIndex]] = [updatedSteps[newIndex], updatedSteps[currentIndex]];
    
    onUpdate({ ...schedule, steps: updatedSteps });
  };

  const getSetupStatus = () => {
    if (schedule.name?.trim() && schedule.description?.trim() && schedule.trigger?.type) {
      return 'complete';
    }
    return 'incomplete';
  };

  const getBasicSetupStatus = () => {
    // Just need name to start adding actions
    return schedule.name?.trim() ? 'ready' : 'incomplete';
  };

  const getActionStatus = (step: ActionChainStep) => {
    return step.actionId ? 'complete' : 'incomplete';
  };

  const getExecutionStatus = () => {
    if (schedule.steps?.length && schedule.trigger?.active) return 'active';
    if (schedule.steps?.length) return 'ready';
    return 'incomplete';
  };

  const StatusIcon = ({ status }: { status: 'complete' | 'incomplete' | 'ready' | 'active' }) => {
    switch (status) {
      case 'complete':
        return <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</div>;
      case 'ready':
        return <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">⚡</div>;
      case 'active':
        return <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white animate-pulse">▶</div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">○</div>;
    }
  };

  // Generate cards with responsive positioning
  const generateCards = (): ScheduleCard[] => {
    const cards: ScheduleCard[] = [];
    let currentIndex = 0;

    // Helper to get position for current index
    const getPosition = (index: number) => ({
      desktop: { x: 50 + (index * 420), y: 100 },
      mobile: { x: 20, y: 50 + (index * 300) }
    });

    // Setup Card
    cards.push({
      id: 'setup',
      type: 'setup',
      icon: '⚙️',
      title: 'Schedule Setup',
      subtitle: schedule.name 
        ? `${schedule.name} • ${schedule.trigger?.type && schedule.trigger?.pattern ? schedule.trigger.type : 'Configure timing'}`
        : 'Define name, purpose, and timing',
      status: getSetupStatus(),
      position: getPosition(currentIndex++),
      content: getSetupStatus() === 'complete' && expandedCard !== 'setup'
        ? `Automated schedule "${schedule.name}" configured to run ${
            schedule.trigger?.type === 'cron' ? schedule.trigger.pattern :
            schedule.trigger?.type === 'interval' ? `every ${schedule.trigger.interval?.value} ${schedule.trigger.interval?.unit}` :
            schedule.trigger?.type === 'date' ? 'on specific date' :
            'manually'
          }.`
        : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-orange-300 font-mono text-sm">✨ Schedule Name</Label>
                <Input
                  value={schedule.name || ''}
                  onChange={(e) => onUpdate({ ...schedule, name: e.target.value })}
                  placeholder="e.g., Daily Reports, Weekly Sync"
                  className="bg-slate-800 border-slate-600 text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-orange-300 font-mono text-sm">📝 Vision & Purpose</Label>
                <Textarea
                  value={schedule.description || ''}
                  onChange={(e) => onUpdate({ ...schedule, description: e.target.value })}
                  placeholder="Describe what this automation chain will accomplish..."
                  className="bg-slate-800 border-slate-600 text-white font-mono text-sm min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-orange-300 font-mono text-sm">⏰ Trigger Type</Label>
                <Select
                  value={schedule.trigger?.type || 'cron'}
                  onValueChange={(value: 'cron' | 'interval' | 'date' | 'manual') => onUpdate({
                    ...schedule,
                    trigger: { ...schedule.trigger, type: value }
                  })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="cron" className="text-white font-mono">Cron Schedule</SelectItem>
                    <SelectItem value="interval" className="text-white font-mono">Regular Interval</SelectItem>
                    <SelectItem value="date" className="text-white font-mono">Specific Date</SelectItem>
                    <SelectItem value="manual" className="text-white font-mono">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {schedule.trigger?.type === 'cron' && (
                <div className="space-y-2">
                  <Label className="text-orange-300 font-mono text-sm">Pattern</Label>
                  <Select
                    value={schedule.trigger?.pattern || '0 0 * * *'}
                    onValueChange={(value) => onUpdate({
                      ...schedule,
                      trigger: { ...schedule.trigger, pattern: value }
                    })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="*/10 * * * *">Every 10 minutes</SelectItem>
                      <SelectItem value="0 * * * *">Every hour</SelectItem>
                      <SelectItem value="0 9 * * 1-5">Weekdays at 9 AM</SelectItem>
                      <SelectItem value="0 0 * * *">Daily at midnight</SelectItem>
                      <SelectItem value="0 0 * * 0">Weekly on Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {schedule.trigger?.type === 'interval' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-orange-300 font-mono text-sm">Every</Label>
                    <Input
                      type="number"
                      value={schedule.trigger?.interval?.value || 1}
                      onChange={(e) => onUpdate({
                        ...schedule,
                        trigger: { 
                          ...schedule.trigger, 
                          interval: { 
                            unit: schedule.trigger?.interval?.unit || 'hours',
                            value: parseInt(e.target.value) || 1 
                          }
                        }
                      })}
                      className="bg-slate-800 border-slate-600 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-orange-300 font-mono text-sm">Unit</Label>
                    <Select
                      value={schedule.trigger?.interval?.unit || 'hours'}
                      onValueChange={(value: 'minutes' | 'hours' | 'days' | 'weeks') => onUpdate({
                        ...schedule,
                        trigger: { 
                          ...schedule.trigger, 
                          interval: { 
                            value: schedule.trigger?.interval?.value || 1,
                            unit: value 
                          }
                        }
                      })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white font-mono">
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
          </div>
        ),
      actionButton: (
        <div className="space-y-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (getBasicSetupStatus() === 'ready' && schedule.steps?.length === 0) {
                addNewAction();
              } else if (getSetupStatus() !== 'complete') {
                // Focus the first incomplete field
                setExpandedCard('setup');
              }
            }}
            className={`w-full font-mono py-3 rounded-lg ${
              getBasicSetupStatus() === 'ready'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{getBasicSetupStatus() === 'ready' ? '✨' : '⚠️'}</span>
              {getBasicSetupStatus() === 'ready' 
                ? (schedule.steps?.length === 0 ? 'Add First Action →' : 'Setup Complete ✓')
                : 'Add Schedule Name First'
              }
            </div>
          </Button>
          
          {/* Always show action chain button if name exists */}
          {schedule.name?.trim() && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                addNewAction();
              }}
              variant="outline"
              className="w-full font-mono py-2 text-orange-300 border-orange-500/30 hover:bg-orange-500/10"
            >
              <div className="flex items-center gap-2">
                <PlusIcon size={16} />
                Add Action to Chain
              </div>
            </Button>
          )}
        </div>
      )
    });

    // Action Cards
    (schedule.steps || []).forEach((step, index) => {
      const action = availableActions.find(a => a.id === step.actionId);
      
      cards.push({
        id: step.id,
        type: 'action',
        icon: action?.emoji || '🔧',
        title: `Action ${index + 1}`,
        subtitle: action?.name || 'Select an action to configure',
        status: getActionStatus(step),
        position: getPosition(currentIndex++),
        content: getActionStatus(step) === 'complete' && expandedCard !== step.id
          ? (
            <div className="space-y-2">
              <div className="text-slate-300 text-sm font-mono leading-relaxed">
                Execute "{action?.name}" with {step.delay?.duration ? `${step.delay.duration / 1000}s delay` : 'no delay'}. On error: {step.onError?.action || 'stop'}.
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>📍 Step {index + 1} of {schedule.steps?.length}</span>
                {index > 0 && <span>⬅️ After Step {index}</span>}
                {index < (schedule.steps?.length || 0) - 1 && <span>➡️ Before Step {index + 2}</span>}
              </div>
            </div>
          )
          : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-orange-300 font-mono text-sm">🎯 Select Action</Label>
                <Select
                  value={step.actionId}
                  onValueChange={(actionId: string) => {
                    const selectedAction = availableActions.find(a => a.id === actionId);
                    const updatedSteps = schedule.steps?.map(s => 
                      s.id === step.id ? { 
                        ...s, 
                        actionId,
                        name: selectedAction?.name || s.name 
                      } : s
                    ) || [];
                    onUpdate({ ...schedule, steps: updatedSteps });
                  }}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white font-mono">
                    <SelectValue placeholder={
                      availableActions.length === 0 
                        ? "No actions available" 
                        : "Choose an action..."
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 max-h-60 overflow-y-auto">
                    {availableActions.length === 0 ? (
                      <div className="p-4 text-slate-400 text-sm font-mono text-center">
                        <div className="mb-2">🔧 No actions available</div>
                        <div className="text-xs">
                          Create actions first in the main builder to use them in schedules.
                        </div>
                      </div>
                    ) : (
                      availableActions.map(action => (
                        <SelectItem 
                          key={action.id} 
                          value={action.id} 
                          className="text-white font-mono hover:bg-slate-700 focus:bg-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <span>{action.emoji || '🔧'}</span>
                            <div>
                              <div>{action.name}</div>
                              {action.description && (
                                <div className="text-xs text-slate-400 truncate max-w-[200px]">
                                  {action.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {action && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="text-orange-300 font-mono text-sm font-medium mb-1">Selected Action</div>
                  <div className="text-white font-mono text-sm">{action.description}</div>
                  <div className="text-slate-400 font-mono text-xs mt-1">
                    {action.role} • {action.execute?.type}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-orange-300 font-mono text-sm">⏱️ Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={step.delay?.duration ? step.delay.duration / 1000 : 0}
                    onChange={(e) => {
                      const seconds = parseInt(e.target.value) || 0;
                      const updatedSteps = schedule.steps?.map(s => 
                        s.id === step.id ? { 
                          ...s, 
                          delay: { duration: seconds * 1000, unit: 'seconds' as const }
                        } : s
                      ) || [];
                      onUpdate({ ...schedule, steps: updatedSteps });
                    }}
                    className="bg-slate-800 border-slate-600 text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-orange-300 font-mono text-sm">🚨 On Error</Label>
                  <Select
                    value={step.onError?.action || 'stop'}
                    onValueChange={(value: 'stop' | 'continue' | 'retry') => {
                      const updatedSteps = schedule.steps?.map(s => 
                        s.id === step.id ? { 
                          ...s, 
                          onError: { ...s.onError, action: value }
                        } : s
                      ) || [];
                      onUpdate({ ...schedule, steps: updatedSteps });
                    }}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stop">Stop Chain</SelectItem>
                      <SelectItem value="continue">Continue</SelectItem>
                      <SelectItem value="retry">Retry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chain Management */}
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveAction(step.id, 'up');
                  }}
                  disabled={index === 0}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-slate-400 border-slate-600"
                >
                  ↑ Move Up
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveAction(step.id, 'down');
                  }}
                  disabled={index === (schedule.steps?.length || 0) - 1}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-slate-400 border-slate-600"
                >
                  ↓ Move Down
                </Button>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAction(step.id);
                }}
                variant="destructive"
                className="w-full font-mono"
              >
                <div className="flex items-center gap-2">
                  <CrossIcon size={14} />
                  Remove Action
                </div>
              </Button>
            </div>
          ),
        actionButton: (
          <div className="space-y-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                addNewAction();
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-mono py-3 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <PlusIcon size={16} />
                Add Next Action →
              </div>
            </Button>
            
            {getActionStatus(step) === 'complete' && (
              <div className="text-center text-xs text-slate-400 font-mono">
                Step {index + 1} ready • Chain continues
              </div>
            )}
          </div>
        )
      });
    });

    // Add Action Card (if no actions yet)
    if (schedule.steps?.length === 0 && getBasicSetupStatus() === 'ready') {
      cards.push({
        id: 'add-action',
        type: 'add-action',
        icon: '➕',
        title: 'Add Action',
        subtitle: 'Start building your chain',
        status: 'incomplete',
        position: getPosition(currentIndex++),
        content: (
          <div className="space-y-3">
            <div className="text-slate-300 text-sm font-mono leading-relaxed">
              Click to add your first action to the automation chain.
            </div>
            {getSetupStatus() !== 'complete' && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="text-orange-300 font-mono text-xs font-medium mb-1">⚠️ Complete Setup Later</div>
                <div className="text-orange-200 text-xs">
                  You can add actions now and configure timing later in the Setup card.
                </div>
              </div>
            )}
          </div>
        ),
        actionButton: (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              addNewAction();
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-mono py-3 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <PlusIcon size={16} />
              Add First Action →
            </div>
          </Button>
        )
      });
    }

    // Execute Card
    if (schedule.steps?.length > 0) {
      cards.push({
        id: 'execute',
        type: 'execute',
        icon: '🚀',
        title: 'Execute',
        subtitle: schedule.trigger?.active ? 'Schedule is active' : 'Ready to activate',
        status: getExecutionStatus(),
        position: getPosition(currentIndex++),
        content: (
          <div className="space-y-3">
            <div className="text-slate-300 text-sm font-mono leading-relaxed">
              {`${schedule.steps.length} action${schedule.steps.length === 1 ? '' : 's'} ready to execute. Schedule will ${schedule.trigger?.active ? 'run automatically' : 'run when activated'}.`}
            </div>
            
            {/* Chain Summary */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600">
              <div className="text-orange-300 font-mono text-xs font-medium mb-2">Action Chain Summary:</div>
              <div className="space-y-1">
                {schedule.steps?.map((step, index) => {
                  const action = availableActions.find(a => a.id === step.actionId);
                  return (
                    <div key={step.id} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">{index + 1}.</span>
                      <span className="text-slate-300">
                        {action?.name || 'Unconfigured Action'}
                      </span>
                      {step.delay?.duration && step.delay.duration > 0 && (
                        <span className="text-orange-400">({step.delay.duration / 1000}s delay)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Status */}
            <div className={`p-3 rounded-lg border ${
              schedule.trigger?.active 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-slate-500/10 border-slate-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  schedule.trigger?.active ? 'bg-green-400 animate-pulse' : 'bg-slate-400'
                }`} />
                <span className={`font-mono text-sm ${
                  schedule.trigger?.active ? 'text-green-300' : 'text-slate-300'
                }`}>
                  {schedule.trigger?.active ? 'ACTIVE - Running automatically' : 'INACTIVE - Manual trigger only'}
                </span>
              </div>
            </div>
          </div>
        ),
        actionButton: (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  executeSchedule();
                }}
                disabled={isExecuting}
                className="bg-orange-600 hover:bg-orange-700 text-white font-mono py-2"
              >
                {isExecuting ? '🧪 Testing...' : '🧪 Test Chain'}
              </Button>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ 
                    ...schedule, 
                    trigger: { 
                      ...schedule.trigger!, 
                      active: !schedule.trigger?.active 
                    } 
                  });
                }}
                className={`font-mono py-2 ${
                  schedule.trigger?.active 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {schedule.trigger?.active ? '⏸️ Deactivate' : '▶️ Activate'}
              </Button>
            </div>

            {executionResult && (
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-600">
                <div className="text-orange-300 font-mono text-sm font-medium mb-1">Test Result</div>
                <div className={`text-sm font-mono ${executionResult.success ? 'text-green-300' : 'text-red-300'}`}>
                  {executionResult.success ? `✅ Success (${executionResult.duration}ms)` : `❌ Failed`}
                </div>
                {executionResult.error && (
                  <div className="text-red-400 font-mono text-xs mt-1">
                    {executionResult.error}
                  </div>
                )}
              </div>
            )}
            
            <div className="text-center text-xs text-slate-400 font-mono">
              {schedule.trigger?.active ? '🟢 Schedule will run automatically' : '🔴 Manual activation required'}
            </div>
          </div>
        )
      });
    }

    return cards;
  };

  const cards = generateCards();

  // Generate connections between cards
  const getConnectionPath = (fromCard: ScheduleCard, toCard: ScheduleCard) => {
    const currentPosition = isMobile ? 'mobile' : 'desktop';
    const cardWidth = isMobile ? 280 : 380;
    const cardHeight = 200;
    
    const startX = fromCard.position[currentPosition].x + (isMobile ? cardWidth / 2 : cardWidth);
    const startY = fromCard.position[currentPosition].y + cardHeight / 2;
    const endX = toCard.position[currentPosition].x + (isMobile ? cardWidth / 2 : 0);
    const endY = toCard.position[currentPosition].y + cardHeight / 2;
    
    if (isMobile) {
      // Vertical connections for mobile
      const midY = (startY + endY) / 2;
      return `M ${startX} ${startY} Q ${startX} ${midY} ${endX} ${endY}`;
    } else {
      // Horizontal curved connections for desktop
      const midX = (startX + endX) / 2;
      return `M ${startX} ${startY} Q ${midX} ${startY} ${endX} ${endY}`;
    }
  };

  const renderCard = (card: ScheduleCard) => {
    const isExpanded = expandedCard === card.id;
    const currentPosition = isMobile ? 'mobile' : 'desktop';
    const cardWidth = isMobile ? 280 : 380;
    
    return (
      <div
        key={card.id}
        className={`absolute transition-all duration-500 cursor-pointer ${
          isExpanded ? 'z-20' : 'z-10'
        }`}
        style={{
          left: card.position[currentPosition].x,
          top: card.position[currentPosition].y,
          width: cardWidth,
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
        }}
        onClick={() => setExpandedCard(isExpanded ? null : card.id)}
      >
        <div
          className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${
            isExpanded
              ? 'bg-orange-500/10 border-orange-400/50 shadow-xl shadow-orange-500/20'
              : 'bg-slate-900/80 border-slate-600/50 hover:border-orange-400/40 hover:bg-slate-900/90'
          } ${
            card.status === 'complete' ? 'ring-2 ring-emerald-400/50' :
            card.status === 'active' ? 'ring-2 ring-green-400/50' : ''
          }`}
          style={{
            backdropFilter: 'blur(8px)',
            minHeight: isExpanded ? '400px' : '200px',
            ...(isExpanded && {
              boxShadow: '0 0 30px rgba(251, 146, 60, 0.2), inset 0 0 20px rgba(251, 146, 60, 0.05)'
            })
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <h3 className={`font-mono font-bold transition-all duration-300 ${
                  isExpanded ? 'text-white text-lg' : 'text-white text-base'
                }`}>
                  {card.title}
                </h3>
                <p className={`text-slate-400 font-mono transition-all duration-300 ${
                  isExpanded ? 'text-sm' : 'text-xs'
                }`}>
                  {card.subtitle}
                </p>
              </div>
            </div>
            <StatusIcon status={card.status} />
          </div>

          {/* Content */}
          {!isExpanded ? (
            <div className="text-slate-300 text-sm font-mono leading-relaxed flex-1">
              {typeof card.content === 'string' ? card.content : ''}
            </div>
          ) : (
            <div className="flex-1 overflow-auto" onClick={(e) => e.stopPropagation()}>
              {card.content}
            </div>
          )}

          {/* Action Button */}
          {card.actionButton && (
            <div className="mt-4 pt-4 border-t border-slate-600/50" onClick={(e) => e.stopPropagation()}>
              {card.actionButton}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[600px] flex flex-col bg-orange-950/40">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-orange-700/30 bg-orange-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <span className="text-orange-400 text-lg md:text-xl">🔗</span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white font-mono">Schedule Builder</h3>
              <p className="text-orange-200 text-xs md:text-sm font-mono">
                {isMobile ? 'Setup → Chain → Activate' : 'Build automated action chains with timing'}
              </p>
            </div>
          </div>
          <Button
            onClick={onDelete}
            variant="destructive"
            size={isMobile ? "sm" : "default"}
            className="px-2 md:px-4 py-1 md:py-2"
          >
            <div className="flex items-center gap-1 md:gap-2">
              <CrossIcon size={isMobile ? 14 : 16} />
              {!isMobile && <span>Remove</span>}
            </div>
          </Button>
        </div>
      </div>

      {/* Schedule Overview */}
      {(schedule.steps?.length > 0 || schedule.name) && (
        <div className="p-4 md:p-6 border-b border-orange-700/30 bg-orange-950/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-mono font-medium">
                {schedule.name || 'Unnamed Schedule'}
              </div>
              <div className="text-orange-300 text-sm font-mono">
                {schedule.steps?.length || 0} action{schedule.steps?.length === 1 ? '' : 's'} • 
                {schedule.trigger?.active ? ' 🟢 Active' : ' 🔴 Inactive'}
              </div>
            </div>
            <div className="flex gap-2">
              {schedule.steps?.length === 0 && schedule.name?.trim() && (
                <Button
                  onClick={addNewAction}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-mono text-sm px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <PlusIcon size={16} />
                    Add Actions
                  </div>
                </Button>
              )}
              {schedule.steps?.length > 0 && (
                <Button
                  onClick={() => setExpandedCard('execute')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-mono text-sm px-4 py-2"
                >
                  {schedule.trigger?.active ? '⏸️ Manage' : '▶️ Activate'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card Flow Container */}
      <div className="flex-1 relative min-h-[500px] overflow-auto">
        <div 
          className="relative bg-gradient-to-br from-orange-950/30 via-orange-900/10 to-orange-950/30"
          style={{ 
            minHeight: isMobile ? (cards.length * 320) + 100 : '600px', 
            minWidth: isMobile ? '320px' : (cards.length * 420) + 100,
            width: '100%'
          }}
        >
          {/* SVG for connections */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ zIndex: 1 }}
          >
            {cards.map((card, index) => {
              if (index === cards.length - 1) return null;
              const nextCard = cards[index + 1];
              
              return (
                <path
                  key={`connection-${card.id}-${nextCard.id}`}
                  d={getConnectionPath(card, nextCard)}
                  stroke="#FB923C"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="5,5"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* Cards */}
          {cards.map(card => renderCard(card))}

          {/* Quick Actions */}
          {!expandedCard && (
            <div className={`absolute flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 ${
              isMobile ? 'bottom-4 right-4' : 'bottom-4 right-4'
            }`}>
              <Button
                onClick={() => setExpandedCard('setup')}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-2 font-mono"
              >
                🎯 Setup
              </Button>
              {schedule.steps?.length === 0 && getBasicSetupStatus() === 'ready' && (
                <Button
                  onClick={addNewAction}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-2 font-mono"
                >
                  ✨ Add Action
                </Button>
              )}
              {schedule.steps?.length > 0 && (
                <Button
                  onClick={() => setExpandedCard('execute')}
                  className={`text-xs px-3 py-2 font-mono ${
                    schedule.trigger?.active 
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {schedule.trigger?.active ? '🟢 Active' : '🚀 Activate'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ScheduleMindMapEditor.displayName = 'ScheduleMindMapEditor'; 