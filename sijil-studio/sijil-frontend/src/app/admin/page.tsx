'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAdminAnalytics } from '@/hooks/use-admin-analytics';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileJson, CloudUpload } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminAnalytics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage your Sijil platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/ingest" className="block">
              <Button className="w-full">
                <FileJson className="mr-2 h-4 w-4" />
                Ingest JSON
              </Button>
            </Link>
            <Link href="/admin/import" className="block">
              <Button variant="outline" className="w-full">
                <CloudUpload className="mr-2 h-4 w-4" />
                Batch Import
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Recent activity will appear here...</p>
          </CardContent>
        </Card>
      </div>

      <AnalyticsDashboard data={data} isLoading={isLoading} />
    </div>
  );
}
