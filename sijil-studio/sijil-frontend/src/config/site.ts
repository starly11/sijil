export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'SIJIL',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  adminSecret: process.env.NEXT_PUBLIC_ADMIN_SECRET || undefined,
  features: {
    search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    export: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
    admin: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
  },
  description: 'Document Intelligence & Headless Publishing Engine',
};

export type SiteConfig = typeof siteConfig;
