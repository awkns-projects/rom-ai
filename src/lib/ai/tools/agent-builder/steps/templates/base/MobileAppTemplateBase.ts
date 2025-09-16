import type { AgentAction, AgentSchedule } from '../../../types';

// Helper function to normalize schedule structure (handles both old and new formats)
export function normalizeSchedule(schedule: any) {
  // Handle both old (interval) and new (trigger) format
  const pattern = schedule.trigger?.pattern || schedule.interval?.pattern || '0 0 * * *';
  const active = schedule.trigger?.active ?? schedule.interval?.active ?? false;
  
  return {
    ...schedule,
    normalizedPattern: pattern,
    normalizedActive: active
  };
}

// Helper function to escape strings for safe JavaScript generation
export function escapeJSString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "\\'")    // Escape single quotes
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t');  // Escape tabs
}

export interface MobileAppTemplateOptions {
  projectName: string;
  models: any[];
  actions: AgentAction[];
  schedules: AgentSchedule[];
  prismaSchema: string; // Required - Complete Prisma schema from database generation step
  enums: any[]; // Required - Enums array from database generation step
  neonOptions?: { region?: string; pgVersion?: number; autoSuspend?: boolean; };
  
  // Local client app configuration
  agentConfig?: {
    name?: string;
    description?: string;
    theme?: string;
    avatar?: any;
    domain?: string;
    personality?: string;
    characterNames?: string;
  };
  
  // Vercel deployment configuration
  vercelConfig?: {
    team?: string;
    buildCommand?: string;
    cronJobs?: boolean;
    aiSdkEnabled?: boolean;
    discoveredPackages?: Array<{
      name: string;
      version: string;
      description: string;
      useCase: string;
    }>;
  };
  environmentVariables?: Record<string, string>;
}

export interface TemplateGenerator {
  generate(options: MobileAppTemplateOptions): Record<string, string>;
}

/**
 * Base Mobile App Template Class
 * Coordinates all template generators to create a complete mobile app
 */
export class MobileAppTemplateBase {
  protected options: MobileAppTemplateOptions;

  constructor(options: MobileAppTemplateOptions) {
    this.options = options;
  }

  /**
   * Generate all files for the mobile app by coordinating template chunks
   */
  generateAllFiles(): Record<string, string> {
    const files: Record<string, string> = {};

    // Import and use template generators dynamically
    // This will be implemented as we create the individual generators
    
    return files;
  }

  protected getSanitizedProjectName(): string {
    return this.options.projectName.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
  }

  protected getAgentName(): string {
    return this.options.agentConfig?.name || this.options.projectName;
  }

  protected getAgentTheme(): string {
    return this.options.agentConfig?.theme || 'green';
  }

  protected getAgentDescription(): string {
    return this.options.agentConfig?.description || 'Smart agent powered by AI';
  }
} 