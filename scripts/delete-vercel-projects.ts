#!/usr/bin/env tsx

import { execSync } from 'child_process';

/**
 * Script to delete all Vercel projects
 * 
 * Prerequisites:
 * - Install Vercel CLI: npm install -g vercel
 * - Login to Vercel: vercel login
 * 
 * Usage:
 * - Run with confirmation: npx tsx scripts/delete-vercel-projects.ts
 * - Run without confirmation: npx tsx scripts/delete-vercel-projects.ts --force
 */

interface VercelProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  framework?: string;
}

async function getVercelProjects(): Promise<VercelProject[]> {
  try {
    console.log('📋 Fetching Vercel projects...');
    const output = execSync('vercel projects ls --format json', { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('❌ Error fetching Vercel projects:', error);
    console.error('Make sure you have the Vercel CLI installed and are logged in:');
    console.error('  npm install -g vercel');
    console.error('  vercel login');
    process.exit(1);
  }
}

async function deleteVercelProject(projectId: string, projectName: string): Promise<boolean> {
  try {
    console.log(`🗑️  Deleting Vercel project: ${projectName} (${projectId})`);
    execSync(`vercel projects rm ${projectName} --yes`, { encoding: 'utf8' });
    console.log(`✅ Successfully deleted: ${projectName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete ${projectName}:`, error);
    return false;
  }
}

async function confirmDeletion(projects: VercelProject[]): Promise<boolean> {
  const force = process.argv.includes('--force');
  
  if (force) {
    return true;
  }

  console.log('\n🚨 WARNING: This will permanently delete ALL your Vercel projects!');
  console.log('\nProjects to be deleted:');
  projects.forEach(project => {
    const createdDate = new Date(project.createdAt).toLocaleDateString();
    const framework = project.framework ? ` (${project.framework})` : '';
    console.log(`  - ${project.name} (${project.id})${framework} - Created: ${createdDate}`);
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
  console.log('🔥 Vercel Projects Deletion Script');
  console.log('==================================\n');

  const projects = await getVercelProjects();
  
  if (projects.length === 0) {
    console.log('✨ No Vercel projects found to delete.');
    return;
  }

  console.log(`📊 Found ${projects.length} Vercel project(s)`);

  const confirmed = await confirmDeletion(projects);
  
  if (!confirmed) {
    console.log('❌ Deletion cancelled.');
    return;
  }

  console.log('\n🚀 Starting deletion process...\n');

  let deletedCount = 0;
  let failedCount = 0;

  for (const project of projects) {
    const success = await deleteVercelProject(project.id, project.name);
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
    console.log('\n🎉 Vercel projects deletion completed!');
  }
}

main().catch(console.error); 