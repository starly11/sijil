import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsOverview } from '@/types/api';

interface AnalyticsDashboardProps {
  data?: AnalyticsOverview | null | undefined;
  isLoading?: boolean;
}

const StatCard: React.FC<{ title: string; value: number | string; icon?: string }> = ({
  title,
  value,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const safeData = {
    total_topics: data.total_topics ?? 0,
    total_documents: data.total_documents ?? 0,
    total_assessments: data.total_assessments ?? 0,
    import_success_rate: data.import_success_rate ?? 0,
    recent_activity: data.recent_activity ?? []
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Topics" value={safeData.total_topics} />
        <StatCard title="Total Documents" value={safeData.total_documents} />
        <StatCard title="Total Assessments" value={safeData.total_assessments} />
        <StatCard
          title="Import Success Rate"
          value={`${safeData.import_success_rate}%`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safeData.recent_activity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              safeData.recent_activity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{activity.type}</div>
                    <div className="text-sm text-gray-500">{activity.message}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
