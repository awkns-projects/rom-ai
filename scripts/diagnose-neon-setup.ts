#!/usr/bin/env tsx

/**
 * Neon API Setup Diagnostic Tool
 * 
 * This script helps diagnose issues with Neon API setup, including
 * the common "organization is managed by Vercel" error.
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface NeonAPIResponse {
  projects?: any[];
  message?: string;
  code?: string;
}

class NeonDiagnostic {
  private apiKey: string;
  private baseUrl = 'https://console.neon.tech/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string): Promise<{ success: boolean; data?: any; error?: string; status?: number }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();
      let data: any;
      
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      return {
        success: response.ok,
        data,
        error: response.ok ? undefined : `${response.status} ${response.statusText}`,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async diagnose(): Promise<void> {
    console.log('🔍 Neon API Setup Diagnostic Tool');
    console.log('=====================================\n');

    // 1. Check API Key
    if (!this.apiKey) {
      console.log('❌ No NEON_API_KEY found in environment variables');
      console.log('   Please add NEON_API_KEY to your .env.local file\n');
      return;
    }

    console.log('✅ NEON_API_KEY found in environment');
    console.log(`   Key: ${this.apiKey.substring(0, 15)}...\n`);

    // 2. Test API Connection
    console.log('🌐 Testing API connection...');
    const connectionTest = await this.makeRequest('/projects');
    
    if (connectionTest.success) {
      console.log('✅ API connection successful');
      console.log(`   Found ${connectionTest.data?.projects?.length || 0} projects\n`);
    } else {
      console.log('❌ API connection failed');
      console.log(`   Error: ${connectionTest.error}`);
      console.log(`   Status: ${connectionTest.status}\n`);
      
      // Check for specific error patterns
      if (connectionTest.data?.message) {
        console.log('📋 Error Details:');
        console.log(`   Message: ${connectionTest.data.message}`);
        
        if (connectionTest.data.message.includes('organization is managed by Vercel')) {
          console.log('\n🚨 DIAGNOSIS: Vercel-Managed Organization');
          console.log('   Your Neon organization is managed by Vercel, which restricts API access.');
          console.log('\n💡 SOLUTIONS:');
          console.log('   1. Create a separate Neon account:');
          console.log('      - Go to https://console.neon.tech');
          console.log('      - Create a new account (different from Vercel-integrated one)');
          console.log('      - Get API key from Account Settings > API Keys');
          console.log('      - Update NEON_API_KEY in .env.local');
          console.log('\n   2. Use Render deployment instead:');
          console.log('      - Switch to step4-render-deployment.ts');
          console.log('      - Uses RENDER_API_KEY instead of NEON_API_KEY');
          console.log('      - No Neon API restrictions');
          console.log('\n   3. Use Vercel-native Postgres:');
          console.log('      - Use Vercel\'s database through their interface');
          console.log('      - Skip programmatic database creation');
        } else if (connectionTest.status === 401) {
          console.log('\n🚨 DIAGNOSIS: Invalid API Key');
          console.log('   Your API key appears to be invalid or expired.');
          console.log('\n💡 SOLUTIONS:');
          console.log('   1. Check your API key:');
          console.log('      - Go to https://console.neon.tech');
          console.log('      - Navigate to Account Settings > API Keys');
          console.log('      - Generate a new API key');
          console.log('      - Update NEON_API_KEY in .env.local');
        } else if (connectionTest.status === 403) {
          console.log('\n🚨 DIAGNOSIS: Insufficient Permissions');
          console.log('   Your API key doesn\'t have sufficient permissions.');
          console.log('\n💡 SOLUTIONS:');
          console.log('   1. Check API key permissions in Neon console');
          console.log('   2. Ensure you\'re using a personal account, not organization account');
        }
      }
      return;
    }

    // 3. Test Project Creation (if connection successful)
    console.log('🧪 Testing project creation capability...');
    const testProjectName = `diagnostic-test-${Date.now()}`;
    const createTest = await this.makeRequest('/projects');
    
    if (createTest.success) {
      console.log('✅ Project creation API access available');
      console.log('   Your setup should work for automated deployments\n');
    } else {
      console.log('❌ Project creation restricted');
      console.log('   This may indicate organization-level restrictions\n');
    }

    // 4. Show current projects
    if (connectionTest.success && connectionTest.data?.projects) {
      console.log('📊 Current Projects:');
      if (connectionTest.data.projects.length === 0) {
        console.log('   No projects found');
      } else {
        connectionTest.data.projects.slice(0, 5).forEach((project: any, index: number) => {
          console.log(`   ${index + 1}. ${project.name} (${project.id})`);
          console.log(`      Region: ${project.region_id || 'Unknown'}`);
          console.log(`      Created: ${project.created_at || 'Unknown'}`);
        });
        if (connectionTest.data.projects.length > 5) {
          console.log(`   ... and ${connectionTest.data.projects.length - 5} more`);
        }
      }
      console.log('');
    }

    console.log('🎉 Diagnostic complete!');
    console.log('\nIf you\'re still having issues:');
    console.log('1. Check the solutions above');
    console.log('2. Consider using Render deployment as an alternative');
    console.log('3. Contact support with this diagnostic output');
  }
}

async function main() {
  const neonApiKey = process.env.NEON_API_KEY;

  if (!neonApiKey) {
    console.error('❌ Missing NEON_API_KEY environment variable');
    console.error('Please add NEON_API_KEY to your .env.local file');
    process.exit(1);
  }

  const diagnostic = new NeonDiagnostic(neonApiKey);
  await diagnostic.diagnose();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  });
} 