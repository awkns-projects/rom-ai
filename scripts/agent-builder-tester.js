#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

// Configuration
const CONFIG = {
  TARGET_SCORE: 80,
  MAX_ITERATIONS: 100,
  API_BASE_URL: 'http://localhost:3000',
  RESULTS_DIR: './scripts/agent-builder-results',
  LOG_FILE: './scripts/agent-builder-test.log'
};

// Ensure results directory exists
if (!fs.existsSync(CONFIG.RESULTS_DIR)) {
  fs.mkdirSync(CONFIG.RESULTS_DIR, { recursive: true });
}

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(CONFIG.LOG_FILE, `${logMessage}\n`);
}

// Test scenarios for agent builder
const TEST_SCENARIOS = [
  {
    id: 'ecommerce-basic',
    name: 'Basic E-commerce System',
    description: 'Create a simple e-commerce system with products, customers, and orders',
    prompt: 'Create an e-commerce system that manages products, customers, and orders. Include inventory tracking and basic customer management.',
    expectedModels: ['Product', 'Customer', 'Order', 'OrderItem'],
    expectedActions: ['Create Order', 'Update Inventory', 'Customer Registration'],
    expectedSchedules: ['Inventory Check', 'Order Processing']
  },
  {
    id: 'project-management',
    name: 'Project Management System',
    description: 'Create a project management system with tasks, teams, and deadlines',
    prompt: 'Build a project management system that handles projects, tasks, team members, and deadlines. Include task assignment and progress tracking.',
    expectedModels: ['Project', 'Task', 'TeamMember', 'Assignment'],
    expectedActions: ['Assign Task', 'Update Progress', 'Create Project'],
    expectedSchedules: ['Deadline Reminder', 'Progress Report']
  },
  {
    id: 'crm-system',
    name: 'Customer Relationship Management',
    description: 'Create a CRM system for managing leads, contacts, and sales pipeline',
    prompt: 'Create a CRM system that manages leads, contacts, opportunities, and sales pipeline. Include lead scoring and follow-up automation.',
    expectedModels: ['Lead', 'Contact', 'Opportunity', 'Company'],
    expectedActions: ['Score Lead', 'Create Follow-up', 'Convert Lead'],
    expectedSchedules: ['Lead Nurturing', 'Pipeline Review']
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management System',
    description: 'Create an inventory system with suppliers, warehouses, and stock tracking',
    prompt: 'Build an inventory management system with suppliers, warehouses, products, and stock levels. Include reorder automation and supplier management.',
    expectedModels: ['Product', 'Supplier', 'Warehouse', 'StockLevel'],
    expectedActions: ['Reorder Stock', 'Receive Shipment', 'Transfer Stock'],
    expectedSchedules: ['Stock Check', 'Supplier Review']
  },
  {
    id: 'hr-system',
    name: 'Human Resources Management',
    description: 'Create an HR system for employee management, payroll, and performance tracking',
    prompt: 'Create an HR management system that handles employees, departments, payroll, and performance reviews. Include onboarding and leave management.',
    expectedModels: ['Employee', 'Department', 'PayrollRecord', 'PerformanceReview'],
    expectedActions: ['Process Payroll', 'Schedule Review', 'Approve Leave'],
    expectedSchedules: ['Payroll Processing', 'Review Reminders']
  },
  {
    id: 'event-management',
    name: 'Event Management System',
    description: 'Create an event management system with venues, attendees, and scheduling',
    prompt: 'Build an event management system that manages events, venues, attendees, and registrations. Include ticket sales and capacity management.',
    expectedModels: ['Event', 'Venue', 'Attendee', 'Registration'],
    expectedActions: ['Register Attendee', 'Send Reminders', 'Process Payment'],
    expectedSchedules: ['Event Reminders', 'Capacity Alerts']
  }
];

// Advanced test scenarios for iteration
const ADVANCED_SCENARIOS = [
  {
    id: 'multi-tenant-saas',
    name: 'Multi-tenant SaaS Platform',
    description: 'Complex SaaS with multiple tenants, subscriptions, and feature flags',
    prompt: 'Create a multi-tenant SaaS platform with organizations, users, subscriptions, billing, and feature flags. Include usage tracking and analytics.',
    expectedModels: ['Organization', 'User', 'Subscription', 'Feature', 'Usage', 'Invoice'],
    expectedActions: ['Process Billing', 'Track Usage', 'Manage Features', 'User Onboarding'],
    expectedSchedules: ['Billing Cycle', 'Usage Reports', 'Feature Updates']
  },
  {
    id: 'marketplace-platform',
    name: 'Marketplace Platform',
    description: 'Multi-vendor marketplace with complex relationships',
    prompt: 'Build a marketplace platform with vendors, buyers, products, orders, payments, and reviews. Include commission tracking and dispute resolution.',
    expectedModels: ['Vendor', 'Buyer', 'Product', 'Order', 'Payment', 'Review', 'Commission'],
    expectedActions: ['Process Order', 'Calculate Commission', 'Handle Dispute', 'Send Notifications'],
    expectedSchedules: ['Commission Payout', 'Review Reminders', 'Vendor Reports']
  },
  {
    id: 'logistics-system',
    name: 'Logistics and Shipping System',
    description: 'Complex logistics with routes, drivers, and real-time tracking',
    prompt: 'Create a logistics system that manages shipments, routes, drivers, vehicles, and real-time tracking. Include delivery optimization and customer notifications.',
    expectedModels: ['Shipment', 'Route', 'Driver', 'Vehicle', 'TrackingEvent', 'Customer'],
    expectedActions: ['Optimize Route', 'Update Tracking', 'Notify Customer', 'Assign Driver'],
    expectedSchedules: ['Route Optimization', 'Delivery Updates', 'Driver Schedules']
  }
];

// Scoring system for agent builder results
function scoreAgentResult(result, expectedCriteria) {
  let score = 0;
  const maxScore = 100;
  const details = [];

  try {
    // Parse the result if it's a string
    const agentData = typeof result === 'string' ? JSON.parse(result) : result;
    
    // Basic structure validation (20 points)
    if (agentData.id) {
      score += 2;
      details.push('✓ Has ID');
    } else {
      details.push('✗ Missing ID');
    }
    
    if (agentData.name) {
      score += 3;
      details.push('✓ Has name');
    } else {
      details.push('✗ Missing name');
    }
    
    if (agentData.description) {
      score += 3;
      details.push('✓ Has description');
    } else {
      details.push('✗ Missing description');
    }
    
    if (agentData.domain) {
      score += 2;
      details.push('✓ Has domain');
    } else {
      details.push('✗ Missing domain');
    }
    
    if (agentData.models && Array.isArray(agentData.models)) {
      score += 5;
      details.push(`✓ Has models array (${agentData.models.length} models)`);
    } else {
      details.push('✗ Missing or invalid models array');
    }
    
    if (agentData.actions && Array.isArray(agentData.actions)) {
      score += 3;
      details.push(`✓ Has actions array (${agentData.actions.length} actions)`);
    } else {
      details.push('✗ Missing or invalid actions array');
    }
    
    if (agentData.schedules && Array.isArray(agentData.schedules)) {
      score += 2;
      details.push(`✓ Has schedules array (${agentData.schedules.length} schedules)`);
    } else {
      details.push('✗ Missing or invalid schedules array');
    }

    // Models validation (30 points)
    if (agentData.models && agentData.models.length > 0) {
      const modelScore = scoreModels(agentData.models, expectedCriteria.expectedModels);
      score += modelScore.score;
      details.push(...modelScore.details);
    }

    // Actions validation (30 points)
    if (agentData.actions && agentData.actions.length > 0) {
      const actionScore = scoreActions(agentData.actions, expectedCriteria.expectedActions);
      score += actionScore.score;
      details.push(...actionScore.details);
    }

    // Schedules validation (20 points)
    if (agentData.schedules && agentData.schedules.length > 0) {
      const scheduleScore = scoreSchedules(agentData.schedules, expectedCriteria.expectedSchedules);
      score += scheduleScore.score;
      details.push(...scheduleScore.details);
    }

  } catch (error) {
    details.push(`✗ JSON parsing error: ${error.message}`);
    score = 0;
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    percentage: Math.round((Math.min(score, maxScore) / maxScore) * 100),
    details
  };
}

function scoreModels(models, expectedModels) {
  let score = 0;
  const maxScore = 30;
  const details = [];

  // Check if we have expected number of models (5 points)
  if (models.length >= expectedModels.length) {
    score += 5;
    details.push(`✓ Has sufficient models (${models.length} >= ${expectedModels.length})`);
  } else {
    details.push(`✗ Insufficient models (${models.length} < ${expectedModels.length})`);
  }

  // Check model structure (25 points total)
  let validModels = 0;
  for (const model of models) {
    let modelScore = 0;
    
    if (model.id) modelScore += 1;
    if (model.name) modelScore += 1;
    if (model.description) modelScore += 1;
    if (model.fields && Array.isArray(model.fields) && model.fields.length > 0) {
      modelScore += 2;
      
      // Check field structure
      const validFields = model.fields.filter(field => 
        field.id && field.name && field.type && 
        typeof field.required === 'boolean' &&
        typeof field.unique === 'boolean'
      );
      
      if (validFields.length === model.fields.length) {
        modelScore += 2;
      }
    }
    
    if (modelScore >= 5) {
      validModels++;
      details.push(`✓ Model '${model.name}' is well-structured`);
    } else {
      details.push(`✗ Model '${model.name || 'unnamed'}' has structural issues`);
    }
  }

  score += Math.min(20, (validModels / models.length) * 20);

  return { score, details };
}

function scoreActions(actions, expectedActions) {
  let score = 0;
  const maxScore = 30;
  const details = [];

  // Check if we have expected number of actions (5 points)
  if (actions.length >= expectedActions.length) {
    score += 5;
    details.push(`✓ Has sufficient actions (${actions.length} >= ${expectedActions.length})`);
  } else {
    details.push(`✗ Insufficient actions (${actions.length} < ${expectedActions.length})`);
  }

  // Check action structure (25 points total)
  let validActions = 0;
  for (const action of actions) {
    let actionScore = 0;
    
    if (action.id) actionScore += 1;
    if (action.name) actionScore += 1;
    if (action.description) actionScore += 1;
    if (action.type && ['Create', 'Update'].includes(action.type)) actionScore += 1;
    if (action.execute?.code?.script) actionScore += 2;
    if (action.dataSource) actionScore += 1;
    if (action.results) actionScore += 1;
    
    if (actionScore >= 6) {
      validActions++;
      details.push(`✓ Action '${action.name}' is well-structured`);
    } else {
      details.push(`✗ Action '${action.name || 'unnamed'}' has structural issues`);
    }
  }

  score += Math.min(25, (validActions / actions.length) * 25);

  return { score, details };
}

function scoreSchedules(schedules, expectedSchedules) {
  let score = 0;
  const maxScore = 20;
  const details = [];

  // Check if we have expected number of schedules (5 points)
  if (schedules.length >= expectedSchedules.length) {
    score += 5;
    details.push(`✓ Has sufficient schedules (${schedules.length} >= ${expectedSchedules.length})`);
  } else {
    details.push(`✗ Insufficient schedules (${schedules.length} < ${expectedSchedules.length})`);
  }

  // Check schedule structure (15 points total)
  let validSchedules = 0;
  for (const schedule of schedules) {
    let scheduleScore = 0;
    
    if (schedule.id) scheduleScore += 1;
    if (schedule.name) scheduleScore += 1;
    if (schedule.description) scheduleScore += 1;
    if (schedule.interval?.pattern) scheduleScore += 2;
    if (schedule.execute?.code?.script) scheduleScore += 2;
    
    if (scheduleScore >= 5) {
      validSchedules++;
      details.push(`✓ Schedule '${schedule.name}' is well-structured`);
    } else {
      details.push(`✗ Schedule '${schedule.name || 'unnamed'}' has structural issues`);
    }
  }

  score += Math.min(15, (validSchedules / schedules.length) * 15);

  return { score, details };
}

// API interaction functions
async function makeAPICall(endpoint, method = 'POST', body = null) {
  try {
    const fetch = await import('node-fetch').then(m => m.default);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    log(`API call error: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function testAgentBuilder(scenario, iteration) {
  log(`Testing scenario: ${scenario.name} (Iteration ${iteration})`);
  
  try {
    // Create a chat session and send the prompt
    const chatId = `test-${scenario.id}-${iteration}-${Date.now()}`;
    
    const requestBody = {
      id: chatId,
      messages: [
        {
          role: 'user',
          content: scenario.prompt
        }
      ]
    };

    // Make the API call to the chat endpoint
    const response = await makeAPICall('/api/chat', 'POST', requestBody);
    
    // Extract agent data from response
    let agentData = null;
    if (response?.content) {
      // Try to find agent data in the response
      if (typeof response.content === 'string') {
        // Look for JSON in the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            agentData = JSON.parse(jsonMatch[0]);
          } catch (e) {
            log(`Failed to parse JSON from response: ${e.message}`, 'WARN');
          }
        }
      } else if (typeof response.content === 'object') {
        agentData = response.content;
      }
    }

    if (!agentData) {
      log('No agent data found in response', 'WARN');
      return { score: 0, details: ['No agent data returned'], agentData: null };
    }

    // Score the result
    const scoreResult = scoreAgentResult(agentData, scenario);
    
    // Save the result
    const resultFile = path.join(CONFIG.RESULTS_DIR, `${scenario.id}-${iteration}.json`);
    fs.writeFileSync(resultFile, JSON.stringify({
      scenario: scenario.name,
      iteration,
      timestamp: new Date().toISOString(),
      score: scoreResult,
      agentData
    }, null, 2));

    log(`Scenario ${scenario.name} scored ${scoreResult.percentage}% (${scoreResult.score}/${scoreResult.maxScore})`);
    
    return {
      score: scoreResult.percentage,
      details: scoreResult.details,
      agentData
    };

  } catch (error) {
    log(`Error testing scenario ${scenario.name}: ${error.message}`, 'ERROR');
    return { score: 0, details: [`Error: ${error.message}`], agentData: null };
  }
}

// Generate new test ideas dynamically
function generateNewTestIdea(previousResults) {
  const domains = ['healthcare', 'education', 'finance', 'retail', 'manufacturing', 'real-estate', 'food-service', 'transportation'];
  const complexities = ['simple', 'moderate', 'complex'];
  const features = ['automation', 'analytics', 'integration', 'workflow', 'reporting', 'notifications'];
  
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const complexity = complexities[Math.floor(Math.random() * complexities.length)];
  const feature = features[Math.floor(Math.random() * features.length)];
  
  return {
    id: `generated-${domain}-${Date.now()}`,
    name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} ${complexity.charAt(0).toUpperCase() + complexity.slice(1)} System`,
    description: `A ${complexity} ${domain} system with ${feature} capabilities`,
    prompt: `Create a ${complexity} ${domain} management system that focuses on ${feature}. Include all necessary data models, business logic actions, and automated schedules.`,
    expectedModels: ['Entity1', 'Entity2', 'Entity3'],
    expectedActions: ['Action1', 'Action2'],
    expectedSchedules: ['Schedule1']
  };
}

// Reorganize test steps based on failures
function reorganizeSteps(failurePatterns) {
  log('Reorganizing test steps based on failure patterns...', 'INFO');
  
  // Analyze common failure patterns
  const modelFailures = failurePatterns.filter(p => p.includes('model')).length;
  const actionFailures = failurePatterns.filter(p => p.includes('action')).length;
  const scheduleFailures = failurePatterns.filter(p => p.includes('schedule')).length;
  
  // Reorder scenarios based on failure patterns
  let reorganizedSteps = [];
  
  if (modelFailures > actionFailures && modelFailures > scheduleFailures) {
    log('Focusing on model-heavy scenarios first', 'INFO');
    reorganizedSteps = [...TEST_SCENARIOS].sort((a, b) => b.expectedModels.length - a.expectedModels.length);
  } else if (actionFailures > scheduleFailures) {
    log('Focusing on action-heavy scenarios first', 'INFO');
    reorganizedSteps = [...TEST_SCENARIOS].sort((a, b) => b.expectedActions.length - a.expectedActions.length);
  } else {
    log('Focusing on schedule-heavy scenarios first', 'INFO');
    reorganizedSteps = [...TEST_SCENARIOS].sort((a, b) => b.expectedSchedules.length - a.expectedSchedules.length);
  }
  
  return reorganizedSteps;
}

// Main test runner
async function runAgentBuilderTests() {
  log('Starting Agent Builder Comprehensive Testing', 'INFO');
  log(`Target score: ${CONFIG.TARGET_SCORE}%`, 'INFO');
  log(`Maximum iterations: ${CONFIG.MAX_ITERATIONS}`, 'INFO');
  
  let currentScenarios = [...TEST_SCENARIOS];
  let iteration = 1;
  let bestScore = 0;
  let bestResult = null;
  const failurePatterns = [];
  let consecutiveFailures = 0;
  
  // Check if server is running
  try {
    await makeAPICall('/api/health', 'GET');
    log('Server is running and accessible', 'INFO');
  } catch (error) {
    log('Server is not accessible. Please start the development server with: npm run dev', 'ERROR');
    log('Attempting to start server automatically...', 'INFO');
    
    // Try to start the server
    const serverProcess = spawn('npm', ['run', 'dev'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
      await makeAPICall('/api/health', 'GET');
      log('Server started successfully', 'INFO');
    } catch (e) {
      log('Failed to start server automatically. Please start it manually and try again.', 'ERROR');
      process.exit(1);
    }
  }
  
  while (iteration <= CONFIG.MAX_ITERATIONS && bestScore < CONFIG.TARGET_SCORE) {
    log(`\n=== ITERATION ${iteration} ===`, 'INFO');
    
    // Select scenario for this iteration
    const scenarioIndex = (iteration - 1) % currentScenarios.length;
    let currentScenario = currentScenarios[scenarioIndex];
    
    // Every 10 iterations, try a generated scenario
    if (iteration % 10 === 0) {
      currentScenario = generateNewTestIdea(failurePatterns);
      log(`Using generated scenario: ${currentScenario.name}`, 'INFO');
    }
    
    // Test the scenario
    const result = await testAgentBuilder(currentScenario, iteration);
    
    // Track results
    if (result.score > bestScore) {
      bestScore = result.score;
      bestResult = result;
      consecutiveFailures = 0;
      log(`New best score: ${bestScore}%`, 'INFO');
    } else {
      consecutiveFailures++;
      failurePatterns.push(...result.details.filter(d => d.startsWith('✗')));
    }
    
    // Log current status
    log(`Current score: ${result.score}% | Best score: ${bestScore}% | Consecutive failures: ${consecutiveFailures}`, 'INFO');
    
    // Reorganize steps if too many consecutive failures
    if (consecutiveFailures >= 5) {
      log('Too many consecutive failures, reorganizing test steps...', 'WARN');
      currentScenarios = reorganizeSteps(failurePatterns);
      consecutiveFailures = 0;
      
      // Add some advanced scenarios to the mix
      if (iteration > 20) {
        currentScenarios.push(...ADVANCED_SCENARIOS);
        log('Added advanced scenarios to test suite', 'INFO');
      }
    }
    
    // Check if we've reached the target
    if (bestScore >= CONFIG.TARGET_SCORE) {
      log(`\n🎉 TARGET ACHIEVED! Best score: ${bestScore}%`, 'INFO');
      break;
    }
    
    // Brief pause between iterations
    await new Promise(resolve => setTimeout(resolve, 2000));
    iteration++;
  }
  
  // Final summary
  log(`\n=== FINAL SUMMARY ===`, 'INFO');
  log(`Total iterations: ${iteration - 1}`, 'INFO');
  log(`Best score achieved: ${bestScore}%`, 'INFO');
  log(`Target score: ${CONFIG.TARGET_SCORE}%`, 'INFO');
  log(`Target ${bestScore >= CONFIG.TARGET_SCORE ? 'ACHIEVED' : 'NOT ACHIEVED'}`, bestScore >= CONFIG.TARGET_SCORE ? 'INFO' : 'WARN');
  
  if (bestResult) {
    log('Best result details:', 'INFO');
    bestResult.details.forEach(detail => log(`  ${detail}`, 'INFO'));
  }
  
  // Generate final report
  const reportFile = path.join(CONFIG.RESULTS_DIR, 'final-report.json');
  fs.writeFileSync(reportFile, JSON.stringify({
    summary: {
      totalIterations: iteration - 1,
      bestScore,
      targetScore: CONFIG.TARGET_SCORE,
      targetAchieved: bestScore >= CONFIG.TARGET_SCORE,
      timestamp: new Date().toISOString()
    },
    bestResult,
    failurePatterns: [...new Set(failurePatterns)]
  }, null, 2));
  
  log(`Final report saved to: ${reportFile}`, 'INFO');
  
  // Keep the process running if target not achieved
  if (bestScore < CONFIG.TARGET_SCORE) {
    log('\nTarget not achieved. Continuing to test...', 'INFO');
    log('Press Ctrl+C to stop the testing process.', 'INFO');
    
    // Continue testing indefinitely
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Generate a new test scenario
      const newScenario = generateNewTestIdea(failurePatterns);
      const result = await testAgentBuilder(newScenario, iteration);
      
      if (result.score > bestScore) {
        bestScore = result.score;
        log(`New best score: ${bestScore}%`, 'INFO');
        
        if (bestScore >= CONFIG.TARGET_SCORE) {
          log(`🎉 TARGET FINALLY ACHIEVED! Score: ${bestScore}%`, 'INFO');
          break;
        }
      }
      
      iteration++;
    }
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log('\nReceived SIGINT. Generating final report...', 'INFO');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\nReceived SIGTERM. Generating final report...', 'INFO');
  process.exit(0);
});

// Start the testing process
if (require.main === module) {
  runAgentBuilderTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  runAgentBuilderTests,
  scoreAgentResult,
  TEST_SCENARIOS,
  ADVANCED_SCENARIOS
}; 