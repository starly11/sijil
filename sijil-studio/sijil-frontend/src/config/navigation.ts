/**
 * Navigation item structure for both header and footer links.
 */
export interface NavItem {
  /** The visible label text */
  label: string;
  /** The destination path or external link */
  href: string;
  /** Optional icon descriptor for mobile view representation */
  icon?: string;
}

/**
 * Footer link category container holding grouped navigation options.
 */
export interface FooterSection {
  /** Header label for the link column */
  title: string;
  /** Grouped item paths */
  items: NavItem[];
}

export const HEADER_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Documents', href: '/documents' },
  { label: 'Subjects', href: '/subjects' },
  { label: 'Quran', href: '/quran' },
  { label: 'Search', href: '/search' },
  { label: 'Exports', href: '/exports' },
];

export const FOOTER_NAV_SECTIONS: FooterSection[] = [
  {
    title: 'Quick Links',
    items: [
      { label: 'Home', href: '/' },
      { label: 'Documents', href: '/documents' },
      { label: 'Subjects', href: '/subjects' },
      { label: 'Quran', href: '/quran' },
      { label: 'Search', href: '/search' },
      { label: 'Exports', href: '/exports' },
    ],
  },
  {
    title: 'Subjects',
    items: [
      { label: 'Physics', href: '/subjects/physics' },
      { label: 'Chemistry', href: '/subjects/chemistry' },
      { label: 'Biology', href: '/subjects/biology' },
      { label: 'Mathematics', href: '/subjects/mathematics' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];
