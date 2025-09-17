import { generateActions, generatePrismaActions, getAgentBuilderModel } from '../generation';
import { generateCompleteAction, updateSpecFromPseudoSteps, updatePseudoStepsFromSpec, type TechnicalSpecification, generateSimplifiedActionFromStep0, extractExecutableActionsFromStep0, determineTargetModelFromStep0 } from '../action-generation-shared';
import type { AgentAction, AgentData } from '../types';
import type { Step0Output } from './step0-comprehensive-analysis';
import type { Step1Output } from './step1-database-generation';
import { generateTitleAndName, sanitizeAgentName } from '../utils';
import { generateObject } from 'ai';
import { z } from 'zod';
import { searchNpmPackages, searchApiDocumentation, combineSearchResults, type WebSearchResult, type NpmPackage } from '../web-search-utils';
import type { OrchestratorConfig } from './orchestrator';

/**
 * STEP 2: Action Generation - AI-POWERED APPROACH
 * 
 * CURRENT APPROACH: Generate pseudo steps and executable code with AI
 * - Step 0 provides basic action specifications (name, purpose, etc.)
 * - AI generates custom pseudo steps for each action based on purpose
 * - AI then generates executable code from the pseudo steps
 * - Complete AI-driven action implementation pipeline
 */

export interface Step2Input {
  step0Analysis: Step0Output;
  databaseGeneration: Step1Output;
  existingAgent?: AgentData;
  conversationContext?: string;
  command?: string;
  // Web search configuration
  orchestratorConfig?: OrchestratorConfig;
}

export interface Step2Output {
  actions: AgentAction[];
  implementationNotes: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  // Web search results
  webSearchResults?: {
    recommendedPackages: NpmPackage[];
    integrationNotes: string[];
  };
}

/**
 * Execute Step 2: ULTRA-STREAMLINED Action Generation
 */
export async function executeStep2ActionGeneration(
  input: Step2Input
): Promise<Step2Output> {
  console.log('🚀 STEP 2: AI-POWERED action generation - generating pseudo steps and code with AI...');
  console.log('🤖 Approach: AI generates custom pseudo steps for each action, then generates executable code');
  
  const { step0Analysis, databaseGeneration, existingAgent, conversationContext, command } = input;
  
  try {
    const availableModels = databaseGeneration.models || [];
    const availableEnums = databaseGeneration.enums || [];
    
    console.log(`📊 Available Models: ${availableModels.length}`);
    console.log(`📊 Available Enums: ${availableEnums.length}`);
    console.log(`📊 Step 0 Actions: ${step0Analysis.actions?.length || 0}`);
    
    if (availableModels.length === 0) {
      console.warn('⚠️ No models available for action generation');
      return {
        actions: [],
        implementationComplexity: 'low',
        implementationNotes: 'No actions generated - no models available'
      };
    }
    
    if (!step0Analysis.actions || step0Analysis.actions.length === 0) {
      console.warn('⚠️ No actions identified in Step 0 analysis');
      return {
        actions: [],
        implementationComplexity: 'low', 
        implementationNotes: 'No actions generated - Step 0 identified no actions'
      };
    }
    
    // 🌐 WEB SEARCH ENHANCEMENT: Find relevant packages (if enabled)
    let webSearchResults: Step2Output['webSearchResults'];
    if (input.orchestratorConfig?.enableWebSearch) {
      console.log('🔍 Searching for relevant npm packages...');
      
      try {
        const packageSearches: Promise<WebSearchResult>[] = [];
        
        // Search for domain-specific packages
        packageSearches.push(
          searchNpmPackages(
            `${step0Analysis.domain} business automation next.js typescript`,
            `${step0Analysis.domain} automation tools`,
            input.orchestratorConfig
          )
        );
        
        // Search for external API packages if APIs are specified
        if (step0Analysis.externalApis && step0Analysis.externalApis.length > 0) {
          for (const api of step0Analysis.externalApis.slice(0, 2)) {
            packageSearches.push(
              searchNpmPackages(
                `${api.provider} typescript sdk client`,
                `${api.provider} integration`,
                input.orchestratorConfig
              )
            );
          }
        }
        
        const packageResults = await Promise.all(packageSearches);
        const combinedResults = await combineSearchResults(packageResults, [], []);
        
        webSearchResults = {
          recommendedPackages: combinedResults.recommendedPackages,
          integrationNotes: [
            `Found ${combinedResults.recommendedPackages.length} recommended packages`,
            'Web search enhanced ultra-streamlined generation'
          ]
        };
        
        console.log(`✅ Web search found ${combinedResults.recommendedPackages.length} packages`);
        
      } catch (webSearchError) {
        console.warn('⚠️ Web search failed, continuing with ultra-streamlined generation:', webSearchError);
        webSearchResults = {
          recommendedPackages: [],
          integrationNotes: ['Web search unavailable, using ultra-streamlined generation']
        };
      }
    }
    
    // 🚀 SIMPLIFIED APPROACH: Generate pseudo steps and code from Step 0 actions
    console.log('🤖 Generating pseudo steps and executable code from Step 0 actions...');
    
    const processedActions = await Promise.all(
      step0Analysis.actions.map(async (actionSpec: any) => {
        console.log(`🔄 Processing action: ${actionSpec.name}`);
        
        // Determine target model for this action
        const targetModel = determineTargetModelFromStep0(actionSpec, step0Analysis, availableModels);
        console.log(`  📋 Target model: ${targetModel}`);
        
        // Generate pseudo steps and executable code
        return await generateSimplifiedActionFromStep0(
          step0Analysis,
          targetModel,
          actionSpec.name, // Use the concise name instead of the long purpose
          availableModels,
          availableEnums,
          actionSpec.title, // Pass the title separately
          actionSpec.purpose // Pass the full purpose as description
        );
      })
    );
    
    console.log(`✅ Generated ${processedActions.length} actions with AI-generated pseudo steps and executable code`);
    
    // Handle incremental updates by merging with existing actions
    let finalActions = processedActions;
    if (existingAgent?.actions && existingAgent.actions.length > 0) {
      console.log(`📊 Merging with ${existingAgent.actions.length} existing actions`);
      
      // Add existing actions that aren't being updated
      const newActionNames = new Set(processedActions.map((a: any) => a.name));
      const existingActionsToKeep = existingAgent.actions.filter(a => !newActionNames.has(a.name));
      
      finalActions = [...existingActionsToKeep, ...processedActions];
      console.log(`✅ Final action count: ${finalActions.length} (${existingActionsToKeep.length} existing + ${processedActions.length} new)`);
    }
    
    // Calculate implementation complexity
    const hasExternalAPIs = step0Analysis.externalApis && step0Analysis.externalApis.length > 0;
    const hasComplexDatabase = availableModels.length > 3;
    const codeGeneratedCount = finalActions.filter((a: any) => a._internal?.hasRealCode).length;
    
    let implementationComplexity: 'low' | 'medium' | 'high' = 'low';
    if (hasExternalAPIs && hasComplexDatabase) {
      implementationComplexity = 'high';
    } else if (hasExternalAPIs || hasComplexDatabase || finalActions.length > 6) {
      implementationComplexity = 'medium';
    }
    
    const result: Step2Output = {
      actions: finalActions,
      implementationComplexity,
      implementationNotes: `AI-GENERATED: Generated ${finalActions.length} executable actions with AI-generated pseudo steps and code. ` +
        `Approach: AI generates custom pseudo steps for each action purpose, then generates executable code. ` +
        `${codeGeneratedCount} actions have ready-to-run code. ` +
        `Models covered: ${availableModels.map(m => m.name).join(', ')}. ` +
        `Processing mode: Single-record with AI-driven step design and code generation. ` +
        `Performance: Standard AI generation for both pseudo steps and executable code. ` +
        `${webSearchResults?.integrationNotes.join(' ') || ''}`,
      webSearchResults
    };

    console.log('✅ STEP 2: AI-GENERATED action generation completed successfully');
    console.log(`🤖 AI Generation Summary:
- Source: Step 0 basic actions with AI pseudo step generation
- Actions Generated: ${result.actions.length} (with AI-generated pseudo steps and code)
- Actions with Code: ${codeGeneratedCount}
- Models Covered: ${availableModels.length} models
- Approach: AI generates custom pseudo steps then executable code
- Performance: Standard AI generation for complete action implementation
- Implementation Complexity: ${implementationComplexity}`);

    return result;
    
  } catch (error) {
    console.error('❌ STEP 2: AI-powered action generation failed:', error);
    throw new Error(`Step 2 AI-powered generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Step 2 output for completeness and quality
 */
export function validateStep2Output(output: Step2Output): boolean {
  try {
    if (!output.actions.length) {
      console.warn('⚠️ No actions generated');
      return false;
    }
    
    // Check that actions have proper structure
    const invalidActions = output.actions.filter(a => 
      !a.name || !a.description || !a.execute
    );
    
    if (invalidActions.length > 0) {
      console.warn(`⚠️ Invalid actions found: ${invalidActions.length}`);
      return false;
    }

    // Check that actions follow the NEW 3-step pattern
    const actionsWithTechnicalSpecs = output.actions.filter((a: any) => a.technicalSpecification);
    const actionsWithPseudoSteps = output.actions.filter((a: any) => a.pseudoSteps && a.pseudoSteps.length > 0);
    const actionsWithCode = output.actions.filter(a => 
      a.execute && a.execute.type === 'code' && a.execute.code?.script
    );

    if (actionsWithCode.length === 0) {
      console.warn('⚠️ No actions have executable code');
      return false;
    }
    
    console.log(`✅ Step 2 output validation passed: ${output.actions.length} actions`);
    console.log(`📊 NEW 3-Step Pattern Compliance: ${actionsWithTechnicalSpecs.length} with technical specs, ${actionsWithPseudoSteps.length} with pseudo steps, ${actionsWithCode.length} with code`);
    return true;
    
  } catch (error) {
    console.error('❌ Step 2 output validation failed:', error);
    return false;
  }
}

/**
 * Extract action insights for downstream steps
 */
export function extractActionInsights(output: Step2Output) {
  const actionsWithCode = output.actions.filter((a: any) => a._internal?.hasRealCode);
  const actionsWithPrompts = output.actions.filter((a: any) => a.execute && a.execute.type === 'prompt');
  const actionsWithTechnicalSpecs = output.actions.filter((a: any) => a.technicalSpecification);
  const actionsWithPseudoSteps = output.actions.filter((a: any) => a.pseudoSteps && a.pseudoSteps.length > 0);
  
  return {
    actionCount: output.actions.length,
    hasCustomCode: actionsWithCode.length > 0,
    hasPromptExecution: actionsWithPrompts.length > 0,
    primaryActionTypes: Array.from(new Set(output.actions.map((a: any) => a.type || 'query'))),
    codeGenerationSuccess: actionsWithCode.length / output.actions.length,
    implementationComplexity: output.implementationComplexity,
    executableActionsCount: actionsWithCode.length,
    // NEW 3-Step Pattern metrics
    technicalSpecPatternCompliance: {
      technicalSpecsGenerated: actionsWithTechnicalSpecs.length / output.actions.length,
      pseudoStepsGenerated: actionsWithPseudoSteps.length / output.actions.length,
      executableCodeGenerated: actionsWithCode.length / output.actions.length,
      fullPatternCompliance: actionsWithTechnicalSpecs.filter((a: any) => 
        actionsWithPseudoSteps.some((b: any) => b.id === a.id) && 
        actionsWithCode.some((c: any) => c.id === a.id)
      ).length / output.actions.length
    }
  };
} 