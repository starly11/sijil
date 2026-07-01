import { Metadata } from 'next';
import { ExportHistoryList } from '@/components/export/export-history-list';

export const metadata: Metadata = {
  title: 'Export History',
  description: 'View and manage your export history',
};

export default function ExportsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Export History</h1>
        <p className="text-muted-foreground">View and manage your exported files</p>
      </div>
      <ExportHistoryList />
    </div>
  );
}
