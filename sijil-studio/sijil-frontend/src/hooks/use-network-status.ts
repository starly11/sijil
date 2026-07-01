'use client';

import * as React from 'react';

interface NetworkStatus {
  isOnline: boolean;
  downlink: number | undefined;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | undefined;
  saveData: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = React.useState<NetworkStatus>({
    isOnline: true,
    downlink: undefined,
    effectiveType: undefined,
    saveData: false,
  });

  React.useEffect(() => {
    const updateStatus = () => {
      if (typeof navigator === 'undefined') {
        return;
      }

      const connection = 'connection' in navigator ? (navigator as any).connection : null;

      setStatus({
        isOnline: navigator.onLine,
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType,
        saveData: connection?.saveData || false,
      });
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = 'connection' in navigator ? (navigator as any).connection : null;
    if (connection?.addEventListener) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection?.removeEventListener) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
};
