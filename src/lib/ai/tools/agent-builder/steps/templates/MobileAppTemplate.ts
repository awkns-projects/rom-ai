import { MobileAppTemplateBase, MobileAppTemplateOptions } from './base/MobileAppTemplateBase';
import { ConfigGenerator } from './generators/ConfigGenerator';
import { PageGenerator } from './generators/PageGenerator';
import { ComponentGenerator } from './generators/ComponentGenerator';
import { ApiGenerator } from './generators/ApiGenerator';
import { UtilityGenerator } from './generators/UtilityGenerator';

/**
 * Unified Mobile App Template Generator
 * Consolidates all file generation into one cohesive system using modular generators
 * 
 * 🚀 FULLY LOCAL ARCHITECTURE:
 * 1. All Configuration Embedded: name, description, theme, avatar, models, actions, schedules
 * 2. Static Action Execution: /api/actions/[actionName] - embedded action code, executes locally
 * 3. Static Cron Jobs: /api/cron/[scheduleName] - embedded schedule code with cron timing
 * 4. Direct Model CRUD: /api/models/[modelName] + /api/models/[modelName]/[id] - PostgreSQL operations via Prisma
 * 5. Self-managed API Keys: Client manages its own OpenAI/Anthropic/Grok keys
 * 6. Interactive Action UI: Modal-based action execution with input parameters and results display
 * 7. Persistent Database: PostgreSQL with provided Prisma schema
 * 
 * Benefits: 
 * - Complete independence - no external dependencies
 * - Fast performance with all data embedded locally
 * - Persistent database with no resets
 * - Embedded action and schedule code
 * - Self-managed API keys and configuration
 * - Direct database operations for optimal performance
 * - Full CRUD operations with pagination and search
 * - Scalable PostgreSQL database
 * - Production-ready deployment
 */
export class MobileAppTemplate extends MobileAppTemplateBase {
  private configGenerator: ConfigGenerator;
  private pageGenerator: PageGenerator;
  private componentGenerator: ComponentGenerator;
  private apiGenerator: ApiGenerator;
  private utilityGenerator: UtilityGenerator;

  constructor(options: MobileAppTemplateOptions) {
    super(options);
    
    // Initialize all generators
    this.configGenerator = new ConfigGenerator();
    this.pageGenerator = new PageGenerator();
    this.componentGenerator = new ComponentGenerator();
    this.apiGenerator = new ApiGenerator();
    this.utilityGenerator = new UtilityGenerator();
  }

  /**
   * Generate all files for the mobile app using modular generators
   */
  generateAllFiles(): Record<string, string> {
    const files: Record<string, string> = {};

    // Generate files using each module
    Object.assign(files, this.configGenerator.generate(this.options));
    Object.assign(files, this.pageGenerator.generate(this.options));
    Object.assign(files, this.componentGenerator.generate(this.options));
    Object.assign(files, this.apiGenerator.generate(this.options));
    Object.assign(files, this.utilityGenerator.generate(this.options));

    return files;
  }
}

export default MobileAppTemplate; 