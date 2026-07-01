import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { FOOTER_NAV_SECTIONS } from '@/config/navigation';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background transition-colors duration-200 py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          {/* Column 1: Core Platform Identity branding profile summary */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Comprehensive digital textbooks tailored for the Pakistani curriculum (PCTB). Access structural documents, topics, and assessments seamlessly.
            </p>
          </div>

          {/* Columns 2-4: Structured Navigation Context arrays mapping */}
          {FOOTER_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.items.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Lower Legal Summary Rules Box */}
        <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {currentYear} Sijil Platform. All rights reserved across curriculum boards.
          </p>
          <div className="text-xs text-muted-foreground flex gap-4">
            <span>Built for Pakistani Curriculums</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
