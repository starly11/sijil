'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VersionInfo } from '@/components/deployment/version-info';

interface HealthData {
  status: string;
  timestamp: string;
  version: string;
}

export default function StatusPage() {
  const [health, setHealth] = React.useState<HealthData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setHealth(data);
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Status</h1>
        <VersionInfo />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Health</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">Loading...</div>
          ) : (
            <div className="flex items-center gap-3">
              <Badge
                className={
                  health?.status === 'healthy'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }
              >
                {health?.status || 'unknown'}
              </Badge>
              {health?.timestamp && (
                <span className="text-sm text-gray-500">
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
