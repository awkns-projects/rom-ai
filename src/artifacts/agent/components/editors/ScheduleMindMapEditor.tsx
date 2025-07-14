import * as React from 'react';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossIcon, PlusIcon } from '@/components/icons';
import { StepFieldEditor } from './StepFieldEditor';
import type { AgentSchedule, EnvVar, PseudoCodeStep, StepField, AgentModel } from '../../types';
import { generateNewId } from '../../utils';

interface ScheduleMindMapEditorProps {
  schedule: AgentSchedule;
  onUpdate: (schedule: AgentSchedule) => void;
  onDelete: () => void;
  allModels?: AgentModel[];
  documentId?: string;
}

interface MindMapNode {
  id: string;
  type: 'description' | 'timing' | 'step' | 'code' | 'execution';
  title: string;
  content: string;
  status: 'empty' | 'processing' | 'complete' | 'ready';
  position: { 
    desktop: { x: number; y: number };
    mobile: { x: number; y: number };
  };
  connections: string[];
  data?: any;
}

interface MindMapConnection {
  id: string;
  from: string;
  to: string;
  status: 'complete' | 'inactive' | 'flowing';
}

export const ScheduleMindMapEditor = memo(({
  schedule,
  onUpdate,
  onDelete,
  allModels = [],
  documentId
}: ScheduleMindMapEditorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>('description');
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const [nodes, setNodes] = useState<MindMapNode[]>(() => [
    {
      id: 'description',
      type: 'description',
      title: '📝 Schedule Details',
      content: schedule.name && schedule.description ? 'Schedule defined' : 'Define your automated schedule',
      status: schedule.name && schedule.description ? 'complete' : 'empty',
      position: { 
        desktop: { x: 50, y: 200 },
        mobile: { x: 20, y: 50 }
      },
      connections: ['timing'],
      data: { name: schedule.name, description: schedule.description }
    },
    {
      id: 'timing',
      type: 'timing',
      title: '⏰ Schedule Timing',
      content: schedule.interval?.pattern ? 'Timing configured' : 'Set when this schedule runs',
      status: schedule.interval?.pattern ? 'complete' : 'empty',
      position: { 
        desktop: { x: 380, y: 200 },
        mobile: { x: 20, y: 220 }
      },
      connections: ['steps'],
      data: schedule.interval
    },
    {
      id: 'steps',
      type: 'step',
      title: '🔄 Automation Steps',
      content: schedule.pseudoSteps?.length ? `${schedule.pseudoSteps.length} steps defined` : 'Break down the process',
      status: schedule.pseudoSteps && schedule.pseudoSteps.length > 0 ? 'complete' : 'empty',
      position: { 
        desktop: { x: 710, y: 200 },
        mobile: { x: 20, y: 390 }
      },
      connections: ['code'],
      data: schedule.pseudoSteps
    },
    {
      id: 'code',
      type: 'code',
      title: '⚡ Executable Code',
      content: schedule.execute?.code?.script ? 'Code generated' : 'Generated automation code',
      status: schedule.execute?.code?.script ? 'complete' : 'empty',
      position: { 
        desktop: { x: 1040, y: 200 },
        mobile: { x: 20, y: 560 }
      },
      connections: ['execution'],
      data: schedule.execute?.code
    },
    {
      id: 'execution',
      type: 'execution',
      title: '🚀 Schedule Activation',
      content: 'Activate & monitor schedule',
      status: schedule.execute?.code?.script ? 'ready' : 'empty',
      position: { 
        desktop: { x: 1370, y: 200 },
        mobile: { x: 20, y: 730 }
      },
      connections: [],
      data: null
    }
  ]);

  const [connections] = useState<MindMapConnection[]>([
    { id: 'desc-timing', from: 'description', to: 'timing', status: 'inactive' },
    { id: 'timing-steps', from: 'timing', to: 'steps', status: 'inactive' },
    { id: 'steps-code', from: 'steps', to: 'code', status: 'inactive' },
    { id: 'code-exec', from: 'code', to: 'execution', status: 'inactive' }
  ]);

  useEffect(() => {
    setNodes(prevNodes => prevNodes.map(node => {
      switch (node.id) {
        case 'description':
          return {
            ...node,
            status: schedule.name && schedule.description ? 'complete' : 'empty',
            content: schedule.name && schedule.description ? 'Schedule defined' : 'Define your automated schedule',
            data: { name: schedule.name, description: schedule.description }
          };
        case 'timing':
          return {
            ...node,
            status: schedule.interval?.pattern ? 'complete' : 'empty',
            content: schedule.interval?.pattern ? 'Timing configured' : 'Set when this schedule runs',
            data: schedule.interval
          };
        case 'steps':
          return {
            ...node,
            status: schedule.pseudoSteps && schedule.pseudoSteps.length > 0 ? 'complete' : 'empty',
            content: schedule.pseudoSteps?.length ? `${schedule.pseudoSteps.length} steps defined` : 'Break down the process',
            data: schedule.pseudoSteps
          };
        case 'code':
          return {
            ...node,
            status: schedule.execute?.code?.script ? 'complete' : 'empty',
            content: schedule.execute?.code?.script ? 'Code generated' : 'Generated automation code',
            data: schedule.execute?.code
          };
        case 'execution':
          return {
            ...node,
            status: schedule.execute?.code?.script ? 'ready' : 'empty'
          };
        default:
          return node;
      }
    }));
  }, [schedule]);

  const generateStepsFromDescription = useCallback(async () => {
    if (!schedule.name?.trim() || !schedule.description?.trim()) return;
    
    setIsGeneratingSteps(true);
    setNodes(prev => prev.map(node => 
      node.id === 'steps' ? { ...node, status: 'processing', content: 'AI is crafting steps...' } : node
    ));

    try {
      const response = await fetch('/api/agent/generate-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schedule.name,
          description: schedule.description,
          availableModels: allModels,
          entityType: 'schedule',
          type: (schedule as any).type || 'mutation', // Default to mutation if type is not set
          businessContext: `Generate pseudo steps for ${schedule.name}. This is a scheduled task that runs automatically.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedSteps = data.pseudoSteps || [];
        onUpdate({ ...schedule, pseudoSteps: generatedSteps });
        setNodes(prev => prev.map(node => 
          node.id === 'steps' ? { 
            ...node, 
            status: 'complete', 
            content: `${generatedSteps.length} steps defined`,
            data: generatedSteps
          } : node
        ));
      } else {
        throw new Error('Failed to generate steps');
      }
    } catch (error) {
      console.error('Error generating steps:', error);
      setNodes(prev => prev.map(node => 
        node.id === 'steps' ? { ...node, status: 'empty', content: 'Failed to generate steps' } : node
      ));
    } finally {
      setIsGeneratingSteps(false);
    }
  }, [schedule, onUpdate, allModels]);

  const generateCodeFromSteps = useCallback(async () => {
    if (!schedule.pseudoSteps?.length) return;

    setIsGeneratingCode(true);
    setNodes(prev => prev.map(node => 
      node.id === 'code' ? { ...node, status: 'processing', content: 'AI is generating code...' } : node
    ));

    try {
      const response = await fetch('/api/agent/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schedule.name,
          description: schedule.description,
          pseudoSteps: schedule.pseudoSteps,
          availableModels: allModels,
          entityType: 'schedule',
          businessContext: `This is a scheduled business task for ${schedule.name}.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate({
          ...schedule,
          execute: {
            ...schedule.execute,
            type: 'code',
            code: {
              script: data.code || '',
              envVars: data.envVars || []
            }
          }
        });
        setNodes(prev => prev.map(node => 
          node.id === 'code' ? { 
            ...node, 
            status: 'complete', 
            content: 'Code generated',
            data: { script: data.code, envVars: data.envVars }
          } : node
        ));
      } else {
        throw new Error('Failed to generate code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setNodes(prev => prev.map(node => 
        node.id === 'code' ? { ...node, status: 'empty', content: 'Failed to generate code' } : node
      ));
    } finally {
      setIsGeneratingCode(false);
    }
  }, [schedule, onUpdate, allModels]);

  const executeSchedule = useCallback(async () => {
    if (!schedule.execute?.code?.script || !documentId) return;

    setIsExecuting(true);
    setNodes(prev => prev.map(node => 
      node.id === 'execution' ? { ...node, status: 'processing', content: 'Testing schedule...' } : node
    ));

    try {
      const response = await fetch('/api/agent/execute-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          scheduleId: schedule.id,
          code: schedule.execute.code.script,
          testMode: true,
          interval: {
            pattern: schedule.interval?.pattern || '0 0 * * *',
            timezone: schedule.interval?.timezone || 'UTC',
            active: false
          }
        }),
      });

      const result = await response.json();
      setExecutionResult(result);

      if (result.success) {
        setNodes(prev => prev.map(node => 
          node.id === 'execution' ? { 
            ...node, 
            status: 'ready', 
            content: `Test successful! ${result.executionTime}ms`
          } : node
        ));
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (error) {
      console.error('Error executing schedule:', error);
      setNodes(prev => prev.map(node => 
        node.id === 'execution' ? { ...node, status: 'ready', content: 'Test failed - check console' } : node
      ));
    } finally {
      setIsExecuting(false);
    }
  }, [schedule, documentId]);

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'empty': return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
      case 'processing': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 animate-pulse';
      case 'complete': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'ready': return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  const getConnectionPath = (from: MindMapNode, to: MindMapNode) => {
    const currentPosition = isMobile ? 'mobile' : 'desktop';
    const nodeWidth = isMobile ? 280 : 300;
    const nodeHeight = 120;
    
    const startX = from.position[currentPosition].x + (isMobile ? nodeWidth / 2 : nodeWidth);
    const startY = from.position[currentPosition].y + nodeHeight / 2;
    const endX = to.position[currentPosition].x + (isMobile ? nodeWidth / 2 : 0);
    const endY = to.position[currentPosition].y + nodeHeight / 2;
    
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

  const renderNodeContent = (node: MindMapNode) => {
    if (selectedNode !== node.id) return null;

    const baseClasses = "mt-4 space-y-3";

    switch (node.type) {
      case 'description':
        return (
          <div className={baseClasses} onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <Label htmlFor="schedule-name" className="text-orange-300 font-mono text-sm">✨ Schedule Name</Label>
              <Input
                id="schedule-name"
                value={schedule.name || ''}
                onChange={(e) => onUpdate({ ...schedule, name: e.target.value })}
                placeholder="e.g., Daily Data Sync, Weekly Reports"
                className="bg-black/50 border-orange-500/30 text-orange-200 font-mono text-sm"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-description" className="text-orange-300 font-mono text-sm">📝 Purpose & Goals</Label>
              <Textarea
                id="schedule-description"
                value={schedule.description || ''}
                onChange={(e) => onUpdate({ ...schedule, description: e.target.value })}
                placeholder="Describe what this schedule will automate and achieve..."
                className="bg-black/50 border-orange-500/30 text-orange-200 font-mono text-xs min-h-[80px] resize-none"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                generateStepsFromDescription();
              }}
              disabled={!schedule.name?.trim() || !schedule.description?.trim() || isGeneratingSteps}
              className="w-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-200 hover:from-orange-500/30 hover:to-red-500/30 font-mono rounded-lg transition-all duration-200 text-sm py-2"
            >
              {isGeneratingSteps ? "🤖 AI is crafting..." : "✨ Generate Steps →"}
            </Button>
          </div>
        );

      case 'timing':
        return (
          <div className={baseClasses} onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <Label className="text-orange-300 font-mono text-sm">⏰ Timing Pattern</Label>
              <Select
                value={schedule.interval?.pattern || '0 0 * * *'}
                onValueChange={(value) => onUpdate({
                  ...schedule,
                  interval: { ...schedule.interval, pattern: value, timezone: schedule.interval?.timezone || 'UTC' }
                })}
              >
                <SelectTrigger className="bg-black/50 border-orange-500/30 text-orange-200 focus:border-orange-400 focus:ring-orange-400/20 font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-orange-500/30">
                  <SelectItem value="*/10 * * * *" className="text-orange-200 font-mono focus:bg-orange-500/20">Every 10 minutes</SelectItem>
                  <SelectItem value="0 * * * *" className="text-orange-200 font-mono focus:bg-orange-500/20">Every hour</SelectItem>
                  <SelectItem value="0 9 * * 1-5" className="text-orange-200 font-mono focus:bg-orange-500/20">Weekdays at 9 AM</SelectItem>
                  <SelectItem value="0 0 * * *" className="text-orange-200 font-mono focus:bg-orange-500/20">Daily at midnight</SelectItem>
                  <SelectItem value="0 0 * * 0" className="text-orange-200 font-mono focus:bg-orange-500/20">Weekly on Sunday</SelectItem>
                  <SelectItem value="0 0 1 * *" className="text-orange-200 font-mono focus:bg-orange-500/20">Monthly on 1st</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-orange-300 font-mono text-sm">🌍 Timezone</Label>
              <Select
                value={schedule.interval?.timezone || 'UTC'}
                onValueChange={(value) => onUpdate({
                  ...schedule,
                  interval: { ...schedule.interval, pattern: schedule.interval?.pattern || '0 0 * * *', timezone: value }
                })}
              >
                <SelectTrigger className="bg-black/50 border-orange-500/30 text-orange-200 focus:border-orange-400 focus:ring-orange-400/20 font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-orange-500/30">
                  <SelectItem value="UTC" className="text-orange-200 font-mono focus:bg-orange-500/20">UTC</SelectItem>
                  <SelectItem value="America/New_York" className="text-orange-200 font-mono focus:bg-orange-500/20">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago" className="text-orange-200 font-mono focus:bg-orange-500/20">Central Time</SelectItem>
                  <SelectItem value="America/Denver" className="text-orange-200 font-mono focus:bg-orange-500/20">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles" className="text-orange-200 font-mono focus:bg-orange-500/20">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="text-orange-300 font-mono text-xs font-medium mb-1">Preview</div>
              <div className="text-orange-100 font-mono text-sm">
                {schedule.interval?.pattern || '0 0 * * *'}
              </div>
              <div className="text-orange-400/70 font-mono text-xs">
                in {schedule.interval?.timezone || 'UTC'}
              </div>
            </div>
          </div>
        );

      case 'step':
        return (
          <div className={baseClasses} onClick={(e) => e.stopPropagation()}>
            <div className="max-h-60 overflow-y-auto space-y-3">
              {(schedule.pseudoSteps || []).length === 0 ? (
                <div className="text-center py-8 text-orange-400/70">
                  <p className="font-mono text-sm">No steps defined yet.</p>
                  <p className="font-mono text-xs mt-2">
                    Complete the description first, then generate steps.
                  </p>
                </div>
              ) : (
                (schedule.pseudoSteps || []).map((step, index) => (
                  <div key={step.id} className="p-3 rounded-lg bg-black/40 border border-orange-500/30">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-orange-300 font-mono text-xs font-semibold">
                          Step {index + 1}
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedSteps = schedule.pseudoSteps?.filter(s => s.id !== step.id) || [];
                            onUpdate({ ...schedule, pseudoSteps: updatedSteps });
                          }}
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <CrossIcon size={12} />
                        </Button>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-orange-300 font-mono text-xs">Type</Label>
                        <Select
                          value={step.type}
                          onValueChange={(value: 'Database create' | 'Database update' | 'Database read' | 'Database delete' | 'External api read' | 'External api write' | 'AI analysis' | 'AI generation') => {
                            const updatedSteps = schedule.pseudoSteps?.map(s => 
                              s.id === step.id ? { ...s, type: value } : s
                            ) || [];
                            onUpdate({ ...schedule, pseudoSteps: updatedSteps });
                          }}
                        >
                          <SelectTrigger 
                            className="bg-black/50 border-orange-500/30 text-orange-200 h-8 text-xs font-mono"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-orange-500/30">
                            <SelectItem value="Database create" className="text-orange-200 font-mono">Database create</SelectItem>
                            <SelectItem value="Database update" className="text-orange-200 font-mono">Database update</SelectItem>
                            <SelectItem value="Database read" className="text-orange-200 font-mono">Database read</SelectItem>
                            <SelectItem value="Database delete" className="text-orange-200 font-mono">Database delete</SelectItem>
                            <SelectItem value="External api read" className="text-orange-200 font-mono">External api read</SelectItem>
                            <SelectItem value="External api write" className="text-orange-200 font-mono">External api write</SelectItem>
                            <SelectItem value="AI analysis" className="text-orange-200 font-mono">AI analysis</SelectItem>
                            <SelectItem value="AI generation" className="text-orange-200 font-mono">AI generation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-orange-300 font-mono text-xs">Description</Label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => {
                            const updatedSteps = schedule.pseudoSteps?.map(s => 
                              s.id === step.id ? { ...s, description: e.target.value } : s
                            ) || [];
                            onUpdate({ ...schedule, pseudoSteps: updatedSteps });
                          }}
                          placeholder="Describe what this step does..."
                          className="bg-black/50 border-orange-500/30 text-orange-200 font-mono text-xs min-h-[50px] resize-none"
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-orange-300 font-mono text-xs">📥 Input Fields</Label>
                        <div onClick={(e) => e.stopPropagation()}>
                          <StepFieldEditor
                            fields={step.inputFields || []}
                            onFieldsChange={(fields) => {
                              const updatedSteps = schedule.pseudoSteps?.map(s => 
                                s.id === step.id ? { ...s, inputFields: fields } : s
                              ) || [];
                              onUpdate({ ...schedule, pseudoSteps: updatedSteps });
                            }}
                            label=""
                            color="orange"
                            allModels={allModels}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-orange-300 font-mono text-xs">📤 Output Fields</Label>
                        <div onClick={(e) => e.stopPropagation()}>
                          <StepFieldEditor
                            fields={step.outputFields || []}
                            onFieldsChange={(fields) => {
                              const updatedSteps = schedule.pseudoSteps?.map(s => 
                                s.id === step.id ? { ...s, outputFields: fields } : s
                              ) || [];
                              onUpdate({ ...schedule, pseudoSteps: updatedSteps });
                            }}
                            label=""
                            color="orange"
                            allModels={allModels}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                const newStep: PseudoCodeStep = {
                  id: generateNewId('step', schedule.pseudoSteps || []),
                  type: 'Database read' as const,
                  description: '',
                  inputFields: [{
                    id: generateNewId('field', []),
                    name: '',
                    type: 'String',
                    kind: 'scalar' as const,
                    required: false,
                    list: false,
                    description: ''
                  }],
                  outputFields: [{
                    id: generateNewId('field', []),
                    name: '',
                    type: 'String',
                    kind: 'scalar' as const,
                    required: false,
                    list: false,
                    description: ''
                  }]
                };
                const updatedSteps = [...(schedule.pseudoSteps || []), newStep];
                onUpdate({ ...schedule, pseudoSteps: updatedSteps });
              }}
              className="w-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-200 hover:from-orange-500/30 hover:to-red-500/30 font-mono rounded-lg transition-all duration-200 text-sm py-2"
            >
              <div className="flex items-center gap-2">
                <PlusIcon size={14} />
                Add Step
              </div>
            </Button>

            {(schedule.pseudoSteps || []).length > 0 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  generateCodeFromSteps();
                }}
                disabled={!schedule.pseudoSteps?.length || isGeneratingCode}
                className="w-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-200 hover:from-orange-500/30 hover:to-red-500/30 font-mono rounded-lg transition-all duration-200 text-sm py-2"
              >
                {isGeneratingCode ? "🤖 Generating..." : "⚡ Generate Code →"}
              </Button>
            )}
          </div>
        );

      case 'code':
        return (
          <div className={baseClasses} onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <Label className="text-orange-300 font-mono text-xs">💎 Executable Code</Label>
              <Textarea
                value={schedule.execute?.code?.script || ''}
                onChange={(e) => onUpdate({
                  ...schedule,
                  execute: {
                    ...schedule.execute,
                    type: 'code',
                    code: {
                      script: e.target.value,
                      envVars: schedule.execute?.code?.envVars || []
                    }
                  }
                })}
                placeholder="// Your executable JavaScript code will appear here
// You can edit it directly or regenerate from steps
async function executeSchedule(input, env) {
  // Implementation goes here
  return { success: true, data: {} };
}"
                className="bg-black/50 border-orange-500/30 text-orange-200 font-mono text-xs min-h-[120px] resize-none"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            {schedule.execute?.code?.envVars && schedule.execute.code.envVars.length > 0 && (
              <div className="space-y-2">
                <Label className="text-orange-300 font-mono text-xs">🔐 Environment Variables</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {schedule.execute.code.envVars.map((envVar, index) => (
                    <div key={index} className="p-2 rounded bg-black/40 border border-orange-500/20">
                      <div className="text-orange-200 font-mono text-xs">
                        {envVar.name} {envVar.required && <span className="text-red-400">*</span>}
                      </div>
                      <div className="text-orange-400/70 font-mono text-xs">
                        {envVar.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!schedule.execute?.code?.script && (
              <div className="text-center py-4 text-orange-400/70">
                <p className="font-mono text-xs">Generate code from steps first</p>
              </div>
            )}
          </div>
        );

      case 'execution':
        return (
          <div className={baseClasses} onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-orange-300 font-mono text-sm font-medium mb-3">Schedule Status</div>
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-mono ${
                schedule.interval?.active 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
              }`}>
                <div className={`w-3 h-3 rounded-full ${schedule.interval?.active ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                {schedule.interval?.active ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>
            
            {schedule.interval?.pattern && (
              <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-orange-300 font-mono text-sm font-medium">Schedule Pattern</div>
                <div className="text-orange-100 font-mono text-lg mt-1">
                  {schedule.interval.pattern}
                </div>
                <div className="text-orange-400/70 font-mono text-xs mt-1">
                  {schedule.interval.timezone || 'UTC'}
                </div>
              </div>
            )}

            {executionResult && (
              <div className="p-3 rounded-lg bg-black/40 border border-orange-500/20">
                <div className="text-orange-300 font-mono text-xs font-medium mb-2">Last Test Result</div>
                <div className={`text-sm font-mono ${executionResult.success ? 'text-green-300' : 'text-red-300'}`}>
                  {executionResult.success ? `✅ Success (${executionResult.executionTime}ms)` : `❌ Failed`}
                </div>
                {executionResult.error && (
                  <div className="text-red-400 font-mono text-xs mt-1">
                    {executionResult.error}
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  executeSchedule();
                }}
                disabled={!schedule.execute?.code?.script || isExecuting}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 text-green-200 hover:from-green-500/30 hover:to-emerald-500/30 font-mono rounded-lg transition-all duration-200 text-sm py-2"
              >
                {isExecuting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                    Testing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>🧪</span>
                    Test Run
                  </div>
                )}
              </Button>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ 
                    ...schedule, 
                    interval: { 
                      ...schedule.interval, 
                      pattern: schedule.interval?.pattern || '0 0 * * *',
                      timezone: schedule.interval?.timezone || 'UTC',
                      active: !schedule.interval?.active 
                    } 
                  });
                }}
                disabled={!schedule.execute?.code?.script}
                className={`font-mono rounded-lg transition-all duration-200 text-sm py-2 ${
                  schedule.interval?.active 
                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/40 text-red-200 hover:from-red-500/30 hover:to-orange-500/30'
                    : 'bg-gradient-to-r from-orange-500/20 to-green-500/20 border border-orange-500/40 text-orange-200 hover:from-orange-500/30 hover:to-green-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{schedule.interval?.active ? '⏸️' : '▶️'}</span>
                  {schedule.interval?.active ? 'Deactivate' : 'Activate'}
                </div>
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-orange-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <span className="text-orange-400 text-lg md:text-xl">🗓️</span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-orange-200 font-mono">
                {isMobile ? 'Schedule Flow' : 'Schedule Mind Map'}
              </h3>
              <p className="text-orange-400 text-xs md:text-sm font-mono">
                {isMobile ? 'Idea → Timing → Steps → Code → Activate' : 'Visual workflow for automated schedules'}
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

      {/* Mind Map Container */}
      <div className="flex-1 relative min-h-[500px] overflow-auto">
        <div 
          ref={containerRef}
          className="relative bg-gradient-to-br from-orange-950/20 via-red-950/20 to-orange-950/20"
          style={{ 
            minHeight: isMobile ? '900px' : '600px', 
            minWidth: isMobile ? '320px' : '1700px',
            width: '100%'
          }}
        >
          {/* SVG for connections */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ zIndex: 1 }}
          >
            {connections.map(connection => {
              const fromNode = nodes.find(n => n.id === connection.from);
              const toNode = nodes.find(n => n.id === connection.to);
              if (!fromNode || !toNode) return null;

              return (
                <path
                  key={connection.id}
                  d={getConnectionPath(fromNode, toNode)}
                  stroke="#fb923c"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="5,5"
                  className="transition-all duration-300"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(251, 146, 60, 0.3))'
                  }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const currentPosition = isMobile ? 'mobile' : 'desktop';
            const nodeWidth = isMobile ? 280 : 300;
            
            return (
              <div
                key={node.id}
                className={`absolute transition-all duration-500 cursor-pointer ${
                  selectedNode === node.id ? 'z-20' : 'z-10'
                }`}
                style={{
                  left: node.position[currentPosition].x,
                  top: node.position[currentPosition].y,
                  width: nodeWidth,
                  transform: selectedNode === node.id ? 'scale(1.02)' : 'scale(1)',
                }}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              >
                <div
                  className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${
                    selectedNode === node.id
                      ? 'bg-orange-500/20 border-orange-400/60 shadow-xl shadow-orange-500/20'
                      : 'bg-orange-950/40 border-orange-500/30 hover:border-orange-400/50'
                  } ${
                    node.status === 'complete' ? 'ring-2 ring-emerald-400/50' :
                    node.status === 'processing' ? 'ring-2 ring-orange-400/50 ai-generating' : ''
                  }`}
                  style={{
                    backdropFilter: 'blur(8px)',
                    ...(selectedNode === node.id && {
                      boxShadow: '0 0 30px rgba(251, 146, 60, 0.3), inset 0 0 20px rgba(251, 146, 60, 0.1)'
                    }),
                    ...(node.status === 'processing' && {
                      animation: 'ai-glow 2s ease-in-out infinite alternate, ai-shimmer 3s linear infinite'
                    })
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-mono font-bold transition-all duration-300 ${
                      selectedNode === node.id ? 'text-orange-200 text-base' : 'text-orange-300 text-sm'
                    }`}>
                      {node.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      {node.status === 'complete' && <span className="text-emerald-400 text-lg">✅</span>}
                      {node.status === 'processing' && (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-400 border-t-transparent"></div>
                          <span className="text-orange-400 text-lg animate-pulse">⚡</span>
                        </div>
                      )}
                      {node.status === 'ready' && <span className="text-orange-400 text-lg">🚀</span>}
                      {node.status === 'empty' && <span className="text-orange-500/50 text-lg">⭕</span>}
                    </div>
                  </div>
                  
                  <div className={`text-orange-400 font-mono transition-all duration-300 ${
                    selectedNode === node.id ? 'text-sm' : 'text-xs'
                  }`}>
                    {node.content}
                  </div>

                  {selectedNode === node.id && (
                    <div className="transition-all duration-300 ease-out">
                      {renderNodeContent(node)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Quick Actions */}
          {!selectedNode && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <Button
                onClick={() => setSelectedNode('description')}
                className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-200 hover:from-orange-500/30 hover:to-red-500/30 font-mono text-xs px-3 py-2 rounded-lg"
                disabled={isGeneratingSteps || isGeneratingCode || isExecuting}
              >
                🎯 Start Here
              </Button>
              {schedule.description && (
                <Button
                  onClick={generateStepsFromDescription}
                  className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-200 hover:from-orange-500/30 hover:to-red-500/30 font-mono text-xs px-3 py-2 rounded-lg"
                  disabled={!schedule.name?.trim() || !schedule.description?.trim() || isGeneratingSteps}
                >
                  {isGeneratingSteps ? "⚡" : "✨ Steps"}
                </Button>
              )}
              {(schedule.pseudoSteps?.length || 0) > 0 && (
                <Button
                  onClick={generateCodeFromSteps}
                  className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-200 hover:from-orange-500/30 hover:to-red-500/30 font-mono text-xs px-3 py-2 rounded-lg"
                  disabled={!schedule.pseudoSteps?.length || isGeneratingCode}
                >
                  {isGeneratingCode ? "⚡" : "🔮 Code"}
                </Button>
              )}
              {schedule.execute?.code?.script && (
                <Button
                  onClick={executeSchedule}
                  className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 text-green-200 hover:from-green-500/30 hover:to-emerald-500/30 font-mono text-xs px-3 py-2 rounded-lg"
                  disabled={!schedule.execute?.code?.script || isExecuting}
                >
                  {isExecuting ? "🚀" : "🧪 Test"}
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