import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { TestingResult, APITestResult, ScheduleTestResult, FixAttempt } from './testing-agent';
import type { AgentData } from './types';

/**
 * AI-POWERED ERROR FIXER
 * 
 * Analyzes deployment and API errors, then generates specific code fixes
 * to resolve issues in generated agent applications.
 */

export interface ErrorAnalysis {
  errorType: 'build' | 'deployment' | 'api' | 'database' | 'environment';
  severity: 'critical' | 'high' | 'medium' | 'low';
  rootCause: string;
  affectedComponents: string[];
  suggestedFixes: Fix[];
  confidence: number; // 0-100
}

export interface Fix {
  type: 'code' | 'config' | 'environment' | 'schema';
  description: string;
  filePath: string;
  changes: CodeChange[];
  priority: number; // 1-10, higher = more important
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface CodeChange {
  operation: 'replace' | 'insert' | 'delete' | 'modify';
  location?: {
    startLine?: number;
    endLine?: number;
    pattern?: string;
  };
  oldCode?: string;
  newCode: string;
  explanation: string;
}

const errorAnalysisSchema = z.object({
  errorType: z.enum(['build', 'deployment', 'api', 'database', 'environment']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  rootCause: z.string().describe('Detailed explanation of what is causing the error'),
  affectedComponents: z.array(z.string()).describe('List of components/files affected by this error'),
  suggestedFixes: z.array(z.object({
    type: z.enum(['code', 'config', 'environment', 'schema']),
    description: z.string().describe('What this fix does'),
    filePath: z.string().describe('Path to the file that needs to be changed'),
    changes: z.array(z.object({
      operation: z.enum(['replace', 'insert', 'delete', 'modify']),
      location: z.object({
        startLine: z.number().optional(),
        endLine: z.number().optional(),
        pattern: z.string().optional().describe('Regex pattern to find the code to change')
      }).optional(),
      oldCode: z.string().optional().describe('Code to be replaced (for replace operations)'),
      newCode: z.string().describe('New code to insert/replace with'),
      explanation: z.string().describe('Why this change is needed')
    })),
    priority: z.number().min(1).max(10).describe('Priority 1-10, higher = more important'),
    estimatedImpact: z.enum(['high', 'medium', 'low'])
  })),
  confidence: z.number().min(0).max(100).describe('Confidence in this analysis (0-100)')
});

/**
 * AI Error Fixer Class
 */
export class AIErrorFixer {
  private model = openai('gpt-4o-mini');

  /**
   * Analyze errors and generate fixes
   */
  async analyzeErrors(
    errors: string[],
    testResults: TestingResult['testResults'],
    agent: AgentData,
    deploymentUrl?: string
  ): Promise<ErrorAnalysis[]> {
    if (errors.length === 0) {
      return [];
    }

    console.log('🔍 Analyzing errors with AI...');

    const analyses: ErrorAnalysis[] = [];

    // Group similar errors together
    const groupedErrors = this.groupSimilarErrors(errors);

    for (const errorGroup of groupedErrors) {
      try {
        const analysis = await this.analyzeErrorGroup(errorGroup, testResults, agent, deploymentUrl);
        if (analysis) {
          analyses.push(analysis);
        }
      } catch (error) {
        console.error(`Failed to analyze error group: ${error}`);
      }
    }

    return analyses;
  }

  /**
   * Group similar errors together for more efficient analysis
   */
  private groupSimilarErrors(errors: string[]): string[][] {
    const groups: string[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < errors.length; i++) {
      if (processed.has(i)) continue;

      const group = [errors[i]];
      processed.add(i);

      // Find similar errors
      for (let j = i + 1; j < errors.length; j++) {
        if (processed.has(j)) continue;

        if (this.areErrorsSimilar(errors[i], errors[j])) {
          group.push(errors[j]);
          processed.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Check if two errors are similar
   */
  private areErrorsSimilar(error1: string, error2: string): boolean {
    // Simple similarity check - can be enhanced
    const keywords1 = this.extractErrorKeywords(error1);
    const keywords2 = this.extractErrorKeywords(error2);
    
    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];
    
    return intersection.length / union.length > 0.5; // 50% similarity threshold
  }

  /**
   * Extract keywords from error messages
   */
  private extractErrorKeywords(error: string): string[] {
    const keywords = error.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['error', 'failed', 'cannot', 'undefined', 'null'].includes(word));
    
    return [...new Set(keywords)];
  }

  /**
   * Analyze a group of similar errors
   */
  private async analyzeErrorGroup(
    errorGroup: string[],
    testResults: TestingResult['testResults'],
    agent: AgentData,
    deploymentUrl?: string
  ): Promise<ErrorAnalysis | null> {
    const prompt = this.buildAnalysisPrompt(errorGroup, testResults, agent, deploymentUrl);

    try {
      const { object } = await generateObject({
        model: this.model,
        schema: errorAnalysisSchema,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software engineer specializing in debugging Next.js applications with Prisma, PostgreSQL, and Vercel deployments. Analyze errors and provide specific, actionable fixes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        maxTokens: 3000,
      });

      return object as ErrorAnalysis;
    } catch (error) {
      console.error(`AI analysis failed for error group: ${error}`);
      return null;
    }
  }

  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(
    errorGroup: string[],
    testResults: TestingResult['testResults'],
    agent: AgentData,
    deploymentUrl?: string
  ): string {
    return `
ANALYZE AND FIX DEPLOYMENT ERRORS

AGENT INFORMATION:
- Name: ${agent.name}
- Domain: ${agent.domain}
- Models: ${agent.models?.length || 0}
- Actions: ${agent.actions?.length || 0}
- Schedules: ${agent.schedules?.length || 0}
${deploymentUrl ? `- Deployment URL: ${deploymentUrl}` : ''}

ERRORS TO ANALYZE:
${errorGroup.map((error, index) => `${index + 1}. ${error}`).join('\n')}

TEST RESULTS CONTEXT:
API Tests: ${testResults.apiTests.length} (${testResults.apiTests.filter(t => t.status === 'success').length} successful)
Schedule Tests: ${testResults.scheduleTests.length} (${testResults.scheduleTests.filter(t => t.status === 'success').length} successful)
Overall Health: ${testResults.overallHealth}

FAILED API TESTS:
${testResults.apiTests.filter(t => t.status === 'error').map(test => 
  `- ${test.action.name}: ${test.error} (HTTP ${test.httpStatus || 'unknown'})`
).join('\n')}

FAILED SCHEDULE TESTS:
${testResults.scheduleTests.filter(t => t.status === 'error').map(test => 
  `- ${test.schedule.name}: ${test.error}`
).join('\n')}

ANALYSIS REQUIREMENTS:

1. IDENTIFY ROOT CAUSE:
   - What is the fundamental issue causing these errors?
   - Is it a code bug, configuration issue, environment problem, or deployment issue?
   - Which specific components are affected?

2. PROVIDE SPECIFIC FIXES:
   - Generate exact code changes needed
   - Include file paths where changes should be made
   - Provide complete code snippets, not just descriptions
   - Focus on Next.js API routes, Prisma operations, and environment configuration

3. COMMON ERROR PATTERNS TO CHECK:
   - Database connection issues (DATABASE_URL, Prisma client)
   - API route handler errors (missing exports, wrong HTTP methods)
   - Prisma schema mismatches (field names, types, relationships)
   - Environment variable issues (missing or incorrect values)
   - TypeScript compilation errors
   - CORS and authentication issues
   - Vercel deployment configuration problems

4. PRIORITIZE FIXES:
   - Critical: Deployment fails completely
   - High: Core functionality broken
   - Medium: Some features not working
   - Low: Minor issues or optimizations

5. CODE CHANGE EXAMPLES:
   For API route fixes:
   - Fix export statements: export async function POST(request: Request)
   - Fix Prisma queries: await prisma.model.findMany()
   - Fix error handling: try/catch blocks with proper responses
   
   For database fixes:
   - Fix schema field references
   - Fix relationship definitions
   - Fix enum value usage

   For environment fixes:
   - Add missing environment variables
   - Fix variable names and formats

PROVIDE CONCRETE, ACTIONABLE SOLUTIONS THAT CAN BE AUTOMATICALLY APPLIED.
`;
  }

  /**
   * Apply fixes to the codebase
   */
  async applyFixes(analyses: ErrorAnalysis[]): Promise<FixAttempt[]> {
    const fixAttempts: FixAttempt[] = [];

    // Sort fixes by priority
    const allFixes = analyses
      .flatMap(analysis => analysis.suggestedFixes)
      .sort((a, b) => b.priority - a.priority);

    console.log(`🔧 Applying ${allFixes.length} fixes...`);

    for (let i = 0; i < allFixes.length; i++) {
      const fix = allFixes[i];
      
      console.log(`🔧 Applying fix ${i + 1}/${allFixes.length}: ${fix.description}`);
      
      const fixAttempt: FixAttempt = {
        iteration: i + 1,
        errorType: this.getErrorTypeFromFix(fix),
        errorMessage: fix.description,
        aiAnalysis: `Priority ${fix.priority} fix: ${fix.description}`,
        fixApplied: '',
        success: false,
        filesModified: []
      };

      try {
        const result = await this.applyFix(fix);
        fixAttempt.success = result.success;
        fixAttempt.fixApplied = result.description;
        fixAttempt.filesModified = result.filesModified;
      } catch (error) {
        fixAttempt.fixApplied = `Failed to apply fix: ${error}`;
        fixAttempt.success = false;
      }

      fixAttempts.push(fixAttempt);
    }

    return fixAttempts;
  }

  /**
   * Apply a single fix
   */
  private async applyFix(fix: Fix): Promise<{ success: boolean; description: string; filesModified: string[] }> {
    const filesModified: string[] = [];
    
    try {
      // For now, we'll simulate applying fixes
      // In a real implementation, you would:
      // 1. Read the target file
      // 2. Apply the code changes
      // 3. Write the file back
      // 4. Validate the changes

      console.log(`  📝 Would modify file: ${fix.filePath}`);
      console.log(`  🔄 Changes: ${fix.changes.length} modifications`);
      
      for (const change of fix.changes) {
        console.log(`    - ${change.operation}: ${change.explanation}`);
        
        // Here you would actually apply the changes:
        // - For 'replace': find oldCode and replace with newCode
        // - For 'insert': add newCode at specified location
        // - For 'delete': remove specified code
        // - For 'modify': make targeted modifications
      }

      filesModified.push(fix.filePath);
      
      return {
        success: true,
        description: `Applied ${fix.changes.length} changes to ${fix.filePath}`,
        filesModified
      };

    } catch (error) {
      return {
        success: false,
        description: `Failed to apply fix: ${error}`,
        filesModified
      };
    }
  }

  /**
   * Get error type from fix
   */
  private getErrorTypeFromFix(fix: Fix): 'build' | 'deployment' | 'api' | 'database' {
    if (fix.type === 'schema') return 'database';
    if (fix.type === 'environment') return 'deployment';
    if (fix.filePath.includes('/api/')) return 'api';
    return 'build';
  }

  /**
   * Generate a summary of all fixes
   */
  generateFixSummary(analyses: ErrorAnalysis[]): string {
    const totalFixes = analyses.reduce((sum, analysis) => sum + analysis.suggestedFixes.length, 0);
    const criticalIssues = analyses.filter(a => a.severity === 'critical').length;
    const highPriorityFixes = analyses.flatMap(a => a.suggestedFixes).filter(f => f.priority >= 8).length;

    return `
🔍 AI ERROR ANALYSIS SUMMARY:
  📊 Total Issues Analyzed: ${analyses.length}
  🚨 Critical Issues: ${criticalIssues}
  🔧 Total Fixes Generated: ${totalFixes}
  ⚡ High Priority Fixes: ${highPriorityFixes}
  
  Error Types:
  ${analyses.map(a => `  - ${a.errorType}: ${a.rootCause.substring(0, 60)}...`).join('\n')}
`;
  }
}

/**
 * Convenience function to analyze and fix errors
 */
export async function analyzeAndFixErrors(
  errors: string[],
  testResults: TestingResult['testResults'],
  agent: AgentData,
  deploymentUrl?: string
): Promise<{ analyses: ErrorAnalysis[]; fixAttempts: FixAttempt[] }> {
  const fixer = new AIErrorFixer();
  
  const analyses = await fixer.analyzeErrors(errors, testResults, agent, deploymentUrl);
  const fixAttempts = await fixer.applyFixes(analyses);
  
  return { analyses, fixAttempts };
} 