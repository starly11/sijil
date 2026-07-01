'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { HEADER_NAV_ITEMS } from '@/config/navigation';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Branding Logo Block */}
        <Link href="/" className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
          <Logo />
        </Link>

        {/* Desktop View Navigation Links Context */}
        <nav className="hidden md:flex items-center gap-8">
          {HEADER_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Global Toolbar Action Controls Wrapper */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground"
            aria-label="Open search model overview interface"
          >
            <Search className="h-5 w-5" />
          </Button>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle structural layout responsive drawer navigation view panel"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Frame Motion Controlled Drawer Layer Context */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </header>
  );
}
