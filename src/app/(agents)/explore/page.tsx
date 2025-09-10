'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExplorePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual agents listing page
    router.replace('/my-agents');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-green-100 font-mono">Loading...</h2>
          <p className="text-green-300/80 font-mono text-sm">Redirecting to agents</p>
        </div>
      </div>
    </div>
  );
} 