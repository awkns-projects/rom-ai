import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function AuthTestPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/api/auth/guest');
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-green-600">
          ✅ Authentication Test - SUCCESS
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-800 mb-2">Session Information</h2>
            <div className="space-y-2 text-sm">
              <div><strong>User ID:</strong> {session.user?.id}</div>
              <div><strong>Email:</strong> {session.user?.email}</div>
              <div><strong>User Type:</strong> {session.user?.type}</div>
              <div><strong>Name:</strong> {session.user?.name || 'N/A'}</div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h2 className="font-semibold text-green-800 mb-2">Environment Information</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
              <div><strong>Auth Secret:</strong> {process.env.AUTH_SECRET ? '✅ Present' : '❌ Missing'}</div>
              <div><strong>Database URL:</strong> {process.env.POSTGRES_URL ? '✅ Present' : '❌ Missing'}</div>
              <div><strong>Ngrok URL:</strong> {process.env.NGROK_URL || 'Not set'}</div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h2 className="font-semibold text-yellow-800 mb-2">Session Details</h2>
            <pre className="text-xs bg-yellow-100 p-2 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          
          <div className="flex gap-4 pt-4">
            <a 
              href="/chat" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Chat
            </a>
            <a 
              href="/api/auth/signout" 
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </a>
            <a 
              href="/api/auth/debug" 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Debug Info
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 