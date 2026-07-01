'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus as useNetwork } from '@/hooks/use-network-status';
import { useOptimizedResize as useResize } from '@/hooks/use-optimized-resize';
import { useVisibilityChange as useVisibility } from '@/hooks/use-visibility-change';

export default function PerformanceDashboard() {
  const network = useNetwork();
  const [mountTime] = React.useState(new Date().toLocaleString());

  useVisibility({
    onHidden: () => console.log('Tab hidden, pausing work'),
    onVisible: () => console.log('Tab visible, resuming work'),
  });

  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useResize(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-gray-500 mt-2">Monitor application performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Connection</span>
                <Badge className={network.isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>
                  {network.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              {network.effectiveType && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Effective Type</span>
                  <span className="font-medium">{network.effectiveType}</span>
                </div>
              )}
              {network.downlink && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Downlink</span>
                  <span className="font-medium">{network.downlink} Mbps</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Save Data</span>
                <span className="font-medium">{network.saveData ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Window Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Width</span>
                <span className="font-medium">{windowSize.width}px</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Height</span>
                <span className="font-medium">{windowSize.height}px</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Session Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Mounted At</span>
                <span className="font-medium">{mountTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
