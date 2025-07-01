import * as React from 'react';
import { memo, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
import { RecordEditor } from './RecordEditor';
import type { AgentModel, AgentEnum } from '../../types';
import { generateNewId } from '../../utils';

interface ModelRecord {
  id: string;
  modelId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ModelDataViewerProps {
  model: AgentModel;
  onUpdateModel: (model: AgentModel) => void;
  onBack: () => void;
  allModels: AgentModel[];
}

export const ModelDataViewer = memo(({ 
  model, 
  onUpdateModel, 
  onBack,
  allModels
}: { 
  model: AgentModel;
  onUpdateModel: (model: AgentModel) => void;
  onBack: () => void;
  allModels: AgentModel[];
}) => {
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  const records = model.records || [];

  // Collect all enums from all models
  const allEnums = useMemo(() => {
    return allModels.flatMap(model => model.enums || []);
  }, [allModels]);

  const addRecord = useCallback(() => {
    setIsAddingRecord(true);
    setEditingRecordId(null);
  }, []);

  const saveRecord = useCallback((recordData: Record<string, any>, recordId?: string) => {
    const now = new Date().toISOString();
    
    if (recordId) {
      // Update existing record
      const updatedRecords = records.map(record => 
        record.id === recordId 
          ? { ...record, data: recordData, updatedAt: now }
          : record
      );
      onUpdateModel({ ...model, records: updatedRecords });
    } else {
      // Add new record
      const newRecord: ModelRecord = {
        id: generateNewId('record', records),
        modelId: model.id,
        data: recordData,
        createdAt: now,
        updatedAt: now
      };
      onUpdateModel({ ...model, records: [...records, newRecord] });
    }
    
    setEditingRecordId(null);
    setIsAddingRecord(false);
  }, [model, records, onUpdateModel]);

  const deleteRecord = useCallback((recordId: string) => {
    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      const updatedRecords = records.filter(record => record.id !== recordId);
      onUpdateModel({ ...model, records: updatedRecords });
      setEditingRecordId(null);
    }
  }, [model, records, onUpdateModel]);

  const cancelEdit = useCallback(() => {
    setEditingRecordId(null);
    setIsAddingRecord(false);
  }, []);

  // Show record editor when adding or editing
  if (isAddingRecord || editingRecordId) {
    const editingRecord = editingRecordId ? records.find(r => r.id === editingRecordId) : null;
    return (
      <RecordEditor
        model={model}
        allModels={allModels}
        allEnums={allEnums}
        record={editingRecord}
        onSave={saveRecord}
        onCancel={cancelEdit}
        onDelete={editingRecord ? () => deleteRecord(editingRecord.id) : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button onClick={onBack} className="btn-matrix px-3 py-2 w-fit">
            ← Back
          </Button>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">{model.name} Data</h3>
            <p className="text-green-400 text-xs sm:text-sm font-mono">
              {records.length} records • {model.fields.length} fields
            </p>
          </div>
        </div>
        <Button 
          onClick={addRecord}
          className="btn-matrix px-3 sm:px-4 py-2 w-full sm:w-auto"
        >
          <div className="flex items-center gap-2 justify-center">
            <PlusIcon size={16} />
            <span className="text-sm sm:text-base">Add Record</span>
          </div>
        </Button>
      </div>

      {/* Model Description */}
      {model.description && (
        <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
          <p className="text-green-300 text-xs sm:text-sm font-mono leading-relaxed">{model.description}</p>
        </div>
      )}

      {/* Records Display */}
      {records.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-xl border border-green-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-500/10 border-b border-green-500/20">
                  <tr>
                    {model.fields.slice(0, 4).map(field => (
                      <th key={field.id} className="px-4 py-3 text-left">
                        <span className="text-green-300 text-sm font-medium font-mono">
                          {field.name}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left">
                      <span className="text-green-300 text-sm font-medium font-mono">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id} className="border-b border-green-500/10 hover:bg-green-500/5">
                      {model.fields.slice(0, 4).map(field => (
                        <td key={field.id} className="px-4 py-3">
                          <span className="text-green-200 text-sm font-mono">
                            {String(record.data[field.name] || '-')}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => setEditingRecordId(record.id)}
                          size="sm"
                          className="btn-matrix px-3 py-1 text-xs"
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {records.map(record => {
              // Show first 3 fields + 1 more if available
              const displayFields = model.fields.slice(0, 3);
              const hasMoreFields = model.fields.length > 3;
              
              return (
                <div key={record.id} className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                  <div className="space-y-3">
                    {/* Record Fields */}
                    <div className="space-y-2">
                      {displayFields.map(field => {
                        const value = record.data[field.name];
                        const displayValue = value !== undefined && value !== null && value !== '' 
                          ? String(value) 
                          : '-';
                        
                        return (
                          <div key={field.id} className="flex justify-between items-start gap-3">
                            <span className="text-green-300 text-xs font-medium font-mono flex-shrink-0">
                              {field.name}
                              {field.required && <span className="text-red-400 ml-1">*</span>}:
                            </span>
                            <span className="text-green-200 text-xs font-mono text-right break-words">
                              {displayValue.length > 30 
                                ? `${displayValue.substring(0, 30)}...` 
                                : displayValue}
                            </span>
                          </div>
                        );
                      })}
                      
                      {hasMoreFields && (
                        <div className="pt-1 border-t border-green-500/10">
                          <span className="text-green-400 text-xs font-mono opacity-60">
                            +{model.fields.length - 3} more fields
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <div className="pt-2 border-t border-green-500/10">
                      <Button
                        onClick={() => setEditingRecordId(record.id)}
                        size="sm"
                        className="btn-matrix px-3 py-2 text-xs w-full"
                      >
                        Edit Record
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-green-800/30 flex items-center justify-center border border-green-500/20">
            <span className="text-2xl sm:text-4xl">📊</span>
          </div>
          <h4 className="text-lg sm:text-xl font-semibold text-green-300 mb-2 font-mono">No Records Yet</h4>
          <p className="text-green-500 text-sm font-mono mb-6 px-4">Add the first record to your {model.name} model</p>
          <Button 
            onClick={addRecord}
            className="btn-matrix px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto max-w-xs"
          >
            <div className="flex items-center gap-2 justify-center">
              <PlusIcon size={16} />
              <span>Add First Record</span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}); 