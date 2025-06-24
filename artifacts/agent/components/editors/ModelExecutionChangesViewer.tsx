import React, { memo } from 'react';
import { Button } from '@/components/ui/button';

interface ModelChange {
  operation: 'create' | 'update' | 'delete';
  recordId?: string;
  data?: Record<string, any>;
  previousData?: Record<string, any>;
}

interface ModelExecutionChange {
  name: string;
  recordCount: number;
  changes: ModelChange[];
}

interface ModelExecutionChangesViewerProps {
  modelChange: ModelExecutionChange;
  onBack: () => void;
}

export const ModelExecutionChangesViewer = memo<ModelExecutionChangesViewerProps>(({ 
  modelChange, 
  onBack 
}) => {
  const renderFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'create': return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
      case 'update': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30';
      case 'delete': return 'text-red-300 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
    }
  };

  const hasChanges = modelChange.changes && modelChange.changes.length > 0;

  return (
    <div className="space-y-6">
      {/* Full-width visual separator to clearly indicate this is a separate view */}
      <div className="w-full h-1 bg-gradient-to-r from-green-500/50 via-blue-500/50 to-green-500/50 rounded-full"></div>
      
      {/* Enhanced Header with Breadcrumb */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              className="btn-matrix px-4 py-2 text-sm"
            >
              ← Back to Action
            </Button>
            <div className="flex items-center gap-2 text-green-400/70 text-sm font-mono">
              <span>Action Execution</span>
              <span>→</span>
              <span>Database Changes</span>
              <span>→</span>
              <span className="text-green-300 font-semibold">{modelChange.name} Details</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 border-t border-green-500/20 pt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <span className="text-green-400 text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-200 font-mono">
                {modelChange.name} - Database Changes
              </h2>
              <p className="text-green-400 text-sm font-mono mt-1">
                {modelChange.changes?.length || 0} changes • {modelChange.recordCount} total records in model
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Changes List */}
      <div className="space-y-4">
        {hasChanges ? (
          modelChange.changes.map((change, index) => (
            <div key={index} className="p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
              <div className="space-y-4">
                {/* Operation Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getOperationColor(change.operation)}`}>
                      {change.operation.toUpperCase()}
                    </span>
                    {change.recordId && (
                      <span className="text-green-400/70 text-sm font-mono">
                        ID: {change.recordId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Data Display */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Current/New Data */}
                  {change.data && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-green-400 font-mono">
                        {change.operation === 'create' ? '📝 Created Data' : 
                         change.operation === 'update' ? '📝 Updated Data' : 
                         '📝 Data'}
                      </h4>
                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                        <div className="space-y-2">
                          {Object.entries(change.data).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-start gap-3">
                              <span className="text-green-300 text-sm font-medium font-mono flex-shrink-0">
                                {key}:
                              </span>
                              <span className="text-green-200 text-sm font-mono text-right break-words">
                                {renderFieldValue(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Previous Data (for updates and deletes) */}
                  {change.previousData && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-orange-400 font-mono">
                        {change.operation === 'update' ? '📋 Previous Data' : '📋 Deleted Data'}
                      </h4>
                      <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                        <div className="space-y-2">
                          {Object.entries(change.previousData).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-start gap-3">
                              <span className="text-orange-300 text-sm font-medium font-mono flex-shrink-0">
                                {key}:
                              </span>
                              <span className="text-orange-200 text-sm font-mono text-right break-words">
                                {renderFieldValue(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Changes Summary for Updates */}
                {change.operation === 'update' && change.data && change.previousData && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-400 font-mono">🔄 Field Changes</h4>
                    <div className="space-y-1">
                      {Object.keys(change.data).map(key => {
                        const newValue = change.data![key];
                        const oldValue = change.previousData![key];
                        const hasChanged = JSON.stringify(newValue) !== JSON.stringify(oldValue);
                        
                        if (!hasChanged) return null;
                        
                        return (
                          <div key={key} className="p-2 rounded bg-blue-500/5 border border-blue-500/10">
                            <div className="text-blue-300 text-xs font-mono font-medium mb-1">{key}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                              <div>
                                <span className="text-red-400">− </span>
                                <span className="text-red-300">{renderFieldValue(oldValue)}</span>
                              </div>
                              <div>
                                <span className="text-green-400">+ </span>
                                <span className="text-green-300">{renderFieldValue(newValue)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-green-800/30 flex items-center justify-center border border-green-500/20">
              <span className="text-2xl sm:text-4xl">📊</span>
            </div>
            <h4 className="text-lg sm:text-xl font-semibold text-green-300 mb-4 font-mono">No Database Changes</h4>
            <div className="space-y-3 max-w-md mx-auto">
              <p className="text-green-500 text-sm font-mono">
                The last action execution did not make any changes to the {modelChange.name} model.
              </p>
              {modelChange.recordCount > 0 ? (
                <p className="text-green-400/70 text-sm font-mono">
                  This model has {modelChange.recordCount} existing records. No new records were created, updated, or deleted.
                </p>
              ) : (
                <p className="text-green-400/70 text-sm font-mono">
                  This model is empty ({modelChange.recordCount} records). No records were created during the action execution.
                </p>
              )}
              <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-400 text-xs font-mono mb-2">💡 To see changes here:</p>
                <ul className="text-blue-300/70 text-xs font-mono text-left space-y-1">
                  <li>• Run an action that creates, updates, or deletes {modelChange.name} records</li>
                  <li>• Use Production Mode (not Test Mode) for real database changes</li>
                  <li>• Check that your action code actually modifies this model</li>
                </ul>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-400 text-xs font-mono">
                  📋 To view all {modelChange.name} records, go to Models tab → {modelChange.name} → View Data
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ModelExecutionChangesViewer.displayName = 'ModelExecutionChangesViewer'; 