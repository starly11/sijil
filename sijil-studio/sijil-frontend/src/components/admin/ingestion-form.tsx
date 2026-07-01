'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IngestionFormProps {
  onSubmit: (json: string) => void;
  isLoading?: boolean;
}

export const IngestionForm: React.FC<IngestionFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [jsonText, setJsonText] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      JSON.parse(jsonText);
      onSubmit(jsonText);
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingest JSON</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              JSON Payload
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Paste JSON here..."
            />
          </div>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}
          <Button type="submit" disabled={isLoading || !jsonText.trim()}>
            {isLoading ? 'Ingesting...' : 'Ingest JSON'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
