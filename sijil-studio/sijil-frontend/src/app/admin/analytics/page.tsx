'use client';

import * as React from 'react';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useEffect, useState } from 'react';
import type { AnalyticsOverview } from '@/types/api';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<AnalyticsOverview>(API_ENDPOINTS.PLATFORM_STATS);
        if (response.success && response.data) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500 mt-2">
          Platform statistics and analytics
        </p>
      </div>

      <AnalyticsDashboard data={data} isLoading={isLoading} />
    </div>
  );
}
