import * as React from 'react';
import { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossIcon, PlusIcon } from '@/components/icons';
import type { AgentModel, AgentField, AgentEnum, AgentAction } from '../../types';
import { generateNewId, FIELD_TYPES, FIELD_KINDS } from '../../utils';

interface ModelEditorProps {
  model: AgentModel;
  onUpdate: (model: AgentModel) => void;
  onDelete: () => void;
  allModels: AgentModel[];
  allEnums: AgentEnum[];
  updateModel: (model: AgentModel) => void;
  allActions: AgentAction[];
}

export const ModelEditor = memo(({
  model,
  onUpdate,
  onDelete,
  allModels,
  allEnums,
  updateModel,
  allActions
}: ModelEditorProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const addField = useCallback(() => {
    const newField: AgentField = {
      id: generateNewId('field', model.fields),
      name: `field${model.fields.length + 1}`,
      type: 'String',
      isId: false,
      unique: false,
      list: false,
      required: false,
      kind: 'scalar',
      relationField: false,
      title: '',
      sort: false,
      order: 0, // Reset order since we're adding to top
      defaultValue: ''
    };
    
    // Add to top of list and set to editing mode
    onUpdate({
      ...model,
      fields: [newField, ...model.fields]
    });
    setEditingField(newField.id);
  }, [model, onUpdate]);

  const updateField = useCallback((fieldId: string, updates: Partial<AgentField>) => {
    onUpdate({
      ...model,
      fields: model.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    });
  }, [model, onUpdate]);

  const deleteField = useCallback((fieldId: string) => {
    const field = model.fields.find(f => f.id === fieldId);
    const fieldName = field?.name || 'this field';
    
    if (window.confirm(`Are you sure you want to delete field "${fieldName}"? This action cannot be undone.`)) {
    onUpdate({
      ...model,
      fields: model.fields.filter(field => field.id !== fieldId)
    });
    }
  }, [model, onUpdate]);

  return (
    <div className="space-y-6">
      {/* Model Basic Info */}
      <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <span className="text-green-400 text-xl">🗃️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-200 font-mono">Model Configuration</h3>
              <p className="text-green-400 text-sm font-mono">Define your database entity structure</p>
            </div>
          </div>
          <Button
            onClick={onDelete}
            variant="destructive"
            className="px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <CrossIcon size={16} />
              <span>Remove Model</span>
            </div>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor={`model-name-${model.id}`} className="text-green-300 font-mono font-medium">Model Name</Label>
            <Input
              id={`model-name-${model.id}`}
              value={model.name}
              onChange={(e) => onUpdate({ ...model, name: e.target.value })}
              placeholder="Model name (e.g., User, Post, Order)"
              className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`model-id-field-${model.id}`} className="text-green-300 font-mono font-medium">
              ID Field
              <span className="text-xs text-gray-400 ml-2">(Protected)</span>
            </Label>
            <div className="relative">
              <Input
                id={`model-id-field-${model.id}`}
                value={model.idField}
                readOnly
                disabled
                placeholder="ID field name (e.g., id)"
                className="bg-gray-800/50 border-gray-500/30 text-gray-400 placeholder-gray-500/50 cursor-not-allowed font-mono"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-mono">
                  🔒
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Primary key is always "id" for consistency
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Visibility</Label>
            <label className="flex items-center space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={model.hasPublishedField || false}
                onChange={(e) => onUpdate({ ...model, hasPublishedField: e.target.checked })}
                className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20"
              />
              <span className="text-green-200 text-sm font-mono font-medium">Published</span>
            </label>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <Label className="text-green-300 font-mono font-medium">Description</Label>
          <Input
            value={model.description || ''}
            onChange={(e) => onUpdate({ ...model, description: e.target.value })}
            placeholder="Model description (optional)"
            className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
          />
          {model.description && (
            <p className="text-green-400 text-sm font-mono italic">
              {model.description}
            </p>
          )}
        </div>
      </div>

      {/* Fields Section */}
      <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
            <h4 className="text-lg font-semibold text-green-200 font-mono">Field Definitions</h4>
            <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
              <span className="text-green-300 text-xs font-medium font-mono">{model.fields.length} fields</span>
            </div>
          </div>
          <Button 
            onClick={addField}
            className="btn-matrix px-4 py-2 text-sm font-mono"
          >
            <div className="flex items-center gap-2">
              <PlusIcon size={16} />
              <span>Add Field</span>
            </div>
          </Button>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {model.fields.map((field) => (
            <div key={field.id} className="p-4 rounded-xl bg-black/30 border border-green-500/20 hover:border-green-500/40 transition-colors">
              {editingField === field.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Field Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="Field name"
                        className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value })}
                      >
                        <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-green-500/30">
                          {field.kind === 'scalar' && FIELD_TYPES.map(type => (
                            <SelectItem key={type} value={type} className="text-green-200 focus:bg-green-500/20 font-mono">{type}</SelectItem>
                          ))}
                          {field.kind === 'object' && (
                            allModels.filter(model => model.name.trim() !== '').length > 0 ? (
                              allModels.filter(model => model.name.trim() !== '').map(model => (
                                <SelectItem key={model.id} value={model.name} className="text-green-200 focus:bg-green-500/20 font-mono">{model.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem key="no-models" value="NoModelsAvailable" className="text-gray-400 focus:bg-gray-500/20 font-mono" disabled>
                                No models available - create a model first
                              </SelectItem>
                            )
                          )}
                          {field.kind === 'enum' && (
                            allEnums.filter(enumItem => enumItem.name.trim() !== '').length > 0 ? (
                              allEnums.filter(enumItem => enumItem.name.trim() !== '').map(enumItem => (
                                <SelectItem key={enumItem.id} value={enumItem.name} className="text-green-200 focus:bg-green-500/20 font-mono">{enumItem.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem key="no-enums" value="NoEnumsAvailable" className="text-gray-400 focus:bg-gray-500/20 font-mono" disabled>
                                No enums available - create an enum first
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Kind</Label>
                      <Select
                        value={field.kind}
                        onValueChange={(value: 'scalar' | 'object' | 'enum') => {
                          updateField(field.id, { 
                            kind: value,
                            type: value === 'scalar' ? 'String' : '',
                            relationField: value === 'object'
                          });
                        }}
                      >
                        <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-green-500/30">
                          {FIELD_KINDS.map(kind => (
                            <SelectItem key={kind.value} value={kind.value} className="text-green-200 focus:bg-green-500/20 font-mono">{kind.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Title</Label>
                      <Input
                        value={field.title}
                        onChange={(e) => updateField(field.id, { title: e.target.value })}
                        placeholder="Display title"
                        className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Default Value</Label>
                      <Input
                        value={field.defaultValue || ''}
                        onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                        placeholder="Default value"
                        className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20"
                      />
                      <span className="text-green-200 text-sm font-mono">Required</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.unique}
                        onChange={(e) => updateField(field.id, { unique: e.target.checked })}
                        className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20"
                      />
                      <span className="text-green-200 text-sm font-mono">Unique</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.list}
                        onChange={(e) => updateField(field.id, { list: e.target.checked })}
                        className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20"
                      />
                      <span className="text-green-200 text-sm font-mono">List/Array</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.sort}
                        onChange={(e) => updateField(field.id, { sort: e.target.checked })}
                        className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20"
                      />
                      <span className="text-green-200 text-sm font-mono">Sortable</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => setEditingField(null)}
                      className="btn-matrix px-3 py-1 text-xs"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => deleteField(field.id)}
                      variant="destructive"
                      className="px-3 py-1 text-xs"
                    >
                      Delete Field
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-green-200 font-mono font-medium">{field.name}</span>
                        <span className="text-green-400 text-sm">({field.type})</span>
                        {field.required && <span className="text-red-400 text-xs">*</span>}
                        {field.unique && <span className="text-blue-400 text-xs">unique</span>}
                        {field.list && <span className="text-green-400 text-xs">[]</span>}
                      </div>
                      {field.title && <span className="text-green-500 text-xs font-mono">{field.title}</span>}
                    </div>
                  </div>
                  <Button
                    onClick={() => setEditingField(field.id)}
                    variant="outline"
                    size="sm"
                    className="border-green-500/30 text-green-300 hover:bg-green-500/20"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}); 