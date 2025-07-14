import * as React from 'react';
import { useState, useMemo } from 'react';
import { X, AlertCircle, CheckCircle, Play, Code2, Database, User } from 'lucide-react';

// Types
interface ActionRunState {
  currentStep: number;
  stepData: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  result: any;
  isComplete: boolean;
}

interface AgentAction {
  id: string;
  name: string;
  emoji?: string;
  description: string;
  role: 'admin' | 'member';
  dataSource: {
    type: 'custom' | 'database';
    customFunction?: {
      code: string;
      envVars?: any[];
    };
    database?: {
      models: any[];
    };
  };
  execute: {
    type: 'code' | 'prompt';
    code?: {
      script: string;
      envVars?: any[];
    };
    prompt?: {
      template: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  results: {
    actionType: 'Create' | 'Update';
    model: string;
    identifierIds?: string[];
    fields?: Record<string, any>;
    fieldsToUpdate?: Record<string, any>;
  };
  uiComponents?: {
    stepForms: Array<{
      stepNumber: number;
      title: string;
      description: string;
      reactCode: string;
      propsInterface: Record<string, any>;
      validationLogic: string;
      dataRequirements: Array<{
        modelName: string;
        fields: string[];
        purpose: string;
      }>;
    }>;
    resultView: {
      title: string;
      description: string;
      reactCode: string;
      propsInterface: Record<string, any>;
    };
  };
}

interface AgentModel {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  idField: string;
  displayFields: string[];
  fields: Array<{
    id: string;
    name: string;
    type: string;
    isId: boolean;
    unique: boolean;
    list: boolean;
    required: boolean;
    kind: 'scalar' | 'object' | 'enum';
    relationField: boolean;
    title: string;
    sort: boolean;
    order: number;
    defaultValue?: string;
  }>;
  records?: Array<{
    id: string;
    data: Record<string, any>;
  }>;
}

// Enhanced Input Component Generator
const generateInputComponent = (
  fieldPath: string,
  fieldSchema: any,
  value: any,
  onChange: (path: string, value: any) => void,
  models: AgentModel[],
  databaseIdFields: string[] = []
) => {
  const isDatabaseId = databaseIdFields.includes(fieldPath);
  const isRequired = fieldSchema.required || false;
  const fieldType = fieldSchema.type || 'string';
  const isArray = fieldSchema.isMultipleIds || fieldSchema.isArray || false;

  // Database record selector for database ID fields
  if (isDatabaseId && fieldSchema.databaseIdModel) {
    const targetModel = models.find(m => m.name === fieldSchema.databaseIdModel);
    if (targetModel) {
      return (
        <div key={fieldPath} className="space-y-2">
          <label className="block text-sm font-medium text-green-300 font-mono">
            {fieldSchema.title || fieldPath.split('.').pop()}
            {isRequired && <span className="text-red-400 ml-1">*</span>}
            <span className="text-green-500/70 text-xs ml-2">({fieldSchema.databaseIdModel} ID{isArray ? 's' : ''})</span>
          </label>
          {isArray ? (
            <select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => {
                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                onChange(fieldPath, selectedValues);
              }}
              className="w-full px-3 py-2 bg-black/50 border border-green-500/30 rounded-lg text-green-100 font-mono focus:outline-none focus:border-green-400 min-h-[120px]"
              required={isRequired}
            >
              {targetModel.records?.map(record => (
                <option key={record.id} value={record.id} className="py-1">
                  {targetModel.displayFields.map(field => record.data[field]).filter(Boolean).join(' - ') || record.id}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={value || ''}
              onChange={(e) => onChange(fieldPath, e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-green-500/30 rounded-lg text-green-100 font-mono focus:outline-none focus:border-green-400"
              required={isRequired}
            >
              <option value="">Select {fieldSchema.databaseIdModel}...</option>
              {targetModel.records?.map(record => (
                <option key={record.id} value={record.id}>
                  {targetModel.displayFields.map(field => record.data[field]).filter(Boolean).join(' - ') || record.id}
                </option>
              ))}
            </select>
          )}
          {fieldSchema.helpText && (
            <p className="text-xs text-green-500/70 font-mono">{fieldSchema.helpText}</p>
          )}
        </div>
      );
    }
  }

  // Regular input fields
  const inputProps = {
    value: value || (isArray ? [] : ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onChange(fieldPath, e.target.value);
    },
    className: "w-full px-3 py-2 bg-black/50 border border-green-500/30 rounded-lg text-green-100 font-mono focus:outline-none focus:border-green-400",
    required: isRequired,
    placeholder: fieldSchema.placeholder || `Enter ${fieldPath.split('.').pop()}...`
  };

  return (
    <div key={fieldPath} className="space-y-2">
      <label className="block text-sm font-medium text-green-300 font-mono">
        {fieldSchema.title || fieldPath.split('.').pop()}
        {isRequired && <span className="text-red-400 ml-1">*</span>}
        <span className="text-green-500/70 text-xs ml-2">({fieldType})</span>
      </label>
      
      {fieldType === 'textarea' ? (
        <textarea {...inputProps} rows={4} />
      ) : fieldType === 'number' ? (
        <input {...inputProps} type="number" step="any" />
      ) : fieldType === 'email' ? (
        <input {...inputProps} type="email" />
      ) : fieldType === 'date' ? (
        <input {...inputProps} type="date" />
      ) : fieldType === 'boolean' ? (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(fieldPath, e.target.checked)}
            className="w-4 h-4 text-green-500 bg-black/50 border-green-500/30 rounded focus:ring-green-400"
          />
          <span className="text-green-300 text-sm font-mono">
            {fieldSchema.placeholder || 'Enable this option'}
          </span>
        </div>
      ) : fieldSchema.options ? (
        <select {...inputProps}>
          <option value="">Select option...</option>
          {fieldSchema.options.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input {...inputProps} type="text" />
      )}
      
      {fieldSchema.helpText && (
        <p className="text-xs text-green-500/70 font-mono">{fieldSchema.helpText}</p>
      )}
    </div>
  );
};

// Run Action Modal Component
export const RunActionModal: React.FC<{
  action: AgentAction;
  models: AgentModel[];
  onClose: () => void;
}> = ({ action, models, onClose }) => {
  const [state, setState] = useState<ActionRunState>({
    currentStep: 0,
    stepData: {},
    isLoading: false,
    error: null,
    result: null,
    isComplete: false
  });

  // Get step forms from action's uiComponents or create simple default
  const stepForms = useMemo(() => {
    if (action.uiComponents?.stepForms && action.uiComponents.stepForms.length > 0) {
      return action.uiComponents.stepForms.map(step => ({
        ...step,
        type: 'input', // Add type for compatibility
        fields: step.propsInterface || {}, // Map propsInterface to fields for compatibility
        modelName: step.dataRequirements?.[0]?.modelName // Extract modelName from dataRequirements
      }));
    }
    
    // Simple fallback: single step with basic fields based on action's database models
    const fields: Record<string, any> = {};
    
    // Extract fields from action's dataSource if available
    if (action.dataSource?.database?.models) {
      action.dataSource.database.models.forEach(model => {
        model.fields?.forEach((field: any) => {
          if (!field.isId && field.required) {
            fields[field.name] = {
              type: field.type.toLowerCase(),
              required: field.required,
              title: field.title || field.name
            };
          }
        });
      });
    }
    
    return [{
      stepNumber: 1,
      title: action.name,
      description: action.description,
      reactCode: '', // Will use standard rendering
      propsInterface: fields,
      validationLogic: '',
      dataRequirements: [],
      type: 'input',
      fields: fields,
      modelName: action.dataSource?.database?.models?.[0]?.name || ''
    }];
  }, [action]);

  const totalSteps = stepForms.length;
  const currentStepData = stepForms[state.currentStep];

  // Create mock database from models
  const mockDatabase = useMemo(() => {
    const db: Record<string, any[]> = {};
    models.forEach(model => {
      db[model.name] = model.records?.map(record => ({
        id: record.id,
        ...record.data
      })) || [];
    });
    return db;
  }, [models]);

  // Mock member (current user)
  const mockMember = {
    id: 'user_123',
    role: 'member',
    email: 'user@example.com',
    name: 'Current User'
  };

  const executeAction = async (inputData: Record<string, any>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let result;
      
      if (action.execute?.type === 'code' && action.execute.code?.script) {
        // Execute custom code with new execution pattern
        const functionBody = action.execute.code.script;
        
        // Create execution context (same pattern as action execution API)
        const executionContext = {
          prisma: mockDatabase, // Map database to prisma for compatibility
          db: mockDatabase, // Keep original for backward compatibility
          ai: {
            generateObject: async (config: any) => {
              console.log('Mock AI call:', config);
              return { object: { result: 'mock ai result' } };
            }
          },
          openai: {
            chat: {
              completions: {
                create: async (config: any) => {
                  console.log('Mock OpenAI call:', config);
                  return { choices: [{ message: { content: 'mock response' } }] };
                }
              }
            }
          },
          xai: {
            chat: {
              completions: {
                create: async (config: any) => {
                  console.log('Mock xAI call:', config);
                  return { choices: [{ message: { content: 'mock response' } }] };
                }
              }
            }
          },
          replicate: {
            run: async (model: string, input: any) => {
              console.log('Mock Replicate call:', model, input);
              return { output: 'mock ai generation result' };
            }
          },
          input: inputData,
          env: action.execute.code?.envVars?.reduce((acc: any, envVar: any) => {
            acc[envVar.name] = `mock_${envVar.name.toLowerCase()}`;
            return acc;
          }, {}) || {},
          // Utility functions
          console: {
            log: (...args: any[]) => console.log('[Action Test]', ...args),
            error: (...args: any[]) => console.error('[Action Test]', ...args),
            warn: (...args: any[]) => console.warn('[Action Test]', ...args)
          },
          generateId: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          formatDate: (date: Date | string) => new Date(date).toISOString(),
          validateRequired: (obj: any, fields: string[]) => {
            const missing = fields.filter(field => !obj[field]);
            if (missing.length > 0) {
              throw new Error(`Missing required fields: ${missing.join(', ')}`);
            }
          },
          z: {} // Mock zod for testing
        };

        // Create the function using new Function() constructor with context parameter
        const actionFunction = new Function(
          'context',
          `
          return (async () => {
            try {
              // Destructure context for generated code compatibility
              const { prisma, ai, openai, xai, replicate, input, env } = context;
              
              // Make other utilities available in scope
              const { db, console: consoleUtils, generateId, formatDate, validateRequired, z } = context;
              
              // Execute the generated code
              ${functionBody}
            } catch (error) {
              throw new Error('Execution error: ' + error.message);
            }
          })();
          `
        );
        
        // Execute with the context object
        result = await actionFunction(executionContext);
      } else {
        // Fallback to mock execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        result = {
          output: {
            success: true,
            message: `${action.name} completed successfully`,
            data: {
              id: `${action.results.model.toLowerCase()}_${Date.now()}`,
              ...inputData,
              createdAt: new Date().toISOString()
            }
          },
          data: [{
            modelId: action.results.model,
            createdRecords: [{
              id: `${action.results.model.toLowerCase()}_${Date.now()}`,
              ...inputData
            }]
          }]
        };
      }
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        result, 
        isComplete: true 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
    }
  };

  const handleInputChange = (path: string, value: any) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        [path]: value
      }
    }));
  };

  const handleNextStep = () => {
    if (state.currentStep < totalSteps - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const handlePreviousStep = () => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If this is the last step (confirmation), execute the action
    if (state.currentStep === totalSteps - 1) {
      executeAction(state.stepData);
    } else {
      // Otherwise, go to next step
      handleNextStep();
    }
  };

  const isLastStep = state.currentStep === totalSteps - 1;
  const isFirstStep = state.currentStep === 0;

  // Get input parameters structure from step data or action configuration
  const inputParameters = useMemo(() => {
    // Check if we have fields defined in the current step
    if (currentStepData?.fields && Object.keys(currentStepData.fields).length > 0) {
      return { fields: currentStepData.fields };
    }
    
    // Fallback to basic model fields
    const targetModel = models.find(m => m.name === action.results.model);
    if (targetModel) {
      return {
        fields: targetModel.fields
          .filter(field => !field.isId && field.required)
          .reduce((acc, field) => {
            acc[field.name] = {
              type: field.type.toLowerCase(),
              required: field.required,
              title: field.title || field.name,
              description: `${field.name} field`
            };
            return acc;
          }, {} as Record<string, any>)
      };
    }
    
    return { fields: {} };
  }, [currentStepData, models, action.results.model]);

  // Get database ID fields from action configuration
  const databaseIdFields = useMemo(() => {
    // Extract database ID fields from action's data requirements
    const idFields: string[] = [];
    
    if (action.dataSource?.database?.models) {
      action.dataSource.database.models.forEach(model => {
        model.fields?.forEach((field: any) => {
          if (field.relationField) {
            idFields.push(field.name);
          }
        });
      });
    }
    
    return idFields;
  }, [action]);

  const renderEnhancedComponent = (stepData: any) => {
    // Check if we have enhanced UI components from the action
    if (!stepData.reactCode || stepData.reactCode.trim() === '') {
      return null; // No enhanced component, use standard rendering
    }

    try {
      // Extract field data from the action configuration
      const fields = action.dataSource?.database?.models?.reduce((acc: any, model: any) => {
        model.fields?.forEach((field: any) => {
          if (!field.isId) {
            acc[field.name] = {
              name: field.name,
              type: field.type,
              required: field.required,
              title: field.title
            };
          }
        });
        return acc;
      }, {}) || {};

      // Prepare props for the dynamic component
      const componentProps = {
        fields: fields,
        values: state.stepData,
        onChange: handleInputChange,
        models: models,
        action: action,
        isLoading: state.isLoading,
        error: state.error
      };

      // Extract component name from the React code
      const componentNameMatch = stepData.reactCode.match(/(?:function|const)\s+(\w+)/);
      const componentName = componentNameMatch ? componentNameMatch[1] : 'DynamicComponent';

      // Create the component using new Function() constructor
      const componentFunction = new Function(
        'React',
        'props',
        `${stepData.reactCode}; return ${componentName};`
      );

      const DynamicComponent = componentFunction(React, componentProps);

      return (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-300 mb-4 font-mono">
              {stepData.title}
            </h3>
            <p className="text-green-400 text-sm mb-6 font-mono">
              {stepData.description}
            </p>
            
            <div className="bg-black/30 border border-green-500/10 rounded-lg p-4">
              <DynamicComponent {...componentProps} />
            </div>
          </div>
        </div>
      );
    } catch (componentError) {
      console.error('Error rendering enhanced component:', componentError);
      
      const errorMessage = componentError instanceof Error ? componentError.message : 'Unknown error';
      const errorStack = componentError instanceof Error ? componentError.stack : '';
      
      return (
        <div className="space-y-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-300 mb-4 font-mono">
              Component Error - Using Standard Rendering
            </h3>
            <div className="bg-black/50 border border-red-500/10 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm font-mono">Error: {errorMessage}</p>
              {errorStack && (
                <pre className="text-red-300 text-xs font-mono mt-2 overflow-auto">
                  {errorStack}
                </pre>
              )}
            </div>
            <p className="text-yellow-400 text-sm font-mono">
              Falling back to standard rendering...
            </p>
          </div>
        </div>
      );
    }
  };

  // Standard field rendering using existing patterns
  const renderStandardFieldInputs = (stepData: any) => {
    const fields = stepData.fields || inputParameters.fields || {};
    
    return (
      <div className="grid gap-6">
        {Object.entries(fields).map(([fieldName, fieldSchema]: [string, any]) => 
          generateInputComponent(
            fieldName,
            fieldSchema,
            state.stepData[fieldName],
            handleInputChange,
            models,
            databaseIdFields
          )
        )}
        
        {Object.keys(fields).length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <span className="text-yellow-400 text-2xl">📝</span>
            </div>
            <h4 className="text-lg font-semibold text-yellow-300 mb-2 font-mono">Ready to Execute</h4>
            <p className="text-yellow-400 text-sm font-mono">This action doesn't require additional input parameters.</p>
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    if (!currentStepData) return null;

    // Try enhanced component first, fallback to standard rendering
    const enhancedComponent = renderEnhancedComponent(currentStepData);
    if (enhancedComponent) {
      return enhancedComponent;
    }

    // Standard step rendering based on step type
    switch (currentStepData.type) {
      case 'input':
        return (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-300 mb-4 font-mono">
                {currentStepData.title}
              </h3>
              <p className="text-green-400 text-sm mb-6 font-mono">
                {currentStepData.description}
              </p>
              {renderStandardFieldInputs(currentStepData)}
            </div>
          </div>
        );

      case 'selection':
        return renderSelectionInterface();

      case 'configuration':
        return renderConfigurationForm();

      case 'confirmation':
        return renderConfirmation();

      default:
        return (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-300 mb-4 font-mono">
                {currentStepData.title || 'Action Step'}
              </h3>
              <p className="text-green-400 text-sm mb-6 font-mono">
                {currentStepData.description || 'Complete this step to continue.'}
              </p>
              {renderStandardFieldInputs(currentStepData)}
            </div>
          </div>
        );
    }
  };

  const renderSelectionInterface = () => {
    const targetModelName = currentStepData.modelName || 
                           models.find(m => m.name.toLowerCase().includes('item'))?.name ||
                           models[0]?.name;
    
    const targetModel = models.find(m => m.name === targetModelName);
    
    if (!targetModel || !targetModel.records) {
      return (
        <div className="text-center py-8">
          <div className="text-yellow-400 text-lg mb-2">⚠️</div>
          <p className="text-yellow-300 font-mono">No {targetModelName || 'records'} available for selection</p>
        </div>
      );
    }

    const selectedItems = state.stepData.selectedRecords || [];

    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {targetModel.records.map(record => {
            const item = record.data;
            const selectedItem = selectedItems.find((sel: any) => sel.recordId === record.id);
            const isSelected = !!selectedItem;
            const displayField = targetModel.displayFields[0] || 'name';
            const displayValue = item[displayField] || item.name || item.title || record.id;

            return (
              <div key={record.id} className="bg-black/30 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-green-300 font-mono font-medium">{displayValue}</h4>
                    {item.description && (
                      <p className="text-green-500/70 text-sm font-mono mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const newSelection = selectedItems.filter((sel: any) => sel.recordId !== record.id);
                        if (!isSelected) {
                          newSelection.push({ recordId: record.id, data: item });
                        }
                        handleInputChange('selectedRecords', newSelection);
                      }}
                      className={`px-4 py-2 rounded-lg border font-mono text-sm transition-colors ${
                        isSelected
                          ? 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedItems.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-green-300 font-mono font-medium mb-3">Selected Records</h4>
            <div className="space-y-2">
              {selectedItems.map((item: any, index: number) => {
                const record = targetModel.records?.find(r => r.id === item.recordId);
                const displayField = targetModel.displayFields[0] || 'name';
                const displayValue = record?.data[displayField] || record?.data.name || item.recordId;
                
                return (
                  <div key={index} className="flex justify-between text-sm font-mono">
                    <span className="text-green-400">{displayValue}</span>
                    <span className="text-green-300">✓</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConfigurationForm = () => {
    const fields = currentStepData.fields || {};
    
    return (
      <div className="grid gap-6">
        {Object.entries(fields).map(([fieldName, fieldSchema]: [string, any]) => 
          generateInputComponent(
            fieldName,
            fieldSchema,
            state.stepData[fieldName],
            handleInputChange,
            models,
            databaseIdFields
          )
        )}
      </div>
    );
  };

  const renderConfirmation = () => {
    return (
      <div className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <h4 className="text-blue-300 font-mono font-semibold mb-4">Review Your Information</h4>
          
          {state.stepData.selectedProducts && (
            <div className="mb-6">
              <h5 className="text-green-300 font-mono font-medium mb-3">Selected Products</h5>
              <div className="space-y-2">
                {state.stepData.selectedProducts.map((item: any, index: number) => {
                  const product = models.find(m => m.name.toLowerCase().includes('product'))
                    ?.records?.find(r => r.id === item.productId)?.data;
                  return (
                    <div key={index} className="flex justify-between text-sm font-mono bg-black/30 p-3 rounded-lg">
                      <span className="text-green-400">{product?.name} × {item.quantity}</span>
                      <span className="text-green-300">${((product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {state.stepData.shippingAddress && (
            <div className="mb-6">
              <h5 className="text-green-300 font-mono font-medium mb-3">Shipping Information</h5>
              <div className="bg-black/30 p-3 rounded-lg space-y-2 text-sm font-mono">
                <div><span className="text-green-500">Address:</span> <span className="text-green-300">{state.stepData.shippingAddress}</span></div>
                {state.stepData.shippingMethod && (
                  <div><span className="text-green-500">Method:</span> <span className="text-green-300">{state.stepData.shippingMethod}</span></div>
                )}
              </div>
            </div>
          )}

          <div className="text-center py-4">
            <p className="text-green-400 font-mono text-sm">Click "Execute Action" to complete your {action.name.toLowerCase()}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-green-500/20 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <span className="text-green-400 text-xl">{action.emoji || '⚡'}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-200 font-mono">Run Action: {action.name}</h2>
                <p className="text-green-400 text-sm font-mono">{action.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Multi-step Progress */}
          {totalSteps > 1 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono text-green-300">
                  Step {state.currentStep + 1} of {totalSteps}
                </span>
                <span className="text-sm font-mono text-green-500">
                  {Math.round(((state.currentStep + 1) / totalSteps) * 100)}% Complete
                </span>
              </div>
              
              <div className="relative h-2 bg-green-500/10 rounded-full overflow-hidden border border-green-500/20">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((state.currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between mt-3 text-xs font-mono">
                {stepForms.map((step: any, index: number) => (
                  <div key={index} className={`flex flex-col items-center ${
                    index <= state.currentStep ? 'text-green-400' : 'text-green-500/50'
                  }`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      index < state.currentStep 
                        ? 'bg-green-500 border-green-500 text-black' 
                        : index === state.currentStep
                        ? 'border-green-400 text-green-400'
                        : 'border-green-500/30 text-green-500/50'
                    }`}>
                      {index < state.currentStep ? '✓' : index + 1}
                    </div>
                    <span className="mt-1 text-center max-w-20 truncate" title={step.title}>
                      {step.title || `Step ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Info */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Database className="w-3 h-3" />
              <span className="text-green-300">Target: {action.results.model}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Code2 className="w-3 h-3" />
              <span className="text-blue-300">Type: {action.execute?.type || 'prompt'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <User className="w-3 h-3" />
              <span className="text-purple-300">Role: {action.role}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Action Execution Loading */}
          {state.isLoading && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Play className="w-6 h-6 animate-pulse text-green-400" />
                <span className="text-green-300 font-mono">Executing action...</span>
              </div>
              <p className="text-green-500/70 text-sm font-mono">Processing your request</p>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h3 className="text-red-300 font-semibold font-mono mb-2">Execution Failed</h3>
                  <p className="text-red-400 text-sm font-mono whitespace-pre-wrap">{state.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {state.result && state.isComplete && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-green-300 font-semibold font-mono mb-3">Action Completed Successfully</h3>
                  
                  {state.result.output && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-green-300 text-sm font-mono mb-2">Output:</h4>
                        <pre className="bg-black/50 border border-green-500/20 rounded-lg p-4 text-xs text-green-200 font-mono overflow-auto max-h-40">
                          {JSON.stringify(state.result.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {state.result.data && state.result.data.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-green-300 text-sm font-mono mb-2">Database Changes:</h4>
                      <div className="space-y-2">
                        {state.result.data.map((change: any, index: number) => (
                          <div key={index} className="bg-black/30 border border-green-500/10 rounded-lg p-3">
                            <div className="text-xs text-green-400 font-mono mb-1">Model: {change.modelId}</div>
                            {change.createdRecords && change.createdRecords.length > 0 && (
                              <div className="text-xs text-green-300 font-mono">✅ Created: {change.createdRecords.length} records</div>
                            )}
                            {change.updatedRecords && change.updatedRecords.length > 0 && (
                              <div className="text-xs text-green-300 font-mono">📝 Updated: {change.updatedRecords.length} records</div>
                            )}
                            {change.deletedRecords && change.deletedRecords.length > 0 && (
                              <div className="text-xs text-green-300 font-mono">🗑️ Deleted: {change.deletedRecords.length} records</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          {!state.isLoading && !state.isComplete && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <span className="text-blue-400 text-lg">
                    {currentStepData?.type === 'product-selection' ? '🛒' :
                     currentStepData?.type === 'shipping-form' ? '📦' :
                     currentStepData?.type === 'confirmation' ? '✅' : '📝'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-200 font-mono">{currentStepData?.title || 'Action Parameters'}</h3>
                  <p className="text-green-400 text-sm font-mono">{currentStepData?.description || 'Provide the required information'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {renderStepContent()}
                
                <div className="flex justify-between space-x-3 pt-6 border-t border-green-500/20">
                  <div>
                    {!isFirstStep && (
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="px-6 py-2 text-sm font-medium text-green-400 bg-transparent border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors font-mono"
                      >
                        Previous
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 text-sm font-medium text-green-400 bg-transparent border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={state.isLoading}
                      className="px-6 py-2 text-sm font-medium text-black bg-green-500 rounded-lg hover:bg-green-400 transition-colors font-mono flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLastStep ? (
                        <>
                          <Play className="w-4 h-4" />
                          Execute Action
                        </>
                      ) : (
                        <>
                          Next Step
                          <span className="text-xs">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 