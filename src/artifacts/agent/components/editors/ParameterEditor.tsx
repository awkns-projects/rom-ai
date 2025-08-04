import * as React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ParamValue, ActionChainStep } from '../../types/schedule';
import type { AgentAction } from '../../types/action';
import { createStaticParam, createRefParam, createAliasParam } from '../../utils/parameter-resolver';

interface ParameterEditorProps {
  paramKey: string;
  paramValue: ParamValue;
  onUpdate: (key: string, value: ParamValue) => void;
  onRemove: (key: string) => void;
  stepIndex: number;
  previousSteps: Array<{ step: ActionChainStep; action?: AgentAction; stepIndex: number }>;
  availableOutputs: Record<number, string[]>;
  expectedParam?: {
    name: string;
    type: string;
    description?: string;
    required: boolean;
  };
}

export function ParameterEditor({
  paramKey,
  paramValue,
  onUpdate,
  onRemove,
  stepIndex,
  previousSteps,
  availableOutputs,
  expectedParam
}: ParameterEditorProps) {
  const [paramName, setParamName] = useState(paramKey);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleNameChange = useCallback((newName: string) => {
    if (newName !== paramKey && newName.trim()) {
      onRemove(paramKey);
      onUpdate(newName.trim(), paramValue);
    }
    setParamName(newName);
    setIsEditingName(false);
  }, [paramKey, paramValue, onUpdate, onRemove]);

  const handleTypeToggle = useCallback(() => {
    if (paramValue.type === 'static') {
      // Switch to ref - find first available previous step
      const firstAvailableStep = previousSteps[0];
      const firstAvailableOutput = availableOutputs[0]?.[0];
      
      if (firstAvailableStep && firstAvailableOutput) {
        onUpdate(paramKey, createRefParam(0, firstAvailableOutput));
      }
    } else if (paramValue.type === 'ref') {
      // Switch to alias if we're in a loop context, otherwise back to static
      // For now, switch to alias with default values
      onUpdate(paramKey, createAliasParam('item', 'id'));
    } else {
      // Switch back to static
      onUpdate(paramKey, createStaticParam(''));
    }
  }, [paramValue, paramKey, onUpdate, previousSteps, availableOutputs]);

  const handleStaticValueChange = useCallback((value: any) => {
    onUpdate(paramKey, createStaticParam(value));
  }, [paramKey, onUpdate]);

  const handleRefChange = useCallback((field: 'fromActionIndex' | 'outputKey', value: any) => {
    if (paramValue.type === 'ref') {
      const newValue = createRefParam(
        field === 'fromActionIndex' ? value : paramValue.fromActionIndex,
        field === 'outputKey' ? value : paramValue.outputKey
      );
      onUpdate(paramKey, newValue);
    }
  }, [paramKey, paramValue, onUpdate]);

  const handleAliasChange = useCallback((field: 'fromAlias' | 'outputKey', value: string) => {
    if (paramValue.type === 'alias') {
      const newValue = createAliasParam(
        field === 'fromAlias' ? value : paramValue.fromAlias,
        field === 'outputKey' ? value : paramValue.outputKey
      );
      onUpdate(paramKey, newValue);
    }
  }, [paramKey, paramValue, onUpdate]);

  const renderValueInput = () => {
    if (paramValue.type === 'static') {
      const value = paramValue.value;
      
      // Try to determine input type from value
      if (typeof value === 'boolean') {
        return (
          <Select
            value={value.toString()}
            onValueChange={(v) => handleStaticValueChange(v === 'true')}
          >
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="true" className="text-white font-mono">true</SelectItem>
              <SelectItem value="false" className="text-white font-mono">false</SelectItem>
            </SelectContent>
          </Select>
        );
      } else if (typeof value === 'number') {
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleStaticValueChange(parseFloat(e.target.value) || 0)}
            className="bg-slate-800 border-slate-600 text-white font-mono"
          />
        );
      } else if (typeof value === 'string' && value.length > 50) {
        return (
          <Textarea
            value={value}
            onChange={(e) => handleStaticValueChange(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white font-mono min-h-[80px]"
            placeholder="Enter static value..."
          />
        );
      } else {
        return (
          <Input
            value={value?.toString() || ''}
            onChange={(e) => handleStaticValueChange(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white font-mono"
            placeholder="Enter static value..."
          />
        );
      }
    } else if (paramValue.type === 'ref') {
      // Reference input
      const availableSteps = previousSteps.filter((_, index) => index < stepIndex);
      
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-orange-300 font-mono text-xs">From Step</Label>
            <Select
              value={paramValue.fromActionIndex.toString()}
              onValueChange={(value) => handleRefChange('fromActionIndex', parseInt(value))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {availableSteps.map((stepData, index) => (
                  <SelectItem 
                    key={index} 
                    value={index.toString()}
                    className="text-white font-mono"
                  >
                    Step {index + 1}: {stepData.step.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label className="text-orange-300 font-mono text-xs">Output Field</Label>
            <Select
              value={paramValue.outputKey}
              onValueChange={(value) => handleRefChange('outputKey', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {(availableOutputs[paramValue.fromActionIndex] || []).map((outputKey) => (
                  <SelectItem 
                    key={outputKey} 
                    value={outputKey}
                    className="text-white font-mono"
                  >
                    {outputKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    } else if (paramValue.type === 'alias') {
      // Alias input - for loop iterations
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-orange-300 font-mono text-xs">From Alias</Label>
            <Input
              value={paramValue.fromAlias}
              onChange={(e) => handleAliasChange('fromAlias', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white font-mono text-sm"
              placeholder="e.g., user, product"
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-orange-300 font-mono text-xs">Property</Label>
            <Input
              value={paramValue.outputKey}
              onChange={(e) => handleAliasChange('outputKey', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white font-mono text-sm"
              placeholder="e.g., id, name"
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-red-400 text-sm font-mono">
          Unknown parameter type: {(paramValue as any).type}
        </div>
      );
    }
  };

  return (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/50 space-y-3">
      {/* Parameter Name and Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {isEditingName && !expectedParam?.required ? (
            <Input
              value={paramName}
              onChange={(e) => setParamName(e.target.value)}
              onBlur={() => handleNameChange(paramName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameChange(paramName);
                if (e.key === 'Escape') {
                  setParamName(paramKey);
                  setIsEditingName(false);
                }
              }}
              className="bg-slate-700 border-slate-500 text-white font-mono text-sm flex-1"
              autoFocus
            />
          ) : (
            <Label 
              className={`text-orange-300 font-mono text-sm font-medium flex-1 ${
                expectedParam?.required ? '' : 'cursor-pointer'
              }`}
              onClick={() => !expectedParam?.required && setIsEditingName(true)}
            >
              {paramKey} {paramValue.type === 'ref' && '🔗'} {paramValue.type === 'alias' && '🏷️'}
              {expectedParam?.required && <span className="text-red-400 ml-1">*</span>}
            </Label>
          )}
          
          {/* Type Toggle */}
          <Button
            onClick={handleTypeToggle}
            size="sm"
            variant="outline"
            className="text-xs px-2 py-1 font-mono border-slate-500 text-slate-300 hover:bg-slate-700"
            disabled={paramValue.type === 'ref' && previousSteps.length === 0}
          >
            {paramValue.type === 'static' ? '📝→🔗' : paramValue.type === 'ref' ? '🔗→🏷️' : '🏷️→📝'}
          </Button>
          
          {/* Remove Button - only show for non-required parameters */}
          {!expectedParam?.required && (
            <Button
              onClick={() => onRemove(paramKey)}
              size="sm"
              variant="destructive"
              className="text-xs px-2 py-1"
            >
              ✕
            </Button>
          )}
        </div>
        
        {/* Parameter Description */}
        {expectedParam?.description && (
          <div className="text-xs text-slate-400 font-mono pl-1">
            {expectedParam.description}
          </div>
        )}
        
        {/* Expected Type Info */}
        {expectedParam && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">Expected:</span>
            <span className="bg-slate-700/50 text-slate-300 font-mono px-2 py-1 rounded border border-slate-600">
              {expectedParam.type}
            </span>
            {expectedParam.required && (
              <span className="text-red-400 font-mono">Required</span>
            )}
          </div>
        )}
      </div>
      
      {/* Value Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2 py-1 rounded ${
            paramValue.type === 'static' 
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
              : paramValue.type === 'ref'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          }`}>
            {paramValue.type === 'static' ? '📝 Static Value' : 
             paramValue.type === 'ref' ? '🔗 Reference' : '🏷️ Alias'}
          </span>
          
          {paramValue.type === 'ref' && (
            <span className="text-xs text-slate-400 font-mono">
              → Step {paramValue.fromActionIndex + 1}.{paramValue.outputKey}
            </span>
          )}
          
          {paramValue.type === 'alias' && (
            <span className="text-xs text-slate-400 font-mono">
              → {paramValue.fromAlias}.{paramValue.outputKey}
            </span>
          )}
        </div>
        
        {renderValueInput()}
      </div>
      
      {/* Preview */}
      {paramValue.type === 'ref' && (
        <div className="text-xs text-slate-400 font-mono p-2 bg-slate-900/50 rounded border border-slate-700">
          <span className="text-orange-300">Preview:</span> Will use output "{paramValue.outputKey}" from Step {paramValue.fromActionIndex + 1} at runtime
        </div>
      )}
      
      {paramValue.type === 'alias' && (
        <div className="text-xs text-slate-400 font-mono p-2 bg-slate-900/50 rounded border border-slate-700">
          <span className="text-purple-300">Preview:</span> Will use "{paramValue.outputKey}" property from the "{paramValue.fromAlias}" loop item
        </div>
      )}
    </div>
  );
} 