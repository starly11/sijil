'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile, generateExportFilename } from '@/lib/fileUtils';

interface DownloadButtonProps {
  downloadUrl: string;
  filename?: string;
  topicTitle?: string;
  format?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  downloadUrl,
  filename,
  topicTitle = 'export',
  format = 'zip',
  size = 'md',
  variant = 'primary',
  className,
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const finalFilename = filename || generateExportFilename(topicTitle, format);
      await downloadFile(downloadUrl, finalFilename);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      size={size}
      variant={variant}
      disabled={isDownloading}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? 'Downloading...' : 'Download'}
    </Button>
  );
};
