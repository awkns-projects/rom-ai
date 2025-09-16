import { createClient, RedisClientType } from 'redis';

let redis: RedisClientType | null = null;

/**
 * Get or create Redis client instance
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redis) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    redis = createClient({ 
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redis.on('disconnect', () => {
      console.log('Redis Client Disconnected');
    });

    await redis.connect();
  }

  return redis;
}

/**
 * Close Redis connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redis) {
    await redis.disconnect();
    redis = null;
  }
}

/**
 * Action execution logging interface
 */
export interface ActionExecutionLog {
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

export interface ActionStepLog {
  stepNumber: number;
  stepName: string;
  startTime: string;
  endTime?: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  executionTime?: number;
}

/**
 * Redis-based action execution logger
 */
export class ActionExecutionLogger {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Start logging an action execution
   */
  async startExecution(
    actionName: string,
    parameters: Record<string, any>,
    userId?: string
  ): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const executionLog: ActionExecutionLog = {
      executionId,
      actionName,
      userId,
      startTime: new Date().toISOString(),
      status: 'running',
      parameters,
      steps: []
    };

    // Store execution log with TTL of 24 hours
    await this.redis.setEx(
      `action_execution:${executionId}`,
      24 * 60 * 60,
      JSON.stringify(executionLog)
    );

    // Add to user's execution history if userId provided
    if (userId) {
      await this.redis.lPush(`user_executions:${userId}`, executionId);
      // Keep only last 100 executions per user
      await this.redis.lTrim(`user_executions:${userId}`, 0, 99);
    }

    // Add to global execution history
    await this.redis.lPush('all_executions', executionId);
    await this.redis.lTrim('all_executions', 0, 999); // Keep last 1000 executions

    console.log(`🚀 Started action execution: ${executionId} for action: ${actionName}`);
    return executionId;
  }

  /**
   * Log a step execution
   */
  async logStep(
    executionId: string,
    stepNumber: number,
    stepName: string,
    input: Record<string, any>,
    output?: Record<string, any>,
    error?: string
  ): Promise<void> {
    const stepLog: ActionStepLog = {
      stepNumber,
      stepName,
      startTime: new Date().toISOString(),
      input,
      output,
      error,
      endTime: new Date().toISOString(),
      executionTime: 0 // Will be calculated when step completes
    };

    // Get current execution log
    const executionData = await this.redis.get(`action_execution:${executionId}`);
    if (!executionData) {
      console.error(`❌ Execution log not found: ${executionId}`);
      return;
    }

    const executionLog: ActionExecutionLog = JSON.parse(executionData);
    
    // Update or add step
    const existingStepIndex = executionLog.steps.findIndex(s => s.stepNumber === stepNumber);
    if (existingStepIndex >= 0) {
      // Update existing step
      const existingStep = executionLog.steps[existingStepIndex];
      stepLog.startTime = existingStep.startTime; // Keep original start time
      stepLog.executionTime = new Date().getTime() - new Date(existingStep.startTime).getTime();
      executionLog.steps[existingStepIndex] = stepLog;
    } else {
      // Add new step
      executionLog.steps.push(stepLog);
    }

    // Sort steps by step number
    executionLog.steps.sort((a, b) => a.stepNumber - b.stepNumber);

    // Update execution log
    await this.redis.setEx(
      `action_execution:${executionId}`,
      24 * 60 * 60,
      JSON.stringify(executionLog)
    );

    console.log(`📝 Logged step ${stepNumber} for execution: ${executionId}`);
  }

  /**
   * Start a step (for tracking execution time)
   */
  async startStep(
    executionId: string,
    stepNumber: number,
    stepName: string,
    input: Record<string, any>
  ): Promise<void> {
    const stepLog: ActionStepLog = {
      stepNumber,
      stepName,
      startTime: new Date().toISOString(),
      input
    };

    // Get current execution log
    const executionData = await this.redis.get(`action_execution:${executionId}`);
    if (!executionData) {
      console.error(`❌ Execution log not found: ${executionId}`);
      return;
    }

    const executionLog: ActionExecutionLog = JSON.parse(executionData);
    
    // Add or update step
    const existingStepIndex = executionLog.steps.findIndex(s => s.stepNumber === stepNumber);
    if (existingStepIndex >= 0) {
      executionLog.steps[existingStepIndex] = { ...executionLog.steps[existingStepIndex], ...stepLog };
    } else {
      executionLog.steps.push(stepLog);
    }

    // Sort steps by step number
    executionLog.steps.sort((a, b) => a.stepNumber - b.stepNumber);

    // Update execution log
    await this.redis.setEx(
      `action_execution:${executionId}`,
      24 * 60 * 60,
      JSON.stringify(executionLog)
    );

    console.log(`🔄 Started step ${stepNumber}: ${stepName} for execution: ${executionId}`);
  }

  /**
   * Complete a step
   */
  async completeStep(
    executionId: string,
    stepNumber: number,
    output: Record<string, any>,
    error?: string
  ): Promise<void> {
    // Get current execution log
    const executionData = await this.redis.get(`action_execution:${executionId}`);
    if (!executionData) {
      console.error(`❌ Execution log not found: ${executionId}`);
      return;
    }

    const executionLog: ActionExecutionLog = JSON.parse(executionData);
    
    // Find and update step
    const stepIndex = executionLog.steps.findIndex(s => s.stepNumber === stepNumber);
    if (stepIndex >= 0) {
      const step = executionLog.steps[stepIndex];
      step.endTime = new Date().toISOString();
      step.output = output;
      step.error = error;
      step.executionTime = new Date().getTime() - new Date(step.startTime).getTime();
    }

    // Update execution log
    await this.redis.setEx(
      `action_execution:${executionId}`,
      24 * 60 * 60,
      JSON.stringify(executionLog)
    );

    console.log(`✅ Completed step ${stepNumber} for execution: ${executionId}`);
  }

  /**
   * Complete an action execution
   */
  async completeExecution(
    executionId: string,
    success: boolean,
    result?: any,
    error?: string
  ): Promise<void> {
    // Get current execution log
    const executionData = await this.redis.get(`action_execution:${executionId}`);
    if (!executionData) {
      console.error(`❌ Execution log not found: ${executionId}`);
      return;
    }

    const executionLog: ActionExecutionLog = JSON.parse(executionData);
    
    executionLog.endTime = new Date().toISOString();
    executionLog.status = success ? 'completed' : 'failed';
    executionLog.error = error;
    executionLog.totalExecutionTime = new Date().getTime() - new Date(executionLog.startTime).getTime();

    // Update execution log
    await this.redis.setEx(
      `action_execution:${executionId}`,
      24 * 60 * 60,
      JSON.stringify(executionLog)
    );

    console.log(`🏁 Completed action execution: ${executionId} (${success ? 'success' : 'failed'})`);
  }

  /**
   * Get execution log
   */
  async getExecution(executionId: string): Promise<ActionExecutionLog | null> {
    const executionData = await this.redis.get(`action_execution:${executionId}`);
    if (!executionData) {
      return null;
    }
    return JSON.parse(executionData);
  }

  /**
   * Get user's execution history
   */
  async getUserExecutions(userId: string, limit: number = 20): Promise<ActionExecutionLog[]> {
    const executionIds = await this.redis.lRange(`user_executions:${userId}`, 0, limit - 1);
    const executions: ActionExecutionLog[] = [];

    for (const executionId of executionIds) {
      const execution = await this.getExecution(executionId);
      if (execution) {
        executions.push(execution);
      }
    }

    return executions;
  }

  /**
   * Get all recent executions
   */
  async getRecentExecutions(limit: number = 50): Promise<ActionExecutionLog[]> {
    const executionIds = await this.redis.lRange('all_executions', 0, limit - 1);
    const executions: ActionExecutionLog[] = [];

    for (const executionId of executionIds) {
      const execution = await this.getExecution(executionId);
      if (execution) {
        executions.push(execution);
      }
    }

    return executions;
  }
}

/**
 * Get action execution logger instance
 */
export async function getActionLogger(): Promise<ActionExecutionLogger> {
  const redis = await getRedisClient();
  return new ActionExecutionLogger(redis);
} 