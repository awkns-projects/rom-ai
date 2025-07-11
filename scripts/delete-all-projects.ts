#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { join } from 'path';

/**
 * Combined script to delete ALL Neon and Vercel projects
 * 
 * Prerequisites:
 * - Install Neon CLI: npm install -g @neondatabase/cli
 * - Install Vercel CLI: npm install -g vercel
 * - Login to Neon: neon auth login
 * - Login to Vercel: vercel login
 * 
 * Usage:
 * - Run with confirmation: npx tsx scripts/delete-all-projects.ts
 * - Run without confirmation: npx tsx scripts/delete-all-projects.ts --force
 */

async function runScript(scriptPath: string, scriptName: string): Promise<boolean> {
  try {
    console.log(`\n🚀 Running ${scriptName}...`);
    console.log('='.repeat(50));
    
    const forceFlag = process.argv.includes('--force') ? ' --force' : '';
    const command = `npx tsx ${scriptPath}${forceFlag}`;
    
    execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd() 
    });
    
    console.log(`✅ ${scriptName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${scriptName} failed:`, error);
    return false;
  }
}

async function confirmDeletion(): Promise<boolean> {
  const force = process.argv.includes('--force');
  
  if (force) {
    return true;
  }

  console.log('🚨 ULTIMATE WARNING: This will permanently delete ALL your projects!');
  console.log('📋 This script will:');
  console.log('  1. Delete ALL Neon database projects');
  console.log('  2. Delete ALL Vercel deployment projects');
  console.log('');
  console.log('⚠️  This action is IRREVERSIBLE and will destroy all your data!');
  console.log('');
  console.log('❓ Are you absolutely sure you want to continue?');
  console.log('   Type "DELETE EVERYTHING" to confirm:');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('> ', (answer: string) => {
      rl.close();
      resolve(answer.trim() === 'DELETE EVERYTHING');
    });
  });
}

async function main() {
  console.log('🔥 ULTIMATE PROJECT DELETION SCRIPT');
  console.log('===================================');
  console.log('🗑️  Neon + Vercel Projects Destroyer');
  console.log('===================================\n');

  const confirmed = await confirmDeletion();
  
  if (!confirmed) {
    console.log('❌ Deletion cancelled. Your projects are safe!');
    return;
  }

  console.log('\n💀 Starting COMPLETE project destruction...\n');

  const scriptsDir = join(__dirname);
  const neonScript = join(scriptsDir, 'delete-neon-projects.ts');
  const vercelScript = join(scriptsDir, 'delete-vercel-projects.ts');

  let successCount = 0;
  let failureCount = 0;

  // Run Neon deletion script
  const neonSuccess = await runScript(neonScript, 'Neon Projects Deletion');
  if (neonSuccess) {
    successCount++;
  } else {
    failureCount++;
  }

  // Run Vercel deletion script
  const vercelSuccess = await runScript(vercelScript, 'Vercel Projects Deletion');
  if (vercelSuccess) {
    successCount++;
  } else {
    failureCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL DESTRUCTION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful deletions: ${successCount}/2`);
  console.log(`❌ Failed deletions: ${failureCount}/2`);
  
  if (successCount === 2) {
    console.log('\n🎉 COMPLETE ANNIHILATION SUCCESSFUL!');
    console.log('💀 All your Neon and Vercel projects have been destroyed!');
  } else if (successCount > 0) {
    console.log('\n⚠️  PARTIAL DESTRUCTION COMPLETED');
    console.log('Some projects were deleted, but others failed.');
  } else {
    console.log('\n❌ DESTRUCTION FAILED');
    console.log('No projects were deleted due to errors.');
  }
  
  console.log('\n🏁 Script execution completed.');
}

main().catch(console.error); 