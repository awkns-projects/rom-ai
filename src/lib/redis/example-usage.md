# Redis Action Execution Logging

This system automatically logs each step of action execution to Redis, providing real-time monitoring and debugging capabilities.

## How It Works

1. **Action Execution Start**: When an action is executed via `/api/agent/execute-action`, a Redis execution log is created
2. **Step Logging**: Each step in the generated action code logs its input/output to Redis
3. **Step Completion**: When each step completes (success or failure), the Redis log is updated
4. **Action Completion**: When the entire action finishes, the final status is logged

## Generated Code Pattern

The AI-generated action code automatically includes Redis logging:

```javascript
async function myAction() {
  const startTime = Date.now();
  
  // Input parameter validation (generated automatically)
  const validateInputParameters = (params) => {
    const errors = [];
    // ... validation logic ...
    return errors;
  };
  
  const validationErrors = validateInputParameters(parameters);
  if (validationErrors.length > 0) {
    return { 
      success: false, 
      data: null, 
      message: 'Input validation failed: ' + validationErrors.join(', '), 
      executionTime: Date.now() - startTime 
    };
  }

  // Step 1: Database Query
  try {
    const stepInput = { userId: parameters.userId, batchSize: parameters.batchSize };
    await actionLogger.startStep(executionId, 1, 'Fetch user data', stepInput);
    
    const step1_userData = await prisma.user.findMany({
      where: { id: parameters.userId },
      take: parseInt(parameters.batchSize, 10)
    });
    
    const stepOutput = { 
      userCount: step1_userData.length,
      userIds: step1_userData.map(u => u.id),
      userData: step1_userData
    };
    
    await actionLogger.completeStep(executionId, 1, stepOutput);
    console.log(`✅ Step 1 completed: Found ${step1_userData.length} users`);
    
  } catch (stepError) {
    await actionLogger.completeStep(executionId, 1, {}, stepError.message);
    console.error(`❌ Step 1 failed:`, stepError);
    throw stepError;
  }

  // Step 2: AI Analysis
  try {
    const stepInput = { userData: step1_userData };
    await actionLogger.startStep(executionId, 2, 'Analyze user patterns', stepInput);
    
    const { object: analysis } = await generateObject({
      model: aiModel,
      messages: [
        { role: 'system', content: 'Analyze user data patterns' },
        { role: 'user', content: JSON.stringify(step1_userData) }
      ],
      schema: z.object({
        insights: z.array(z.string()),
        recommendations: z.array(z.string())
      })
    });
    
    const stepOutput = { 
      insights: analysis.insights,
      recommendations: analysis.recommendations
    };
    
    await actionLogger.completeStep(executionId, 2, stepOutput);
    console.log(`✅ Step 2 completed: Generated ${analysis.insights.length} insights`);
    
  } catch (stepError) {
    await actionLogger.completeStep(executionId, 2, {}, stepError.message);
    console.error(`❌ Step 2 failed:`, stepError);
    throw stepError;
  }

  // Return final result
  return {
    success: true,
    data: {
      users: step1_userData,
      analysis: analysis
    },
    message: `Successfully processed ${step1_userData.length} users`,
    executionTime: Date.now() - startTime
  };
}
```

## Global Variables Available

When actions are executed, these globals are available:

- `actionLogger`: ActionExecutionLogger instance
- `executionId`: Unique execution ID for this run
- `parameters`: User input parameters
- `prisma`: Database client
- `generateObject`: AI function
- `aiModel`: AI model instance

## Viewing Execution Logs

### API Endpoints

1. **Get All Recent Executions**:
   ```
   GET /api/execution-logs?limit=20
   ```

2. **Get User's Executions**:
   ```
   GET /api/execution-logs?userId=user123&limit=20
   ```

3. **Get Specific Execution**:
   ```
   GET /api/execution-logs/exec_1234567890_abc123
   ```

### UI Components

1. **ExecutionLogViewer Component**:
   ```jsx
   import { ExecutionLogViewer } from '@/components/execution-logs/execution-log-viewer';
   
   <ExecutionLogViewer
     userId="user123"
     autoRefresh={true}
     refreshInterval={5000}
     showParameters={true}
   />
   ```

2. **React Hooks**:
   ```jsx
   import { useExecutionLogs, useExecutionTracking } from '@/hooks/use-execution-logs';
   
   // View execution history
   const { executions, loading, error } = useExecutionLogs({ userId: 'user123' });
   
   // Track specific execution in real-time
   const { selectedExecution } = useExecutionTracking('exec_1234567890_abc123');
   ```

### Web UI

Visit `/execution-logs` to access the web interface for viewing execution logs.

## Redis Data Structure

### Execution Log
```json
{
  "executionId": "exec_1234567890_abc123",
  "actionName": "analyzeUsers",
  "userId": "user123",
  "startTime": "2023-12-01T10:00:00.000Z",
  "endTime": "2023-12-01T10:00:05.123Z",
  "status": "completed",
  "parameters": {
    "userId": "user123",
    "batchSize": "50"
  },
  "steps": [
    {
      "stepNumber": 1,
      "stepName": "Fetch user data",
      "startTime": "2023-12-01T10:00:00.100Z",
      "endTime": "2023-12-01T10:00:02.234Z",
      "input": {
        "userId": "user123",
        "batchSize": 50
      },
      "output": {
        "userCount": 25,
        "userIds": ["user1", "user2"],
        "userData": [...]
      },
      "executionTime": 2134
    }
  ],
  "totalExecutionTime": 5123
}
```

### Redis Keys

- `action_execution:{executionId}` - Individual execution logs (TTL: 24 hours)
- `user_executions:{userId}` - List of execution IDs for a user (last 100)
- `all_executions` - Global list of execution IDs (last 1000)

## Environment Variables

Add to your `.env.local`:

```
REDIS_URL=redis://default:password@host:port
```

## Benefits

1. **Real-time Monitoring**: See action executions as they happen
2. **Step-by-step Debugging**: Identify exactly where failures occur
3. **Input/Output Tracking**: Debug data flow between steps
4. **Performance Monitoring**: Track execution times for optimization
5. **User Activity**: Monitor which users are running which actions
6. **Error Tracking**: Detailed error logs with context
7. **Audit Trail**: Complete history of action executions

## Integration with Action Builder

The Redis logging is automatically integrated into the action generation system. When you generate actions using the agent builder, the logging code is automatically included in the generated JavaScript.

No additional setup is required - just ensure `REDIS_URL` is configured and the system will start logging all action executions automatically. 