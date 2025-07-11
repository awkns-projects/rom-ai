#!/usr/bin/env npx tsx

// Load environment variables from .env.local
import { config } from 'dotenv';
import path from 'path';

// Load .env.local first
config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Simple test to verify Neon API functionality
 */

class NeonClient {
  private apiKey: string;
  private baseUrl = 'https://console.neon.tech/api/v2';
  private lastRequestTime = 0;
  private readonly minRequestInterval = 500;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before next Neon API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.rateLimit();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Neon API error: ${response.status} ${response.statusText}\nResponse: ${errorText}`);
    }

    return response.json();
  }

  async createProject(name: string, region: string = 'aws-us-east-1') {
    console.log(`🗄️ Creating Neon project: ${name}`);
    
    const project = await this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        project: {
          name: name,
          region_id: region,
          pg_version: 16,
          store_passwords: true
        }
      }),
    });

    console.log(`✅ Neon project created: ${project.project.id}`);
    return project;
  }

  async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`);
  }

  async getConnectionString(projectId: string, databaseName: string = 'neondb') {
    console.log(`🔗 Retrieving connection URI for project: ${projectId}`);
    
    try {
      // Get connection URI using the proper API endpoint with database_name parameter
      const connectionResponse = await this.request(`/projects/${projectId}/connection_uri?database_name=${encodeURIComponent(databaseName)}&role_name=neondb_owner`);
      let connectionString = connectionResponse.uri;
      
      if (!connectionString) {
        throw new Error('No connection URI returned from API');
      }
      
      console.log(`✅ Connection string retrieved successfully`);
      return connectionString;
      
    } catch (error) {
      console.error(`❌ Failed to retrieve connection URI: ${error}`);
      throw error;
    }
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, { method: 'DELETE' });
  }
}

async function main() {
  const neonApiKey = process.env.NEON_API_KEY;

  if (!neonApiKey) {
    console.error('❌ Missing NEON_API_KEY environment variable');
    process.exit(1);
  }

  const neonClient = new NeonClient(neonApiKey);
  const testProjectName = `test-neon-${Date.now()}`;

  console.log('🧪 Testing Neon Database Functionality');
  console.log('=====================================\n');

  try {
    // Create a test project
    const project = await neonClient.createProject(testProjectName);
    const projectId = project.project.id;
    
    console.log(`📋 Project Details:`);
    console.log(`  ID: ${projectId}`);
    console.log(`  Name: ${project.project.name}`);
    console.log(`  Region: ${project.project.region_id}`);
    console.log(`  Created: ${project.project.created_at}`);
    
    // Test connection string retrieval
    console.log('\n🔗 Testing connection string retrieval...');
    const connectionString = await neonClient.getConnectionString(projectId);
    
    console.log('✅ Connection string obtained successfully!');
    console.log(`📝 Connection: ${connectionString.substring(0, 30)}...[hidden]`);
    
    // Clean up - delete the test project
    console.log('\n🗑️ Cleaning up test project...');
    await neonClient.deleteProject(projectId);
    console.log('✅ Test project deleted');
    
    console.log('\n🎉 All Neon tests passed!');
    
  } catch (error) {
    console.error('❌ Neon test failed:', error);
    process.exit(1);
  }
}

main(); 