import { TemplateGenerator, MobileAppTemplateOptions, escapeJSString } from '../base/MobileAppTemplateBase';

export class ComponentGenerator implements TemplateGenerator {
  generate(options: MobileAppTemplateOptions): Record<string, string> {
    return {
      'src/components/Layout.tsx': this.generateLayoutComponent(options),
      'src/components/MobileNav.tsx': this.generateMobileNavComponent(options),
      'src/components/ModelCard.tsx': this.generateModelCardComponent(options),
      'src/components/ActionCard.tsx': this.generateActionCardComponent(options),
      'src/components/ScheduleCard.tsx': this.generateScheduleCardComponent(options),
      'src/components/ChatMessage.tsx': this.generateChatMessageComponent(),
      'src/components/LoadingSpinner.tsx': this.generateLoadingSpinnerComponent(),
      'src/components/ActionExecutionModal.tsx': this.generateActionExecutionModal(),
      'src/components/ExecutionTracker.tsx': this.generateExecutionTracker(),
      'src/components/ClientProviders.tsx': this.generateClientProviders(),
      'src/components/CompositeUnicorn.tsx': this.generateCompositeUnicornComponent(options)
    };
  }

  private generateCompositeUnicornComponent(options: MobileAppTemplateOptions): string {
    return `"use client"

import React from 'react'
import Image from 'next/image'

interface UnicornParts {
  body: string
  hair: string
  eyes: string
  mouth: string
  accessory: string
}

interface CompositeUnicornProps {
  parts: UnicornParts
  size?: number
}

export function CompositeUnicorn({ parts, size = 128 }: CompositeUnicornProps) {
  console.log('🦄 CompositeUnicorn rendering:', { parts, size });
  
  // Function to get image source - handles both blob URLs and local paths
  const getImageSrc = (partUrl: string, fallbackCategory?: string) => {
    // If it's already a full URL (blob URL), use it directly
    if (partUrl?.startsWith('http') || partUrl?.startsWith('blob:')) {
      return partUrl;
    }
    
    // If it's a local path starting with /, use it directly
    if (partUrl?.startsWith('/')) {
      return partUrl;
    }
    
    // Use pre-uploaded blob URLs if available, otherwise fallback to local paths
    const blobAssets = ${JSON.stringify(options.agentConfig?.avatar?.unicornParts || {})};
    
    // Check if we have blob URLs for this part
    const getBlobUrl = (category: string, filename: string) => {
      return blobAssets[\`\${category}/\${filename}\`];
    };
    
    // Fallback: try to map filename to local path (for backward compatibility)
    const imageMap: { [key: string]: { [key: string]: string } } = {
      bodies: {
        "body.png": "/images/unicorn/bodies/body.png",
        "body_h.png": "/images/unicorn/bodies/body_h.png",
      },
      hair: {
        "hair_blue.png": "/images/unicorn/hair/hair_blue.png",
        "hair_g.png": "/images/unicorn/hair/hair_g.png",
      },
      eyes: {
        "eye_h.png": "/images/unicorn/eyes/eye_h.png",
        "eye_heart.png": "/images/unicorn/eyes/eye_heart.png",
      },
      mouths: {
        "m_.png": "/images/unicorn/mouths/m_.png",
        "m_ice.png": "/images/unicorn/mouths/m_ice.png",
      },
      accessories: {
        "corn_ice1.png": "/images/unicorn/accessories/corn_ice1.png",
        "corn_ice2.png": "/images/unicorn/accessories/corn_ice2.png",
      },
    }
    
    // Check for blob URL first (highest priority)
    if (fallbackCategory && partUrl) {
      const blobUrl = getBlobUrl(fallbackCategory, partUrl);
      if (blobUrl) {
        console.log(\`🦄 Using blob URL for \${fallbackCategory}/\${partUrl}:\`, blobUrl);
        return blobUrl;
      }
    }
    
    // Fallback to local path mapping
    if (fallbackCategory && partUrl && imageMap[fallbackCategory]?.[partUrl]) {
      console.log(\`📁 Using local path for \${fallbackCategory}/\${partUrl}\`);
      return imageMap[fallbackCategory][partUrl];
    }
    
    console.warn(\`⚠️ No image found for \${fallbackCategory}/\${partUrl}, using placeholder\`);
    return \`/placeholder.svg?height=\${size}&width=\${size}\`;
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Body (base layer) */}
      <Image
        src={getImageSrc(parts.body, "bodies")}
        alt="Unicorn body"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 1 }}
      />

      {/* Hair */}
      <Image
        src={getImageSrc(parts.hair, "hair")}
        alt="Unicorn hair"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 2 }}
      />

      {/* Eyes */}
      <Image
        src={getImageSrc(parts.eyes, "eyes")}
        alt="Unicorn eyes"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 3 }}
      />

      {/* Mouth */}
      <Image
        src={getImageSrc(parts.mouth, "mouths")}
        alt="Unicorn mouth"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 4 }}
      />

      {/* Accessory (top layer) */}
      <Image
        src={getImageSrc(parts.accessory, "accessories")}
        alt="Unicorn accessory"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 5 }}
      />
    </div>
  );
}`;
  }

  private generateLayoutComponent(options: MobileAppTemplateOptions): string {
    const agentName = escapeJSString(options.agentConfig?.name || options.projectName);
    const agentTheme = options.agentConfig?.theme || 'green';
    const agentDescription = escapeJSString(options.agentConfig?.description || 'Smart agent powered by AI');
    const agentAvatar = options.agentConfig?.avatar;
    
    return `'use client'
import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MobileNav from './MobileNav';
import { CompositeUnicorn } from './CompositeUnicorn';
import Image from 'next/image';
import { themes } from '@/lib/theme';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  agentName?: string;
  theme?: keyof typeof themes;
}

export default function Layout({ 
  children, 
  title = '${agentName}', 
  agentName = '${agentName}', 
  theme = '${agentTheme}' 
}: LayoutProps) {
  const [isMobile, setIsMobile] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use embedded local configuration
  const selectedTheme = theme;
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;
  const displayName = agentName;
  
  // Extract avatar configuration from embedded config
  const avatar = ${JSON.stringify(agentAvatar)};

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render avatar function with proper unicorn and image support
  const renderAvatar = (size = 32) => {
    const containerClass = size === 32 ? 'w-8 h-8' : 'w-10 h-10';
    const iconSize = size === 32 ? 'text-lg' : 'text-xl';
    
    if (!avatar) {
      return (
        <div className={\`\${containerClass} \${currentTheme.bg} border \${currentTheme.border} rounded-lg flex items-center justify-center\`}>
          <span className={\`\${iconSize} \${currentTheme.accent}\`}>🤖</span>
        </div>
      );
    }

    if (avatar.type === 'rom-unicorn' && avatar.unicornParts) {
      console.log('🦄 Rendering unicorn avatar:', { avatar, unicornParts: avatar.unicornParts, size });
      return (
        <div className={\`\${containerClass} \${currentTheme.bg} border \${currentTheme.border} rounded-lg flex items-center justify-center overflow-hidden\`}>
          <CompositeUnicorn parts={avatar.unicornParts} size={size} />
        </div>
      );
    } else if (avatar.type === 'custom' && avatar.customType === 'upload' && avatar.uploadedImage) {
      return (
        <div className={\`\${containerClass} \${currentTheme.bg} border \${currentTheme.border} rounded-lg overflow-hidden\`}>
          <Image
            src={avatar.uploadedImage}
            alt="Agent Avatar"
            width={size}
            height={size}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to theme gradient if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-avatar');
              if (fallback) {
                fallback.classList.remove('hidden');
              }
            }}
          />
          <div className={\`hidden fallback-avatar \${containerClass} \${currentTheme.bg} border \${currentTheme.border} rounded-lg flex items-center justify-center\`}>
            <span className={\`\${iconSize} \${currentTheme.accent}\`}>🤖</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className={\`\${containerClass} \${currentTheme.bg} border \${currentTheme.border} rounded-lg flex items-center justify-center\`}>
          <span className={\`\${iconSize} \${currentTheme.accent}\`}>🤖</span>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Subtle theme gradient overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className={\`absolute inset-0 bg-gradient-to-br \${currentTheme.gradient}\`}></div>
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <header className={\`relative z-40 \${currentTheme.bg} border-b \${currentTheme.border} backdrop-blur-sm bg-opacity-80\`}>
          <div className="px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {renderAvatar(32)}
                <div>
                  <h1 className={\`font-mono font-bold text-lg \${currentTheme.light}\`}>{displayName}</h1>
                  <div className="flex items-center gap-2">
                    <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-pulse\`}></div>
                    <span className={\`font-mono text-xs \${currentTheme.accent}\`}>Live</span>
                  </div>
                </div>
              </div>
              {pathname !== '/' && (
                <button
                  onClick={() => router.push('/')}
                  className={\`w-10 h-10 \${currentTheme.bg} border \${currentTheme.border} rounded-xl flex items-center justify-center \${currentTheme.bgHover} transition-colors duration-200\`}
                >
                  <span className={\`text-lg \${currentTheme.accent}\`}>🏠</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <header className={\`relative z-40 \${currentTheme.bg} border-b \${currentTheme.border} backdrop-blur-sm bg-opacity-80\`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Left side - Agent info */}
              <div className="flex items-center gap-4">
                {renderAvatar(40)}
                <div>
                  <h1 className={\`font-mono font-bold text-lg \${currentTheme.light}\`}>{displayName}</h1>
                  <div className="flex items-center gap-2">
                    <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-pulse\`}></div>
                    <span className={\`font-mono text-xs \${currentTheme.accent}\`}>Live</span>
                  </div>
                </div>
              </div>
              
              {/* Right side - Navigation */}
              <nav className="flex items-center gap-2">
                {[
                  { path: '/', icon: '🏠', label: 'Home' },
                  { path: '/models', icon: '🗃️', label: 'Data' },
                  { path: '/schedules', icon: '⏰', label: 'Tasks' },
                  { path: '/chat', icon: '💬', label: 'Chat' },
                  { path: '/execution-logs', icon: '📊', label: 'Logs' }
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={\`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm transition-all duration-200 \${
                      pathname === item.path
                        ? \`\${currentTheme.bgActive} \${currentTheme.accent} border \${currentTheme.borderActive} scale-105\`
                        : \`\${currentTheme.dim} hover:\${currentTheme.light} hover:\${currentTheme.bgHover} hover:scale-105\`
                    }\`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="relative z-10">
        <div className={\`max-w-6xl mx-auto px-4 \${isMobile ? 'py-4 pb-24' : 'py-6'}\`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav currentTheme={currentTheme} />}
    </div>
  );
}`;
  }

  private generateMobileNavComponent(options: MobileAppTemplateOptions): string {
    return `'use client'
import { useRouter, usePathname } from 'next/navigation';

interface MobileNavProps {
  currentTheme: any;
}

export default function MobileNav({ currentTheme }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: '/models', icon: '🗃️', label: 'Data' },
    { path: '/schedules', icon: '⏰', label: 'Tasks' },
    { path: '/chat', icon: '🤖', label: 'AI Chat' },
    { path: '/execution-logs', icon: '📊', label: 'Logs' }
  ];

  return (
    <div className={\`fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t \${currentTheme?.border || 'border-gray-700'} p-3 z-40 safe-area-pb\`}>
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={\`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 \${
              pathname === item.path
                ? \`\${currentTheme?.bgActive || 'bg-gray-700'} border \${currentTheme?.borderActive || 'border-gray-600'} scale-105\`
                : \`hover:\${currentTheme?.bgHover || 'hover:bg-gray-800'} active:scale-95\`
            }\`}
          >
            <span className={\`text-xl mb-1 \${
              pathname === item.path ? (currentTheme?.accent || 'text-green-400') : (currentTheme?.dim || 'text-gray-400')
            }\`}>{item.icon}</span>
            <span className={\`text-xs font-mono font-medium \${
              pathname === item.path 
                ? (currentTheme?.light || 'text-gray-200')
                : (currentTheme?.dim || 'text-gray-400')
            }\`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}`;
  }

  private generateModelCardComponent(options: MobileAppTemplateOptions): string {
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import { themes } from '@/lib/theme';
import { useRouter } from 'next/navigation';

interface ModelCardProps {
  model: {
    name: string;
    emoji?: string;
    description?: string;
    recordCount?: number;
    error?: boolean;
  };
}

export default function ModelCard({ model }: ModelCardProps) {
  const router = useRouter();
  
  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  const handleClick = () => {
    router.push(\`/models/\${model.name}\`);
  };

  return (
    <div 
      className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4 cursor-pointer \${currentTheme.bgHover} transition-colors\`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{model.emoji || '📋'}</span>
        <div className="flex-1">
          <h3 className={\`font-mono font-semibold text-sm \${currentTheme.light} capitalize\`}>
            {model.title || model.name}
          </h3>
          <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
            {model.description || \`Manage \${model.title || model.name} records\`}
          </p>
        </div>
        <div className="text-right">
          <div className={\`font-mono font-semibold text-sm \${currentTheme.accent}\`}>
            {model.error ? '⚠️' : (model.recordCount || 0)}
          </div>
          <div className={\`font-mono text-xs \${currentTheme.dim}\`}>
            {model.error ? 'Error' : 'records'}
          </div>
        </div>
      </div>
      
      {/* Click indicator */}
      <div className={\`mt-3 pt-3 border-t \${currentTheme.border}\`}>
        <p className={\`font-mono text-xs \${currentTheme.dim} text-center\`}>
          Click to view records →
        </p>
      </div>
    </div>
  );
}`;
  }

  private generateActionCardComponent(options: MobileAppTemplateOptions): string {
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ActionExecutionModal from './ActionExecutionModal';
import { themes } from '@/lib/theme';

interface ActionCardProps {
  action: {
    id: string;
    name: string;
    title?: string;
    emoji?: string;
    description?: string;
    type: string;
    uiComponentsDesign?: any[];
    pseudoSteps?: any[];
  };
}

export default function ActionCard({ action }: ActionCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [lastExecutionTime, setLastExecutionTime] = useState<string | null>(null);
  const router = useRouter();

  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  const handleActionComplete = (result: any) => {
    setLastResult(result);
    setLastExecutionTime(new Date().toLocaleString());
    setShowModal(false);
  };

  // Handle action click - open execution modal for all actions
  const handleActionClick = () => {
    setShowModal(true);
  };



  const getActionTypeDisplay = () => {
    return '⚡ Execute';
  };

  const getActionDescription = () => {
    return action.description || \`Execute \${action.title || action.name}\`;
  };

  return (
    <>
      <div 
        className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-5 cursor-pointer hover:\${currentTheme.bgHover} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]\`}
        onClick={handleActionClick}
      >
        <div className="flex items-start gap-4 mb-4">
                      <div className={\`w-12 h-12 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-xl flex items-center justify-center flex-shrink-0\`}>
              <span className="text-2xl">{action.emoji || '⚡'}</span>
            </div>
          <div className="flex-1 min-w-0">
            <h3 className={\`font-mono text-lg font-bold \${currentTheme.light} mb-1\`}>
              {action.title || action.name}
            </h3>
            <p className={\`font-mono text-sm \${currentTheme.dim} mb-2\`}>
              {getActionDescription()}
            </p>
            <div className="flex items-center gap-4">
              <span className={\`font-mono text-xs px-3 py-1.5 rounded-full \${currentTheme.bgActive} border \${currentTheme.borderActive} \${currentTheme.accent}\`}>
                ✅ Ready
              </span>
              {lastExecutionTime && (
                <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
                  Last: {lastExecutionTime.split(' ')[1]?.substring(0, 5)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick status indicator */}
        {lastResult && (
          <div className={\`flex items-center gap-2 text-xs font-mono mb-3 p-2 rounded-lg \${
            lastResult.success ? \`\${currentTheme.bgActive} border \${currentTheme.borderActive}\` : 'bg-red-500/20 border border-red-400/30'
          }\`}>
            <div className={\`w-2 h-2 rounded-full \${
              lastResult.success ? currentTheme.accent.replace('text-', 'bg-') : 'bg-red-400'
            }\`} />
            <span className={\`\${lastResult.success ? currentTheme.accent : 'text-red-300'}\`}>
              {lastResult.success ? 'Last execution successful' : 'Last execution failed'}
            </span>
          </div>
        )}

        {/* Click indicator */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <span className={\`font-mono text-xs \${currentTheme.dim}\`}>
            Type: {action.type || 'Business Process'}
          </span>
          <span className={\`font-mono text-sm \${currentTheme.dim} flex items-center gap-1\`}>
            <span>Tap to execute</span>
            <span className={\`\${currentTheme.accent}\`}>⚡</span>
          </span>
        </div>
      </div>

      {/* Execution modal for all actions */}
      {showModal && (
        <ActionExecutionModal
          action={action}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onComplete={handleActionComplete}
          theme={selectedTheme}
        />
      )}
    </>
  );
}`;
  }

  private generateScheduleCardComponent(options: MobileAppTemplateOptions): string {
    const agentTheme = options.agentConfig?.theme || 'green';
    
    return `'use client'
import { themes } from '@/lib/theme';

interface ScheduleCardProps {
  schedule: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    pattern: string;
    active: boolean;
    nextRun?: string;
  };
}

export default function ScheduleCard({ schedule }: ScheduleCardProps) {
  // Use embedded local configuration
  const selectedTheme = '${agentTheme}';
  const currentTheme = themes[selectedTheme as keyof typeof themes] || themes.green;

  return (
    <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-xl p-4\`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{schedule.emoji || '⏰'}</span>
        <div className="flex-1">
          <h3 className={\`font-mono font-semibold text-sm \${currentTheme.light}\`}>
            {schedule.title || schedule.name}
          </h3>
          <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
            {schedule.description || \`Scheduled: \${schedule.pattern}\`}
          </p>
        </div>
        <div className={\`px-2 py-1 rounded-lg border \${
          schedule.active 
            ? \`\${currentTheme.bgActive} \${currentTheme.borderActive} \${currentTheme.accent}\`
            : 'bg-gray-500/25 border-gray-400/50 text-gray-400'
        }\`}>
          <span className="font-mono text-xs">
            {schedule.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className={\`font-mono text-xs \${currentTheme.dim}\`}>
        Pattern: <span className={\`\${currentTheme.light}\`}>{schedule.pattern}</span>
      </div>
      {schedule.steps && schedule.steps.length > 0 && (
        <div className={\`font-mono text-xs \${currentTheme.dim} mt-1\`}>
          Steps: <span className={\`\${currentTheme.light}\`}>{schedule.steps.length} actions</span>
        </div>
      )}
      {schedule.nextRun && (
        <div className={\`font-mono text-xs \${currentTheme.dim} mt-1\`}>
          Next: <span className={\`\${currentTheme.light}\`}>{schedule.nextRun}</span>
        </div>
      )}
    </div>
  );
}`;
  }

  private generateChatMessageComponent(): string {
    return `'use client'
import { memo, useState } from 'react';
import { CompositeUnicorn } from './CompositeUnicorn';
import ExecutionTracker from './ExecutionTracker';
import ActionExecutionModal from './ActionExecutionModal';
import Image from 'next/image';
import { themes } from '@/lib/theme';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  toolInvocations?: any[];
}

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  theme?: keyof typeof themes;
  avatar?: {
    type: 'rom-unicorn' | 'custom';
    unicornParts?: any;
    customType?: 'upload' | 'wallet';
    uploadedImage?: string;
    selectedNFT?: string;
  };
  availableActions?: any[];
  onActionExecute?: (actionName: string) => void;
}

const ChatMessage = memo(({ 
  message, 
  isTyping = false, 
  theme = 'green', 
  avatar,
  availableActions = [],
  onActionExecute
}: ChatMessageProps) => {
  const isUser = message.type === 'user';
  const currentTheme = themes[theme] || themes.green;
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const formatContent = (content: string) => {
    // Enhanced markdown-like formatting with action button detection
    let formattedContent = content
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>') // Bold
      .replace(/\\*(.*?)\\*/g, '<em>$1</em>') // Italic
      .replace(/\`(.*?)\`/g, \`<code class="\${currentTheme.bg} px-1 rounded \${currentTheme.light}">$1</code>\`) // Inline code
      .replace(/\\n/g, '<br>'); // Line breaks

    // Look for action names in the content and convert them to clickable buttons
    availableActions.forEach(action => {
      const actionNameRegex = new RegExp(\`\\\\b\${action.name}\\\\b\`, 'gi');
      if (formattedContent.match(actionNameRegex)) {
        formattedContent = formattedContent.replace(
          actionNameRegex,
          \`<button 
            onclick="window.executeActionFromChat && window.executeActionFromChat('\${action.name}')"
            class="inline-flex items-center gap-1 px-2 py-1 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors cursor-pointer"
            title="Click to execute \${action.title || action.name}"
          >
            <span>\${action.emoji || '⚡'}</span>
            <span>\${action.title || action.name}</span>
          </button>\`
        );
      }
    });

    return formattedContent;
  };

  const toggleToolExpansion = (toolId: string) => {
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId);
    } else {
      newExpanded.add(toolId);
    }
    setExpandedTools(newExpanded);
  };

  // Handle action execution from inline buttons
  const executeAction = (actionName: string) => {
    const action = availableActions.find(a => a.name === actionName);
    if (action) {
      setSelectedAction(action);
      setShowActionModal(true);
    } else if (onActionExecute) {
      onActionExecute(actionName);
    } else {
      console.error('Action not found:', actionName);
    }
  };

  const handleChatActionComplete = (result: any) => {
    setShowActionModal(false);
    setSelectedAction(null);
    console.log('Action completed from chat:', result);
  };



  // Make action execution available globally for inline buttons
  if (typeof window !== 'undefined') {
    (window as any).executeActionFromChat = executeAction;
  }

  if (isTyping) {
    return (
      <div className="flex justify-start">
        <div className={\`max-w-xs p-3 rounded-lg \${currentTheme.bg} border \${currentTheme.border}\`}>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`}></div>
              <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`} style={{animationDelay: '0.1s'}}></div>
              <div className={\`w-2 h-2 bg-\${currentTheme.primary}-400 rounded-full animate-bounce\`} style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className={\`text-xs font-mono \${currentTheme.dim} ml-2\`}>AI is typing...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={\`flex \${isUser ? 'justify-end' : 'justify-start'} mb-3\`}>
        <div className={\`flex \${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[85%]\`}>
          {!isUser && (
            <div className="flex-shrink-0">
              <div className={\`w-6 h-6 \${currentTheme.bg} border \${currentTheme.border} rounded-lg flex items-center justify-center overflow-hidden\`}>
                {avatar?.type === 'rom-unicorn' && avatar.unicornParts ? (
                  <CompositeUnicorn parts={avatar.unicornParts} size={24} />
                ) : avatar?.type === 'custom' && avatar.customType === 'upload' && avatar.uploadedImage ? (
                  <Image
                    src={avatar.uploadedImage}
                    alt="Agent Avatar"
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs">🤖</span>
                )}
              </div>
            </div>
          )}
          <div className={\`px-4 py-3 rounded-2xl font-mono text-sm leading-relaxed shadow-sm \${
            isUser 
              ? \`\${currentTheme.bgActive} border \${currentTheme.borderActive} \${currentTheme.light} rounded-br-md\` 
              : \`\${currentTheme.bg} border \${currentTheme.border} \${currentTheme.light} rounded-bl-md\`
          }\`}>
            <div className="mb-1">
              <div 
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
              />
            </div>
            
            {/* Tool Invocations */}
            {!isUser && message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.toolInvocations.map((tool, index) => {
                  const toolId = \`\${message.id}-tool-\${index}\`;
                  const isExpanded = expandedTools.has(toolId);
                  
                  if (tool.toolName === 'executeAction') {
                    const result = tool.result;
                    const executionId = result?.executionId;
                    
                    return (
                      <div key={index} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-3\`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚡</span>
                            <span className={\`font-medium \${currentTheme.light}\`}>
                              Action: {tool.args?.actionName}
                            </span>
                            <span className={\`px-2 py-1 rounded text-xs \${
                              result?.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }\`}>
                              {result?.success ? '✅ Success' : '❌ Failed'}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleToolExpansion(toolId)}
                            className={\`text-xs \${currentTheme.accent} hover:\${currentTheme.light}\`}
                          >
                            {isExpanded ? '▼ Hide' : '▶ Details'}
                          </button>
                        </div>
                        
                        {executionId && (
                          <div className="mb-2">
                            <div className={\`text-xs \${currentTheme.dim} mb-1\`}>Execution Tracking:</div>
                            <ExecutionTracker
                              executionId={executionId}
                              title={tool.args?.actionName}
                              compact={true}
                              showSteps={isExpanded}
                              theme={theme}
                            />
                          </div>
                        )}
                        
                        {isExpanded && (
                          <div className="space-y-2 text-xs">
                            <div>
                              <div className={\`\${currentTheme.dim} mb-1\`}>Parameters:</div>
                              <pre className={\`\${currentTheme.bg} p-2 rounded overflow-x-auto \${currentTheme.light}\`}>
                                {JSON.stringify(tool.args?.parameters, null, 2)}
                              </pre>
                            </div>
                            {result?.result && (
                              <div>
                                <div className={\`\${currentTheme.dim} mb-1\`}>Result:</div>
                                <pre className={\`\${currentTheme.bg} p-2 rounded overflow-x-auto \${currentTheme.light}\`}>
                                  {JSON.stringify(result.result, null, 2)}
                                </pre>
                              </div>
                            )}
                            {result?.error && (
                              <div>
                                <div className="text-red-400 mb-1">Error:</div>
                                <div className="bg-red-500/20 border border-red-400/50 p-2 rounded text-red-400">
                                  {result.error}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  } else if (tool.toolName === 'getActionInfo') {
                    const result = tool.result;
                    
                    return (
                      <div key={index} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-3\`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">ℹ️</span>
                          <span className={\`font-medium \${currentTheme.light}\`}>
                            Action Info: {tool.args?.actionName || 'All Actions'}
                          </span>
                        </div>
                        
                        {result?.success && result.action && (
                          <div className="space-y-2 text-xs">
                            <div>
                              <div className={\`\${currentTheme.dim}\`}>Description:</div>
                              <div className={\`\${currentTheme.light}\`}>{result.action.description}</div>
                            </div>
                            {result.action.parameters && result.action.parameters.length > 0 && (
                              <div>
                                <div className={\`\${currentTheme.dim}\`}>Required Parameters:</div>
                                <div className="space-y-1 mt-1">
                                  {result.action.parameters.map((param, idx) => (
                                    <div key={idx} className={\`\${currentTheme.bg} p-2 rounded\`}>
                                      <span className={\`font-medium \${currentTheme.light}\`}>{param.name}</span>
                                      <span className={\`text-xs \${currentTheme.dim} ml-2\`}>
                                        ({param.type}{param.required ? ', required' : ', optional'})
                                      </span>
                                      {param.description && (
                                        <div className={\`text-xs \${currentTheme.dim} mt-1\`}>{param.description}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Add execute button for the action */}
                            <div className="mt-3">
                              <button
                                onClick={() => executeAction(tool.args?.actionName)}
                                className={\`px-3 py-1.5 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg font-mono text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors\`}
                              >
                                ⚡ Execute {result.action.title || result.action.name}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {result?.success && result.actions && (
                          <div className="space-y-1 text-xs">
                            <div className={\`\${currentTheme.dim}\`}>Available Actions:</div>
                            {result.actions.map((action, idx) => (
                              <div key={idx} className={\`\${currentTheme.bg} p-2 rounded flex justify-between items-center\`}>
                                <div className="flex items-center gap-2">
                                  <span className={\`\${currentTheme.light}\`}>{action.name}</span>
                                  <span className={\`\${currentTheme.dim}\`}>({action.parameterCount} params)</span>
                                </div>
                                <button
                                  onClick={() => executeAction(action.name)}
                                  className={\`px-2 py-1 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded text-xs \${currentTheme.accent} hover:\${currentTheme.bgHover} transition-colors\`}
                                >
                                  ⚡ Run
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  } else if (tool.toolName === 'getExecutionStatus') {
                    const result = tool.result;
                    
                    return (
                      <div key={index} className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-3\`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">📊</span>
                          <span className={\`font-medium \${currentTheme.light}\`}>
                            Execution Status
                          </span>
                        </div>
                        
                        {result?.success && result.execution && (
                          <ExecutionTracker
                            executionId={result.execution.executionId}
                            title={result.execution.actionName}
                            compact={true}
                            showSteps={true}
                            theme={theme}
                          />
                        )}
                        
                        {result?.error && (
                          <div className="text-red-400 text-xs">
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            )}
            
            <div className={\`text-xs \${currentTheme.dim} text-right mt-1\`}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Execution Modal */}
      {showActionModal && selectedAction && (
        <ActionExecutionModal
          action={selectedAction}
          isOpen={showActionModal}
          onClose={() => setShowActionModal(false)}
          onComplete={handleChatActionComplete}
          theme={theme}
        />
      )}
         </>
   );
 });

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;`;
  }

  private generateLoadingSpinnerComponent(): string {
    return `'use client'
import { themes } from '@/lib/theme';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: keyof typeof themes;
}

export default function LoadingSpinner({ size = 'md', theme = 'green' }: LoadingSpinnerProps) {
  const currentTheme = themes[theme] || themes.green;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={\`\${sizeClasses[size]} border-2 border-\${currentTheme.primary}-400 border-t-transparent rounded-full animate-spin\`}
      ></div>
    </div>
  );
}`;
  }

  private generateExecutionTracker(): string {
    return `'use client'
import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { themes } from '@/lib/theme';

interface ExecutionTrackerProps {
  executionId: string;
  title?: string;
  compact?: boolean;
  showSteps?: boolean;
  theme?: keyof typeof themes;
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

interface ActionExecutionLog {
  executionId: string;
  actionName: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  steps: ActionStepLog[];
  error?: string;
  totalExecutionTime?: number;
}

export default function ExecutionTracker({
  executionId,
  title = 'Action Execution',
  compact = false,
  showSteps = true,
  theme = 'green'
}: ExecutionTrackerProps) {
  const [execution, setExecution] = useState<ActionExecutionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentTheme = themes[theme] || themes.green;

  // Fetch execution data
  useEffect(() => {
    const fetchExecution = async () => {
      try {
        setError(null);
        const response = await fetch(\`/api/execution-logs/\${executionId}\`);
        const result = await response.json();
        
        if (result.success) {
          setExecution(result.data);
        } else {
          setError(result.error || 'Failed to fetch execution');
        }
      } catch (err) {
        console.error('Failed to fetch execution:', err);
        setError('Failed to fetch execution');
      } finally {
        setLoading(false);
      }
    };

    fetchExecution();
    
    // Auto-refresh every 2 seconds while execution is running
    const intervalId = setInterval(fetchExecution, 2000);
    
    return () => clearInterval(intervalId);
  }, [executionId]);

  // Stop auto-refresh when execution is complete
  useEffect(() => {
    if (execution && (execution.status === 'completed' || execution.status === 'failed')) {
      // Final fetch after 1 second to ensure we get the final state
      setTimeout(() => {
        fetch(\`/api/execution-logs/\${executionId}\`)
          .then(response => response.json())
          .then(result => {
            if (result.success) {
              setExecution(result.data);
            }
          })
          .catch(console.error);
      }, 1000);
    }
  }, [execution?.status, executionId]);

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

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return \`\${ms}ms\`;
    if (ms < 60000) return \`\${(ms / 1000).toFixed(1)}s\`;
    return \`\${(ms / 60000).toFixed(1)}m\`;
  };

  if (loading) {
    return (
      <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-4\`}>
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" theme={theme} />
          <span className={\`ml-2 text-sm font-mono \${currentTheme.light}\`}>Loading execution...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={\`\${currentTheme.bg} border border-red-400/50 rounded-lg p-4\`}>
        <div className="flex items-center justify-center py-4 text-red-400">
          <span className="text-sm font-mono">❌ {error}</span>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-4\`}>
        <div className="flex items-center justify-center py-4">
          <span className={\`text-sm font-mono \${currentTheme.dim}\`}>⚠️ Execution not found</span>
        </div>
      </div>
    );
  }

  const status = getStatusDisplay(execution.status);
  const totalSteps = execution.steps.length;
  const completedSteps = execution.steps.filter(step => step.endTime).length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-4 space-y-4\`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{status.icon}</span>
          <span className={\`font-mono font-medium \${currentTheme.light}\`}>{title}</span>
        </div>
        <div className={\`px-2 py-1 rounded text-xs font-mono \${status.color} \${currentTheme.bg} border \${currentTheme.border}\`}>
          {status.text}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-mono">
          <span className={\`\${currentTheme.light}\`}>Progress</span>
          <span className={\`\${currentTheme.dim}\`}>{completedSteps}/{totalSteps} steps</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={\`\${currentTheme.bgActive} h-2 rounded-full transition-all duration-300\`}
            style={{ width: \`\${progress}%\` }}
          ></div>
        </div>
      </div>

      {/* Timing */}
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">⏱️</span>
          <span className={\`\${currentTheme.dim}\`}>
            {execution.totalExecutionTime ? 
              formatDuration(execution.totalExecutionTime) : 
              execution.endTime ? 
                formatDuration(new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) :
                formatDuration(Date.now() - new Date(execution.startTime).getTime())
            }
          </span>
        </div>
        <div className="text-right">
          <span className={\`\${currentTheme.dim}\`}>
            {new Date(execution.startTime).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {execution.error && (
        <div className="p-2 bg-red-900/20 border border-red-400/50 rounded text-xs text-red-400 font-mono">
          <strong>Error:</strong> {execution.error}
        </div>
      )}

      {/* Steps */}
      {showSteps && execution.steps.length > 0 && (
        <div>
          <div className={\`text-xs font-medium \${currentTheme.light} font-mono mb-2\`}>
            Execution Steps
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {execution.steps.map((step) => {
              const stepCompleted = !!step.endTime;
              const stepFailed = !!step.error;
              
              return (
                <div
                  key={step.stepNumber}
                  className={\`flex items-center gap-2 p-2 rounded text-xs font-mono \${
                    stepFailed ? 'bg-red-900/20 border border-red-400/50' :
                    stepCompleted ? 'bg-green-900/20 border border-green-400/50' :
                    'bg-blue-900/20 border border-blue-400/50'
                  }\`}
                >
                  <span className="flex-shrink-0">
                    {stepFailed ? '❌' : stepCompleted ? '✅' : '🔄'}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className={\`font-medium truncate \${
                      stepFailed ? 'text-red-400' :
                      stepCompleted ? 'text-green-400' :
                      'text-blue-400'
                    }\`}>
                      Step {step.stepNumber}: {step.stepName}
                    </div>
                    {stepCompleted && step.executionTime && (
                      <div className="text-gray-500 text-xs">
                        {formatDuration(step.executionTime)}
                      </div>
                    )}
                    {stepFailed && step.error && (
                      <div className="text-red-400 mt-1 text-xs">
                        {step.error}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}`;
  }

  private generateClientProviders(): string {
    return `'use client'
import { AgentProvider } from '@/contexts/AgentContext'

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AgentProvider>
      {children}
    </AgentProvider>
  );
}`;
  }

  private generateActionExecutionModal(): string {
    return `'use client'
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import ExecutionTracker from './ExecutionTracker';
import { themes } from '@/lib/theme';

interface ActionExecutionModalProps {
  action: {
    id: string;
    name: string;
    emoji?: string;
    description?: string;
    type: string;
    uiComponentsDesign?: any[];
    pseudoSteps?: any[];
  };
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: any) => void;
  theme?: keyof typeof themes;
}

export default function ActionExecutionModal({ action, isOpen, onClose, onComplete, theme = 'green' }: ActionExecutionModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [inputParameters, setInputParameters] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'executing' | 'result'>('input');
  const [databaseOptions, setDatabaseOptions] = useState<Record<string, any[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [showExecutionTracker, setShowExecutionTracker] = useState(false);
  
  const currentTheme = themes[theme] || themes.green;

  // Generate mock UI components if none provided
  const uiComponents = action.uiComponentsDesign || [
    {
      name: 'input',
      type: 'text',
      label: 'Input Data',
      placeholder: 'Enter input for ' + action.name,
      required: false,
      defaultValue: ''
    }
  ];

  // Initialize input parameters with default values and load database options
  useEffect(() => {
    const defaultInputs: Record<string, any> = {};
    const dbFieldsToLoad: string[] = [];
    
    uiComponents.forEach(component => {
      // Check if this is a database relation field
      if (component.databaseModel && component.type === 'select') {
        dbFieldsToLoad.push(component.name);
        defaultInputs[component.name] = '';
      } else if (component.defaultValue !== undefined) {
        defaultInputs[component.name] = component.defaultValue;
      } else if (component.type === 'checkbox') {
        defaultInputs[component.name] = false;
      } else if (component.type === 'select' && component.options && component.options.length > 0) {
        defaultInputs[component.name] = component.options[0].value;
      } else {
        defaultInputs[component.name] = '';
      }
    });
    
    setInputParameters(defaultInputs);
    
    // Load database options for relation fields
    dbFieldsToLoad.forEach(fieldName => {
      loadDatabaseOptions(fieldName);
    });
  }, [action.name]);

  // Function to load database records for dropdown options
  const loadDatabaseOptions = async (fieldName: string) => {
    const component = uiComponents.find(c => c.name === fieldName);
    if (!component || !component.databaseModel) return;
    
    const modelName = component.databaseModel;
    setLoadingOptions(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      console.log(\`🔄 Loading \${modelName} records for \${fieldName} dropdown...\`);
      
      // Fetch records from the model API endpoint
      const response = await fetch(\`/api/models/\${modelName}\`);
      if (!response.ok) {
        throw new Error(\`Failed to fetch \${modelName} records: \${response.status}\`);
      }
      
      const data = await response.json();
      const records = data.success ? (data.data || []) : [];
      
      console.log(\`✅ Loaded \${records.length} \${modelName} records for \${fieldName}\`);
      
      // Convert records to dropdown options
      const options = records.map((record: any) => ({
        value: record.id,
        label: record.name || record.title || record.campaignName || record.id
      }));
      
      setDatabaseOptions(prev => ({ ...prev, [fieldName]: options }));
    } catch (error) {
      console.error(\`❌ Failed to load \${modelName} records for \${fieldName}:\`, error);
      setDatabaseOptions(prev => ({ ...prev, [fieldName]: [] }));
    } finally {
      setLoadingOptions(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const validateRequiredFields = () => {
    const errors: string[] = [];
    
    uiComponents.forEach(component => {
      if (component.required) {
        const value = inputParameters[component.name];
        if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
          errors.push(\`\${component.label || component.name} is required\`);
        }
      }
    });
    
    return errors;
  };

  const executeModalAction = async () => {
    // Validate required fields before execution
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      const errorResult = {
        success: false,
        error: 'Please fill in all required fields: ' + validationErrors.join(', '),
        validationErrors
      };
      setResult(errorResult);
      setStep('result');
      onComplete(errorResult);
      return;
    }

    setIsExecuting(true);
    setStep('executing');
    setResult(null);
    
    // Show execution tracker
    setShowExecutionTracker(true);

    try {
      // Execute action locally using embedded action endpoint with Redis logging
      const actionResult = await api.executeActionWithTracking(action.name, inputParameters);
      
      // Set execution ID for tracking
      if (actionResult.executionId) {
        setExecutionId(actionResult.executionId);
      }

      setResult(actionResult);
      
      // Don't immediately go to result step - let user see execution tracker
      setTimeout(() => {
        setStep('result');
        onComplete(actionResult);
      }, 3000); // Wait 3 seconds to show execution steps
      
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executedLocally: true
      };
      setResult(errorResult);
      setStep('result');
      onComplete(errorResult);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInputChange = (componentName: string, value: any) => {
    setInputParameters(prev => ({
      ...prev,
      [componentName]: value
    }));
  };

  const renderInputComponent = (component: any) => {
    const value = inputParameters[component.name] || '';

    // Determine if field has validation errors
    const hasError = component.required && (!value || value === '');
    const borderClass = hasError ? 'border-red-400/50' : currentTheme.border;
    const focusBorderClass = hasError ? 'focus:border-red-400/70' : \`focus:\${currentTheme.borderActive}\`;

    switch (component.type) {
      case 'select':
        // Use database options if available, otherwise use static options
        const isLoadingDbOptions = loadingOptions[component.name];
        const dbOptions = databaseOptions[component.name];
        const finalOptions = dbOptions || component.options || [];
        
        return (
          <div>
            <select
              value={value}
              onChange={(e) => handleInputChange(component.name, e.target.value)}
              disabled={isLoadingDbOptions}
              className={\`w-full p-3 \${currentTheme.bg} border \${borderClass} rounded-lg \${currentTheme.light} font-mono text-sm focus:outline-none \${focusBorderClass} \${isLoadingDbOptions ? 'opacity-50 cursor-not-allowed' : ''}\`}
            >
              <option value="" className="bg-gray-800">
                {isLoadingDbOptions ? \`Loading \${component.databaseModel || component.label}...\` : (component.placeholder || \`Select \${component.label}\`)}
              </option>
              {finalOptions.map((option: any, idx: number) => (
                <option key={idx} value={option.value} className="bg-gray-800">
                  {option.label || option.value}
                </option>
              ))}
            </select>
            {isLoadingDbOptions && (
              <div className="flex items-center gap-2 mt-1">
                <div className={\`w-3 h-3 border-2 border-\${currentTheme.primary}-400 border-t-transparent rounded-full animate-spin\`}></div>
                <span className={\`text-xs font-mono \${currentTheme.dim}\`}>
                  Loading {component.databaseModel} records...
                </span>
              </div>
            )}
            {dbOptions && dbOptions.length === 0 && !isLoadingDbOptions && component.databaseModel && (
              <div className="mt-1 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded">
                <span className="text-yellow-400 text-xs font-mono">
                  No {component.databaseModel} records found. Create some records first.
                </span>
              </div>
            )}
          </div>
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleInputChange(component.name, e.target.checked)}
              className={\`w-4 h-4 rounded \${currentTheme.border} \${currentTheme.bg} \${currentTheme.accent} focus:ring-\${currentTheme.primary}-400/50\`}
            />
            <span className={\`font-mono text-sm \${currentTheme.light}\`}>
              {component.label}
            </span>
          </label>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            rows={4}
            className={\`w-full p-3 \${currentTheme.bg} border \${borderClass} rounded-lg \${currentTheme.light} font-mono text-sm focus:outline-none \${focusBorderClass} resize-none\`}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const numValue = e.target.value;
              // Keep as string to preserve user input, but validate it's a valid number
              handleInputChange(component.name, numValue);
            }}
            placeholder={component.placeholder}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'datetime':
      case 'datetime-local':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(component.name, e.target.value)}
            placeholder={component.placeholder}
            className={\`w-full p-3 bg-green-500/10 border \${borderClass} rounded-lg text-green-200 font-mono text-sm focus:outline-none \${focusBorderClass}\`}
          />
        );
    }
  };

  const formatResult = (result: any) => {
    if (!result) return 'No result';
    
    if (result.success) {
      return {
        status: 'Success',
        message: result.message || 'Action executed successfully',
        data: result.data || result,
        executionTime: result.executionTime || 'N/A',
        mode: 'Local Execution'
      };
    } else {
      return {
        status: 'Error',
        message: result.error || 'Action failed',
        details: result.details || 'No additional details',
        mode: 'Local Execution'
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={\`bg-gray-900 border \${currentTheme.border} rounded-xl w-full max-w-lg max-h-[80vh] mb-16 overflow-hidden flex flex-col shadow-2xl\`}>
        {/* Header */}
        <div className={\`p-4 border-b \${currentTheme.border}\`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{action.emoji || '⚡'}</span>
              <div>
                <h2 className={\`font-mono font-bold \${currentTheme.light}\`}>{action.title || action.name}</h2>
                <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
                  {action.description || \`Execute \${action.title || action.name}\`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExecuting}
              className={\`w-10 h-10 \${currentTheme.bg} border \${currentTheme.border} rounded-xl flex items-center justify-center hover:\${currentTheme.bgHover} transition-colors disabled:opacity-50\`}
            >
              <span className={\`\${currentTheme.accent} font-mono text-xl\`}>×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'input' && (
            <div className="space-y-4">
              {/* Execution Info */}
              <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-3\`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={\`\${currentTheme.accent}\`}>🏠</span>
                  <span className={\`font-mono text-sm \${currentTheme.light}\`}>Local Execution</span>
                </div>
                <p className={\`font-mono text-xs \${currentTheme.dim}\`}>
                  This action will run locally on this sub-agent with embedded code and your database.
                </p>
              </div>

              {/* Input Parameters */}
              <div>
                <label className="block font-mono text-sm text-green-300 mb-3">
                  Input Parameters
                </label>
                <div className="space-y-3">
                  {uiComponents.map((component, idx) => {
                    const hasError = component.required && (!inputParameters[component.name] || inputParameters[component.name] === '');
                    return (
                      <div key={idx}>
                        <label className="block font-mono text-xs text-green-300/70 mb-1">
                          {component.label || component.name}
                          {component.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {renderInputComponent(component)}
                        {hasError && (
                          <p className="mt-1 text-xs font-mono text-red-400">
                            This field is required
                          </p>
                        )}
                        {component.description && (
                          <p className="mt-1 text-xs font-mono text-green-300/50">
                            {component.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 'executing' && (
            <div className="space-y-4">
              {showExecutionTracker && executionId ? (
                <div>
                  <div className="text-center mb-4">
                    <p className={\`font-mono text-sm \${currentTheme.light}\`}>
                      🚀 Executing {action.title || action.name}
                    </p>
                    <p className={\`font-mono text-xs \${currentTheme.dim} mt-1\`}>
                      Execution ID: {executionId}
                    </p>
                  </div>
                  <ExecutionTracker
                    executionId={executionId}
                    title={action.title || action.name}
                    compact={true}
                    showSteps={true}
                    theme={theme}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" theme={theme} />
                  <p className={\`font-mono text-sm \${currentTheme.light} mt-4\`}>
                    Initializing execution...
                  </p>
                  <p className={\`font-mono text-xs \${currentTheme.dim} mt-1\`}>
                    Setting up Redis tracking
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={\`text-4xl mb-2 \${result.success ? '🟢' : '🔴'}\`}>
                  {result.success ? '✅' : '❌'}
                </div>
                <h3 className={\`font-mono text-lg \${currentTheme.light} mb-1\`}>
                  {result.success ? 'Success!' : 'Failed'}
                </h3>
              </div>

              <div className={\`\${currentTheme.bg} border \${currentTheme.border} rounded-lg p-4\`}>
                <div className="space-y-3 font-mono text-sm">
                  {Object.entries(formatResult(result)).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-3">
                      <span className={\`\${currentTheme.dim} capitalize\`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className={\`\${currentTheme.light} text-right flex-1\`}>
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={\`p-4 border-t \${currentTheme.border}\`}>
          {step === 'input' && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={\`flex-1 p-3 border \${currentTheme.border} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} transition-colors\`}
              >
                Cancel
              </button>
              <button
                onClick={executeModalAction}
                disabled={isExecuting || validateRequiredFields().length > 0}
                className={\`flex-1 p-3 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} disabled:opacity-50 transition-colors\`}
              >
                {validateRequiredFields().length > 0 ? 'Fill Required Fields' : 'Execute Action'}
              </button>
            </div>
          )}

          {step === 'result' && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('input');
                  setResult(null);
                }}
                className={\`flex-1 p-3 border \${currentTheme.border} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} transition-colors\`}
              >
                Run Again
              </button>
              <button
                onClick={onClose}
                className={\`flex-1 p-3 \${currentTheme.bgActive} border \${currentTheme.borderActive} rounded-lg font-mono text-sm \${currentTheme.light} hover:\${currentTheme.bgHover} transition-colors\`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;
  }
} 