'use client';

import * as React from 'react';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500 mt-2">
          Platform statistics and analytics
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
