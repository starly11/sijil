'use client';

import * as React from 'react';
import { ExportJobCard } from './export-job-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Mock data since there's no user-specific export history endpoint
const MOCK_JOBS = [
  {
    export_job_id: 'exp_123',
    status: 'complete' as const,
    format: 'topic_pack' as const,
    topic_title: 'Newton\'s Laws of Motion',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    package_url: '/downloads/exp_123.zip',
  },
  {
    export_job_id: 'exp_456',
    status: 'processing' as const,
    format: 'formula_pack' as const,
    topic_title: 'Chemical Reactions',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    progress: 65,
  },
  {
    export_job_id: 'exp_789',
    status: 'failed' as const,
    format: 'mcq_pack' as const,
    topic_title: 'Cell Structure',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    message: 'Topic content not found',
  },
];

interface ExportHistoryListProps {
  className?: string;
}

export const ExportHistoryList: React.FC<ExportHistoryListProps> = ({ className }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={className}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (MOCK_JOBS.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center text-muted-foreground">
          No exports yet. Start by exporting a topic!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {MOCK_JOBS.map((job) => (
        <ExportJobCard key={job.export_job_id} job={job} />
      ))}
    </div>
  );
};
