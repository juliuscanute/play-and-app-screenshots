'use client';

import dynamic from 'next/dynamic';
import Sidebar from '@/components/editor/Sidebar';

// Dynamic import to avoid SSR issues with Fabric.js
const FabricCanvas = dynamic(() => import('@/components/editor/FabricCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-gray-400">Loading Canvas Engine...</div>
});

export default function Home() {
  return (
    <main className="flex h-screen flex-row overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Header/Toolbar could go here */}
        <div className="flex-1 h-full relative min-h-0">
          <FabricCanvas />
        </div>
      </div>
    </main>
  );
}
