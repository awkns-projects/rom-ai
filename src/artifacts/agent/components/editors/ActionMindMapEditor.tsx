import * as React from 'react';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossIcon, PlusIcon } from '@/components/icons';
import { StepFieldEditor } from './StepFieldEditor';
import { ModelExecutionChangesViewer } from './ModelExecutionChangesViewer';
import type { AgentAction, EnvVar, PseudoCodeStep, StepField, AgentModel } from '../../types';
import { generateNewId } from '../../utils';

interface ActionMindMapEditorProps {
  action: AgentAction;
  onUpdate: (action: AgentAction) => void;
  onDelete: () => void;
  allModels?: AgentModel[];
  documentId?: string;
}

interface MindMapNode {
  id: string;
  type: 'description' | 'step' | 'code' | 'execution';
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

export const ActionMindMapEditor = memo(({
  action,
  onUpdate,
  onDelete,
  allModels = [],
  documentId
}: ActionMindMapEditorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>('description');
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [animatingConnection, setAnimatingConnection] = useState<string | null>(null);
  const [viewingModelChanges, setViewingModelChanges] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Initialize mind map nodes with responsive positioning
  const [nodes, setNodes] = useState<MindMapNode[]>(() => [
    {
      id: 'description',
      type: 'description',
      title: '💡 Action Idea',
      content: action.description || 'Your creative spark starts here',
      status: action.description ? 'complete' : 'empty',
      position: { 
        desktop: { x: 50, y: 200 },
        mobile: { x: 20, y: 50 }
      },
      connections: ['steps'],
      data: { name: action.name, description: action.description }
    },
    {
      id: 'steps',
      type: 'step',
      title: '🔄 Smart Steps',
      content: action.pseudoSteps?.length ? `${action.pseudoSteps.length} AI-crafted steps` : 'Intelligent workflow will emerge',
      status: action.pseudoSteps?.length ? 'complete' : 'empty',
      position: { 
        desktop: { x: 380, y: 200 },
        mobile: { x: 20, y: 220 }
      },
      connections: ['code'],
      data: action.pseudoSteps
    },
    {
      id: 'code',
      type: 'code',
      title: '⚡ Living Code',
      content: action.execute?.code?.script ? 'Code brought to life' : 'Executable magic awaits',
      status: action.execute?.code?.script ? 'complete' : 'empty',
      position: { 
        desktop: { x: 710, y: 200 },
        mobile: { x: 20, y: 390 }
      },
      connections: ['execution'],
      data: action.execute?.code
    },
    {
      id: 'execution',
      type: 'execution',
      title: '🚀 Launch Pad',
      content: 'Ready for takeoff',
      status: action.execute?.code?.script ? 'ready' : 'empty',
      position: { 
        desktop: { x: 1040, y: 200 },
        mobile: { x: 20, y: 560 }
      },
      connections: [],
      data: null
    }
  ]);

  // Initialize connections
  const [connections] = useState<MindMapConnection[]>([
    { id: 'desc-to-steps', from: 'description', to: 'steps', status: 'inactive' },
    { id: 'steps-to-code', from: 'steps', to: 'code', status: 'inactive' },
    { id: 'code-to-exec', from: 'code', to: 'execution', status: 'inactive' }
  ]);

  // Update node status based on action changes
  useEffect(() => {
    setNodes(prevNodes => prevNodes.map(node => {
      switch (node.id) {
        case 'description':
          return {
            ...node,
            status: action.name && action.description ? 'complete' : 'empty',
            data: { name: action.name, description: action.description }
          };
        case 'steps':
          return {
            ...node,
            status: action.pseudoSteps?.length ? 'complete' : 'empty',
            content: action.pseudoSteps?.length ? `${action.pseudoSteps.length} steps defined` : 'Steps will appear here',
            data: action.pseudoSteps
          };
        case 'code':
          return {
            ...node,
            status: action.execute?.code?.script ? 'complete' : 'empty',
            content: action.execute?.code?.script ? 'Code generated' : 'Code will be generated',
            data: action.execute?.code
          };
        case 'execution':
          return {
            ...node,
            status: action.execute?.code?.script ? 'ready' : 'empty'
          };
        default:
          return node;
      }
    }));
  }, [action]);

  const animateConnection = useCallback((connectionId: string) => {
    setAnimatingConnection(connectionId);
    setTimeout(() => {
      setAnimatingConnection(null);
    }, 2000);
  }, []);

  const generateStepsFromDescription = useCallback(async () => {
    if (!action.name.trim()) {
      alert('Please enter an action name first');
      return;
    }

    setIsGeneratingSteps(true);
    setSelectedNode('steps');
    animateConnection('desc-to-steps');

    // Update steps node to processing state
    setNodes(prev => prev.map(node => 
      node.id === 'steps' ? { ...node, status: 'processing', content: 'AI is analyzing your idea...' } : node
    ));

    try {
      const response = await fetch('/api/agent/generate-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: action.name,
          description: action.description || `Action to ${action.name}`,
          availableModels: allModels,
          entityType: 'action',
          businessContext: `Generate pseudo steps for ${action.name}. Make it comprehensive and realistic for business operations.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedSteps = data.pseudoSteps || [];
        
        onUpdate({
          ...action,
          pseudoSteps: generatedSteps
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to generate pseudo steps: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating pseudo steps:', error);
      alert('Error generating pseudo steps. Please try again.');
    } finally {
      setIsGeneratingSteps(false);
    }
  }, [action, onUpdate, allModels, animateConnection]);

  const generateCodeFromSteps = useCallback(async () => {
    if (!action.pseudoSteps?.length) {
      alert('Please generate steps first');
      return;
    }

    setIsGeneratingCode(true);
    setSelectedNode('code');
    animateConnection('steps-to-code');

    // Update code node to processing state
    setNodes(prev => prev.map(node => 
      node.id === 'code' ? { ...node, status: 'processing', content: 'AI is generating executable code...' } : node
    ));

    try {
      const response = await fetch('/api/agent/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: action.name,
          description: action.description || `Action to ${action.name}`,
          pseudoSteps: action.pseudoSteps,
          availableModels: allModels,
          entityType: 'action',
          businessContext: `Generate comprehensive, executable code for ${action.name}.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        onUpdate({
          ...action,
          execute: {
            ...action.execute,
            type: 'code',
            code: {
              script: data.code || '',
              envVars: data.envVars || []
            }
          }
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to generate code: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Error generating code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  }, [action, onUpdate, allModels, animateConnection]);

  const executeAction = useCallback(async () => {
    if (!action.execute?.code?.script) {
      alert('No code to execute. Please generate code first.');
      return;
    }

    setIsExecuting(true);
    setSelectedNode('execution');
    animateConnection('code-to-exec');

    // Update execution node to processing state
    setNodes(prev => prev.map(node => 
      node.id === 'execution' ? { ...node, status: 'processing', content: 'Executing action...' } : node
    ));

    try {
      const response = await fetch('/api/agent/execute-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          code: action.execute.code.script,
          inputParameters: {},
          envVars: {},
          testMode: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update execution node to complete state
        setNodes(prev => prev.map(node => 
          node.id === 'execution' ? { 
            ...node, 
            status: 'complete', 
            content: `Executed successfully! ${result.executionTime}ms`,
            data: result
          } : node
        ));
        
        if (result.modelsAffected?.length > 0) {
          alert(`Action executed successfully!\n\nModels affected: ${result.modelsAffected.map((m: any) => `${m.name} (${m.recordCount} records)`).join(', ')}`);
        }
      } else {
        alert(`Action execution failed:\n${result.error || 'Unknown error'}`);
        setNodes(prev => prev.map(node => 
          node.id === 'execution' ? { ...node, status: 'ready', content: 'Ready to execute' } : node
        ));
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Error executing action. Please try again.');
      setNodes(prev => prev.map(node => 
        node.id === 'execution' ? { ...node, status: 'ready', content: 'Ready to execute' } : node
      ));
    } finally {
      setIsExecuting(false);
    }
  }, [action, documentId, animateConnection]);

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'empty': return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
      case 'processing': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 animate-pulse';
      case 'complete': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'ready': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
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

    switch (node.type) {
      case 'description':
        return (
          <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <Label htmlFor="action-name" className="text-blue-300 font-mono text-sm">✨ Action Name</Label>
              <Input
                id="action-name"
                value={action.name}
                onChange={(e) => onUpdate({ ...action, name: e.target.value })}
                placeholder="e.g., Create Customer Invoice"
                className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-sm"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-description" className="text-blue-300 font-mono text-sm">📝 Vision & Purpose</Label>
              <Textarea
                id="action-description"
                value={action.description}
                onChange={(e) => onUpdate({ ...action, description: e.target.value })}
                placeholder="Paint the picture... What magic should this action create?"
                className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-xs min-h-[80px] resize-none"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                generateStepsFromDescription();
              }}
              disabled={!action.name.trim() || !action.description.trim() || isGeneratingSteps}
              className="btn-matrix w-full text-sm py-2"
            >
              {isGeneratingSteps ? "🤖 AI is crafting..." : "✨ Weave the Steps →"}
            </Button>
          </div>
        );

      case 'step':
        return (
          <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* Steps List with Editing */}
            <div className="max-h-60 overflow-y-auto space-y-3">
              {action.pseudoSteps?.map((step, index) => (
                <div key={step.id} className="p-3 rounded-lg bg-black/40 border border-blue-500/30">
                  <div className="space-y-3">
                    {/* Step Header */}
                    <div className="flex items-center justify-between">
                      <div className="text-blue-300 font-mono text-xs font-semibold">
                        Step {index + 1}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedSteps = action.pseudoSteps?.filter(s => s.id !== step.id) || [];
                          onUpdate({ ...action, pseudoSteps: updatedSteps });
                        }}
                        variant="destructive"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <CrossIcon size={12} />
                      </Button>
                    </div>

                    {/* Step Type */}
                    <div className="space-y-1">
                      <Label className="text-blue-300 font-mono text-xs">Type</Label>
                      <Select
                        value={step.type}
                        onValueChange={(value: "Database find unique" | "Database find many" | "Database update unique" | "Database update many" | "Database create" | "Database create many" | "Database delete unique" | "Database delete many" | "call external api" | "ai analysis") => {
                          const updatedSteps = action.pseudoSteps?.map(s => 
                            s.id === step.id ? { ...s, type: value } : s
                          ) || [];
                          onUpdate({ ...action, pseudoSteps: updatedSteps });
                        }}
                      >
                        <SelectTrigger 
                          className="bg-black/50 border-blue-500/30 text-blue-200 h-8 text-xs font-mono"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-blue-500/30">
                          <SelectItem value="Database find unique" className="text-blue-200 font-mono">Database find unique</SelectItem>
                          <SelectItem value="Database find many" className="text-blue-200 font-mono">Database find many</SelectItem>
                          <SelectItem value="Database update unique" className="text-blue-200 font-mono">Database update unique</SelectItem>
                          <SelectItem value="Database update many" className="text-blue-200 font-mono">Database update many</SelectItem>
                          <SelectItem value="Database create" className="text-blue-200 font-mono">Database create</SelectItem>
                          <SelectItem value="Database create many" className="text-blue-200 font-mono">Database create many</SelectItem>
                          <SelectItem value="Database delete unique" className="text-blue-200 font-mono">Database delete unique</SelectItem>
                          <SelectItem value="Database delete many" className="text-blue-200 font-mono">Database delete many</SelectItem>
                          <SelectItem value="call external api" className="text-blue-200 font-mono">Call External API</SelectItem>
                          <SelectItem value="ai analysis" className="text-blue-200 font-mono">AI Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Step Description */}
                    <div className="space-y-1">
                      <Label className="text-blue-300 font-mono text-xs">Description</Label>
                      <Textarea
                        value={step.description}
                        onChange={(e) => {
                          const updatedSteps = action.pseudoSteps?.map(s => 
                            s.id === step.id ? { ...s, description: e.target.value } : s
                          ) || [];
                          onUpdate({ ...action, pseudoSteps: updatedSteps });
                        }}
                        placeholder="Describe what this step does..."
                        className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-xs min-h-[50px] resize-none"
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Input Fields */}
                    <div className="space-y-2">
                      <Label className="text-blue-300 font-mono text-xs">📥 Input Fields</Label>
                      <div onClick={(e) => e.stopPropagation()}>
                        <StepFieldEditor
                          fields={step.inputFields || []}
                          onFieldsChange={(fields) => {
                            const updatedSteps = action.pseudoSteps?.map(s => 
                              s.id === step.id ? { ...s, inputFields: fields } : s
                            ) || [];
                            onUpdate({ ...action, pseudoSteps: updatedSteps });
                          }}
                          label=""
                          color="blue"
                          allModels={allModels}
                        />
                      </div>
                    </div>

                    {/* Output Fields */}
                    <div className="space-y-2">
                      <Label className="text-blue-300 font-mono text-xs">📤 Output Fields</Label>
                      <div onClick={(e) => e.stopPropagation()}>
                        <StepFieldEditor
                          fields={step.outputFields || []}
                          onFieldsChange={(fields) => {
                            const updatedSteps = action.pseudoSteps?.map(s => 
                              s.id === step.id ? { ...s, outputFields: fields } : s
                            ) || [];
                            onUpdate({ ...action, pseudoSteps: updatedSteps });
                          }}
                          label=""
                          color="blue"
                          allModels={allModels}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Step Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                const newStep = {
                  id: generateNewId('step', action.pseudoSteps || []),
                  type: 'Database find many' as const,
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
                const updatedSteps = [...(action.pseudoSteps || []), newStep];
                onUpdate({ ...action, pseudoSteps: updatedSteps });
              }}
              className="btn-matrix w-full text-xs py-2"
            >
              <PlusIcon size={14} />
              Add Step
            </Button>

            {/* Generate Code Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                generateCodeFromSteps();
              }}
              disabled={!action.pseudoSteps?.length || isGeneratingCode}
              className="btn-matrix w-full text-sm py-2"
            >
              {isGeneratingCode ? "⚡ Materializing..." : "🔮 Conjure Code →"}
            </Button>
          </div>
        );

      case 'code':
        return (
          <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* Code Editor */}
            <div className="space-y-2">
              <Label className="text-blue-300 font-mono text-xs">💎 Executable Code</Label>
              <Textarea
                value={action.execute?.code?.script || ''}
                onChange={(e) => {
                  onUpdate({
                    ...action,
                    execute: {
                      ...action.execute,
                      type: 'code',
                      code: {
                        ...action.execute?.code,
                        script: e.target.value,
                        envVars: action.execute?.code?.envVars || []
                      }
                    }
                  });
                }}
                placeholder="// Your executable JavaScript code will appear here
// You can edit it directly or regenerate from steps
async function executeAction(input, env) {
  // Implementation goes here
  return { success: true, data: {} };
}"
                className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-xs min-h-[120px] resize-none"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            {/* Environment Variables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-blue-300 font-mono text-xs">🔐 Environment Variables</Label>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newEnvVar = {
                      name: '',
                      description: '',
                      required: true,
                      sensitive: false
                    };
                    const updatedEnvVars = [...(action.execute?.code?.envVars || []), newEnvVar];
                    onUpdate({
                      ...action,
                      execute: {
                        ...action.execute,
                        type: 'code',
                        code: {
                          ...action.execute?.code,
                          script: action.execute?.code?.script || '',
                          envVars: updatedEnvVars
                        }
                      }
                    });
                  }}
                  className="btn-matrix text-xs px-2 py-1"
                >
                  <PlusIcon size={12} />
                </Button>
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-2">
                {action.execute?.code?.envVars?.map((envVar, index) => (
                  <div key={index} className="p-2 rounded-lg bg-black/40 border border-blue-500/20">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={envVar.name}
                          onChange={(e) => {
                            const updatedEnvVars = action.execute?.code?.envVars?.map((ev, i) => 
                              i === index ? { ...ev, name: e.target.value } : ev
                            ) || [];
                            onUpdate({
                              ...action,
                              execute: {
                                ...action.execute,
                                type: 'code',
                                code: {
                                  ...action.execute?.code,
                                  script: action.execute?.code?.script || '',
                                  envVars: updatedEnvVars
                                }
                              }
                            });
                          }}
                          placeholder="Variable name"
                          className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-xs h-7"
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                        />
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedEnvVars = action.execute?.code?.envVars?.filter((_, i) => i !== index) || [];
                            onUpdate({
                              ...action,
                              execute: {
                                ...action.execute,
                                type: 'code',
                                code: {
                                  ...action.execute?.code,
                                  script: action.execute?.code?.script || '',
                                  envVars: updatedEnvVars
                                }
                              }
                            });
                          }}
                          variant="destructive"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <CrossIcon size={10} />
                        </Button>
                      </div>
                      <Input
                        value={envVar.description}
                        onChange={(e) => {
                          const updatedEnvVars = action.execute?.code?.envVars?.map((ev, i) => 
                            i === index ? { ...ev, description: e.target.value } : ev
                          ) || [];
                          onUpdate({
                            ...action,
                            execute: {
                              ...action.execute,
                              type: 'code',
                              code: {
                                ...action.execute?.code,
                                script: action.execute?.code?.script || '',
                                envVars: updatedEnvVars
                              }
                            }
                          });
                        }}
                        placeholder="Description"
                        className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-xs h-7"
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-blue-300 text-xs font-mono">
                          <input
                            type="checkbox"
                            checked={envVar.required}
                            onChange={(e) => {
                              const updatedEnvVars = action.execute?.code?.envVars?.map((ev, i) => 
                                i === index ? { ...ev, required: e.target.checked } : ev
                              ) || [];
                              onUpdate({
                                ...action,
                                execute: {
                                  ...action.execute,
                                  type: 'code',
                                  code: {
                                    ...action.execute?.code,
                                    script: action.execute?.code?.script || '',
                                    envVars: updatedEnvVars
                                  }
                                }
                              });
                            }}
                            className="rounded border-blue-500/30"
                            onClick={(e) => e.stopPropagation()}
                          />
                          Required
                        </label>
                        <label className="flex items-center gap-1 text-blue-300 text-xs font-mono">
                          <input
                            type="checkbox"
                            checked={envVar.sensitive}
                            onChange={(e) => {
                              const updatedEnvVars = action.execute?.code?.envVars?.map((ev, i) => 
                                i === index ? { ...ev, sensitive: e.target.checked } : ev
                              ) || [];
                              onUpdate({
                                ...action,
                                execute: {
                                  ...action.execute,
                                  type: 'code',
                                  code: {
                                    ...action.execute?.code,
                                    script: action.execute?.code?.script || '',
                                    envVars: updatedEnvVars
                                  }
                                }
                              });
                            }}
                            className="rounded border-blue-500/30"
                            onClick={(e) => e.stopPropagation()}
                          />
                          Sensitive
                        </label>
                      </div>
                    </div>
                  </div>
                )) || null}
              </div>
            </div>

            {/* Regenerate Code Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                generateCodeFromSteps();
              }}
              disabled={!action.pseudoSteps?.length || isGeneratingCode}
              className="btn-matrix w-full text-xs py-2"
              variant="outline"
            >
              🔄 Regenerate from Steps
            </Button>

            {/* Execute Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                executeAction();
              }}
              disabled={!action.execute?.code?.script || isExecuting}
              className="btn-matrix w-full text-sm py-2"
            >
              {isExecuting ? "🚀 Launching..." : "🎯 Test Flight →"}
            </Button>
          </div>
        );

      case 'execution':
        const executionData = node.data;
        return (
          <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            {executionData ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-300 font-mono text-xs font-semibold mb-2">
                  🎊 Mission Accomplished
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-emerald-200 flex justify-between">
                    <span>Status:</span> 
                    <span className="font-bold">{executionData.success ? '✅ Success' : '❌ Failed'}</span>
                  </div>
                  <div className="text-emerald-200 flex justify-between">
                    <span>Duration:</span> 
                    <span>{executionData.executionTime}ms ⚡</span>
                  </div>
                  {executionData.modelsAffected?.length > 0 && (
                    <div className="text-emerald-200">
                      <div className="font-semibold">🗃️ Data Updated:</div>
                      {executionData.modelsAffected.slice(0, 2).map((m: any, i: number) => (
                        <div key={i} className="text-emerald-300 ml-2">
                          📊 {m.name} ({m.recordCount})
                        </div>
                      ))}
                    </div>
                  )}
                  {executionData.result && (
                    <div className="mt-2">
                      <div className="text-emerald-300 font-semibold mb-1">Result:</div>
                      <pre className="text-emerald-200 text-xs bg-emerald-500/5 p-2 rounded overflow-auto max-h-20">
                        {typeof executionData.result === 'string' 
                          ? executionData.result 
                          : JSON.stringify(executionData.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-blue-300 font-mono text-xs text-center">
                  🌟 Awaiting your command
                </div>
                <div className="text-blue-400/70 font-mono text-xs text-center mt-1">
                  Execute the action to see results here
                </div>
              </div>
            )}

            {/* Re-execute Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                executeAction();
              }}
              disabled={!action.execute?.code?.script || isExecuting}
              className="btn-matrix w-full text-sm py-2"
            >
              {isExecuting ? "🚀 Re-launching..." : "🎯 Execute Again"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (viewingModelChanges) {
    return (
      <ModelExecutionChangesViewer
        modelChange={viewingModelChanges}
        onBack={() => setViewingModelChanges(null)}
      />
    );
  }

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <span className="text-blue-400 text-lg md:text-xl">🧠</span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-blue-200 font-mono">
                {isMobile ? 'Mind Flow' : 'Action Mind Map'}
              </h3>
              <p className="text-blue-400 text-xs md:text-sm font-mono">
                {isMobile ? 'Idea → Steps → Code → Launch' : 'Visual flow from idea to execution'}
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
          className="relative bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-blue-950/20"
          style={{ 
            minHeight: isMobile ? '800px' : '600px', 
            minWidth: isMobile ? '320px' : '1400px',
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
                  stroke={connection.status === 'flowing' ? '#60A5FA' : '#3B82F6'}
                  strokeWidth={connection.status === 'flowing' ? 3 : 2}
                  fill="none"
                  strokeDasharray={connection.status === 'flowing' ? '0' : '5,5'}
                  className="transition-all duration-300"
                  style={{
                    filter: connection.status === 'flowing' ? 'drop-shadow(0 0 8px #60A5FA)' : 'none'
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
                      ? 'bg-blue-500/20 border-blue-400/60 shadow-xl shadow-blue-500/20'
                      : 'bg-blue-950/40 border-blue-500/30 hover:border-blue-400/50'
                  } ${
                    node.status === 'complete' ? 'ring-2 ring-emerald-400/50' :
                    node.status === 'processing' ? 'ring-2 ring-blue-400/50 ai-generating' : ''
                  }`}
                  style={{
                    backdropFilter: 'blur(8px)',
                    ...(selectedNode === node.id && {
                      boxShadow: '0 0 30px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
                    }),
                    ...(node.status === 'processing' && {
                      animation: 'ai-glow 2s ease-in-out infinite alternate, ai-shimmer 3s linear infinite'
                    })
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-mono font-bold transition-all duration-300 ${
                      selectedNode === node.id ? 'text-blue-200 text-base' : 'text-blue-300 text-sm'
                    }`}>
                      {node.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      {node.status === 'complete' && <span className="text-emerald-400 text-lg">✅</span>}
                      {node.status === 'processing' && (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                          <span className="text-blue-400 text-lg animate-pulse">⚡</span>
                        </div>
                      )}
                      {node.status === 'empty' && <span className="text-blue-500/50 text-lg">⭕</span>}
                    </div>
                  </div>
                  
                  <div className={`text-blue-400 font-mono transition-all duration-300 ${
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
                className="btn-matrix text-xs px-3 py-2"
                disabled={isGeneratingSteps || isGeneratingCode || isExecuting}
              >
                🎯 Start Here
              </Button>
              {action.description && (
                <Button
                  onClick={generateStepsFromDescription}
                  className="btn-matrix text-xs px-3 py-2"
                  disabled={!action.name.trim() || !action.description.trim() || isGeneratingSteps}
                >
                  {isGeneratingSteps ? "⚡" : "✨ Steps"}
                </Button>
              )}
              {(action.pseudoSteps?.length || 0) > 0 && (
                <Button
                  onClick={generateCodeFromSteps}
                  className="btn-matrix text-xs px-3 py-2"
                  disabled={!action.pseudoSteps?.length || isGeneratingCode}
                >
                  {isGeneratingCode ? "⚡" : "🔮 Code"}
                </Button>
              )}
              {action.execute?.code?.script && (
                <Button
                  onClick={executeAction}
                  className="btn-matrix text-xs px-3 py-2"
                  disabled={!action.execute?.code?.script || isExecuting}
                >
                  {isExecuting ? "🚀" : "🎯 Test"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ActionMindMapEditor.displayName = 'ActionMindMapEditor'; 