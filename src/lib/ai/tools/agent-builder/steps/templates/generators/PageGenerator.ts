import { TemplateGenerator, MobileAppTemplateOptions, escapeJSString } from '../base/MobileAppTemplateBase';

export class PageGenerator implements TemplateGenerator {
  generate(options: MobileAppTemplateOptions): Record<string, string> {
    return {
      'src/app/layout.tsx': this.generateAppLayout(options),
      'src/app/page.tsx': this.generateHomePage(options),
      'src/app/models/page.tsx': this.generateModelsListPage(options),
      'src/app/models/[modelName]/page.tsx': this.generateModelDetailPage(options),
      // Removed: 'src/app/actions/page.tsx' - actions are now accessible per record
      'src/app/schedules/page.tsx': this.generateSchedulesPage(options),
      'src/app/chat/page.tsx': this.generateChatPage(options),
      'src/app/execution-logs/page.tsx': this.generateExecutionLogsPage(options)
    };
  }

  private generateAppLayout(options: MobileAppTemplateOptions): string {
    return `import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: '${options.agentConfig?.name || options.projectName}',
  description: '${options.agentConfig?.description || 'Smart agent powered by AI'}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}`;
  }

  private generateHomePage(options: MobileAppTemplateOptions): string {
    const { projectName, models, actions, schedules } = options;
    const agentName = escapeJSString(options.agentConfig?.name || options.projectName);
    const agentTheme = options.agentConfig?.theme || 'green';
    const agentAvatar = options.agentConfig?.avatar;
    const agentDescription = options.agentConfig?.description || 'Smart agent powered by AI';
    
    return `'use client'
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { CompositeUnicorn } from '@/components/CompositeUnicorn';
import Image from 'next/image';
import { themes } from '@/lib/theme';

export default function HomePage() {
  const router = useRouter();

  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;
  const displayName = '${agentName}';
  
  // Extract avatar configuration from embedded config
  const avatar = ${JSON.stringify(agentAvatar)};

  const quickActions = [
    { 
      path: '/chat', 
      icon: '💬', 
      title: 'Chat with AI', 
      desc: 'Ask questions or give commands'
    },
    { 
      path: '/models', 
      icon: '🗃️', 
      title: 'View Data', 
      desc: 'Manage records and run actions'
    },
    { 
      path: '/schedules', 
      icon: '⏰', 
      title: 'Schedules', 
      desc: 'Manage automated tasks'
    },
    { 
      path: '/execution-logs', 
      icon: '📊', 
      title: 'Execution Logs', 
      desc: 'Monitor action executions'
    }
  ];

  return (
    <Layout title="${agentName}">
      <div className="space-y-6">
        {/* Hero Section with Avatar */}
        <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-8 text-center\`}>
          <div className="flex justify-center mb-6">
            <div className={\`w-24 h-24 rounded-2xl bg-gradient-to-br \${currentTheme.gradient} border-2 \${currentTheme.borderActive} flex items-center justify-center overflow-hidden\`}>
              {avatar?.type === 'rom-unicorn' && avatar.unicornParts ? (
                <CompositeUnicorn parts={avatar.unicornParts} size={96} />
              ) : avatar?.type === 'custom' && avatar.customType === 'upload' && avatar.uploadedImage ? (
                <Image
                  src={avatar.uploadedImage}
                  alt="Agent Avatar"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to theme emoji if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback-avatar');
                    if (fallback) {
                      fallback.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <span className={\`text-3xl \${currentTheme.accent} \${avatar?.type === 'rom-unicorn' && avatar.unicornParts || avatar?.type === 'custom' && avatar.uploadedImage ? 'hidden' : ''} fallback-avatar\`}>🤖</span>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className={\`font-mono font-bold text-2xl \${currentTheme.light}\`}>{displayName}</h2>
            <p className={\`font-mono text-base \${currentTheme.dim} max-w-md mx-auto leading-relaxed\`}>
              ${agentDescription}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={\`w-3 h-3 bg-\${currentTheme.primary}-400 rounded-full animate-pulse\`}></div>
              <span className={\`font-mono text-sm \${currentTheme.accent}\`}>Live & Ready</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-6\`}>
          <h3 className={\`font-mono font-bold text-xl \${currentTheme.light} mb-4\`}>Quick Actions</h3>
          <div className="grid gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.path)}
                className={\`w-full flex items-center gap-4 p-4 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl hover:\${currentTheme.bgHover} transition-all duration-200 hover:scale-[1.02]\`}
              >
                <div className={\`w-12 h-12 \${currentTheme.bg} border \${currentTheme.border} rounded-xl flex items-center justify-center\`}>
                  <span className="text-xl">{action.icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className={\`font-mono text-base font-bold \${currentTheme.light}\`}>{action.title}</div>
                  <div className={\`font-mono text-sm \${currentTheme.dim}\`}>{action.desc}</div>
                </div>
                <span className={\`text-lg \${currentTheme.accent}\`}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-6\`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={\`w-12 h-12 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl flex items-center justify-center\`}>
                <div className={\`w-4 h-4 bg-\${currentTheme.primary}-400 rounded-full animate-pulse\`}></div>
              </div>
              <div>
                <div className={\`font-mono font-bold text-lg \${currentTheme.light}\`}>System Status</div>
                <div className={\`font-mono text-sm \${currentTheme.dim}\`}>All systems operational</div>
              </div>
            </div>
            <div className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl\`}>
              <span className={\`font-mono text-sm font-bold \${currentTheme.accent}\`}>LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}`;
  }

  private generateModelsListPage(options: MobileAppTemplateOptions): string {
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { themes } from '@/lib/theme';

export default function ModelsPage() {
  const router = useRouter();
  const [modelsData, setModelsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModelForCreate, setSelectedModelForCreate] = useState<any>(null);
  const [createFormData, setCreateFormData] = useState<Record<string, any>>({});
  const [creating, setCreating] = useState(false);

  // Use embedded local configuration with fallback safety
  const selectedTheme = '${agentTheme}' || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchModelData();
  }, []);

  const fetchModelData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint (returns embedded models)
      const response = await fetch('/api/agent/models');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch models: \${response.status} \${response.statusText}\`);
      }
      
      const data = await response.json();
      
      if (data.success && data.models && Array.isArray(data.models)) {
        // Use embedded models from sub-agent API
        const currentModels = data.models.map((model: any) => ({
          name: model.name || 'Unknown',
          title: model.title || model.name || 'Unknown',
          emoji: model.emoji || '📋',
          description: model.description || 'Data model',
          fields: Array.isArray(model.fields) ? model.fields : []
        }));
        
        setModels(currentModels);
        
        // Fetch data for each model with better error handling
        const promises = currentModels.map(async (model) => {
          try {
            const records = await api.getModelRecords(model.name);
            const recordArray = Array.isArray(records) ? records : [];
            return { 
              ...model, 
              recordCount: recordArray.length, 
              records: recordArray.slice(0, 3),
              error: false 
            };
          } catch (error) {
            console.warn(\`Failed to fetch records for model \${model.name}:\`, error);
            return { 
              ...model, 
              recordCount: 0, 
              records: [], 
              error: true 
            };
          }
        });
        
        const results = await Promise.all(promises);
        setModelsData(results);
      } else {
        console.warn('Invalid models response:', data);
        throw new Error('No valid models data received');
      }
    } catch (error) {
      console.error('Failed to fetch embedded model data:', error);
      setError(\`Failed to load models: \${error instanceof Error ? error.message : 'Unknown error'}\`);
      setModels([]);
      setModelsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle create record
  const handleCreateRecord = async () => {
    if (!selectedModelForCreate || creating) return;
    
    try {
      setCreating(true);
      
      // Validate required fields
      const hasData = Object.keys(createFormData).some(key => 
        createFormData[key] !== '' && createFormData[key] !== null && createFormData[key] !== undefined
      );
      
      if (!hasData) {
        alert('Please fill in at least one field');
        return;
      }

      // Create record via API
      const response = await fetch(\`/api/models/\${selectedModelForCreate.name}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData)
      });

      if (!response.ok) {
        throw new Error(\`Failed to create record: \${response.status}\`);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh data
        await fetchModelData();
        
        // Close modal and reset form
        setShowCreateModal(false);
        setSelectedModelForCreate(null);
        setCreateFormData({});
        
        alert('Record created successfully!');
      } else {
        throw new Error(result.error || 'Failed to create record');
      }
    } catch (error) {
      console.error('Create error:', error);
      alert(\`Failed to create record: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    } finally {
      setCreating(false);
    }
  };

  // Open create modal for specific model
  const openCreateModal = (model: any) => {
    setSelectedModelForCreate(model);
    setCreateFormData({});
    setShowCreateModal(true);
  };

  // Handle form field changes
  const handleFormChange = (fieldName: string, value: any) => {
    setCreateFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Render form field based on type
  const renderFormField = (field: any) => {
    const value = createFormData[field.name] || '';
    
    switch (field.type) {
      case 'Boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFormChange(field.name, e.target.checked)}
              className="rounded"
            />
            <span className={\`font-mono text-sm \${currentTheme.light}\`}>{field.name}</span>
          </label>
        );
      case 'Int':
      case 'Float':
        return (
          <div>
            <label className={\`block font-mono text-sm \${currentTheme.light} mb-1\`}>
              {field.name}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleFormChange(field.name, parseFloat(e.target.value) || '')}
              className={\`w-full \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg px-3 py-2 \${currentTheme.light} font-mono text-sm focus:outline-none focus:\${currentTheme.borderActive}\`}
              placeholder={\`Enter \${field.name.toLowerCase()}\`}
            />
          </div>
        );
      case 'DateTime':
        return (
          <div>
            <label className={\`block font-mono text-sm \${currentTheme.light} mb-1\`}>
              {field.name}
            </label>
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => handleFormChange(field.name, e.target.value)}
              className={\`w-full \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg px-3 py-2 \${currentTheme.light} font-mono text-sm focus:outline-none focus:\${currentTheme.borderActive}\`}
            />
          </div>
        );
      default:
        return (
          <div>
            <label className={\`block font-mono text-sm \${currentTheme.light} mb-1\`}>
              {field.name}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFormChange(field.name, e.target.value)}
              className={\`w-full \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg px-3 py-2 \${currentTheme.light} font-mono text-sm focus:outline-none focus:\${currentTheme.borderActive}\`}
              placeholder={\`Enter \${field.name.toLowerCase()}\`}
            />
          </div>
        );
    }
  };

  return (
    <Layout title="Data Models">
      <div className="space-y-6">
        <div className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-6\`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={\`text-3xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>Data Models</h1>
              <p className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'}\`}>
                Manage and view your data structures
              </p>
            </div>
            <span className={\`text-lg font-mono px-4 py-2 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl \${currentTheme?.accent || 'text-green-400'}\`}>
              {models.length} model{models.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
            <p className="font-mono text-sm text-red-300">
              ⚠️ {error}
            </p>
            <button
              onClick={fetchModelData}
              className="mt-3 px-4 py-2 bg-red-500/25 border border-red-400/50 rounded-lg text-red-200 font-mono text-xs hover:bg-red-500/35 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-5 animate-pulse\`}>
                <div className="flex items-start gap-4">
                  <div className={\`w-12 h-12 \${currentTheme?.bgActive || 'bg-gray-700'} rounded-xl\`}></div>
                  <div className="flex-1">
                    <div className={\`h-5 \${currentTheme?.bgActive || 'bg-gray-700'} rounded w-1/2 mb-2\`}></div>
                    <div className={\`h-4 \${currentTheme?.bgActive || 'bg-gray-700'} rounded w-3/4 mb-2\`}></div>
                    <div className={\`h-3 \${currentTheme?.bgActive || 'bg-gray-700'} rounded w-1/3\`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : modelsData.length > 0 ? (
          <div className="space-y-4">
            {modelsData.map((model, i) => (
              <div 
                key={i} 
                className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]\`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={\`w-12 h-12 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl flex items-center justify-center flex-shrink-0\`}>
                    <span className="text-2xl">{model.emoji || '🗃️'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={\`font-mono text-lg font-bold \${currentTheme?.light || 'text-gray-200'} mb-1\`}>
                      {model.title || model.name}
                    </div>
                    <div className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} mb-2\`}>
                      {model.description || 'Data model for managing records'}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className={\`font-mono text-xs \${currentTheme?.dim || 'text-gray-400'}\`}>Fields:</span>
                        <span className={\`font-mono text-xs font-bold \${currentTheme?.accent || 'text-green-400'}\`}>
                          {model.fields?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={\`font-mono text-xs \${currentTheme?.dim || 'text-gray-400'}\`}>Records:</span>
                        <span className={\`font-mono text-xs font-bold \${currentTheme?.accent || 'text-green-400'}\`}>
                          {model.recordCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <span className={\`font-mono text-xs px-3 py-1.5 rounded-full \${
                      model.error 
                        ? 'bg-red-500/20 border border-red-400/30 text-red-300' 
                        : \`\${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} \${currentTheme?.accent || 'text-green-400'}\`
                    }\`}>
                      {model.error ? '⚠️ Error' : '✅ Ready'}
                    </span>
                    <button
                      onClick={() => openCreateModal(model)}
                      disabled={model.error}
                      className={\`px-3 py-1.5 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-full font-mono text-xs \${currentTheme?.accent || 'text-green-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-600'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed\`}
                    >
                      + Add Record
                    </button>
                  </div>
                  <button
                    onClick={() => router.push(\`/models/\${model.name}\`)}
                    className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} flex items-center gap-1 hover:\${currentTheme?.accent || 'hover:text-green-400'} transition-colors\`}
                  >
                    <span>View Details</span>
                    <span className={\`\${currentTheme?.accent || 'text-green-400'}\`}>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={\`w-20 h-20 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-2xl flex items-center justify-center mx-auto mb-4\`}>
              <span className={\`text-3xl \${currentTheme?.dim || 'text-gray-400'}\`}>🗃️</span>
            </div>
            <div className={\`font-mono text-lg font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>No Models Yet</div>
            <div className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} max-w-xs mx-auto\`}>
              Your data models will appear here once you create them
            </div>
          </div>
        )}

        {/* Create Record Modal */}
        {showCreateModal && selectedModelForCreate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto\`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={\`text-xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'}\`}>
                  Create {selectedModelForCreate.title || selectedModelForCreate.name}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={\`p-2 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-lg \${currentTheme?.dim || 'text-gray-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-600'} transition-colors\`}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedModelForCreate.fields?.map((field: any) => (
                  <div key={field.name}>
                    {renderFormField(field)}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={\`flex-1 py-3 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-700'} transition-colors\`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRecord}
                  disabled={creating}
                  className={\`flex-1 py-3 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl font-mono text-sm \${currentTheme?.accent || 'text-green-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-600'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed\`}
                >
                  {creating ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  // Continue with other page generators...
  private generateModelDetailPage(options: MobileAppTemplateOptions): string {
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';
import ActionExecutionModal from '@/components/ActionExecutionModal';

export default function ModelDetailPage({ params }: { params: { modelName: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { modelName } = params;
  const actionParam = searchParams.get('action');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelDef, setModelDef] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [availableActions, setAvailableActions] = useState<any[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedActionForRecord, setSelectedActionForRecord] = useState<{action: any, record: any} | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // Get model definition from embedded config
  const embeddedModels = ${JSON.stringify(options.models)};

  useEffect(() => {
    if (modelName && typeof modelName === 'string') {
      const foundModel = embeddedModels.find(m => m.name === modelName);
      setModelDef(foundModel);
      fetchRecords();
      fetchAvailableActions();
      
      // Auto-open create modal if action=create parameter is present
      if (actionParam === 'create' && foundModel) {
        openEditModal({ id: 'new' }); // Use 'new' as a special ID for create mode
      }
    }
  }, [modelName, actionParam]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionMenu) {
        setShowActionMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showActionMenu]);

  const fetchAvailableActions = async () => {
    try {
      console.log(\`🔍 Fetching actions for model: \${modelName}\`);
      const response = await fetch('/api/agent/actions');
      const data = await response.json();
      
      console.log('📊 Actions API response:', { success: data.success, actionCount: data.actions?.length || 0 });
      
      if (data.success && data.actions) {
        console.log('🔍 All available actions:', data.actions.map(a => ({ 
          name: a.name, 
          targetModel: a.targetModel, 
          hasTargetModel: !!a.targetModel,
          description: a.description?.substring(0, 30) + '...'
        })));
        
        // Filter actions that target this specific model OR show all if no targetModel is set
        const modelActions = data.actions.filter((action: any) => {
          // NEW MIGRATION: Actions with targetModel matching current model
          if (action.targetModel === modelName) {
            console.log(\`✅ Action \${action.name} targets \${modelName}\`);
            return true;
          }
          
          // LEGACY: Actions without targetModel (old generation)
          if (!action.targetModel) {
            console.log(\`📝 Action \${action.name} has no targetModel (legacy) - including\`);
            return true;
          }
          
          // Check if action name or description mentions the model
          const actionText = (action.name + ' ' + (action.description || '')).toLowerCase();
          const modelNameLower = modelName.toLowerCase();
          if (actionText.includes(modelNameLower)) {
            console.log(\`🔍 Action \${action.name} mentions \${modelName} in text - including\`);
            return true;
          }
          
          console.log(\`❌ Action \${action.name} does not match \${modelName}\`);
          return false;
        });
        
        console.log(\`📋 Filtered actions for \${modelName}:\`, modelActions.map(a => ({ name: a.name, targetModel: a.targetModel || 'none' })));
        setAvailableActions(modelActions);
        console.log(\`✅ Found \${modelActions.length} actions for \${modelName} model\`);
      } else {
        console.warn('⚠️ No actions data received or API call failed');
        setAvailableActions([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch actions:', error);
      setAvailableActions([]);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!modelName || typeof modelName !== 'string') {
        throw new Error('Invalid model name');
      }
      
      const data = await api.getModelRecords(modelName);
      const recordArray = Array.isArray(data) ? data : [];
      setRecords(recordArray);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit record
  const openEditModal = (record: any) => {
    setEditingRecord(record);
    // Initialize form with current record data (or empty for new records)
    const formData: Record<string, any> = {};
    if (modelDef?.fields) {
      modelDef.fields.forEach((field: any) => {
        formData[field.name] = record.id === 'new' ? '' : (record[field.name] || '');
      });
    }
    setEditFormData(formData);
    setShowEditModal(true);
  };

    const handleUpdateRecord = async () => {
    if (!editingRecord || !modelDef || updating) return;
    
    try {
      setUpdating(true);
      
      if (editingRecord.id === 'new') {
        // Create new record
        const response = await fetch(\`/api/models/\${modelName}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        });

        if (!response.ok) {
          throw new Error(\`Failed to create record: \${response.status}\`);
        }

        const result = await response.json();
        if (result.success) {
          // Refresh data
          await fetchRecords();
          
          // Close modal and reset form
          setShowEditModal(false);
          setEditingRecord(null);
          setEditFormData({});
          
          alert('Record created successfully!');
        } else {
          throw new Error(result.error || 'Failed to create record');
        }
      } else {
        // Update existing record
        const response = await fetch(\`/api/models/\${modelName}/\${editingRecord.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        });

        if (!response.ok) {
          throw new Error(\`Failed to update record: \${response.status}\`);
        }

        const result = await response.json();
        if (result.success) {
          // Refresh data
          await fetchRecords();
          
          // Close modal and reset form
          setShowEditModal(false);
          setEditingRecord(null);
          setEditFormData({});
          
          alert('Record updated successfully!');
        } else {
          throw new Error(result.error || 'Failed to update record');
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(\`Failed to \${editingRecord.id === 'new' ? 'create' : 'update'} record: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete record
  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleting(recordId);
      
             const response = await fetch(\`/api/models/\${modelName}/\${recordId}\`, {
         method: 'DELETE'
       });

      if (!response.ok) {
        throw new Error(\`Failed to delete record: \${response.status}\`);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh data
        await fetchRecords();
        alert('Record deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(\`Failed to delete record: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    } finally {
      setDeleting(null);
    }
  };

  // Handle action execution on record
  const executeActionOnRecord = (action: any, record: any) => {
    setSelectedActionForRecord({ action, record });
    setShowActionModal(true);
    setShowActionMenu(null); // Close action menu
  };

  const handleActionComplete = (result: any) => {
    setShowActionModal(false);
    setSelectedActionForRecord(null);
    
    // Refresh records to show updated data
    fetchRecords();
    
    console.log('Action completed on record:', result);
  };

  // Toggle action menu for a specific record
  const toggleActionMenu = (recordId: string) => {
    setShowActionMenu(showActionMenu === recordId ? null : recordId);
  };

  // Handle form field changes
  const handleEditFormChange = (fieldName: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Render form field based on type
  const renderEditFormField = (field: any) => {
    const value = editFormData[field.name] || '';
    
    switch (field.type) {
      case 'Boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleEditFormChange(field.name, e.target.checked)}
              className="rounded"
            />
            <span className={\`font-mono text-sm \${currentTheme.light}\`}>{field.name}</span>
          </label>
        );
      case 'Int':
      case 'Float':
        return (
          <div>
            <label className={\`block font-mono text-sm \${currentTheme.light} mb-1\`}>
              {field.name}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleEditFormChange(field.name, parseFloat(e.target.value) || '')}
              className={\`w-full \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg px-3 py-2 \${currentTheme.light} font-mono text-sm focus:outline-none focus:\${currentTheme.borderActive}\`}
              placeholder={\`Enter \${field.name.toLowerCase()}\`}
            />
          </div>
        );
      case 'DateTime':
        return (
          <div>
            <label className={\`block font-mono text-sm \${currentTheme.light} mb-1\`}>
              {field.name}
            </label>
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => handleEditFormChange(field.name, e.target.value)}
              className={\`w-full \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg px-3 py-2 \${currentTheme.light} font-mono text-sm focus:outline-none focus:\${currentTheme.borderActive}\`}
            />
          </div>
        );
      default:
        return (
          <div>
            <label className={\`block font-mono text-sm \${currentTheme.light} mb-1\`}>
              {field.name}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleEditFormChange(field.name, e.target.value)}
              className={\`w-full \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg px-3 py-2 \${currentTheme.light} font-mono text-sm focus:outline-none focus:\${currentTheme.borderActive}\`}
              placeholder={\`Enter \${field.name.toLowerCase()}\`}
            />
          </div>
        );
    }
  };

  // Helper functions for dynamic field handling
  const getRecordId = (record: any) => {
    if (!modelDef || !modelDef.fields) return record.id || 'Unknown';
    
    // Find ID field from model definition
    const idField = modelDef.fields.find((field: any) => 
      field.name === 'id' || field.name.toLowerCase().includes('id')
    );
    
    if (idField && record[idField.name]) {
      return record[idField.name];
    }
    
    return record.id || 'Unknown';
  };

  const getRecordDate = (record: any) => {
    if (!modelDef || !modelDef.fields) return null;
    
    // Find date/timestamp fields from model definition
    const dateFields = modelDef.fields.filter((field: any) => 
      field.type === 'DateTime' || 
      field.name.toLowerCase().includes('date') ||
      field.name.toLowerCase().includes('time') ||
      field.name === 'createdAt' ||
      field.name === 'updatedAt'
    );
    
    for (const field of dateFields) {
      if (record[field.name]) {
        return new Date(record[field.name]).toLocaleDateString();
      }
    }
    
    return 'No date';
  };

  const getDisplayFields = (record: any) => {
    if (!modelDef || !modelDef.fields) {
      // Fallback: show all fields except common system fields
      return Object.entries(record).filter(([key]) => 
        !key.toLowerCase().includes('id') && 
        !['createdAt', 'updatedAt'].includes(key)
      );
    }
    
    // Use model definition to determine display fields
    const displayFields = modelDef.fields.filter((field: any) => 
      !field.name.toLowerCase().includes('id') &&
      !['createdAt', 'updatedAt'].includes(field.name)
    );
    
    return displayFields
      .map((field: any) => [field.name, record[field.name]])
      .filter(([, value]) => value !== undefined && value !== null);
  };

  // Use embedded local configuration with fallback safety
  const selectedTheme = '${agentTheme}' || 'green';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  if (!modelName) {
    return (
      <Layout title="Model Details">
        <div className="p-4 text-center">
          <div className="text-red-400">Invalid model name</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={\`\${modelName} Records\`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className={\`p-3 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl \${currentTheme?.accent || 'text-green-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-700'} transition-colors\`}
          >
            ←
          </button>
          <div>
            <h1 className={\`text-2xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'} capitalize\`}>
              {modelName} Records
            </h1>
            {!loading && !error && (
              <p className={\`text-sm font-mono \${currentTheme?.dim || 'text-gray-400'}\`}>
                {records.length} record{records.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={\`w-8 h-8 border-2 border-\${currentTheme?.primary || 'green'}-400 border-t-transparent rounded-full animate-spin\`}></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-5 text-center">
            <div className="text-red-400 font-mono text-base mb-3">⚠️ {error}</div>
            <button
              onClick={fetchRecords}
              className="px-6 py-3 bg-red-500/25 border border-red-400/50 rounded-xl text-red-200 font-mono text-sm hover:bg-red-500/35 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record, i) => (
              <div
                key={getRecordId(record) || i}
                className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-5\`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={\`font-mono text-lg font-semibold \${currentTheme?.light || 'text-gray-200'}\`}>
                    Record #{getRecordId(record)}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Action Menu Button - Always show for debugging */}
                    <div className="relative">
                      <button
                        onClick={() => toggleActionMenu(getRecordId(record))}
                        className={\`px-3 py-1.5 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-lg font-mono text-xs \${currentTheme?.accent || 'text-green-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-600'} transition-colors flex items-center gap-1\`}
                      >
                        <span>⚡</span>
                        <span>Actions</span>
                        <span className="text-xs">({availableActions.length})</span>
                      </button>
                        
                      {/* Action Dropdown Menu */}
                      {showActionMenu === getRecordId(record) && (
                        <div className={\`absolute right-0 top-full mt-1 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-lg shadow-xl z-50 min-w-48\`}>
                          <div className="p-2 space-y-1">
                            {availableActions.length > 0 ? (
                              availableActions.map((action, actionIndex) => (
                                <button
                                  key={actionIndex}
                                  onClick={() => executeActionOnRecord(action, record)}
                                  className={\`w-full text-left px-3 py-2 rounded-lg \${currentTheme?.bgHover || 'hover:bg-gray-700'} transition-colors flex items-center gap-2\`}
                                >
                                  <span>{action.emoji || '⚡'}</span>
                                  <div className="flex-1">
                                    <div className={\`font-mono text-sm \${currentTheme?.light || 'text-gray-200'}\`}>
                                      {action.title || action.name}
                                    </div>
                                    <div className={\`font-mono text-xs \${currentTheme?.dim || 'text-gray-400'}\`}>
                                      {action.description?.substring(0, 40)}...
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className={\`px-3 py-2 text-center \${currentTheme?.dim || 'text-gray-400'} font-mono text-xs\`}>
                                No actions available for {modelName}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => openEditModal(record)}
                      className={\`px-3 py-1.5 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-lg font-mono text-xs \${currentTheme?.accent || 'text-green-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-600'} transition-colors\`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(getRecordId(record))}
                      disabled={deleting === getRecordId(record)}
                      className={\`px-3 py-1.5 bg-red-500/20 border border-red-400/50 rounded-lg font-mono text-xs text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed\`}
                    >
                      {deleting === getRecordId(record) ? '🗑️ Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <span className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'}\`}>
                    {getRecordDate(record)}
                  </span>
                </div>
                <div className="space-y-3">
                  {getDisplayFields(record).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-3">
                      <span className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} capitalize\`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className={\`font-mono text-sm \${currentTheme?.light || 'text-gray-200'} text-right flex-1 max-w-48 truncate\`}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={\`w-20 h-20 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-2xl flex items-center justify-center mx-auto mb-4\`}>
              <span className={\`text-3xl \${currentTheme?.dim || 'text-gray-400'}\`}>📋</span>
            </div>
            <h3 className={\`font-mono text-lg font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>No Records</h3>
            <div className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} max-w-xs mx-auto\`}>
              This model doesn't have any records yet. Records will appear here once you add them.
            </div>
          </div>
        )}

        {/* Edit Record Modal */}
        {showEditModal && editingRecord && modelDef && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto\`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={\`text-xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'}\`}>
                  {editingRecord.id === 'new' ? \`Create New \${modelName} Record\` : \`Edit Record #\${getRecordId(editingRecord)}\`}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={\`p-2 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-lg \${currentTheme?.dim || 'text-gray-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-600'} transition-colors\`}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {modelDef.fields?.map((field: any) => (
                  <div key={field.name}>
                    {renderEditFormField(field)}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className={\`flex-1 py-3 \${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-700'} transition-colors\`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRecord}
                  disabled={updating}
                  className={\`flex-1 py-3 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl font-mono text-sm \${currentTheme?.accent || 'text-green-400'} hover:\${currentTheme?.bgHover || 'hover:bg-gray-600'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed\`}
                >
                  {updating ? (editingRecord.id === 'new' ? 'Creating...' : 'Updating...') : (editingRecord.id === 'new' ? 'Create Record' : 'Update Record')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Execution Modal */}
        {showActionModal && selectedActionForRecord && (
          <ActionExecutionModal
            action={{
              ...selectedActionForRecord.action,
              // Pre-populate the record ID for single-record processing
              uiComponentsDesign: [
                {
                  name: 'id',
                  type: 'text',
                  label: 'Record ID',
                  required: true,
                  defaultValue: getRecordId(selectedActionForRecord.record),
                  readonly: true
                },
                ...(selectedActionForRecord.action.uiComponentsDesign || [])
              ]
            }}
            isOpen={showActionModal}
            onClose={() => setShowActionModal(false)}
            onComplete={handleActionComplete}
            theme={selectedTheme}
          />
        )}
      </div>
    </Layout>
  );
}`;
  }



  private generateSchedulesPage(options: MobileAppTemplateOptions): string {
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import ScheduleCard from '@/components/ScheduleCard';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint (returns embedded schedules)
      const response = await fetch('/api/agent/schedules');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch schedules: \${response.status}\`);
      }
      
      const data = await response.json();
      
      if (data.success && data.schedules) {
        const formattedSchedules = data.schedules.map((schedule: any) => ({
          id: schedule.name, // Use name as ID for consistency
          name: schedule.name,
          emoji: schedule.emoji || '⏰',
          description: schedule.description || 'Scheduled task',
          pattern: schedule.trigger?.pattern || '0 0 * * *',
          active: schedule.trigger?.active !== false,
          nextRun: schedule.trigger?.pattern ? 'Calculated from pattern' : 'Unknown',
          steps: schedule.steps || []
        }));
        setSchedules(formattedSchedules);
      } else {
        throw new Error('No schedules data received');
      }
    } catch (err) {
      console.error('Failed to fetch embedded schedules:', err);
      setError('Failed to load schedules. Please refresh the page.');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getNextRunTime = (pattern: string) => {
    // Simple next run calculation - in a real app, use a cron library
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    return nextHour.toLocaleString();
  };

  if (loading) {
    return (
      <Layout title="Schedules">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className={\`text-xl font-mono font-bold \${currentTheme.light}\`}>Scheduled Tasks</h1>
            <span className={\`text-sm font-mono \${currentTheme.dim}\`}>Loading...</span>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4 animate-pulse\`}>
                <div className={\`h-6 \${currentTheme.bg} rounded w-1/3 mb-2\`}></div>
                <div className={\`h-4 \${currentTheme.bg} rounded w-2/3\`}></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Schedules">
      <div className="space-y-6">
        <div className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-6\`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={\`text-3xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>Scheduled Tasks</h1>
              <p className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'}\`}>
                Monitor and manage automated workflows
              </p>
            </div>
            <span className={\`text-lg font-mono px-4 py-2 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl \${currentTheme?.accent || 'text-green-400'}\`}>
              {schedules.filter(s => s.active).length}/{schedules.length} active
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-400/20 rounded-xl">
            <p className="font-mono text-sm text-red-300">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-5 text-center\`}>
            <div className={\`font-mono font-bold text-2xl \${currentTheme.accent} mb-1\`}>
              {schedules.length}
            </div>
            <div className={\`font-mono text-sm \${currentTheme.dim}\`}>Total Tasks</div>
          </div>
          <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-5 text-center\`}>
            <div className={\`font-mono font-bold text-2xl \${currentTheme.accent} mb-1\`}>
              {schedules.filter(s => s.active).length}
            </div>
            <div className={\`font-mono text-sm \${currentTheme.dim}\`}>Active Tasks</div>
          </div>
        </div>

        {schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]\`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={\`w-12 h-12 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl flex items-center justify-center flex-shrink-0\`}>
                    <span className="text-2xl">{schedule.emoji || '⏰'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={\`font-mono text-lg font-bold \${currentTheme.light} mb-1\`}>
                      {schedule.title || schedule.name}
                    </div>
                    <div className={\`font-mono text-sm \${currentTheme.dim} mb-3\`}>
                      {schedule.description || 'Automated task execution'}
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={\`w-3 h-3 rounded-full \${
                          schedule.trigger?.active ? \`bg-\${currentTheme.primary}-400 animate-pulse\` : \`bg-gray-500\`
                        }\`}></div>
                        <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
                          {schedule.trigger?.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className={\`px-2 py-1 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-md\`}>
                        <span className={\`font-mono text-xs \${currentTheme.accent}\`}>
                          {schedule.trigger?.pattern || 'Manual'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                  <span className={\`font-mono text-xs px-3 py-1.5 rounded-full \${
                    schedule.trigger?.active 
                      ? \`\${currentTheme.bgActive} border \${currentTheme.borderActive} \${currentTheme.accent}\`
                      : 'bg-gray-500/20 border border-gray-400/30 text-gray-400'
                  }\`}>
                    {schedule.steps?.length || 0} steps
                  </span>
                  <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
                    Next run: {schedule.trigger?.active ? 'Scheduled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={\`w-20 h-20 \${currentTheme.bg} border \${currentTheme.border} rounded-2xl flex items-center justify-center mx-auto mb-4\`}>
              <span className={\`text-3xl \${currentTheme.dim}\`}>⏰</span>
            </div>
            <div className={\`font-mono text-lg font-bold \${currentTheme.light} mb-2\`}>No Schedules Yet</div>
            <div className={\`font-mono text-sm \${currentTheme.dim} max-w-xs mx-auto\`}>
              Automated tasks and workflows will appear here
            </div>
          </div>
        )}

        {/* Today's Progress */}
        {schedules.length > 0 && (
          <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-3 mt-4\`}>
            <h4 className={\`font-mono text-sm font-semibold mb-2 \${currentTheme.light}\`}>Today's Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className={currentTheme.dim}>Schedules Active</span>
                <span className={\`font-bold \${currentTheme.accent}\`}>
                  {schedules.filter(s => s.trigger?.active).length}/{schedules.length}
                </span>
              </div>
              <div className={\`w-full bg-\${currentTheme.primary}-900/30 rounded-full h-2\`}>
                <div 
                  className={\`bg-\${currentTheme.primary}-400 h-2 rounded-full\`}
                  style={{ 
                    width: \`\${schedules.length > 0 ? (schedules.filter(s => s.trigger?.active).length / schedules.length) * 100 : 0}%\` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateChatPage(options: MobileAppTemplateOptions): string {
    const agentName = escapeJSString(options.agentConfig?.name || options.projectName);
    const agentDescription = escapeJSString(options.agentConfig?.description || 'Smart agent powered by AI');
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import ChatMessage from '@/components/ChatMessage';
import ActionExecutionModal from '@/components/ActionExecutionModal';
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { themes } from '@/lib/theme';

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [availableActions, setAvailableActions] = useState<any[]>([]);
  
  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load available actions on component mount
  useEffect(() => {
    const loadActions = async () => {
      try {
        const response = await fetch('/api/agent/actions');
        const data = await response.json();
        if (data.success && data.actions) {
          setAvailableActions(data.actions);
        }
      } catch (error) {
        console.error('Failed to load actions:', error);
      }
    };
    loadActions();
  }, []);
  
  const agentConfig = {
    name: '${agentName}',
    description: '${agentDescription}',
    models: ${JSON.stringify(options.models)},
    actions: ${JSON.stringify(options.actions)},
    schedules: ${JSON.stringify(options.schedules)}
  };
  
  // Extract avatar configuration for chat messages
  const avatar = ${JSON.stringify(options.agentConfig?.avatar)};
  
  // Create initial welcome message with personality from avatar
  const personality = avatar?.personality || '${escapeJSString(options.agentConfig?.personality || '')}';
  const characterNames = avatar?.characterNames || '${escapeJSString(options.agentConfig?.characterNames || '')}';
  
  console.log('🎭 Chat page personality data:', {
    personality,
    characterNames,
    hasPersonality: !!personality,
    hasCharacterNames: !!characterNames,
    avatarPersonality: avatar?.personality,
    avatarCharacterNames: avatar?.characterNames
  });
  
  // Build personalized greeting
  let greeting = \`Hello! I'm \${agentConfig.name || 'your AI assistant'}\`;
  if (personality && characterNames) {
    greeting += \`, and I embody \${personality}. I draw inspiration from \${characterNames}.\`;
  } else if (personality) {
    greeting += \`, and I'm \${personality}.\`;
  } else if (characterNames) {
    greeting += \`, drawing inspiration from \${characterNames}.\`;
  } else {
    greeting += \`, and I'm here to help you with this agent app.\`;
  }
  
  if (agentConfig.description && !personality) {
    greeting += \` \${agentConfig.description}\`;
  }
  
  console.log('🎭 Final greeting:', greeting);
  
  const initialWelcomeMessage = {
    id: 'welcome',
    role: 'assistant' as const,
    content: \`\${greeting}

I can help you with:
• **Data Management**: View and manage your \${agentConfig.models?.length || ${options.models.length}} data models
• **Smart Actions**: Execute any of your \${agentConfig.actions?.length || ${options.actions.length}} configured actions  
• **Task Scheduling**: Monitor your \${agentConfig.schedules?.length || ${options.schedules.length}} automated tasks
• **System Status**: Check health and performance

What would you like to explore first?\`,
    createdAt: new Date()
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [initialWelcomeMessage],
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Handle action execution from chat
  const executeActionFromChat = (actionName: string) => {
    const action = availableActions.find(a => a.name === actionName);
    if (action) {
      setSelectedAction(action);
      setShowActionModal(true);
    } else {
      console.error('Action not found:', actionName);
    }
  };

  const handleActionComplete = (result: any) => {
    setShowActionModal(false);
    setSelectedAction(null);
    
    // Add the action result to the chat
    const resultMessage = \`Action "\${selectedAction?.title || selectedAction?.name}" \${result.success ? 'completed successfully' : 'failed'}\${result.error ? ': ' + result.error : ''}.\`;
    
    // You could add this to the chat messages if needed
    console.log('Action completed:', resultMessage, result);
  };

  // Smart input suggestions based on common patterns
  const detectIntentAndSuggest = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Action-related keywords
    const actionKeywords = ['run', 'execute', 'trigger', 'start', 'perform', 'do', 'action'];
    // Data-related keywords  
    const dataKeywords = ['show', 'list', 'get', 'find', 'view', 'data', 'records', 'create', 'add', 'update', 'edit', 'delete', 'remove'];
    
    const hasActionIntent = actionKeywords.some(keyword => lowerText.includes(keyword));
    const hasDataIntent = dataKeywords.some(keyword => lowerText.includes(keyword));
    
    return { hasActionIntent, hasDataIntent };
  };

  const getSuggestionButtons = () => {
    const { hasActionIntent, hasDataIntent } = detectIntentAndSuggest(input);
    
    const suggestions = [];
    
    if (hasActionIntent) {
      suggestions.push({
        text: '🗃️ Go to Data Models (Actions)',
        action: () => router.push('/models'),
        color: 'bg-blue-500/20 border-blue-400/30 text-blue-200'
      });
    }
    
    if (hasDataIntent) {
      suggestions.push({
        text: '🗃️ Go to Data Models',
        action: () => router.push('/models'),
        color: 'bg-purple-500/20 border-purple-400/30 text-purple-200'
      });
    }
    
    return suggestions;
  };

  const quickActions = [
    { 
      icon: '🗃️', 
      label: 'View Data Models', 
      action: () => router.push('/models'),
      description: 'Browse and manage your data'
    },
    { 
      icon: '⚡', 
      label: 'Execute Actions', 
      action: () => router.push('/models'),
      description: 'Run actions on records'
    },
    { 
      icon: '⏰', 
      label: 'Check Schedules', 
      action: () => router.push('/schedules'),
      description: 'Monitor automated tasks'
    },
    { 
      icon: '📊', 
      label: 'System Status', 
      action: () => {
        handleInputChange({ target: { value: 'What is the current system status?' } } as any);
        setShowQuickActions(false);
      },
      description: 'Get system health info'
    }
  ];

  const suggestions = getSuggestionButtons();

  return (
    <Layout title="AI Chat">
      <div className={\`flex flex-col \${isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-5rem)]'}\`}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 mb-4">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={{
                id: message.id,
                type: message.role === 'user' ? 'user' : 'bot',
                content: message.content,
                timestamp: message.createdAt || new Date(),
                toolInvocations: message.toolInvocations
              }}
              theme={selectedTheme}
              avatar={avatar}
              availableActions={availableActions}
              onActionExecute={executeActionFromChat}
            />
          ))}
          
          {isLoading && (
            <div className={\`flex justify-start\`}>
              <div className={\`max-w-xs p-4 rounded-xl \${currentTheme.bg} border \${currentTheme.border}\`}>
                <div className="flex items-center gap-2">
                  <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`}></div>
                  <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`} style={{animationDelay: '0.1s'}}></div>
                  <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`} style={{animationDelay: '0.2s'}}></div>
                  <span className={\`text-xs font-mono \${currentTheme.dim} ml-2\`}>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4">
              <div className="text-red-400 font-mono text-sm">
                ⚠️ Chat Error: {error.message}
              </div>
              <div className="text-red-300/70 font-mono text-xs mt-2">
                Please check your AI API keys in environment variables and try again.
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Data Management Buttons */}
        <div className={\`p-4 \${currentTheme.bg} border \${currentTheme.border} rounded-xl mb-4\`}>
          <div className={\`font-mono text-sm \${currentTheme.light} mb-3\`}>Quick Data Management:</div>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => handleInputChange({ target: { value: 'Show me all records from my models' } } as any)}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap flex items-center gap-2\`}
            >
              <span>🗃️</span>
              <span>List Records</span>
            </button>
            <button
              onClick={() => handleInputChange({ target: { value: 'Help me create a new record' } } as any)}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap flex items-center gap-2\`}
            >
              <span>➕</span>
              <span>Create Record</span>
            </button>
            <button
              onClick={() => router.push('/models')}
              className={\`px-4 py-2 \${currentTheme.bg} border \${currentTheme.border} rounded-xl font-mono text-xs \${currentTheme.dim} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              🗃️ Data Models
            </button>
            {availableActions.length > 0 && (
              <button
                onClick={() => router.push('/models')}
                className={\`px-4 py-2 \${currentTheme.bg} border \${currentTheme.border} rounded-xl font-mono text-xs \${currentTheme.dim} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
              >
                ⚡ Actions ({availableActions.length})
              </button>
            )}
          </div>
        </div>

        {/* Chat Input */}
        <div className={\`p-4 \${currentTheme.bg} border \${currentTheme.border} rounded-xl\`}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask AI anything..."
                className={\`w-full \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl px-4 py-3 \${currentTheme.light} font-mono text-sm focus:outline-none focus:\${currentTheme.borderActive} placeholder:\${currentTheme.dim} resize-none\`}
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={\`w-12 h-12 \${currentTheme.bgActive} hover:\${currentTheme.bgHover} border \${currentTheme.borderActive} rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed\`}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <div className={\`w-4 h-4 border-2 border-\${currentTheme.primary}-400 border-t-transparent rounded-full animate-spin\`}></div>
              ) : (
                <span className={\`text-lg \${currentTheme.accent}\`}>→</span>
              )}
            </button>
          </div>
          
          {/* Navigation Quick Actions */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            <button 
              onClick={() => router.push('/models')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              🗃️ View Data
            </button>
            <button 
              onClick={() => router.push('/models')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              ⚡ Run Actions
            </button>
            <button 
              onClick={() => router.push('/schedules')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              ⏰ View Tasks
            </button>
          </div>
        </div>

        {/* Action Execution Modal */}
        {showActionModal && selectedAction && (
          <ActionExecutionModal
            action={selectedAction}
            isOpen={showActionModal}
            onClose={() => setShowActionModal(false)}
            onComplete={handleActionComplete}
            theme={selectedTheme}
          />
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateExecutionLogsPage(options: MobileAppTemplateOptions): string {
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { themes } from '@/lib/theme';

interface ActionExecutionLog {
  executionId: string;
  actionName: string;
  scheduleName?: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  steps: ActionStepLog[];
  error?: string;
  totalExecutionTime?: number;
}

interface ActionStepLog {
  stepNumber: number;
  stepName: string;
  startTime: string;
  endTime?: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  executionTime?: number;
}

export default function ExecutionLogsPage() {
  const [executions, setExecutions] = useState<ActionExecutionLog[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ActionExecutionLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  // Fetch executions
  const fetchExecutions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/execution-logs?limit=50');
      const result = await response.json();
      
      if (result.success) {
        setExecutions(result.data);
        if (result.data.length > 0 && !selectedExecution) {
          setSelectedExecution(result.data[0]);
        }
      } else {
        setError(result.error || 'Failed to fetch executions');
      }
    } catch (err) {
      console.error('Failed to fetch executions:', err);
      setError('Failed to fetch executions');
    } finally {
      setLoading(false);
    }
  };

     // Auto-refresh effect
   useEffect(() => {
    fetchExecutions();
    
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(fetchExecutions, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return \`\${ms}ms\`;
    if (ms < 60000) return \`\${(ms / 1000).toFixed(1)}s\`;
    return \`\${(ms / 60000).toFixed(1)}m\`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'running':
        return { icon: '🔄', color: currentTheme.accent, text: 'Running' };
      case 'completed':
        return { icon: '✅', color: 'text-green-400', text: 'Completed' };
      case 'failed':
        return { icon: '❌', color: 'text-red-400', text: 'Failed' };
      default:
        return { icon: '❓', color: currentTheme.dim, text: 'Unknown' };
    }
  };

  return (
    <Layout title="Execution Logs">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={\`text-2xl font-bold font-mono \${currentTheme.light}\`}>
              📊 Execution Logs
            </h1>
            <p className={\`\${currentTheme.dim} font-mono text-sm\`}>
              Monitor action and schedule executions with step-by-step details
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className={\`text-sm font-mono \${currentTheme.light}\`}>Auto Refresh</span>
            </label>
            <button
              onClick={fetchExecutions}
              disabled={loading}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} disabled:opacity-50 transition-colors\`}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-400/30 rounded-lg p-4">
            <div className="text-red-400 font-mono text-sm">
              ❌ {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Execution List */}
          <div className={\`lg:col-span-1 \${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4\`}>
            <h2 className={\`text-lg font-bold font-mono \${currentTheme.light} mb-4\`}>
              Recent Executions ({executions.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className={\`\${currentTheme.accent}\`}>🔄 Loading...</div>
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-8">
                <div className={\`\${currentTheme.dim} font-mono text-sm\`}>
                  No executions found
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {executions.map((execution) => {
                  const status = getStatusDisplay(execution.status);
                  const isSelected = selectedExecution?.executionId === execution.executionId;
                  
                  return (
                    <div
                      key={execution.executionId}
                      className={\`p-3 border rounded-lg cursor-pointer transition-colors \${
                        isSelected
                          ? \`\${currentTheme.borderActive} \${currentTheme.bgActive}\`
                          : \`\${currentTheme.border} hover:\${currentTheme.bgHover}\`
                      }\`}
                      onClick={() => setSelectedExecution(execution)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{status.icon}</span>
                          <span className={\`font-medium font-mono text-sm \${currentTheme.light}\`}>
                            {execution.scheduleName ? \`📅 \${execution.scheduleName}\` : execution.actionName}
                          </span>
                        </div>
                        <span className={\`px-2 py-1 rounded text-xs font-mono \${status.color}\`}>
                          {status.text}
                        </span>
                      </div>
                      <div className={\`text-xs font-mono \${currentTheme.dim}\`}>
                        {formatTimestamp(execution.startTime)}
                      </div>
                      <div className={\`text-xs font-mono \${currentTheme.dim}\`}>
                        {execution.steps.length} steps • {formatDuration(execution.totalExecutionTime)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Execution Details */}
          <div className={\`lg:col-span-2 \${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4\`}>
            {selectedExecution ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className={\`text-lg font-bold font-mono \${currentTheme.light}\`}>
                    {selectedExecution.scheduleName ? 
                      \`📅 Schedule: \${selectedExecution.scheduleName}\` : 
                      \`⚡ Action: \${selectedExecution.actionName}\`
                    }
                  </h2>
                  <div className={\`px-3 py-1 rounded font-mono text-sm \${getStatusDisplay(selectedExecution.status).color}\`}>
                    {getStatusDisplay(selectedExecution.status).text}
                  </div>
                </div>
                
                <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-3\`}>
                  <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                    <div>
                      <div className={\`\${currentTheme.dim}\`}>Execution ID:</div>
                      <div className={\`\${currentTheme.light} break-all\`}>{selectedExecution.executionId}</div>
                    </div>
                    <div>
                      <div className={\`\${currentTheme.dim}\`}>Duration:</div>
                      <div className={\`\${currentTheme.light}\`}>{formatDuration(selectedExecution.totalExecutionTime)}</div>
                    </div>
                    <div>
                      <div className={\`\${currentTheme.dim}\`}>Started:</div>
                      <div className={\`\${currentTheme.light}\`}>{formatTimestamp(selectedExecution.startTime)}</div>
                    </div>
                    {selectedExecution.endTime && (
                      <div>
                        <div className={\`\${currentTheme.dim}\`}>Ended:</div>
                        <div className={\`\${currentTheme.light}\`}>{formatTimestamp(selectedExecution.endTime)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedExecution.error && (
                  <div className="bg-red-500/15 border border-red-400/30 rounded-lg p-3">
                    <div className="text-red-400 font-mono text-sm">
                      <strong>Error:</strong> {selectedExecution.error}
                    </div>
                  </div>
                )}

                {/* Steps */}
                <div>
                  <h3 className={\`text-md font-bold font-mono \${currentTheme.light} mb-3\`}>
                    Execution Steps ({selectedExecution.steps.length})
                  </h3>
                  
                  {selectedExecution.steps.length === 0 ? (
                    <div className={\`text-center py-8 \${currentTheme.dim} font-mono text-sm\`}>
                      No steps recorded
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedExecution.steps.map((step) => {
                        const stepCompleted = !!step.endTime;
                        const stepFailed = !!step.error;
                        
                        return (
                          <div
                            key={step.stepNumber}
                            className={\`\${currentTheme.bg} border \${
                              stepFailed ? 'border-red-400/50' :
                              stepCompleted ? 'border-green-400/50' :
                              'border-blue-400/50'
                            } rounded-lg p-3\`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span>
                                  {stepFailed ? '❌' : stepCompleted ? '✅' : '🔄'}
                                </span>
                                <span className={\`font-medium font-mono text-sm \${
                                  stepFailed ? 'text-red-400' :
                                  stepCompleted ? 'text-green-400' :
                                  'text-blue-400'
                                }\`}>
                                  Step {step.stepNumber}: {step.stepName}
                                </span>
                              </div>
                              {step.executionTime && (
                                <span className={\`text-xs font-mono \${currentTheme.dim}\`}>
                                  {formatDuration(step.executionTime)}
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                              <div>
                                <div className={\`\${currentTheme.dim} mb-1\`}>📥 Input:</div>
                                <pre className={\`\${currentTheme.bg} p-2 rounded overflow-x-auto \${currentTheme.light} max-h-32\`}>
                                  {JSON.stringify(step.input, null, 2)}
                                </pre>
                              </div>
                              
                              {step.output && (
                                <div>
                                  <div className={\`\${currentTheme.dim} mb-1\`}>📤 Output:</div>
                                  <pre className={\`\${currentTheme.bg} p-2 rounded overflow-x-auto \${currentTheme.light} max-h-32\`}>
                                    {JSON.stringify(step.output, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {step.error && (
                                <div className="md:col-span-2">
                                  <div className="text-red-400 mb-1">❌ Error:</div>
                                  <div className="bg-red-500/20 border border-red-400/50 p-2 rounded text-red-400">
                                    {step.error}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className={\`text-4xl mb-4\`}>📊</div>
                <h3 className={\`text-lg font-bold font-mono \${currentTheme.light} mb-2\`}>
                  No Execution Selected
                </h3>
                <p className={\`\${currentTheme.dim} font-mono text-sm\`}>
                  Select an execution from the list to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}`;
  }
} 