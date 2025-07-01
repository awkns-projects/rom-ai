import * as React from 'react';
import { memo, useState, useCallback } from 'react';
import type { AgentData, AgentModel, AgentAction, AgentSchedule } from '../types';

interface MobileAppDemoProps {
  agentData?: AgentData;
  currentTheme?: keyof typeof themes;
  viewMode?: 'mobile' | 'desktop'; // Add view mode prop
  onDataChange?: (agentData: AgentData) => void; // Add callback to save data changes
}

interface MobileAppDemoWrapperProps {
  agentData?: AgentData;
  onThemeChange?: (theme: string) => void; // Callback to save theme changes
  onDataChange?: (agentData: AgentData) => void; // Callback to save data changes
}

// Theme color definitions
const themes = {
  green: {
    name: 'Matrix Green',
    primary: 'green',
    gradient: 'from-green-500/10 via-green-600/5 to-green-700/10',
    border: 'border-green-500/20',
    accent: 'text-green-400',
    light: 'text-green-200',
    dim: 'text-green-300/70',
    bg: 'bg-green-500/10',
    bgHover: 'hover:bg-green-500/20',
    borderActive: 'border-green-500/30',
    bgActive: 'bg-green-500/20'
  },
  blue: {
    name: 'Ocean Blue',
    primary: 'blue',
    gradient: 'from-blue-500/10 via-blue-600/5 to-blue-700/10',
    border: 'border-blue-500/20',
    accent: 'text-blue-400',
    light: 'text-blue-200',
    dim: 'text-blue-300/70',
    bg: 'bg-blue-500/10',
    bgHover: 'hover:bg-blue-500/20',
    borderActive: 'border-blue-500/30',
    bgActive: 'bg-blue-500/20'
  },
  purple: {
    name: 'Royal Purple',
    primary: 'purple',
    gradient: 'from-purple-500/10 via-purple-600/5 to-purple-700/10',
    border: 'border-purple-500/20',
    accent: 'text-purple-400',
    light: 'text-purple-200',
    dim: 'text-purple-300/70',
    bg: 'bg-purple-500/10',
    bgHover: 'hover:bg-purple-500/20',
    borderActive: 'border-purple-500/30',
    bgActive: 'bg-purple-500/20'
  },
  cyan: {
    name: 'Cyber Cyan',
    primary: 'cyan',
    gradient: 'from-cyan-500/10 via-cyan-600/5 to-cyan-700/10',
    border: 'border-cyan-500/20',
    accent: 'text-cyan-400',
    light: 'text-cyan-200',
    dim: 'text-cyan-300/70',
    bg: 'bg-cyan-500/10',
    bgHover: 'hover:bg-cyan-500/20',
    borderActive: 'border-cyan-500/30',
    bgActive: 'bg-cyan-500/20'
  },
  orange: {
    name: 'Sunset Orange',
    primary: 'orange',
    gradient: 'from-orange-500/10 via-orange-600/5 to-orange-700/10',
    border: 'border-orange-500/20',
    accent: 'text-orange-400',
    light: 'text-orange-200',
    dim: 'text-orange-300/70',
    bg: 'bg-orange-500/10',
    bgHover: 'hover:bg-orange-500/20',
    borderActive: 'border-orange-500/30',
    bgActive: 'bg-orange-500/20'
  },
  pink: {
    name: 'Neon Pink',
    primary: 'pink',
    gradient: 'from-pink-500/10 via-pink-600/5 to-pink-700/10',
    border: 'border-pink-500/20',
    accent: 'text-pink-400',
    light: 'text-pink-200',
    dim: 'text-pink-300/70',
    bg: 'bg-pink-500/10',
    bgHover: 'hover:bg-pink-500/20',
    borderActive: 'border-pink-500/30',
    bgActive: 'bg-pink-500/20'
  },
  yellow: {
    name: 'Golden Yellow',
    primary: 'yellow',
    gradient: 'from-yellow-500/10 via-yellow-600/5 to-yellow-700/10',
    border: 'border-yellow-500/20',
    accent: 'text-yellow-400',
    light: 'text-yellow-200',
    dim: 'text-yellow-300/70',
    bg: 'bg-yellow-500/10',
    bgHover: 'hover:bg-yellow-500/20',
    borderActive: 'border-yellow-500/30',
    bgActive: 'bg-yellow-500/20'
  },
  red: {
    name: 'Fire Red',
    primary: 'red',
    gradient: 'from-red-500/10 via-red-600/5 to-red-700/10',
    border: 'border-red-500/20',
    accent: 'text-red-400',
    light: 'text-red-200',
    dim: 'text-red-300/70',
    bg: 'bg-red-500/10',
    bgHover: 'hover:bg-red-500/20',
    borderActive: 'border-red-500/30',
    bgActive: 'bg-red-500/20'
  },
  indigo: {
    name: 'Deep Indigo',
    primary: 'indigo',
    gradient: 'from-indigo-500/10 via-indigo-600/5 to-indigo-700/10',
    border: 'border-indigo-500/20',
    accent: 'text-indigo-400',
    light: 'text-indigo-200',
    dim: 'text-indigo-300/70',
    bg: 'bg-indigo-500/10',
    bgHover: 'hover:bg-indigo-500/20',
    borderActive: 'border-indigo-500/30',
    bgActive: 'bg-indigo-500/20'
  },
  emerald: {
    name: 'Emerald Green',
    primary: 'emerald',
    gradient: 'from-emerald-500/10 via-emerald-600/5 to-emerald-700/10',
    border: 'border-emerald-500/20',
    accent: 'text-emerald-400',
    light: 'text-emerald-200',
    dim: 'text-emerald-300/70',
    bg: 'bg-emerald-500/10',
    bgHover: 'hover:bg-emerald-500/20',
    borderActive: 'border-emerald-500/30',
    bgActive: 'bg-emerald-500/20'
  },
  teal: {
    name: 'Teal Blue',
    primary: 'teal',
    gradient: 'from-teal-500/10 via-teal-600/5 to-teal-700/10',
    border: 'border-teal-500/20',
    accent: 'text-teal-400',
    light: 'text-teal-200',
    dim: 'text-teal-300/70',
    bg: 'bg-teal-500/10',
    bgHover: 'hover:bg-teal-500/20',
    borderActive: 'border-teal-500/30',
    bgActive: 'bg-teal-500/20'
  },
  rose: {
    name: 'Rose Gold',
    primary: 'rose',
    gradient: 'from-rose-500/10 via-rose-600/5 to-rose-700/10',
    border: 'border-rose-500/20',
    accent: 'text-rose-400',
    light: 'text-rose-200',
    dim: 'text-rose-300/70',
    bg: 'bg-rose-500/10',
    bgHover: 'hover:bg-rose-500/20',
    borderActive: 'border-rose-500/30',
    bgActive: 'bg-rose-500/20'
  }
};

// Wrapper component with theme selector
export const MobileAppDemoWrapper = memo(({ agentData, onThemeChange, onDataChange }: MobileAppDemoWrapperProps) => {
  // Initialize theme from agent data or default to 'green'
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>(
    (agentData?.theme as keyof typeof themes) || 'green'
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile'); // Add view mode state

  // Handle theme change with persistence
  const handleThemeChange = useCallback((newTheme: keyof typeof themes) => {
    setCurrentTheme(newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  }, [onThemeChange]);

  // Display first 6 themes when collapsed, all when expanded
  const visibleThemes = isExpanded 
    ? Object.entries(themes) 
    : Object.entries(themes).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Theme Selector and View Mode Switch */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h4 className="text-green-200 font-mono text-sm font-semibold mb-2">Customize Experience</h4>
          <p className="text-green-300/70 font-mono text-xs">Choose your app's color scheme and display mode</p>
        </div>
        
        {/* View Mode Switch */}
        <div className="flex items-center gap-2">
          <div className="flex bg-green-500/10 border border-green-500/20 rounded-lg p-1">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 ${
                viewMode === 'mobile'
                  ? 'bg-green-500/30 text-green-200 border border-green-500/40'
                  : 'text-green-400 hover:bg-green-500/10'
              }`}
            >
              📱 Mobile
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 ${
                viewMode === 'desktop'
                  ? 'bg-green-500/30 text-green-200 border border-green-500/40'
                  : 'text-green-400 hover:bg-green-500/10'
              }`}
            >
              💻 Desktop
            </button>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-4 bg-green-500/5 border border-green-500/10 rounded-xl backdrop-blur-sm max-w-2xl">
            {visibleThemes.map(([key, themeOption]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key as keyof typeof themes)}
                className={`group flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                  currentTheme === key 
                    ? `bg-${themeOption.primary}-500/20 border-2 border-${themeOption.primary}-400 shadow-lg shadow-${themeOption.primary}-500/30` 
                    : `border-2 border-${themeOption.primary}-500/20 hover:border-${themeOption.primary}-400/60 hover:bg-${themeOption.primary}-500/10`
                }`}
                title={themeOption.name}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${themeOption.gradient} border border-${themeOption.primary}-500/30`}></div>
                <span className={`text-xs font-mono font-medium transition-colors ${
                  currentTheme === key 
                    ? themeOption.accent.replace('text-', 'text-')
                    : 'text-green-400/70 group-hover:text-green-300'
                }`}>
                  {themeOption.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
          
          {/* Expand/Collapse Button */}
          {Object.keys(themes).length > 6 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-green-400/70 hover:text-green-300 border border-green-500/20 hover:border-green-500/40 rounded-lg transition-all duration-200 hover:bg-green-500/10"
            >
              <span>{isExpanded ? 'Show Less' : `Show All ${Object.keys(themes).length} Colors`}</span>
              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile App Demo */}
      <MobileAppDemo agentData={agentData} currentTheme={currentTheme} viewMode={viewMode} onDataChange={onDataChange} />
    </div>
  );
});

// Main mobile app demo component
const MobileAppDemo = memo(({ agentData, currentTheme = 'green', viewMode = 'mobile', onDataChange }: MobileAppDemoProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for hamburger menu
  const [selectedModel, setSelectedModel] = useState<any>(null); // State for selected model
  const [modelViewMode, setModelViewMode] = useState<'view' | 'edit'>('view'); // State for model view/edit mode
  const [editingRecord, setEditingRecord] = useState<any>(null); // State for editing record
  const [newRecordData, setNewRecordData] = useState<Record<string, any>>({}); // State for new record form
  const [editRecordData, setEditRecordData] = useState<Record<string, any>>({}); // State for editing record form
  
  const theme = themes[currentTheme];
  
  // Use actual agent data or fallback defaults
  const agentName = agentData?.name || 'AI Agent';
  const models = agentData?.models || [];
  const actions = agentData?.actions || [];
  const schedules = agentData?.schedules || [];
  
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      color: theme.accent
    },
    { 
      id: 'models', 
      label: 'Models', 
      icon: '🗃️',
      color: theme.accent
    },
    { 
      id: 'schedules', 
      label: 'Schedules', 
      icon: '⏰',
      color: theme.accent
    },
    { 
      id: 'chat', 
      label: 'AI Chat', 
      icon: '🤖',
      color: theme.accent
    }
  ];

  // Handle model selection
  const handleModelSelect = useCallback((model: any, mode: 'view' | 'edit' = 'view') => {
    setSelectedModel(model);
    setModelViewMode(mode);
    setEditingRecord(null);
    setNewRecordData({});
    setEditRecordData({});
  }, []);

  // Close model modal
  const closeModelModal = useCallback(() => {
    setSelectedModel(null);
    setEditingRecord(null);
    setNewRecordData({});
    setEditRecordData({});
  }, []);

  // Handle new record form changes
  const handleNewRecordChange = useCallback((fieldName: string, value: any) => {
    setNewRecordData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Handle edit record form changes
  const handleEditRecordChange = useCallback((fieldName: string, value: any) => {
    setEditRecordData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Add new record
  const handleAddRecord = useCallback(() => {
    if (!selectedModel || !selectedModel.fields || !agentData) return;

    // Validate required fields
    const hasRequiredData = selectedModel.fields.some((field: any) => 
      newRecordData[field.name] !== undefined && newRecordData[field.name] !== ''
    );

    if (!hasRequiredData) {
      alert('Please fill in at least one field');
      return;
    }

    // Create new record with proper structure for ModelDataViewer
    const newRecord = {
      id: Date.now().toString(),
      modelId: selectedModel.id,
      data: { ...newRecordData }, // Store field data in 'data' object
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update the selected model's records
    const updatedModel = {
      ...selectedModel,
      records: [...(selectedModel.records || []), newRecord]
    };

    setSelectedModel(updatedModel);
    setNewRecordData({});

    // Show success message
    alert('Record added successfully!');

    // Update the agentData with the modified model
    if (onDataChange) {
      const updatedAgentData = {
        ...agentData,
        models: agentData.models.map(model => 
          model.id === selectedModel.id ? updatedModel : model
        )
      };
      onDataChange(updatedAgentData);
    }
  }, [selectedModel, newRecordData, agentData, onDataChange]);

  // Start editing a record
  const handleStartEditRecord = useCallback((record: any) => {
    setEditingRecord(record);
    // Extract data from the record's data object
    setEditRecordData({ ...record.data });
  }, []);

  // Save edited record
  const handleSaveEditRecord = useCallback(() => {
    if (!selectedModel || !editingRecord || !agentData) return;

    // Update the record in the model's records array with proper structure
    const updatedRecords = selectedModel.records.map((record: any) =>
      record.id === editingRecord.id ? { 
        ...editingRecord, 
        data: { ...editRecordData }, // Store field data in 'data' object
        updatedAt: new Date().toISOString() 
      } : record
    );

    const updatedModel = {
      ...selectedModel,
      records: updatedRecords
    };

    setSelectedModel(updatedModel);
    setEditingRecord(null);
    setEditRecordData({});

    // Show success message
    alert('Record updated successfully!');

    // Update the agentData with the modified model
    if (onDataChange) {
      const updatedAgentData = {
        ...agentData,
        models: agentData.models.map(model => 
          model.id === selectedModel.id ? updatedModel : model
        )
      };
      onDataChange(updatedAgentData);
    }
  }, [selectedModel, editingRecord, editRecordData, agentData, onDataChange]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingRecord(null);
    setEditRecordData({});
  }, []);

  // Delete record
  const handleDeleteRecord = useCallback((recordToDelete: any) => {
    if (!selectedModel || !agentData) return;

    if (confirm('Are you sure you want to delete this record?')) {
      const updatedRecords = selectedModel.records.filter((record: any) => record.id !== recordToDelete.id);
      const updatedModel = {
        ...selectedModel,
        records: updatedRecords
      };

      setSelectedModel(updatedModel);
      
      // If we were editing this record, clear the editing state
      if (editingRecord && editingRecord.id === recordToDelete.id) {
        setEditingRecord(null);
        setEditRecordData({});
      }

      alert('Record deleted successfully!');

      // Update the agentData with the modified model
      if (onDataChange) {
        const updatedAgentData = {
          ...agentData,
          models: agentData.models.map(model => 
            model.id === selectedModel.id ? updatedModel : model
          )
        };
        onDataChange(updatedAgentData);
      }
    }
  }, [selectedModel, editingRecord, agentData, onDataChange]);

  // Render model details modal
  const renderModelModal = () => {
    if (!selectedModel) return null;

    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closeModelModal}>
        <div 
          className={`${theme.bg} border ${theme.border} rounded-2xl max-w-sm w-full max-h-[90%] overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className={`p-3 border-b ${theme.border} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedModel.emoji || '🗃️'}</span>
              <div>
                <h3 className={`font-mono font-bold text-sm ${theme.light}`}>{selectedModel.name}</h3>
                <p className={`font-mono text-xs ${theme.dim}`}>
                  {selectedModel.fields?.length || 0} fields • {selectedModel.records?.length || 0} records
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setModelViewMode('view')}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                  modelViewMode === 'view' 
                    ? `${theme.bgActive} ${theme.accent}` 
                    : `${theme.bg} ${theme.dim} hover:${theme.bgHover}`
                }`}
              >
                👁️
              </button>
              <button
                onClick={() => setModelViewMode('edit')}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                  modelViewMode === 'edit' 
                    ? `${theme.bgActive} ${theme.accent}` 
                    : `${theme.bg} ${theme.dim} hover:${theme.bgHover}`
                }`}
              >
                ✏️
              </button>
              <button
                onClick={closeModelModal}
                className={`w-5 h-5 ${theme.bg} border ${theme.border} rounded text-xs ${theme.accent} hover:${theme.bgHover} flex items-center justify-center`}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {modelViewMode === 'view' ? (
              <div className="space-y-3">
                {/* Model Info */}
                <div>
                  <h4 className={`font-mono text-xs font-semibold ${theme.light} mb-2`}>Model Information</h4>
                  <div className={`${theme.bg} border ${theme.border} rounded-lg p-2 space-y-1`}>
                    <div className="flex justify-between">
                      <span className={`font-mono text-xs ${theme.dim}`}>Name:</span>
                      <span className={`font-mono text-xs ${theme.light}`}>{selectedModel.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`font-mono text-xs ${theme.dim}`}>Status:</span>
                      <span className={`font-mono text-xs ${theme.accent}`}>
                        {selectedModel.hasPublishedField ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`font-mono text-xs ${theme.dim}`}>Created:</span>
                      <span className={`font-mono text-xs ${theme.light}`}>
                        {new Date(selectedModel.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <h4 className={`font-mono text-xs font-semibold ${theme.light} mb-2`}>Fields</h4>
                  <div className="space-y-1">
                    {selectedModel.fields?.length > 0 ? (
                      selectedModel.fields.slice(0, 4).map((field: any, index: number) => (
                        <div key={index} className={`${theme.bg} border ${theme.border} rounded-lg p-2`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-mono text-xs ${theme.light}`}>{field.name}</span>
                            <span className={`font-mono text-xs px-1 py-0.5 rounded ${theme.bgActive} ${theme.accent}`}>
                              {field.type}
                            </span>
                          </div>
                          {field.description && (
                            <p className={`font-mono text-xs ${theme.dim} mt-1`}>{field.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-3 ${theme.dim} font-mono text-xs`}>
                        No fields defined
                      </div>
                    )}
                  </div>
                </div>

                {/* Sample Records */}
                <div>
                  <h4 className={`font-mono text-xs font-semibold ${theme.light} mb-2`}>Recent Records</h4>
                  <div className="space-y-1">
                    {selectedModel.records?.length > 0 ? (
                      selectedModel.records.slice(0, 2).map((record: any, index: number) => (
                        <div key={index} className={`${theme.bg} border ${theme.border} rounded-lg p-2`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-mono text-xs ${theme.light}`}>
                              Record #{record.id || index + 1}
                            </span>
                            <span className={`font-mono text-xs ${theme.dim}`}>
                              {new Date(record.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={`font-mono text-xs ${theme.dim} mt-1`}>
                            {Object.keys(record.data || {}).filter(key => key !== 'id' && key !== 'createdAt').slice(0, 2).map(key => 
                              `${key}: ${String(record.data[key]).substring(0, 15)}${String(record.data[key]).length > 15 ? '...' : ''}`
                            ).join(' • ')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-3 ${theme.dim} font-mono text-xs`}>
                        No records found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Edit Mode - Record Management */}
                <div>
                  <h4 className={`font-mono text-xs font-semibold ${theme.light} mb-1`}>Manage Records</h4>
                  <p className={`font-mono text-xs ${theme.dim} mb-3`}>Add, edit, or delete records in this model</p>
                </div>

                {/* Add New Record Form */}
                <div className={`${theme.bg} border ${theme.border} rounded-lg p-2`}>
                  <h5 className={`font-mono text-xs font-semibold ${theme.light} mb-2`}>Add New Record</h5>
                  <div className="space-y-2">
                    {selectedModel.fields?.length > 0 ? (
                      selectedModel.fields.slice(0, 3).map((field: any, index: number) => (
                        <div key={index}>
                          <label className={`font-mono text-xs ${theme.dim} block mb-1`}>{field.name}</label>
                          {field.type === 'boolean' ? (
                            <select 
                              value={newRecordData[field.name] || ''}
                              onChange={(e) => handleNewRecordChange(field.name, e.target.value === 'true')}
                              className={`w-full ${theme.bg} border ${theme.border} rounded px-2 py-1 ${theme.light} font-mono text-xs focus:outline-none focus:${theme.borderActive}`}
                            >
                              <option value="">Select...</option>
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              value={newRecordData[field.name] || ''}
                              onChange={(e) => handleNewRecordChange(field.name, e.target.value)}
                              className={`w-full ${theme.bg} border ${theme.border} rounded px-2 py-1 ${theme.light} font-mono text-xs focus:outline-none focus:${theme.borderActive}`}
                            />
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              placeholder={`Enter ${field.name}...`}
                              value={newRecordData[field.name] || ''}
                              onChange={(e) => handleNewRecordChange(field.name, e.target.value ? Number(e.target.value) : '')}
                              className={`w-full ${theme.bg} border ${theme.border} rounded px-2 py-1 ${theme.light} font-mono text-xs focus:outline-none focus:${theme.borderActive}`}
                            />
                          ) : (
                            <input
                              type="text"
                              placeholder={`Enter ${field.name}...`}
                              value={newRecordData[field.name] || ''}
                              onChange={(e) => handleNewRecordChange(field.name, e.target.value)}
                              className={`w-full ${theme.bg} border ${theme.border} rounded px-2 py-1 ${theme.light} font-mono text-xs focus:outline-none focus:${theme.borderActive}`}
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-3 ${theme.dim} font-mono text-xs`}>
                        No fields defined in this model
                      </div>
                    )}
                  </div>
                  {selectedModel.fields?.length > 0 && (
                    <button 
                      onClick={handleAddRecord}
                      className={`w-full mt-2 py-1 ${theme.bgActive} border ${theme.borderActive} rounded ${theme.accent} font-mono text-xs font-semibold hover:opacity-80 transition-opacity`}
                    >
                      ➕ Add Record
                    </button>
                  )}
                </div>

                {/* Existing Records List */}
                <div>
                  <h5 className={`font-mono text-xs font-semibold ${theme.light} mb-2`}>Existing Records</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedModel.records?.length > 0 ? (
                      selectedModel.records.slice(0, 3).map((record: any, index: number) => (
                        <div key={record.id || index} className={`${theme.bg} border ${theme.border} rounded-lg p-2`}>
                          {editingRecord && editingRecord.id === record.id ? (
                            // Edit form for this record
                            <div className="space-y-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className={`font-mono text-xs font-semibold ${theme.light}`}>
                                  Editing Record #{record.id || index + 1}
                                </span>
                              </div>
                              {selectedModel.fields?.slice(0, 2).map((field: any, fieldIndex: number) => (
                                <div key={fieldIndex}>
                                  <label className={`font-mono text-xs ${theme.dim} block mb-1`}>{field.name}</label>
                                  {field.type === 'boolean' ? (
                                    <select 
                                      value={editRecordData[field.name] !== undefined ? String(editRecordData[field.name]) : ''}
                                      onChange={(e) => handleEditRecordChange(field.name, e.target.value === 'true')}
                                      className={`w-full ${theme.bg} border ${theme.border} rounded px-1 py-0.5 ${theme.light} font-mono text-xs focus:outline-none`}
                                    >
                                      <option value="">Select...</option>
                                      <option value="true">True</option>
                                      <option value="false">False</option>
                                    </select>
                                  ) : field.type === 'date' ? (
                                    <input
                                      type="date"
                                      value={editRecordData[field.name] || ''}
                                      onChange={(e) => handleEditRecordChange(field.name, e.target.value)}
                                      className={`w-full ${theme.bg} border ${theme.border} rounded px-1 py-0.5 ${theme.light} font-mono text-xs focus:outline-none`}
                                    />
                                  ) : field.type === 'number' ? (
                                    <input
                                      type="number"
                                      value={editRecordData[field.name] || ''}
                                      onChange={(e) => handleEditRecordChange(field.name, e.target.value ? Number(e.target.value) : '')}
                                      className={`w-full ${theme.bg} border ${theme.border} rounded px-1 py-0.5 ${theme.light} font-mono text-xs focus:outline-none`}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={editRecordData[field.name] || ''}
                                      onChange={(e) => handleEditRecordChange(field.name, e.target.value)}
                                      className={`w-full ${theme.bg} border ${theme.border} rounded px-1 py-0.5 ${theme.light} font-mono text-xs focus:outline-none`}
                                    />
                                  )}
                                </div>
                              ))}
                              <div className="flex gap-1 mt-2">
                                <button 
                                  onClick={handleSaveEditRecord}
                                  className={`flex-1 px-1 py-0.5 ${theme.bgActive} border ${theme.borderActive} rounded text-xs ${theme.accent} hover:opacity-80 transition-opacity font-mono`}
                                >
                                  💾 Save
                                </button>
                                <button 
                                  onClick={handleCancelEdit}
                                  className={`flex-1 px-1 py-0.5 ${theme.bg} border ${theme.border} rounded text-xs ${theme.light} hover:${theme.bgHover} transition-colors font-mono`}
                                >
                                  ✕ Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Display mode for this record
                            <>
                              <div className="flex justify-between items-start mb-1">
                                <span className={`font-mono text-xs font-semibold ${theme.light}`}>
                                  Record #{record.id || index + 1}
                                </span>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => handleStartEditRecord(record)}
                                    className={`px-1 py-0.5 ${theme.bg} border ${theme.border} rounded text-xs ${theme.accent} hover:${theme.bgHover} transition-colors`}
                                    title="Edit Record"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteRecord(record)}
                                    className={`px-1 py-0.5 ${theme.bg} border ${theme.border} rounded text-xs text-red-400 hover:bg-red-500/10 transition-colors`}
                                    title="Delete Record"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                {Object.entries(record.data || {}).filter(([key]) => key !== 'id' && key !== 'createdAt').slice(0, 2).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className={`font-mono text-xs ${theme.dim}`}>{key}:</span>
                                    <span className={`font-mono text-xs ${theme.light} max-w-20 truncate`}>
                                      {String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-3 ${theme.dim} font-mono text-xs border-2 border-dashed ${theme.border} rounded-lg`}>
                        No records yet. Add your first record above.
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => setModelViewMode('view')}
                    className={`flex-1 py-1 ${theme.bg} border ${theme.border} rounded ${theme.light} hover:${theme.bgHover} font-mono text-xs transition-colors`}
                  >
                    👁️ View
                  </button>
                  <button 
                    onClick={closeModelModal}
                    className={`px-3 py-1 ${theme.bgActive} border ${theme.borderActive} rounded ${theme.accent} font-mono text-xs font-semibold hover:opacity-80 transition-opacity`}
                  >
                    ✅ Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Dashboard
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-mono font-bold text-lg ${theme.light}`}>Dashboard</h3>
              <div className={`w-2 h-2 bg-${theme.primary}-400 rounded-full animate-pulse`}></div>
            </div>
            
            {/* Stats Grid - Shows total items for each model */}
            <div className="grid grid-cols-2 gap-3">
              {models.length > 0 ? (
                models.slice(0, 4).map((model, index) => (
                  <div key={model.id} className={`bg-black/30 border ${theme.border} rounded-lg p-3 text-center`}>
                    <div className={`text-xl font-bold font-mono ${theme.accent}`}>
                      {model.records?.length || 0}
                    </div>
                    <div className={`font-mono text-xs ${theme.dim}`}>{model.name}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-4">
                  <div className={`font-mono text-sm ${theme.dim}`}>No models created yet</div>
                </div>
              )}
            </div>

            {/* Quick Actions - Shows actual actions */}
            <div className="space-y-2">
              <h4 className={`font-mono text-sm font-semibold ${theme.light}`}>Quick Actions</h4>
              {actions.length > 0 ? (
                actions.slice(0, 3).map((action, index) => (
                  <div key={action.id} className={`flex items-center justify-between p-3 ${theme.bg} border ${theme.border} rounded-lg`}>
                    <div>
                      <div className={`font-mono text-sm ${theme.light}`}>{action.name}</div>
                      <div className={`font-mono text-xs ${theme.accent}`}>
                        {action.results?.actionType || 'Ready'}
                      </div>
                    </div>
                    <button className={`w-8 h-8 ${theme.bg} border ${theme.border} rounded-md flex items-center justify-center ${theme.bgHover}`}>
                      <span className={`text-xs ${theme.accent}`}>→</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <div className={`font-mono text-sm ${theme.dim}`}>No actions created yet</div>
                </div>
              )}
            </div>
          </div>
        );

      case 1: // Models
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-mono font-bold text-lg ${theme.light}`}>Models</h3>
              <span className={`font-mono text-xs ${theme.dim}`}>{models.length} models</span>
            </div>
            
            <div className="space-y-3">
              {models.length > 0 ? (
                models.map((model, index) => (
                  <div 
                    key={model.id} 
                    className={`${theme.bg} border ${theme.border} rounded-lg p-3 cursor-pointer hover:${theme.bgHover} transition-colors`}
                    onClick={() => handleModelSelect(model, 'view')}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{model.emoji || '🗃️'}</span>
                      <div className="flex-1">
                        <div className={`font-mono text-sm font-medium ${theme.light}`}>{model.name}</div>
                        <div className={`font-mono text-xs ${theme.dim}`}>
                          {model.fields?.length || 0} fields
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold ${theme.accent}`}>
                          {model.records?.length || 0} items
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs px-2 py-1 rounded ${theme.bgActive} ${theme.accent}`}>
                        {model.hasPublishedField ? 'Published' : 'Draft'}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          className={`w-6 h-6 ${theme.bg} border ${theme.border} rounded text-xs hover:${theme.bgHover} transition-colors`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelSelect(model, 'view');
                          }}
                          title="View Model"
                        >
                          👁️
                        </button>
                        <button 
                          className={`w-6 h-6 ${theme.bg} border ${theme.border} rounded text-xs hover:${theme.bgHover} transition-colors`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelSelect(model, 'edit');
                          }}
                          title="Edit Model"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className={`font-mono text-sm ${theme.dim}`}>No models created yet</div>
                  <div className={`font-mono text-xs mt-1 ${theme.dim}`}>
                    Create your first data model to get started
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2: // Schedules
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-mono font-bold text-lg ${theme.light}`}>Schedules</h3>
              <span className={`font-mono text-xs ${theme.dim}`}>{schedules.length} schedules</span>
            </div>
            
            <div className="space-y-3">
              {schedules.length > 0 ? (
                schedules.map((schedule, index) => (
                  <div key={schedule.id} className={`${theme.bg} border ${theme.border} rounded-lg p-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          schedule.interval?.active ? `bg-${theme.primary}-400 animate-pulse` : `bg-${theme.primary}-400/30`
                        }`}></div>
                        <span className={`font-mono text-sm font-bold ${theme.accent}`}>
                          {schedule.interval?.pattern || 'Manual'}
                        </span>
                      </div>
                      <span className={`font-mono text-xs ${theme.dim}`}>
                        {schedule.interval?.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={`font-mono text-sm ${theme.light}`}>{schedule.name}</div>
                    <div className={`font-mono text-xs mt-1 ${theme.dim}`}>
                      {schedule.description || 'No description'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className={`font-mono text-sm ${theme.dim}`}>No schedules created yet</div>
                  <div className={`font-mono text-xs mt-1 ${theme.dim}`}>
                    Set up automated tasks and workflows
                  </div>
                </div>
              )}
            </div>

            {/* Today's Progress */}
            {schedules.length > 0 && (
              <div className={`${theme.bg} border ${theme.border} rounded-lg p-3 mt-4`}>
                <h4 className={`font-mono text-sm font-semibold mb-2 ${theme.light}`}>Today's Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className={theme.dim}>Schedules Active</span>
                    <span className={`font-bold ${theme.accent}`}>
                      {schedules.filter(s => s.interval?.active).length}/{schedules.length}
                    </span>
                  </div>
                  <div className={`w-full bg-${theme.primary}-900/30 rounded-full h-2`}>
                    <div 
                      className={`bg-${theme.primary}-400 h-2 rounded-full`}
                      style={{ 
                        width: `${schedules.length > 0 ? (schedules.filter(s => s.interval?.active).length / schedules.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // AI Chat
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 ${theme.bg} border ${theme.border} rounded-lg flex items-center justify-center`}>
                <span className={`text-sm ${theme.accent}`}>🤖</span>
              </div>
              <h3 className={`font-mono font-bold text-lg ${theme.light}`}>AI Assistant</h3>
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {[
                { type: 'ai', message: `Welcome to ${agentName}! I can help you manage your data and workflows.` },
                { type: 'ai', message: `You currently have ${models.length} models, ${actions.length} actions, and ${schedules.length} schedules configured.` },
                { type: 'user', message: 'Show me the current status' },
                { type: 'ai', message: models.length > 0 
                  ? `Your models: ${models.slice(0, 3).map(m => m.name).join(', ')}${models.length > 3 ? '...' : ''}` 
                  : 'No models have been created yet. Would you like me to help you create one?'
                },
                ...(actions.length > 0 ? [
                  { type: 'user', message: 'What actions are available?' },
                  { type: 'ai', message: `Available actions: ${actions.slice(0, 2).map(a => a.name).join(', ')}${actions.length > 2 ? '...' : ''}` }
                ] : [])
              ].map((chat, index) => (
                <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-4 rounded-2xl font-mono text-sm leading-relaxed ${
                    chat.type === 'user' 
                      ? `${theme.bgActive} border ${theme.borderActive} ${theme.light}` 
                      : `${theme.bg} border ${theme.border} ${theme.light}`
                  }`}>
                    {chat.message}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`flex gap-3 mt-6 pt-4 border-t ${theme.border}`}>
              <input 
                type="text" 
                placeholder="Ask AI anything..." 
                className={`flex-1 ${theme.bg} border ${theme.border} rounded-xl px-4 py-3 ${theme.light} font-mono text-sm focus:outline-none focus:${theme.borderActive} placeholder:${theme.dim}`}
              />
              <button className={`w-12 h-12 ${theme.bg} ${theme.bgHover} border ${theme.border} rounded-xl flex items-center justify-center transition-colors duration-200`}>
                <span className={`text-lg ${theme.accent}`}>→</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderDesktopSidebar = () => (
    <div className={`${isMenuOpen ? 'w-64' : 'w-16'} transition-all duration-300 ${theme.bg} border-r ${theme.border} flex flex-col`}>
      {/* Hamburger Menu Button */}
      <div className="p-4 border-b border-green-500/20">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-8 h-8 ${theme.bg} border ${theme.border} rounded-lg flex items-center justify-center ${theme.bgHover} transition-colors duration-200`}
        >
          <span className={`text-sm ${theme.accent}`}>☰</span>
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-2 space-y-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(index)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              activeTab === index
                ? `${theme.bgActive} border ${theme.borderActive}`
                : theme.bgHover
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {isMenuOpen && (
              <span className={`font-mono text-sm font-medium transition-colors ${
                activeTab === index 
                  ? theme.light
                  : theme.dim
              }`}>
                {tab.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Agent Info at Bottom */}
      {isMenuOpen && (
        <div className={`p-4 border-t ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${theme.bg} border ${theme.border} rounded-lg flex items-center justify-center`}>
              <span className="text-lg">🤖</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-mono font-bold text-xs ${theme.light} truncate`}>{agentName}</div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 bg-${theme.primary}-400 rounded-full animate-pulse`}></div>
                <span className={`font-mono text-xs ${theme.dim}`}>Live</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (viewMode === 'desktop') {
    return (
      <>
        <div className={`relative bg-gradient-to-br ${theme.gradient} border ${theme.border} rounded-3xl backdrop-blur-sm shadow-2xl overflow-hidden mx-auto flex`} 
             style={{ 
               height: 'min(700px, 80vh)',
               width: 'min(900px, calc(100vw - 2rem))', // Fixed width for desktop
               maxWidth: '900px' // Ensure consistent max width
             }}>
          {/* Desktop Sidebar */}
          {renderDesktopSidebar()}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className={`bg-black/40 border-b ${theme.border} p-4 flex-shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className={`font-mono font-bold text-lg ${theme.light}`}>{tabs[activeTab].label}</h3>
                </div>
                <div className="flex gap-1">
                  <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
                  <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
                  <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {renderTabContent()}
            </div>
          </div>
        </div>
        {/* Model Modal */}
        {renderModelModal()}
      </>
    );
  }

  // Mobile Mode (existing code)
  return (
    <>
      <div className={`relative bg-gradient-to-br ${theme.gradient} border ${theme.border} rounded-3xl backdrop-blur-sm shadow-2xl overflow-hidden w-full max-w-sm mx-auto flex flex-col`} style={{ height: 'min(700px, 80vh)', maxWidth: 'min(350px, calc(100vw - 2rem))' }}>
        {/* Mobile App Header */}
        <div className={`bg-black/40 border-b ${theme.border} p-4 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${theme.bg} border ${theme.border} rounded-lg flex items-center justify-center`}>
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className={`font-mono font-bold text-sm ${theme.light}`}>{agentName}</h3>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 bg-${theme.primary}-400 rounded-full animate-pulse`}></div>
                  <span className={`font-mono text-xs ${theme.dim}`}>Live</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
              <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
              <div className={`w-1 h-1 bg-${theme.primary}-400 rounded-full`}></div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderTabContent()}
        </div>

        {/* Bottom Tab Navigation */}
        <div className={`bg-black/60 border-t ${theme.border} p-2 flex-shrink-0`}>
          <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                  activeTab === index
                    ? `${theme.bgActive} border ${theme.borderActive}`
                    : theme.bgHover
                }`}
              >
                <span className="text-lg mb-1">{tab.icon}</span>
                <span className={`text-xs font-mono font-medium ${
                  activeTab === index 
                    ? theme.light
                    : theme.dim
                }`}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Model Modal */}
      {renderModelModal()}
    </>
  );
}); 

// Export both components and themes for use in other files
export { MobileAppDemo, themes };