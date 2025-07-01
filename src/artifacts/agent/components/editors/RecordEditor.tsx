import * as React from 'react';
import { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossIcon } from '@/components/icons';
import type { AgentModel, AgentField, AgentEnum, AgentFormField } from '../../types';

interface ModelRecord {
  id: string;
  modelId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface RecordEditorProps {
  model: AgentModel;
  allModels: AgentModel[];
  allEnums: AgentEnum[];
  record?: ModelRecord | null;
  onSave: (data: Record<string, any>, recordId?: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const RecordEditor = memo(({ 
  model, 
  record, 
  onSave, 
  onCancel, 
  onDelete,
  allModels = [],
  allEnums = []
}: { 
  model: AgentModel;
  record?: ModelRecord | null;
  onSave: (data: Record<string, any>, recordId?: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  allModels?: AgentModel[];
  allEnums?: AgentEnum[];
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    record?.data || {}
  );

  const updateField = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const getFieldValue = useCallback((field: AgentField) => {
    return formData[field.name] || (field.list ? [] : '');
  }, [formData]);

  const handleSave = useCallback(() => {
    onSave(formData, record?.id);
  }, [formData, onSave, record?.id]);

  const renderFieldInput = (field: AgentField) => {
    const fieldId = `field-${field.id}`;
    
    // Don't render input for ID fields - they should be auto-generated
    if (field.isId) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
          <span className="text-gray-400 text-sm font-mono">
            {record ? String(record.data[field.name] || record.id) : 'Auto-generated on save'}
          </span>
          <span className="text-xs text-gray-500 font-mono bg-gray-700 px-2 py-1 rounded">
            ID
          </span>
        </div>
      );
    }

    // Handle relation fields
    if (field.relationField && field.kind === 'object') {
      const relatedModel = allModels.find(m => m.name === field.type);
      
      if (!relatedModel) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-red-400 text-sm font-mono">
              Related model "{field.type}" not found
            </span>
          </div>
        );
      }

      const relatedRecords = relatedModel.records || [];
      
      if (relatedRecords.length === 0) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-yellow-400 text-sm font-mono">
              No {field.type} records available
            </span>
          </div>
        );
      }

      if (field.list) {
        // Multi-select for list relations
        const selectedIds = Array.isArray(getFieldValue(field)) ? getFieldValue(field) : [];
        
        return (
          <div className="space-y-2">
            <div className="text-green-400 text-xs font-mono mb-2">
              Select multiple {field.type} records ({selectedIds.length} selected)
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg bg-black/30 border border-green-500/20">
              {relatedRecords.map(relatedRecord => {
                const isSelected = selectedIds.includes(relatedRecord.id);
                const displayField = relatedModel.displayFields[0] || relatedModel.idField;
                const displayValue = relatedRecord.data[displayField] || relatedRecord.id;
                
                return (
                  <label key={relatedRecord.id} className="flex items-center gap-2 p-2 hover:bg-green-500/10 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelectedIds = e.target.checked
                          ? [...selectedIds, relatedRecord.id]
                          : selectedIds.filter((id: string) => id !== relatedRecord.id);
                        updateField(field.name, newSelectedIds);
                      }}
                      className="w-4 h-4 rounded border-green-500/30 bg-black/50 text-green-400 focus:ring-green-400/20"
                    />
                    <span className="text-green-200 text-sm font-mono flex-1">
                      {String(displayValue)}
                    </span>
                    <span className="text-green-500 text-xs font-mono">
                      ID: {relatedRecord.id}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      } else {
        // Single select for non-list relations
        const selectedId = getFieldValue(field);
        
        return (
          <Select
            value={selectedId || 'none'}
            onValueChange={(value) => updateField(field.name, value === 'none' ? null : value)}
          >
            <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
              <SelectValue placeholder={`Select ${field.type}`} />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500/30">
              <SelectItem value="none" className="text-green-200 focus:bg-green-500/20 font-mono">
                None selected
              </SelectItem>
              {relatedRecords.map(relatedRecord => {
                const displayField = relatedModel.displayFields[0] || relatedModel.idField;
                const displayValue = relatedRecord.data[displayField] || relatedRecord.id;
                
                return (
                  <SelectItem 
                    key={relatedRecord.id} 
                    value={relatedRecord.id} 
                    className="text-green-200 focus:bg-green-500/20 font-mono"
                  >
                    {String(displayValue)} (ID: {relatedRecord.id})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      }
    }
    
    // Handle enum fields
    if (field.kind === 'enum') {
      const enumType = allEnums.find(e => e.name === field.type);
      
      if (!enumType) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-red-400 text-sm font-mono">
              Enum "{field.type}" not found
            </span>
          </div>
        );
      }

      const enumValues = enumType.fields || [];
      
      if (enumValues.length === 0) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-yellow-400 text-sm font-mono">
              No values defined for enum "{field.type}"
            </span>
          </div>
        );
      }

      if (field.list) {
        // Multi-select for list enums
        const selectedValues = Array.isArray(getFieldValue(field)) ? getFieldValue(field) : [];
        
        return (
          <div className="space-y-2">
            <div className="text-green-400 text-xs font-mono mb-2">
              Select multiple values ({selectedValues.length} selected)
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg bg-black/30 border border-green-500/20">
              {enumValues.map(enumValue => {
                const isSelected = selectedValues.includes(enumValue.name);
                
                return (
                  <label key={enumValue.id} className="flex items-center gap-2 p-2 hover:bg-green-500/10 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelectedValues = e.target.checked
                          ? [...selectedValues, enumValue.name]
                          : selectedValues.filter((value: string) => value !== enumValue.name);
                        updateField(field.name, newSelectedValues);
                      }}
                      className="w-4 h-4 rounded border-green-500/30 bg-black/50 text-green-400 focus:ring-green-400/20"
                    />
                    <span className="text-green-200 text-sm font-mono flex-1">
                      {enumValue.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      } else {
        // Single select for non-list enums
        const selectedValue = getFieldValue(field);
        
        return (
          <Select
            value={selectedValue || 'none'}
            onValueChange={(value) => updateField(field.name, value === 'none' ? '' : value)}
          >
            <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
              <SelectValue placeholder={`Select ${field.type}`} />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500/30">
              <SelectItem value="none" className="text-green-200 focus:bg-green-500/20 font-mono">
                None selected
              </SelectItem>
              {enumValues.map(enumValue => (
                <SelectItem 
                  key={enumValue.id} 
                  value={enumValue.name} 
                  className="text-green-200 focus:bg-green-500/20 font-mono"
                >
                  {enumValue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
    }
    
    if (field.type === 'Boolean') {
      return (
        <div className="flex items-center gap-2">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(getFieldValue(field))}
            onChange={(e) => updateField(field.name, e.target.checked)}
            className="w-4 h-4 rounded border-green-500/30 bg-black/50 text-green-400 focus:ring-green-400/20"
          />
          <span className="text-green-400 text-sm font-mono">
            {getFieldValue(field) ? 'True' : 'False'}
          </span>
        </div>
      );
    } else if (field.type === 'Int' || field.type === 'Float') {
      return (
        <Input
          id={fieldId}
          type="number"
          step={field.type === 'Float' ? '0.01' : '1'}
          value={getFieldValue(field)}
          onChange={(e) => updateField(field.name, field.type === 'Int' ? Number.parseInt(e.target.value) || 0 : Number.parseFloat(e.target.value) || 0)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
        />
      );
    } else if (field.type === 'DateTime') {
      return (
        <Input
          id={fieldId}
          type="datetime-local"
          value={getFieldValue(field)}
          onChange={(e) => updateField(field.name, e.target.value)}
          className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
        />
      );
    } else {
      return (
        <Input
          id={fieldId}
          type="text"
          value={getFieldValue(field)}
          onChange={(e) => updateField(field.name, e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
        />
      );
    }
  };

  // If model has forms, display each form as a section in order
  // If no forms, display all fields in a single section
  const formsToDisplay = model.forms && model.forms.length > 0 
    ? model.forms.sort((a, b) => a.order - b.order)
    : null;

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button onClick={onCancel} className="btn-matrix px-3 py-2 w-fit">
            ← Cancel
          </Button>
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">
              {record ? 'Edit' : 'Add'} {model.name} Record
            </h3>
            <p className="text-green-400 text-xs sm:text-sm font-mono">
              Fill in the fields below using {formsToDisplay ? `${formsToDisplay.length} forms` : 'all fields'}
            </p>
          </div>
        </div>
        
        {/* Action buttons - Responsive layout */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          {onDelete && (
            <Button 
              onClick={onDelete}
              variant="destructive"
              className="px-3 sm:px-4 py-2 w-full sm:w-auto order-2 sm:order-1"
            >
              <div className="flex items-center gap-2 justify-center">
                <CrossIcon size={16} />
                <span>Delete Record</span>
              </div>
            </Button>
          )}
          <Button 
            onClick={handleSave}
            className="btn-matrix px-3 sm:px-4 py-2 w-full sm:w-auto order-1 sm:order-2"
          >
            <span>Save Record</span>
          </Button>
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {formsToDisplay ? (
          // Display each form as a separate section
          formsToDisplay.map((form) => {
            const formFields = form.fields
              .sort((a, b) => a.order - b.order)
              .map(formField => {
                const modelField = model.fields.find(f => f.id === formField.fieldId);
                return modelField && !formField.hidden ? { ...modelField, formField } : null;
              })
              .filter(Boolean) as (AgentField & { formField: AgentFormField })[];

            if (formFields.length === 0) return null;

            return (
              <div key={form.id} className="p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                  <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono">{form.title}</h4>
                  {form.description && (
                    <p className="text-green-400 text-xs sm:text-sm font-mono">- {form.description}</p>
                  )}
                  <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
                    <span className="text-green-300 text-xs font-medium font-mono">{formFields.length} fields</span>
                  </div>
                </div>
                
                <div className="grid gap-4 max-w-4xl mx-auto">
                  {formFields.map(field => {
                    const isRequired = field.formField.required !== undefined ? 
                      field.formField.required : field.required;
                    
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-green-300 font-mono font-medium text-xs sm:text-sm">
                          {field.title || field.name}
                          {isRequired && <span className="text-red-400 ml-1">*</span>}
                          <span className="text-green-500 text-xs ml-2">({field.type})</span>
                        </Label>
                        {renderFieldInput(field)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          // Display all fields in a single section if no forms
          <div className="p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
              <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono">All Fields</h4>
              <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
                <span className="text-green-300 text-xs font-medium font-mono">{model.fields.length} fields</span>
              </div>
            </div>
            
            <div className="grid gap-4 max-w-4xl mx-auto">
              {model.fields.map(field => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`} className="text-green-300 font-mono font-medium text-xs sm:text-sm">
                    {field.title || field.name}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                    <span className="text-green-500 text-xs ml-2">({field.type})</span>
                  </Label>
                  {renderFieldInput(field)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});