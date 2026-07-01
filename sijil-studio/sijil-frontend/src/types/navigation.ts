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
