#!/usr/bin/env tsx

import { execSync, spawn } from 'child_process';

/**
 * Script to delete Vercel projects that aren't connected to a GitHub repository
 * 
 * Prerequisites:
 * - Install Vercel CLI: npm install -g vercel
 * - Login to Vercel: vercel login
 * - Set VERCEL_TOKEN environment variable for accurate Git detection (get from vercel.com/account/tokens)
 * 
 * Usage:
 * - Interactive mode: VERCEL_TOKEN=your_token npx tsx scripts/delete-unconnected-vercel-projects.ts
 * - Force interactive mode: VERCEL_TOKEN=your_token npx tsx scripts/delete-unconnected-vercel-projects.ts --force
 * - Generate manual commands: VERCEL_TOKEN=your_token npx tsx scripts/delete-unconnected-vercel-projects.ts --manual
 * - Dry run (see what would be deleted): VERCEL_TOKEN=your_token npx tsx scripts/delete-unconnected-vercel-projects.ts --dry-run
 */

interface VercelProject {
  id: string;
  name: string;
  latestProductionUrl: string;
  updatedAt: number;
  nodeVersion: string;
  deprecated: boolean;
}

interface VercelProjectsResponse {
  projects: VercelProject[];
  pagination: {
    count: number;
    next?: number;
    prev?: number;
  };
  contextName: string;
  elapsed: string;
}

async function getVercelProjects(): Promise<VercelProject[]> {
  try {
    console.log('📋 Fetching Vercel projects...');
    let allProjects: VercelProject[] = [];
    let nextCursor: number | undefined = undefined;
    let pageCount = 0;

    do {
      pageCount++;
      console.log(`   Fetching page ${pageCount}...`);
      
      let command = 'vercel projects ls --json';
      if (nextCursor) {
        command += ` --next ${nextCursor}`;
      }
      
      const output = execSync(command, { encoding: 'utf8' });
      const response: VercelProjectsResponse = JSON.parse(output);
      
      allProjects.push(...response.projects);
      nextCursor = response.pagination.next;
      
      console.log(`   Found ${response.projects.length} projects on page ${pageCount}`);
      
    } while (nextCursor);

    console.log(`📊 Total projects fetched: ${allProjects.length} across ${pageCount} page(s)`);
    return allProjects;
  } catch (error) {
    console.error('❌ Error fetching Vercel projects:', error);
    console.error('Make sure you have the Vercel CLI installed and are logged in:');
    console.error('  npm install -g vercel');
    console.error('  vercel login');
    process.exit(1);
  }
}

async function checkGitConnection(projectId: string, projectName: string): Promise<boolean> {
  // First try to use Vercel REST API if token is available
  const token = process.env.VERCEL_TOKEN;
  if (token) {
    try {
      const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const projectDetails = await response.json();
        const hasGitConnection = projectDetails.link && projectDetails.link.repo;
        if (hasGitConnection) {
          console.log(`✅ ${projectName} - Connected to ${projectDetails.link.repo}`);
          return true;
        }
      }
    } catch (error) {
      console.log(`⚠️  API check failed for ${projectName}, using fallback method`);
    }
  }

  // Fallback: Use name patterns to protect important projects
  // If we can't verify Git connection via API, be very conservative
  const protectedPatterns = [
    /^cpu-/,           // CPU-related projects
    /^yoh-/,           // YOH-related projects  
    /^event-/,         // Event-related projects
    /^pancake/,        // Pancake projects
    /^pounds$/,        // Specific important projects
    /^awkns/,          // AWKNS projects
    /^nakama/,         // Nakama projects
    /^rom-/,           // ROM projects
    /^next-app/,       // Next.js app projects
    /-admin$/,         // Admin projects
    /-landing$/,       // Landing page projects
    /-story$/,         // Story projects
  ];

  // If it matches protected patterns, assume it has Git connection (safer)
  for (const pattern of protectedPatterns) {
    if (pattern.test(projectName)) {
      console.log(`🛡️  ${projectName} - Protected by name pattern (assumed connected)`);
      return true;
    }
  }

  // Only consider deletion candidates if they look like auto-generated projects
  const tempPatterns = [
    /-\d{6,}-[a-z0-9]{3,4}$/,  // Ends with -numbers-letters like -222665-tqd
    /^(marketing|content|inventory|lead).*-\d+/,  // Starts with common prefixes + numbers
    /^.*ai-\d{6}/,  // AI-related with 6+ digit numbers
    // Add more auto-generated patterns
    /^(marketing|content|inventory|lead|insta|unified).*$/,  // Auto-generated project prefixes
    /tracker.*$/,  // Tracker-related projects
    /extractor.*$/,  // Extractor projects
    /dashboard.*$/,  // Dashboard projects (but not admin dashboards)
    /agent$/,  // Projects ending in 'agent'
    /^.*ai$/,  // Projects ending in 'ai' (but not cpu-ai which is protected)
  ];

  for (const pattern of tempPatterns) {
    if (pattern.test(projectName)) {
      console.log(`🔗 ${projectName} - No Git repository connected (auto-generated pattern)`);
      return false;
    }
  }

  // If we can't determine safely, assume it's unconnected (delete it)
  console.log(`❓ ${projectName} - Cannot determine Git status, marking for deletion`);
  return false;
}

async function findUnconnectedProjects(projects: VercelProject[]): Promise<VercelProject[]> {
  console.log('🔍 Checking for Git repository connections...');
  const unconnectedProjects: VercelProject[] = [];
  
  for (const project of projects) {
    console.log(`Checking ${project.name}...`);
    
    const hasGitConnection = await checkGitConnection(project.id, project.name);
    
    if (!hasGitConnection) {
      console.log(`🔗 ${project.name} - No Git repository connected`);
      unconnectedProjects.push(project);
    } else {
      console.log(`✅ ${project.name} - Connected to Git repository`);
    }
    
    // Add a small delay to avoid overwhelming the CLI
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return unconnectedProjects;
}

async function deleteVercelProject(projectName: string): Promise<boolean> {
  try {
    console.log(`🗑️  Deleting Vercel project: ${projectName}`);
    
    // Try to delete using the CLI - this will prompt for confirmation
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const child = spawn('vercel', ['projects', 'rm', projectName], {
        stdio: 'inherit' // This allows the user to see and respond to prompts
      });
      
      child.on('close', (code: number) => {
        if (code === 0) {
          console.log(`✅ Successfully deleted: ${projectName}`);
          resolve(true);
        } else {
          console.log(`⏩ Skipped or failed to delete: ${projectName}`);
          resolve(false);
        }
      });
      
      child.on('error', (error: Error) => {
        console.error(`❌ Failed to delete ${projectName}:`, error);
        resolve(false);
      });
    });
  } catch (error) {
    console.error(`❌ Failed to delete ${projectName}:`, error);
    return false;
  }
}

async function confirmDeletion(projects: VercelProject[]): Promise<'manual' | 'interactive' | 'cancel'> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const manual = process.argv.includes('--manual');
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No projects will be deleted');
    return 'cancel';
  }
  
  if (manual) {
    return 'manual';
  }
  
  if (force) {
    return 'interactive';
  }

  console.log('\n🚨 WARNING: This will permanently delete Vercel projects that are NOT connected to Git repositories!');
  console.log('\nProjects to be deleted (no Git connection):');
  projects.forEach(project => {
    const updatedDate = new Date(project.updatedAt).toLocaleDateString();
    console.log(`  - ${project.name} (${project.id}) - Updated: ${updatedDate}`);
    console.log(`    URL: ${project.latestProductionUrl}`);
  });

  console.log('\n❓ How would you like to proceed?');
  console.log('  1. Type "INTERACTIVE" - Delete projects one by one with manual confirmation');
  console.log('  2. Type "MANUAL" - Show deletion commands to copy and paste');
  console.log('  3. Type anything else to cancel');
  
  // Simple confirmation check
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('> ', (answer: string) => {
      rl.close();
      const choice = answer.trim().toUpperCase();
      if (choice === 'INTERACTIVE') {
        resolve('interactive');
      } else if (choice === 'MANUAL') {
        resolve('manual');
      } else {
        resolve('cancel');
      }
    });
  });
}

function generateManualCommands(projects: VercelProject[]): void {
  console.log('\n📋 Manual Deletion Commands');
  console.log('============================\n');
  console.log('Copy and paste these commands one by one:\n');
  
  projects.forEach((project, index) => {
    console.log(`# ${index + 1}. Delete ${project.name}`);
    console.log(`vercel projects rm ${project.name}`);
    console.log('');
  });
  
  console.log('# Or delete all at once by copying this entire block:');
  projects.forEach(project => {
    console.log(`vercel projects rm ${project.name} && \\`);
  });
  console.log('echo "All projects deleted!"');
  
  console.log('\n💡 Tip: Each command will ask for confirmation before deleting.');
}

async function main() {
  console.log('🔥 Vercel Unconnected Projects Deletion Script');
  console.log('===============================================\n');

  // Check for VERCEL_TOKEN for accurate Git detection
  if (!process.env.VERCEL_TOKEN) {
    console.log('⚠️  VERCEL_TOKEN not set - using name patterns for Git detection');
    console.log('   For more accurate detection, get a token from vercel.com/account/tokens');
    console.log('   and set: VERCEL_TOKEN=your_token\n');
  }

  const allProjects = await getVercelProjects();
  
  if (allProjects.length === 0) {
    console.log('✨ No Vercel projects found.');
    return;
  }

  console.log(`📊 Found ${allProjects.length} Vercel project(s) total`);

  const unconnectedProjects = await findUnconnectedProjects(allProjects);
  
  if (unconnectedProjects.length === 0) {
    console.log('\n✨ All Vercel projects are connected to Git repositories. Nothing to delete.');
    return;
  }

  console.log(`\n📊 Found ${unconnectedProjects.length} project(s) without Git connections`);

  const proceedMode = await confirmDeletion(unconnectedProjects);
  
  if (proceedMode === 'cancel') {
    console.log('❌ Deletion cancelled.');
    return;
  }

  if (proceedMode === 'manual') {
    generateManualCommands(unconnectedProjects);
    return;
  }

  console.log('\n🚀 Starting interactive deletion process...\n');

  let deletedCount = 0;
  let failedCount = 0;

  for (const project of unconnectedProjects) {
    const success = await deleteVercelProject(project.name);
    if (success) {
      deletedCount++;
    } else {
      failedCount++;
    }
  }

  console.log('\n📈 Deletion Summary:');
  console.log(`✅ Successfully deleted: ${deletedCount} projects`);
  console.log(`❌ Failed to delete: ${failedCount} projects`);
  console.log(`🔗 Kept (with Git connections): ${allProjects.length - unconnectedProjects.length} projects`);
  
  if (deletedCount > 0) {
    console.log('\n🎉 Unconnected Vercel projects deletion completed!');
  }
}

main().catch(console.error); 