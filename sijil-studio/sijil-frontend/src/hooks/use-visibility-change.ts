'use client';

import * as React from 'react';

interface UseVisibilityChangeProps {
  onHidden?: () => void;
  onVisible?: () => void;
}

export const useVisibilityChange = ({ onHidden, onVisible }: UseVisibilityChangeProps) => {
  const handleVisibilityChange = React.useCallback(() => {
    if (document.hidden) {
      onHidden?.();
    } else {
      onVisible?.();
    }
  }, [onHidden, onVisible]);

  React.useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);
};
