'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Isolated hook managing mobile responsive navigation drawer lifecycle.
 */
export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  // Prevent background scrolling when navigation layer covers viewports
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return {
    isOpen,
    setIsOpen,
    toggle,
    close,
    open,
  };
}
