import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const TestActualStepsSchema = z.object({
  steps: z.array(z.object({
    id: z.string(),
    description: z.string(),
    type: z.string(),
    testCode: z.string(),
    actualCode: z.string(),
    mockInput: z.record(z.any()),
    mockOutput: z.record(z.any()),
    logMessage: z.string(),
    stepOrder: z.number()
  })),
  inputParameters: z.record(z.any())
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = TestActualStepsSchema.parse(body);
    const { steps, inputParameters } = validatedData;

    console.log('🧪 Testing actual step code with real testCode execution');
    
    const startTime = Date.now();
    const stepResults = [];
    
    // Execute each step's testCode with mockInput
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();
      
      try {
        console.log(`Testing step ${step.stepOrder}: ${step.description}`);
        
        // Create test execution context
        const testContext = {
          input: { ...step.mockInput, ...inputParameters },
          mockOutput: step.mockOutput,
          stepIndex: i,
          stepId: step.id
        };
        
        // Execute the testCode for this step
        const testFunction = new Function('context', `
          ${step.testCode}
          return executeStepTest(context);
        `);
        
        const testResult = await testFunction(testContext);
        const stepTime = Date.now() - stepStartTime;
        
        // Validate against expected mockOutput
        const isValid = validateStepResult(testResult, step.mockOutput);
        
        stepResults.push({
          stepId: step.id,
          stepNumber: step.stepOrder,
          description: step.description,
          type: step.type,
          status: isValid ? 'passed' : 'failed',
          result: testResult,
          expectedOutput: step.mockOutput,
          isValid,
          duration: stepTime,
          logMessage: step.logMessage,
          actualCodeGenerated: !!step.actualCode
        });
        
        console.log(`✅ Step ${step.stepOrder} test completed in ${stepTime}ms`);
        
      } catch (error) {
        const stepTime = Date.now() - stepStartTime;
        console.error(`❌ Step ${step.stepOrder} test failed:`, error);
        
        stepResults.push({
          stepId: step.id,
          stepNumber: step.stepOrder,
          description: step.description,
          type: step.type,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: stepTime,
          actualCodeGenerated: !!step.actualCode
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const passedSteps = stepResults.filter(r => r.status === 'passed').length;
    const totalSteps = stepResults.length;
    
    console.log(`🎯 Test Summary: ${passedSteps}/${totalSteps} steps passed in ${totalTime}ms`);
    
    return NextResponse.json({
      success: true,
      stepResults,
      summary: {
        totalSteps,
        passedSteps,
        failedSteps: totalSteps - passedSteps,
        successRate: (passedSteps / totalSteps) * 100
      },
      executionTime: totalTime,
      timestamp: new Date().toISOString(),
      testMode: 'real-code-testing'
    });

  } catch (error) {
    console.error('Error testing actual steps:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test actual steps',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to validate step results against expected output
function validateStepResult(actual: any, expected: any): boolean {
  try {
    // Basic validation - can be enhanced
    if (typeof expected === 'object' && expected !== null) {
      for (const key in expected) {
        if (!(key in actual)) return false;
        if (typeof expected[key] === 'object') {
          if (!validateStepResult(actual[key], expected[key])) return false;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    documentation: {
      endpoint: '/api/agent/test-actual-steps',
      method: 'POST',
      description: 'Execute actual testCode from PseudoCodeSteps with mockInput and validate against mockOutput',
      requiredFields: ['steps', 'inputParameters'],
      responseFormat: 'Real test execution results with validation'
    }
  });
} 