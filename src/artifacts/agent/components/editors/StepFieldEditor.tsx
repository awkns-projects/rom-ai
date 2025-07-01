import * as React from 'react';
import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CrossIcon, PlusIcon } from '@/components/icons';
import type { StepField, AgentModel } from '../../types';
import { generateNewId, FIELD_TYPES, FIELD_KINDS } from '../../utils';

interface StepFieldEditorProps {
  fields: StepField[];
  onFieldsChange: (fields: StepField[]) => void;
  label: string;
  color: 'blue' | 'orange';
  allModels?: AgentModel[];
}

export const StepFieldEditor = memo(({
  fields = [],
  onFieldsChange,
  label,
  color,
  allModels = []
}: StepFieldEditorProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Collapsed by default
  
  const colorClasses = {
    blue: {
      border: 'border-blue-500/30',
      text: 'text-blue-300',
      placeholder: 'placeholder-blue-500/50',
      focus: 'focus:border-blue-400 focus:ring-blue-400/20',
      button: 'btn-matrix'
    },
    orange: {
      border: 'border-orange-500/30',
      text: 'text-orange-300',
      placeholder: 'placeholder-orange-500/50',
      focus: 'focus:border-orange-400 focus:ring-orange-400/20',
      button: 'btn-matrix'
    }
  };

  const classes = colorClasses[color];

  const safeFields = fields || [];

  const addField = useCallback(() => {
    const newField: StepField = {
      id: generateNewId('field', safeFields),
      name: '',
      type: 'String',
      kind: 'scalar',
      required: false,
      list: false,
      description: ''
    };
    onFieldsChange([...safeFields, newField]);
    // Auto-expand when adding a field
    setIsCollapsed(false);
  }, [safeFields, onFieldsChange]);

  const updateField = useCallback((fieldId: string, updates: Partial<StepField>) => {
    const updatedFields = safeFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    onFieldsChange(updatedFields);
  }, [safeFields, onFieldsChange]);

  const removeField = useCallback((fieldId: string) => {
    if (safeFields.length <= 1) return; // Don't remove the last field
    const updatedFields = safeFields.filter(field => field.id !== fieldId);
    onFieldsChange(updatedFields);
  }, [safeFields, onFieldsChange]);

  // Get available types including model relations
  const availableTypes = [
    ...FIELD_TYPES,
    ...allModels.map(model => model.name)
  ];

  return (
    <div className="space-y-2">
      {/* Collapsible Header */}
      <div className="flex items-center justify-between">
        <div 
          className={`flex items-center gap-2 cursor-pointer ${classes.text} font-mono font-medium`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>{label} ({safeFields.length})</span>
        </div>
        <Button
          onClick={addField}
          size="sm"
          className={`px-2 py-1 text-xs ${classes.button}`}
        >
          <PlusIcon size={12} />
        </Button>
      </div>
      
      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="space-y-3">
          {safeFields.map((field, index) => (
            <div key={field.id} className={`p-3 rounded-lg bg-black/30 border ${classes.border}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Field Name */}
                <div className="space-y-1">
                  <Label className={`text-xs ${classes.text}`}>Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    placeholder="Field name"
                    className={`bg-black/50 ${classes.border} ${classes.text} ${classes.placeholder} ${classes.focus} font-mono text-sm`}
                  />
                </div>

                {/* Field Type */}
                <div className="space-y-1">
                  <Label className={`text-xs ${classes.text}`}>Type</Label>
                  <Select 
                    value={field.type} 
                    onValueChange={(value) => {
                      const isRelation = allModels.some(model => model.name === value);
                      updateField(field.id, { 
                        type: value,
                        kind: isRelation ? 'object' : 'scalar',
                        relationModel: isRelation ? value : undefined
                      });
                    }}
                  >
                    <SelectTrigger className={`bg-black/50 ${classes.border} ${classes.text} ${classes.focus} font-mono text-sm`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-xs font-medium text-gray-400 border-b border-gray-700">Scalar Types</div>
                      {FIELD_TYPES.map(type => (
                        <SelectItem key={type} value={type} className="font-mono text-sm">
                          {type}
                        </SelectItem>
                      ))}
                      {allModels.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-gray-400 border-b border-gray-700 mt-1">Model Relations</div>
                          {allModels.map(model => (
                            <SelectItem key={model.name} value={model.name} className="font-mono text-sm">
                              {model.name} (Relation)
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Field Options */}
                <div className="space-y-2">
                  <Label className={`text-xs ${classes.text}`}>Options</Label>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded border-gray-600"
                      />
                      <Label htmlFor={`required-${field.id}`} className={`text-xs ${classes.text}`}>Required</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        id={`list-${field.id}`}
                        checked={field.list}
                        onChange={(e) => updateField(field.id, { list: e.target.checked })}
                        className="rounded border-gray-600"
                      />
                      <Label htmlFor={`list-${field.id}`} className={`text-xs ${classes.text}`}>List</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-3 space-y-1">
                <Label className={`text-xs ${classes.text}`}>Description</Label>
                <Textarea
                  value={field.description || ''}
                  onChange={(e) => updateField(field.id, { description: e.target.value })}
                  placeholder="Optional field description..."
                  className={`bg-black/50 ${classes.border} ${classes.text} ${classes.placeholder} ${classes.focus} font-mono text-sm`}
                  rows={2}
                />
              </div>

              {/* Remove Button */}
              <div className="mt-3 flex justify-end">
                {safeFields.length > 1 && (
                  <Button
                    onClick={() => removeField(field.id)}
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                  >
                    <CrossIcon size={12} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}); 