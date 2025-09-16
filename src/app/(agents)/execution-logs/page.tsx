'use client';

import React, { useState } from 'react';
import { ExecutionLogViewer } from '@/components/execution-logs/execution-log-viewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Search, 
  User, 
  Settings,
  Info
} from 'lucide-react';

export default function ExecutionLogsPage() {
  const [viewMode, setViewMode] = useState<'all' | 'user' | 'execution'>('all');
  const [userId, setUserId] = useState('');
  const [executionId, setExecutionId] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showParameters, setShowParameters] = useState(true);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Action Execution Logs
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and debug action executions with step-by-step details
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            View Settings
          </CardTitle>
          <CardDescription>
            Configure how you want to view execution logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* View Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-colors ${
                viewMode === 'all' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
              }`}
              onClick={() => setViewMode('all')}
            >
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium">All Executions</h3>
                <p className="text-sm text-gray-600">View recent executions from all users</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-colors ${
                viewMode === 'user' ? 'border-green-500 bg-green-50' : 'hover:border-gray-300'
              }`}
              onClick={() => setViewMode('user')}
            >
              <CardContent className="p-4 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium">User Executions</h3>
                <p className="text-sm text-gray-600">View executions for a specific user</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-colors ${
                viewMode === 'execution' ? 'border-purple-500 bg-purple-50' : 'hover:border-gray-300'
              }`}
              onClick={() => setViewMode('execution')}
            >
              <CardContent className="p-4 text-center">
                <Search className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium">Specific Execution</h3>
                <p className="text-sm text-gray-600">View details of a specific execution</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Input Fields Based on Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {viewMode === 'user' && (
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            )}

            {viewMode === 'execution' && (
              <div className="space-y-2">
                <Label htmlFor="executionId">Execution ID</Label>
                <Input
                  id="executionId"
                  placeholder="Enter execution ID"
                  value={executionId}
                  onChange={(e) => setExecutionId(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoRefresh" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Auto Refresh
                </Label>
                <Switch
                  id="autoRefresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showParameters" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Show Parameters
                </Label>
                <Switch
                  id="showParameters"
                  checked={showParameters}
                  onCheckedChange={setShowParameters}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Logs Viewer */}
      <ExecutionLogViewer
        userId={viewMode === 'user' ? userId : undefined}
        executionId={viewMode === 'execution' ? executionId : undefined}
        autoRefresh={autoRefresh}
        refreshInterval={5000}
        showParameters={showParameters}
        maxHeight="70vh"
      />

      {/* Help Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Viewing Modes</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>All Executions:</strong> Shows recent executions from all users</li>
                <li>• <strong>User Executions:</strong> Shows executions for a specific user ID</li>
                <li>• <strong>Specific Execution:</strong> Shows details of a single execution</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Auto Refresh:</strong> Automatically updates every 5 seconds</li>
                <li>• <strong>Step Details:</strong> Click steps to see input/output data</li>
                <li>• <strong>Error Tracking:</strong> Failed steps are highlighted in red</li>
                <li>• <strong>Real-time Updates:</strong> See executions as they happen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 