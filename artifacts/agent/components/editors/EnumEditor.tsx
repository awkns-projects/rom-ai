import * as React from 'react';
import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CrossIcon, PlusIcon } from '@/components/icons';
import type { AgentEnum, AgentEnumField } from '../../types';
import { generateNewId } from '../../utils';

interface EnumEditorProps {
  enumItem: AgentEnum;
  onUpdate: (enumItem: AgentEnum) => void;
  onDelete: () => void;
}

export const EnumEditor = memo(({
  enumItem,
  onUpdate,
  onDelete
}: EnumEditorProps) => {
  const addField = useCallback(() => {
    const newField: AgentEnumField = {
      id: generateNewId('enumField', enumItem.fields),
      name: `VALUE_${enumItem.fields.length + 1}`,
      type: 'String',
      defaultValue: ''
    };
    onUpdate({
      ...enumItem,
      fields: [...enumItem.fields, newField]
    });
  }, [enumItem, onUpdate]);

  const updateField = useCallback((index: number, updates: Partial<AgentEnumField>) => {
    onUpdate({
      ...enumItem,
      fields: enumItem.fields.map((field, i) => i === index ? { ...field, ...updates } : field)
    });
  }, [enumItem, onUpdate]);

  const deleteField = useCallback((index: number) => {
    onUpdate({
      ...enumItem,
      fields: enumItem.fields.filter((_, i) => i !== index)
    });
  }, [enumItem, onUpdate]);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <span className="text-purple-400 text-xl">📋</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-200 font-mono">Enum Configuration</h3>
              <p className="text-purple-400 text-sm font-mono">Define enumeration values</p>
            </div>
          </div>
          <Button
            onClick={onDelete}
            variant="destructive"
            className="px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <CrossIcon size={16} />
              <span>Remove Enum</span>
            </div>
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`enum-name-${enumItem.id}`} className="text-purple-300 font-mono font-medium">Enum Name</Label>
            <Input
              id={`enum-name-${enumItem.id}`}
              value={enumItem.name}
              onChange={(e) => onUpdate({ ...enumItem, name: e.target.value })}
              placeholder="Enum name (e.g., Status, Priority)"
              className="bg-black/50 border-purple-500/30 text-purple-200 placeholder-purple-500/50 focus:border-purple-400 focus:ring-purple-400/20 font-mono"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-purple-200 font-mono">Values</h4>
              <Button 
                onClick={addField}
                className="btn-matrix px-4 py-2 text-sm font-mono"
              >
                <div className="flex items-center gap-2">
                  <PlusIcon size={16} />
                  <span>Add Value</span>
                </div>
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {enumItem.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    placeholder="Enum value"
                    className="bg-black/30 border-purple-500/20 text-purple-200 placeholder-purple-500/50 focus:border-purple-400 focus:ring-purple-400/20 font-mono"
                  />
                  <Button
                    onClick={() => deleteField(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <CrossIcon size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}); 