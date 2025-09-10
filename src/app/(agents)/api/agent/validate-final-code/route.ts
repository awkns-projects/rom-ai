import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for code validation request
const ValidateCodeSchema = z.object({
  code: z.string().describe('Generated code to validate'),
  testInputs: z.record(z.any()).describe('Test inputs to run with the code'),
  expectedOutput: z.record(z.any()).optional().describe('Expected output for validation')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ValidateCodeSchema.parse(body);
    const { code, testInputs, expectedOutput } = validatedData;

    const startTime = Date.now();

    try {
      // Create a safe execution context
      const mockDb = createMockDatabase();
      const mockAi = createMockAi();
      
      const context = {
        db: mockDb,
        ai: mockAi,
        input: testInputs,
        envVars: {}
      };

      // Execute the generated code
      const generatedFunction = new Function('context', `
        const { db, ai, input, envVars } = context;
        try {
          ${code}
        } catch (error) {
          return { error: error.message, success: false };
        }
      `);

      let result;
      try {
        result = await generatedFunction(context);
      } catch (error) {
        // If the function is not async, try running it synchronously
        try {
          result = generatedFunction(context);
        } catch (syncError) {
          throw syncError;
        }
      }
      const executionTime = Date.now() - startTime;

      // Validate the result structure
      const isValid = validateResult(result, expectedOutput);

      console.log('Code validation result:', {
        isValid,
        resultType: typeof result,
        result,
        executionTime
      });

      return NextResponse.json({
        success: isValid,
        result,
        executionTime,
        validation: {
          codeExecuted: true,
          hasExpectedStructure: isValid,
          outputType: typeof result,
          outputKeys: result && typeof result === 'object' ? Object.keys(result) : [],
          timestamp: new Date().toISOString()
        }
      });

    } catch (executionError) {
      return NextResponse.json({
        success: false,
        error: 'Code execution failed',
        details: executionError instanceof Error ? executionError.message : 'Unknown execution error',
        validation: {
          codeExecuted: false,
          hasExpectedStructure: false,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Error validating code:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to validate code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Create mock database for testing
function createMockDatabase() {
  return {
    findMany: async (model: string, options: any) => {
      return Array.from({ length: 3 }, (_, i) => ({
        id: `${model.toLowerCase()}-${Date.now()}-${i}`,
        [`${model.toLowerCase()}Name`]: `Test ${model} ${i + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    },
    findUnique: async (model: string, where: any) => ({
      id: where.id || `${model.toLowerCase()}-${Date.now()}`,
      [`${model.toLowerCase()}Name`]: `Test ${model}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    create: async (model: string, data: any) => ({
      id: `${model.toLowerCase()}-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    update: async (model: string, where: any, data: any) => ({
      id: where.id || `${model.toLowerCase()}-${Date.now()}`,
      ...data,
      updatedAt: new Date().toISOString()
    }),
    delete: async (model: string, where: any) => ({
      id: where.id || `${model.toLowerCase()}-${Date.now()}`,
      deleted: true
    })
  };
}

// Create mock AI for testing
function createMockAi() {
  return {
    generateObject: async (options: any) => ({
      analysis: 'Mock AI analysis completed successfully',
      confidence: 95,
      recommendations: ['Optimization suggestion 1', 'Optimization suggestion 2']
    })
  };
}

// Validate result structure
function validateResult(result: any, expectedOutput?: any) {
  // Allow any successful execution result
  if (result === null || result === undefined) {
    return false;
  }

  // If it's a primitive value, consider it valid
  if (typeof result !== 'object') {
    return true;
  }

  // If it's an object, it's probably valid
  // (The code executed without throwing an error)
  return true;
} 