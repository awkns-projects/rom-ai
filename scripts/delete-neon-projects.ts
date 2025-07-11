#!/usr/bin/env tsx

import { execSync } from 'child_process';

/**
 * Script to delete all Neon projects
 * 
 * Prerequisites:
 * - Install Neon CLI: npm install -g @neondatabase/cli
 * - Login to Neon: neon auth login
 * 
 * Usage:
 * - Run with confirmation: npx tsx scripts/delete-neon-projects.ts
 * - Run without confirmation: npx tsx scripts/delete-neon-projects.ts --force
 */

interface NeonProject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

async function getNeonProjects(): Promise<NeonProject[]> {
  try {
    console.log('📋 Fetching Neon projects...');
    const output = execSync('neon projects list --output json', { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('❌ Error fetching Neon projects:', error);
    console.error('Make sure you have the Neon CLI installed and are logged in:');
    console.error('  npm install -g @neondatabase/cli');
    console.error('  neon auth login');
    process.exit(1);
  }
}

async function deleteNeonProject(projectId: string, projectName: string): Promise<boolean> {
  try {
    console.log(`🗑️  Deleting Neon project: ${projectName} (${projectId})`);
    execSync(`neon projects delete ${projectId} --confirm`, { encoding: 'utf8' });
    console.log(`✅ Successfully deleted: ${projectName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete ${projectName}:`, error);
    return false;
  }
}

async function confirmDeletion(projects: NeonProject[]): Promise<boolean> {
  const force = process.argv.includes('--force');
  
  if (force) {
    return true;
  }

  console.log('\n🚨 WARNING: This will permanently delete ALL your Neon projects!');
  console.log('\nProjects to be deleted:');
  projects.forEach(project => {
    console.log(`  - ${project.name} (${project.id}) - Created: ${new Date(project.created_at).toLocaleDateString()}`);
  });

  console.log('\n❓ Are you sure you want to continue? (type "DELETE ALL" to confirm)');
  
  // Simple confirmation check
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('> ', (answer: string) => {
      rl.close();
      resolve(answer.trim() === 'DELETE ALL');
    });
  });
}

async function main() {
  console.log('🔥 Neon Projects Deletion Script');
  console.log('================================\n');

  const projects = await getNeonProjects();
  
  if (projects.length === 0) {
    console.log('✨ No Neon projects found to delete.');
    return;
  }

  console.log(`📊 Found ${projects.length} Neon project(s)`);

  const confirmed = await confirmDeletion(projects);
  
  if (!confirmed) {
    console.log('❌ Deletion cancelled.');
    return;
  }

  console.log('\n🚀 Starting deletion process...\n');

  let deletedCount = 0;
  let failedCount = 0;

  for (const project of projects) {
    const success = await deleteNeonProject(project.id, project.name);
    if (success) {
      deletedCount++;
    } else {
      failedCount++;
    }
  }

  console.log('\n📈 Deletion Summary:');
  console.log(`✅ Successfully deleted: ${deletedCount} projects`);
  console.log(`❌ Failed to delete: ${failedCount} projects`);
  
  if (deletedCount > 0) {
    console.log('\n🎉 Neon projects deletion completed!');
  }
}

main().catch(console.error); 