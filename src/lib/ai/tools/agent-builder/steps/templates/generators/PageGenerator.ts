import { TemplateGenerator, MobileAppTemplateOptions, escapeJSString } from '../base/MobileAppTemplateBase';

export class PageGenerator implements TemplateGenerator {
  generate(options: MobileAppTemplateOptions): Record<string, string> {
    return {
      'src/app/layout.tsx': this.generateAppLayout(options),
      'src/app/page.tsx': this.generateHomePage(options),
      'src/app/models/page.tsx': this.generateModelsListPage(options),
      'src/app/models/[modelName]/page.tsx': this.generateModelDetailPage(options),
      'src/app/actions/page.tsx': this.generateActionsPage(options),
      'src/app/schedules/page.tsx': this.generateSchedulesPage(options),
      'src/app/chat/page.tsx': this.generateChatPage(options)
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
      desc: 'Manage your business information'
    },
    { 
      path: '/actions', 
      icon: '⚡', 
      title: 'Actions', 
      desc: 'Run automated workflows'
    },
    { 
      path: '/schedules', 
      icon: '⏰', 
      title: 'Schedules', 
      desc: 'Manage automated tasks'
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
                className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-5 cursor-pointer hover:\${currentTheme?.bgHover || 'hover:bg-gray-700'} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]\`}
                onClick={() => router.push(\`/models/\${model.name}\`)}
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
                  <span className={\`font-mono text-xs px-3 py-1.5 rounded-full \${
                    model.error 
                      ? 'bg-red-500/20 border border-red-400/30 text-red-300' 
                      : \`\${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} \${currentTheme?.accent || 'text-green-400'}\`
                  }\`}>
                    {model.error ? '⚠️ Error' : '✅ Ready'}
                  </span>
                  <span className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} flex items-center gap-1\`}>
                    <span>Tap to explore</span>
                    <span className={\`\${currentTheme?.accent || 'text-green-400'}\`}>→</span>
                  </span>
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
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';

export default function ModelDetailPage({ params }: { params: { modelName: string } }) {
  const router = useRouter();
  const { modelName } = params;
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelDef, setModelDef] = useState<any>(null);

  // Get model definition from embedded config
  const embeddedModels = ${JSON.stringify(options.models)};

  useEffect(() => {
    if (modelName && typeof modelName === 'string') {
      const foundModel = embeddedModels.find(m => m.name === modelName);
      setModelDef(foundModel);
      fetchRecords();
    }
  }, [modelName]);

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
            <p className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'} max-w-xs mx-auto\`}>
              This model doesn't have any records yet. Records will appear here once you add them.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}`;
  }

  private generateActionsPage(options: MobileAppTemplateOptions): string {
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import Layout from '@/components/Layout';
import ActionCard from '@/components/ActionCard';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { themes } from '@/lib/theme';

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call sub-agent's own API endpoint (returns embedded actions)
      const response = await fetch('/api/agent/actions');
      
      if (!response.ok) {
        throw new Error(\`Failed to fetch actions: \${response.status}\`);
      }
      
      const data = await response.json();
      
      if (data.success && data.actions) {
        const formattedActions = data.actions.map((action: any) => ({
          id: action.name, // Use name as ID for consistency
          name: action.name,
          title: action.title || action.name,
          emoji: action.emoji || '⚡',
          description: action.description || 'Execute action',
          type: action.type || 'query',
          role: action.role || 'member',
          uiComponentsDesign: action.uiComponentsDesign || [],
          pseudoSteps: action.pseudoSteps || []
        }));
        setActions(formattedActions);
      } else {
        throw new Error('No actions data received');
      }
    } catch (err) {
      console.error('Failed to fetch embedded actions:', err);
      setError('Failed to load actions. Please refresh the page.');
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Actions">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className={\`text-xl font-mono font-bold \${currentTheme.light}\`}>Smart Actions</h1>
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
    <Layout title="Actions">
      <div className="space-y-6">
        <div className={\`\${currentTheme?.bg || 'bg-gray-800'} border \${currentTheme?.border || 'border-gray-700'} rounded-xl p-6\`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={\`text-3xl font-mono font-bold \${currentTheme?.light || 'text-gray-200'} mb-2\`}>Smart Actions</h1>
              <p className={\`font-mono text-sm \${currentTheme?.dim || 'text-gray-400'}\`}>
                Execute automated workflows and tasks
              </p>
            </div>
            <span className={\`text-lg font-mono px-4 py-2 \${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} rounded-xl \${currentTheme?.accent || 'text-green-400'}\`}>
              {actions.length} action{actions.length !== 1 ? 's' : ''}
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

        <div className={\`mb-4 p-4 \${currentTheme.bg} border \${currentTheme.border} rounded-xl\`}>
          <p className={\`font-mono text-sm \${currentTheme.dim}\`}>
            💡 <strong>Embedded Actions:</strong> Click any action card to open the execution modal. 
            All action code is embedded and executes locally on this sub-agent for optimal performance.
          </p>
        </div>

        {actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionCard 
                key={action.id} 
                action={action}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={\`w-20 h-20 \${currentTheme.bg} border \${currentTheme.border} rounded-2xl flex items-center justify-center mx-auto mb-4\`}>
              <span className={\`text-3xl \${currentTheme.dim}\`}>⚡</span>
            </div>
            <div className={\`font-mono text-lg font-bold \${currentTheme.light} mb-2\`}>No Actions Yet</div>
            <div className={\`font-mono text-sm \${currentTheme.dim} max-w-xs mx-auto\`}>
              Smart actions and workflows will appear here
            </div>
          </div>
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
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { themes } from '@/lib/theme';

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  
  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
        text: '⚡ Go to Actions Page',
        action: () => router.push('/actions'),
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
      action: () => router.push('/actions'),
      description: 'Run smart actions'
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
                timestamp: message.createdAt || new Date()
              }}
              theme={selectedTheme}
              avatar={avatar}
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
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            <button 
              onClick={() => router.push('/models')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              🗃️ View Data
            </button>
            <button 
              onClick={() => router.push('/actions')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              ⚡ Run Action
            </button>
            <button 
              onClick={() => router.push('/schedules')}
              className={\`px-4 py-2 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors whitespace-nowrap\`}
            >
              ⏰ View Tasks
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}`;
  }
} 