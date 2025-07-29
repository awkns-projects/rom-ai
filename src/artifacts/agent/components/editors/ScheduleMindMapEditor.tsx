import * as React from 'react';
import { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossIcon, PlusIcon } from '@/components/icons';
import type { AgentSchedule, ActionChainStep, AgentAction, AgentModel } from '../../types';
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
  type: 'action';
  position: {
    desktop: { x: number; y: number };
    mobile: { x: number; y: number };
  };
  data: { step: ActionChainStep; index: number };
}

export const ScheduleMindMapEditor = memo(({
  schedule,
  onUpdate,
  onDelete,
  availableActions = [],
  allModels = [],
  documentId
}: ScheduleMindMapEditorProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Detect mobile/desktop
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const addNewAction = () => {
    const newStep: ActionChainStep = {
      id: generateNewId('step', schedule.steps || []),
      name: `Action ${(schedule.steps?.length || 0) + 1}`,
      actionId: '',
      order: (schedule.steps?.length || 0) + 1,
      delay: { duration: 0, unit: 'seconds' },
      onError: { action: 'stop' }
    };

    onUpdate({
      ...schedule,
      steps: [...(schedule.steps || []), newStep]
    });
  };

  const removeAction = (stepId: string) => {
    const updatedSteps = schedule.steps?.filter(s => s.id !== stepId) || [];
    onUpdate({ ...schedule, steps: updatedSteps });
  };

  const updateAction = (stepId: string, updates: Partial<ActionChainStep>) => {
    const updatedSteps = schedule.steps?.map(s => 
      s.id === stepId ? { ...s, ...updates } : s
    ) || [];
    onUpdate({ ...schedule, steps: updatedSteps });
  };

  const executeSchedule = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch('/api/agent/execute-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule,
          documentId,
          testMode: true
        }),
      });
      
      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({ success: false, error: 'Execution failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  // Pure actions chain only (mind map shows only after setup is complete)
  const generateCards = (): ScheduleCard[] => {
    const cards: ScheduleCard[] = [];
    
    if (schedule.steps && schedule.steps.length > 0) {
      schedule.steps.forEach((step, index) => {
        cards.push({
          id: step.id,
          type: 'action',
          position: {
            desktop: { x: 50 + (index * 320), y: 50 },
            mobile: { x: 20, y: 50 + (index * 280) }
          },
          data: { step, index }
        });
      });
    }

    return cards;
  };

  // Only action-to-action connections (within the chain)
  const getConnectionPath = (fromCard: ScheduleCard, toCard: ScheduleCard) => {
    const currentPosition = isMobile ? 'mobile' : 'desktop';
    const cardWidth = isMobile ? 280 : 300;
    const cardHeight = 160;
    
    if (isMobile) {
      // Mobile: Vertical connections between actions
      const fromX = fromCard.position[currentPosition].x + cardWidth / 2;
      const fromY = fromCard.position[currentPosition].y + cardHeight;
      const toX = toCard.position[currentPosition].x + cardWidth / 2;
      const toY = toCard.position[currentPosition].y;
      
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    } else {
      // Desktop: Horizontal connections between actions in chain
      const fromX = fromCard.position[currentPosition].x + cardWidth;
      const fromY = fromCard.position[currentPosition].y + cardHeight / 2;
      const toX = toCard.position[currentPosition].x;
      const toY = toCard.position[currentPosition].y + cardHeight / 2;
      
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }
  };

  const cards = generateCards();

  const getSetupStatus = () => {
    return schedule.name && schedule.trigger?.type ? 'complete' : 'incomplete';
  };

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <span className="text-orange-400 text-lg md:text-xl">📅</span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-orange-200 font-mono">
                Schedule Builder
              </h3>
              <p className="text-orange-400 text-xs md:text-sm font-mono">
                Setup → Actions → Execute
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

      {/* Setup Section */}
      <div className="p-4 md:p-6 border-b border-orange-500/20 bg-orange-500/5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <span className="text-orange-400">⚙️</span>
            </div>
            <h4 className="text-orange-200 font-mono font-semibold">Schedule Setup</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-orange-300 font-mono text-sm">✨ Schedule Name</Label>
              <Input
                value={schedule.name || ''}
                onChange={(e) => onUpdate({ ...schedule, name: e.target.value })}
                placeholder="e.g., Daily Reports, Weekly Sync"
                className="bg-black/50 border-orange-500/30 text-orange-200 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-orange-300 font-mono text-sm">📝 Description</Label>
              <Textarea
                value={schedule.description || ''}
                onChange={(e) => onUpdate({ ...schedule, description: e.target.value })}
                placeholder="Describe what this automation chain will accomplish..."
                className="bg-black/50 border-orange-500/30 text-orange-200 font-mono text-xs min-h-[80px] resize-none"
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
                <SelectTrigger className="bg-black/50 border-orange-500/30 text-orange-200 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-orange-500/30">
                  <SelectItem value="cron" className="text-orange-200 font-mono">Cron Schedule</SelectItem>
                  <SelectItem value="interval" className="text-orange-200 font-mono">Regular Interval</SelectItem>
                  <SelectItem value="date" className="text-orange-200 font-mono">Specific Date</SelectItem>
                  <SelectItem value="manual" className="text-orange-200 font-mono">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {schedule.name?.trim() && schedule.trigger?.type && !schedule.steps?.length && (
              <Button
                onClick={addNewAction}
                className="btn-matrix w-full text-sm py-2"
              >
                ➕ Add First Action →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Actions Chain Mind Map - Only shows when actions exist */}
      {schedule.steps && schedule.steps.length > 0 && (
        <div className="border-b border-purple-500/20 bg-purple-500/5">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <span className="text-purple-400">🔗</span>
              </div>
              <h4 className="text-purple-200 font-mono font-semibold">Actions Chain</h4>
              <div className="text-purple-400 text-xs">
                {schedule.steps.length} action{schedule.steps.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <div className="relative min-h-[300px] overflow-auto">
            <div 
              className="relative bg-gradient-to-r from-purple-950/20 to-purple-900/20 p-4"
              style={{ 
                minHeight: isMobile ? 
                  `${100 + (schedule.steps.length * 280)}px` : 
                  '240px', 
                minWidth: isMobile ? '320px' : 
                  `${Math.max(400, schedule.steps.length * 320)}px`,
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
                      stroke="#A855F7"
                      strokeWidth={2}
                      fill="none"
                      strokeDasharray="5,5"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>

              {/* Action Cards */}
              {cards.map(card => {
                const { step, index } = card.data;
                const action = availableActions.find(a => a.id === step.actionId);
                const currentPosition = isMobile ? 'mobile' : 'desktop';
                const cardWidth = isMobile ? 280 : 300;
                
                return (
                  <div
                    key={card.id}
                    className="absolute transition-all duration-300 z-10"
                    style={{
                      left: card.position[currentPosition].x,
                      top: card.position[currentPosition].y,
                      width: cardWidth,
                    }}
                  >
                    <div className="p-3 rounded-xl border bg-slate-800/60 border-slate-600/50 hover:border-slate-400/70 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{action?.emoji || '🔧'}</span>
                          <div>
                            <h5 className="text-slate-200 font-mono font-bold text-sm">Action {index + 1}</h5>
                            <p className="text-slate-400 font-mono text-xs">
                              {action?.name || 'Select action'}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeAction(step.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1"
                        >
                          <CrossIcon size={12} />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <Select
                          value={step.actionId}
                          onValueChange={(actionId: string) => {
                            const selectedAction = availableActions.find(a => a.id === actionId);
                            updateAction(step.id, { 
                              actionId,
                              name: selectedAction?.name || step.name 
                            });
                          }}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-slate-600/50 text-slate-200 text-xs h-8">
                            <SelectValue placeholder="Choose action..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-600/50">
                            {availableActions.map(action => (
                              <SelectItem key={action.id} value={action.id} className="text-slate-200 font-mono text-xs">
                                {action.emoji} {action.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-slate-400 text-xs">Delay (sec)</Label>
                            <Input
                              type="number"
                              value={step.delay?.duration ? step.delay.duration / 1000 : 0}
                              onChange={(e) => {
                                const seconds = parseInt(e.target.value) || 0;
                                updateAction(step.id, {
                                  delay: { duration: seconds * 1000, unit: 'seconds' }
                                });
                              }}
                              className="bg-slate-900/50 border-slate-600/50 text-slate-200 text-xs h-8"
                              min="0"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-slate-400 text-xs">On Error</Label>
                            <Select
                              value={step.onError?.action || 'stop'}
                              onValueChange={(value: 'stop' | 'continue' | 'retry') => {
                                updateAction(step.id, {
                                  onError: { action: value }
                                });
                              }}
                            >
                              <SelectTrigger className="bg-slate-900/50 border-slate-600/50 text-slate-200 text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-600/50">
                                <SelectItem value="stop" className="text-slate-200 text-xs">Stop</SelectItem>
                                <SelectItem value="continue" className="text-slate-200 text-xs">Continue</SelectItem>
                                <SelectItem value="retry" className="text-slate-200 text-xs">Retry</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Add Action Button */}
              <div
                className="absolute transition-all duration-300 z-10"
                style={{
                  left: 50 + (schedule.steps.length * 320),
                  top: 50,
                  width: isMobile ? 280 : 300,
                }}
              >
                <div className="p-4 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all duration-300">
                  <Button
                    onClick={addNewAction}
                    className="w-full btn-matrix text-sm py-3"
                  >
                    ➕ Add Action
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execute & Monitor Section - Only shows when actions exist */}
      {schedule.steps && schedule.steps.length > 0 && (
        <div className="p-4 md:p-6 bg-emerald-500/5">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <span className="text-emerald-400">🚀</span>
              </div>
              <h4 className="text-emerald-200 font-mono font-semibold">Execute & Monitor</h4>
              <div className={`w-3 h-3 rounded-full ${
                schedule.trigger?.active ? 'bg-green-400 animate-pulse' : 'bg-slate-400'
              }`} />
              <span className={`font-mono text-sm ${
                schedule.trigger?.active ? 'text-green-300' : 'text-slate-300'
              }`}>
                {schedule.trigger?.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={executeSchedule}
                  disabled={isExecuting}
                  className="btn-matrix flex-1"
                >
                  {isExecuting ? '🧪 Testing...' : '🧪 Test Chain'}
                </Button>
                
                <Button
                  onClick={() => {
                    onUpdate({ 
                      ...schedule, 
                      trigger: { 
                        ...schedule.trigger!, 
                        active: !schedule.trigger?.active 
                      } 
                    });
                  }}
                  className={`flex-1 font-mono py-2 ${
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
                  <div className="text-emerald-300 font-mono text-sm font-medium mb-1">Test Result</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ScheduleMindMapEditor.displayName = 'ScheduleMindMapEditor';