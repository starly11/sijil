'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { HEADER_NAV_ITEMS } from '@/config/navigation';

interface MobileMenuProps {
  /** Indicates whether the modal navigation drawer layer is drawn onto screen viewboards */
  open: boolean;
  /** Functional callback catching focus and layer closure state overrides */
  onOpenChange: (open: boolean) => void;
}

/**
 * High-performance mobile panel satisfying focus trap isolation, backdrop dismissals, and hardware-accelerated animations.
 */
export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close layout shell automatically on Escape key triggers
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Trap keyboard focus navigation flows loop inside drawer while context drawer displays active
  useEffect(() => {
    if (!open) return;

    const focusableElements = containerRef.current?.querySelectorAll(
      'a[href], button:not([disabled])'
    );
    if (!focusableElements || focusableElements.length === 0) return;

    const firstEl = focusableElements[0] as HTMLElement;
    const lastEl = focusableElements[focusableElements.length - 1] as HTMLElement;

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          lastEl.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastEl) {
          firstEl.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', trapFocus);
    // Auto focus first item for screen reader optimization
    setTimeout(() => firstEl.focus(), 50);

    return () => window.removeEventListener('keydown', trapFocus);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop Mask Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-In Navigation Panel Container */}
          <motion.div
            ref={containerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            className="fixed bottom-0 left-0 top-0 z-50 flex h-full w-3/4 max-w-sm flex-col border-r bg-background p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-foreground">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label="Close navigation panel drawer"
              >
                <X className="h-5 w-5 text-foreground" />
              </Button>
            </div>

            <nav className="mt-8 flex flex-col space-y-4">
              <Link
                href="/"
                onClick={() => onOpenChange(false)}
                className="flex h-11 items-center rounded-md px-3 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Home
              </Link>
              {HEADER_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className="flex h-11 items-center rounded-md px-3 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t pt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Adjust Appearance</span>
              <ThemeToggle />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
