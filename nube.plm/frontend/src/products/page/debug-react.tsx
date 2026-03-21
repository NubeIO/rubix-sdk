/**
 * Debug page to test React instance
 */
import React from 'react';

export default function DebugReactPage() {
  // Log React instance to console
  React.useEffect(() => {
    console.log('[PLUGIN] React version:', React.version);
    console.log('[PLUGIN] React instance:', React);

    // Check if there are multiple React instances
    if (typeof window !== 'undefined') {
      // @ts-expect-error - accessing window React
      if (window.React) {
        // @ts-expect-error
        console.log('[PLUGIN] window.React version:', window.React.version);
        // @ts-expect-error
        console.log('[PLUGIN] Same React instance?', React === window.React);
      } else {
        // @ts-expect-error
        window.React = React;
        console.log('[PLUGIN] Set window.React to plugin React');
      }
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">React Debug Page</h1>
      <div className="space-y-2">
        <p>React version: {React.version}</p>
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  );
}
