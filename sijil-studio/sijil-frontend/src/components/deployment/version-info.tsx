'use client';

import * as React from 'react';

export const VersionInfo: React.FC = () => {
  const [version, setVersion] = React.useState<string>('unknown');
  const [environment, setEnvironment] = React.useState<string>('');

  React.useEffect(() => {
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => {
        setVersion(data.version);
        setEnvironment(data.environment);
      })
      .catch(() => {
        setVersion(process.env.npm_package_version || '0.1.0');
        setEnvironment('development');
      });
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <span className="font-medium">v{version}</span>
      {environment && (
        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
          {environment}
        </span>
      )}
    </div>
  );
};
