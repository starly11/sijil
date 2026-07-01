# SIJIL Frontend Implementation Constitution

## Mission

This document serves as the **single source of truth** for all frontend implementation activities. It ensures consistency across multiple AI implementation sessions, engineering handoffs, and phased development cycles.

**Authority**: All implementation MUST comply with these standards. Violations must be corrected before merge.

---

## 1. Architecture Laws

### 1.1 Domain Boundary Law
- **Public Domain**: `/`, `/topics/*`, `/documents/*`, `/quran/*`, `/search`
- **Admin Domain**: `/admin/*` (protected by authentication)
- **Search Domain**: Isolated query logic, shared across domains
- **Export Domain**: Stateless generation endpoints
- **Analytics Domain**: Client-side tracking + admin dashboards

**Violation**: Cross-domain imports without explicit facade = REJECT

### 1.2 Layer Separation Law
```
Presentation Layer (pages, layouts) 
    ↓
Feature Layer (feature modules, hooks)
    ↓
Domain Layer (business logic, validators)
    ↓
Infrastructure Layer (API clients, utilities)
```

**Rule**: Lower layers CANNOT import from higher layers.

### 1.3 Single Responsibility Law
- One feature per module
- One component per file
- One hook per file
- One API client per domain

### 1.4 Immutability Law
- State updates MUST use immutable patterns
- Props MUST NOT be mutated
- API responses MUST be treated as immutable

---

## 2. Coding Standards

### 2.1 TypeScript Configuration

```typescript
// tsconfig.json strict mode REQUIRED
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": false,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

### 2.2 Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `TopicCard`, `BlockRenderer` |
| Files | kebab-case | `topic-card.tsx`, `block-renderer.tsx` |
| Hooks | camelCase with `use` prefix | `useTopicQuery`, `useSearchState` |
| Types/Interfaces | PascalCase with `T` or `I` prefix optional | `Topic`, `ApiResponse<T>` |
| Constants | UPPER_SNAKE_CASE | `MAX_RESULTS`, `API_TIMEOUT` |
| Utilities | camelCase | `formatDate`, `validateSlug` |
| Test files | `[name].test.tsx` | `topic-card.test.tsx` |

### 2.3 File Organization Rules

```typescript
// ✅ CORRECT: Co-located tests and types
// topic-card.tsx
// topic-card.test.tsx
// topic-card.types.ts

// ❌ WRONG: Scattered files
// /components/topic-card.tsx
// /tests/topic-card.test.tsx
// /types/topic-card.types.ts
```

### 2.4 Import Order

```typescript
// 1. Next.js core
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Internal aliases (absolute paths)
import { TopicCard } from '@/features/topics/components/topic-card';
import { topicApi } from '@/features/topics/api/topics.api';

// 4. Relative imports (own module first, then others)
import { TopicSchema } from './topic-card.types';
import { formatDate } from '@/lib/utils';

// 5. Styles (if not using Tailwind utility classes directly)
import styles from './topic-card.module.css';
```

### 2.5 Export Strategy

```typescript
// ✅ Use named exports for components and utilities
export function TopicCard({ topic }: TopicCardProps) { ... }
export const useTopicQuery = (id: string) => { ... }

// ✅ Re-export from index.ts for public API
export { TopicCard } from './topic-card';
export type { TopicCardProps } from './topic-card.types';

// ❌ Avoid default exports (breaks tree-shaking clarity)
```

---

## 3. Folder Rules

### 3.1 Root Structure

```
/workspace/sijil
├── app/                    # Next.js App Router
├── features/               # Feature modules (domain-driven)
├── components/             # Shared UI components
├── lib/                    # Core utilities and configurations
├── hooks/                  # Shared hooks (cross-feature)
├── types/                  # Global type definitions
├── public/                 # Static assets
├── tests/                  # Integration and E2E tests
├── docs/                   # Documentation (blueprint + implementation)
└── CLAUDE.md              # This constitution
```

### 3.2 Feature Module Structure

Every feature module MUST follow this structure:

```
features/[feature-name]/
├── api/                    # API clients specific to feature
│   ├── [feature].api.ts
│   └── [feature].api.test.ts
├── components/             # Feature-specific components
│   ├── [component].tsx
│   ├── [component].types.ts
│   └── [component].test.tsx
├── hooks/                  # Feature-specific hooks
│   ├── use[Feature]Query.ts
│   └── use[Feature]Mutation.ts
├── pages/                  # Page components (if not in app/)
├── types/                  # Feature-specific types
│   └── [feature].types.ts
├── utils/                  # Feature-specific utilities
│   └── [utility].ts
├── constants.ts            # Feature constants
├── index.ts                # Public API exports
└── README.md               # Feature documentation
```

### 3.3 Component Library Structure

```
components/
├── ui/                     # shadcn/ui primitives (DO NOT MODIFY)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── layout/                 # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── sidebar.tsx
├── content/                # Content display components
│   ├── block-renderer/
│   ├── formula-block.tsx
│   └── quran-reference.tsx
└── forms/                  # Form components
    ├── form-field.tsx
    └── validation-message.tsx
```

### 3.4 Forbidden Patterns

```bash
# ❌ NEVER create:
/components/utils/          # Utils belong in lib/ or feature/utils/
/hooks/api/                 # API hooks belong in features/*/hooks/
/types/features/            # Types belong in features/*/types/
/lib/components/            # Components don't belong in lib/

# ❌ NEVER nest deeper than 3 levels:
/features/topics/components/cards/topic/Title.tsx  # TOO DEEP
/features/topics/components/topic-title.tsx        # ✅ CORRECT
```

---

## 4. Component Rules

### 4.1 Component Anatomy

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

// 1. Types defined FIRST (or in separate .types.ts file)
export interface TopicCardProps {
  topic: Topic;
  variant?: 'default' | 'compact';
  className?: string;
  onClick?: (topicId: string) => void;
}

// 2. Display name for debugging
TopicCard.displayName = 'TopicCard';

// 3. Default props documented
const defaultProps: Partial<TopicCardProps> = {
  variant: 'default',
  className: undefined,
  onClick: undefined,
};

// 4. Component function
export function TopicCard({ 
  topic, 
  variant = 'default', 
  className,
  onClick 
}: TopicCardProps) {
  // Hook calls at top level ONLY
  const router = useRouter();
  
  // Event handlers as named functions
  const handleClick = useCallback(() => {
    onClick?.(topic.id);
    router.push(`/topics/${topic.slug}`);
  }, [topic.id, onClick, router]);

  // Early returns for null/undefined
  if (!topic) return null;

  // Render
  return (
    <Card 
      className={cn('topic-card', `topic-card--${variant}`, className)}
      onClick={handleClick}
    >
      {/* Content */}
    </Card>
  );
}

TopicCard.defaultProps = defaultProps;
```

### 4.2 Composition Over Configuration

```typescript
// ✅ PREFER: Composition with children
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// ❌ AVOID: Boolean flags for layout variations
<Card showHeader={true} showFooter={false} layout="vertical" />
```

### 4.3 Prop Drilling Prevention

```typescript
// ✅ Use context for deeply nested shared state
<TopicProvider topicId={topicId}>
  <TopicLayout>
    <TopicContent />  {/* Can access topic via useContext */}
  </TopicLayout>
</TopicProvider>

// ❌ Avoid passing through intermediate components
<TopicLayout topic={topic} user={user} settings={settings}>
  <TopicContent topic={topic} user={user} settings={settings} />
</TopicLayout>
```

### 4.4 Server vs Client Components

```typescript
// ✅ Server Component (default)
// - Fetch data directly
// - No useState, useEffect, useReducer
// - No event handlers (onClick, onChange)
import { topicApi } from '@/features/topics/api/topics.api';

export async function TopicPage({ params }: { params: { slug: string } }) {
  const topic = await topicApi.getTopicBySlug(params.slug);
  return <TopicView topic={topic} />;
}

// ✅ Client Component (explicit directive)
'use client';

import { useState, useEffect } from 'react';
import { useTopicQuery } from '@/features/topics/hooks/use-topic-query';

export function InteractiveTopicView({ topicId }: { topicId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data } = useTopicQuery(topicId);
  
  return (
    <div onClick={() => setExpanded(!expanded)}>
      {/* Interactive content */}
    </div>
  );
}
```

### 4.5 Accessibility Requirements

- All interactive elements MUST have `aria-label` or visible text
- Images MUST have `alt` text (or `alt=""` for decorative)
- Forms MUST have associated `<label>` elements
- Color alone MUST NOT convey information
- Focus states MUST be visible
- Keyboard navigation MUST work for all interactive elements

---

## 5. State Rules

### 5.1 State Ownership Matrix

| State Type | Owner | Location | Example |
|------------|-------|----------|---------|
| Server Cache | TanStack Query | `features/*/hooks/use*Query.ts` | Topics, Documents |
| URL State | Next.js Router | URL search params | Filters, Pagination |
| Form State | React Hook Form | `components/forms/*` | Search, Admin forms |
| UI State | Zustand | `stores/*Store.ts` | Sidebar, Modals |
| Auth State | Zustand + HTTPOnly | `stores/authStore.ts` | User session |

### 5.2 TanStack Query Rules

```typescript
// ✅ Query key factory pattern
export const topicKeys = {
  all: ['topics'] as const,
  lists: () => [...topicKeys.all, 'list'] as const,
  list: (filters: TopicFilters) => [...topicKeys.lists(), filters] as const,
  details: () => [...topicKeys.all, 'detail'] as const,
  detail: (id: string) => [...topicKeys.details(), id] as const,
};

// ✅ Custom hook with typed options
export function useTopicQuery(id: string, options?: UseQueryOptions<Topic>) {
  return useQuery({
    queryKey: topicKeys.detail(id),
    queryFn: () => topicApi.getTopicById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    ...options,
  });
}

// ✅ Mutation with invalidation
export function useUpdateTopicMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: topicApi.updateTopic,
    onSuccess: (data, variables) => {
      // Invalidate specific query
      queryClient.invalidateQueries({ 
        queryKey: topicKeys.detail(variables.id) 
      });
      // Optionally update cache immediately
      queryClient.setQueryData(topicKeys.detail(variables.id), data);
    },
  });
}
```

### 5.3 Zustand Store Rules

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UiState {
  // State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'light',
        
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setTheme: (theme) => set({ theme }),
      }),
      { name: 'ui-storage' }
    )
  )
);
```

**Rules**:
- Stores MUST be scoped to feature or cross-cutting concern
- NO server state in Zustand (use TanStack Query)
- Persist ONLY UI preferences (NOT sensitive data)
- Use `devtools` middleware in development

### 5.4 URL State Synchronization

```typescript
// ✅ Use useQueryState for filter synchronization
import { useQueryState } from 'nuqs';

export function useTopicFilters() {
  const [category, setCategory] = useQueryState('category', {
    defaultValue: 'all',
    shallow: false, // Trigger page reload for SEO
  });
  
  const [page, setPage] = useQueryState('page', {
    defaultValue: 1,
    parse: Number,
  });

  return {
    filters: { category, page },
    setFilters: ({ category, page }: { category?: string; page?: number }) => {
      if (category) setCategory(category);
      if (page) setPage(page);
    },
  };
}
```

### 5.5 Form State Rules

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SearchSchema } from './search.types';

export function SearchForm() {
  const form = useForm<z.infer<typeof SearchSchema>>({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      query: '',
      filters: {
        category: 'all',
        dateFrom: undefined,
        dateTo: undefined,
      },
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    // Submit logic
  });

  return (
    <form onSubmit={onSubmit}>
      {/* Form fields with form.control */}
    </form>
  );
}
```

**Rules**:
- ALL forms MUST use Zod schema validation
- Form state MUST be local (no global form state)
- Validation errors MUST display inline
- Forms MUST be accessible (labels, error announcements)

---

## 6. API Rules

### 6.1 API Client Structure

```typescript
// features/topics/api/topics.api.ts
import { apiClient } from '@/lib/api/client';
import { Topic, TopicListResponse } from '../types/topic.types';

export const topicApi = {
  // GET /api/v1/topics
  getTopics: async (params: TopicListParams): Promise<TopicListResponse> => {
    const response = await apiClient.get('/api/v1/topics', { params });
    return TopicListResponseSchema.parse(response.data);
  },

  // GET /api/v1/topics/:id
  getTopicById: async (id: string): Promise<Topic> => {
    const response = await apiClient.get(`/api/v1/topics/${id}`);
    return TopicSchema.parse(response.data);
  },

  // POST /api/v1/topics
  createTopic: async (data: CreateTopicInput): Promise<Topic> => {
    const response = await apiClient.post('/api/v1/topics', data);
    return TopicSchema.parse(response.data);
  },

  // PUT /api/v1/topics/:id
  updateTopic: async (id: string, data: UpdateTopicInput): Promise<Topic> => {
    const response = await apiClient.put(`/api/v1/topics/${id}`, data);
    return TopicSchema.parse(response.data);
  },

  // DELETE /api/v1/topics/:id
  deleteTopic: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/topics/${id}`);
  },
};
```

### 6.2 Error Handling Strategy

```typescript
// lib/api/error-handler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const code = error.response?.data?.code || 'UNKNOWN_ERROR';
    const message = error.response?.data?.message || 'An unexpected error occurred';
    const details = error.response?.data?.details;

    throw new ApiError(status, code, message, details);
  }

  throw new ApiError(500, 'UNKNOWN_ERROR', 'An unexpected error occurred');
}
```

### 6.3 Request/Response Typing

```typescript
// ALL API responses MUST be validated with Zod
const TopicSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const TopicListResponseSchema = z.object({
  data: z.array(TopicSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  }),
});

// Type inference from schemas
export type Topic = z.infer<typeof TopicSchema>;
export type TopicListResponse = z.infer<typeof TopicListResponseSchema>;
```

### 6.4 Retry Strategy

```typescript
// lib/api/client.ts
import axios from 'axios';
import { retry } from './retry-strategy';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Don't retry on 4xx errors (client errors)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return Promise.reject(error);
    }

    // Retry logic for 5xx errors and network failures
    if (!config || !config.retryCount) {
      config.retryCount = 0;
    }

    const maxRetries = 3;
    if (config.retryCount >= maxRetries) {
      return Promise.reject(error);
    }

    config.retryCount += 1;
    
    // Exponential backoff
    const delay = Math.min(1000 * 2 ** config.retryCount, 10000);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return apiClient(config);
  }
);
```

---

## 7. Testing Strategy

### 7.1 Testing Pyramid

```
        E2E Tests (10%)
       ↗             ↖
Integration Tests (20%)
     ↗                 ↖
Unit Tests (70%)
```

### 7.2 Unit Testing Rules

```typescript
// ✅ Test utilities and pure functions
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/utils';

describe('formatDate', () => {
  it('formats ISO date to readable format', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toBe('January 15, 2024');
  });

  it('returns empty string for invalid date', () => {
    const result = formatDate('invalid');
    expect(result).toBe('');
  });
});
```

**Coverage Requirements**:
- Utility functions: 100% coverage
- Type guards: 100% coverage
- API response parsers: 100% coverage
- Complex business logic: 90%+ coverage

### 7.3 Component Testing Rules

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopicCard } from './topic-card';
import { mockTopic } from '@/tests/mocks/topic.mock';

describe('TopicCard', () => {
  it('renders topic title and description', () => {
    render(<TopicCard topic={mockTopic} />);
    
    expect(screen.getByText(mockTopic.title)).toBeInTheDocument();
    expect(screen.getByText(mockTopic.description)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<TopicCard topic={mockTopic} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledWith(mockTopic.id);
  });

  it('applies compact variant styles', () => {
    const { container } = render(<TopicCard topic={mockTopic} variant="compact" />);
    
    expect(container.firstChild).toHaveClass('topic-card--compact');
  });
});
```

### 7.4 Integration Testing Rules

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicList } from '@/features/topics/components/topic-list';
import { server } from '@/tests/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TopicList Integration', () => {
  it('fetches and displays topics from API', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TopicList />
      </QueryClientProvider>
    );

    // Show loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Introduction to Calculus')).toBeInTheDocument();
    });
  });
});
```

### 7.5 E2E Testing Rules

```typescript
// tests/e2e/topic-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Topic Navigation', () => {
  test('navigates from topic list to topic detail', async ({ page }) => {
    await page.goto('/topics');
    
    // Click on first topic
    await page.click('[data-testid="topic-card"]:first-child');
    
    // Verify navigation
    await expect(page).toHaveURL(/\/topics\/[\w-]+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('search filters update URL params', async ({ page }) => {
    await page.goto('/search');
    
    // Enter search query
    await page.fill('[name="query"]', 'calculus');
    await page.press('[name="query"]', 'Enter');
    
    // Verify URL updated
    await expect(page).toHaveURL('/search?query=calculus');
    
    // Apply category filter
    await page.selectOption('[name="category"]', 'mathematics');
    
    // Verify URL updated with filter
    await expect(page).toHaveURL('/search?query=calculus&category=mathematics');
  });
});
```

### 7.6 Mock Data Strategy

```typescript
// tests/mocks/topic.mock.ts
import { faker } from '@faker-js/faker';
import type { Topic } from '@/features/topics/types/topic.types';

export function createMockTopic(overrides?: Partial<Topic>): Topic {
  return {
    id: faker.string.uuid(),
    slug: faker.helpers.slugify(faker.lorem.words(3)),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    content: [],
    categoryId: faker.string.uuid(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export const mockTopic = createMockTopic();
export const mockTopicList = Array.from({ length: 10 }, (_, i) =>
  createMockTopic({ title: `Topic ${i + 1}` })
);
```

---

## 8. Quality Gates

### 8.1 Pre-commit Checks

```json
// package.json scripts
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "precommit": "npm run lint && npm run typecheck && npm run test"
  }
}
```

**Required Checks Before Commit**:
1. ✅ ESLint passes with zero errors
2. ✅ TypeScript compilation succeeds with zero errors
3. ✅ All unit tests pass
4. ✅ Code coverage meets minimum thresholds

### 8.2 Pull Request Requirements

**Mandatory**:
- [ ] All automated checks pass (CI/CD)
- [ ] Code review approval from at least 1 engineer
- [ ] Test coverage does not decrease
- [ ] No console.log() or debugger statements
- [ ] Accessibility audit passes (axe-core)
- [ ] Performance budget met (Lighthouse scores)

**Recommended**:
- [ ] Screenshots for UI changes
- [ ] Updated documentation
- [ ] Migration guide for breaking changes

### 8.3 Performance Budget

| Metric | Target | Method |
|--------|--------|--------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Total Bundle Size | < 500KB | Webpack Bundle Analyzer |
| Initial JS Payload | < 200KB | Webpack Bundle Analyzer |

### 8.4 Accessibility Requirements

- WCAG 2.1 Level AA compliance
- Automated testing with `axe-core`
- Manual keyboard navigation testing
- Screen reader testing (NVDA, VoiceOver)
- Color contrast verification

---

## 9. Definition of Done

A feature is considered **DONE** when ALL criteria are met:

### 9.1 Functional Completeness
- [ ] All acceptance criteria from blueprint implemented
- [ ] Edge cases handled (empty states, errors, loading)
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Browser compatibility verified (Chrome, Firefox, Safari, Edge)

### 9.2 Code Quality
- [ ] TypeScript strict mode compliant
- [ ] ESLint rules satisfied
- [ ] No TODO comments without linked issues
- [ ] Code reviewed and approved

### 9.3 Testing
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing (critical paths)
- [ ] Test coverage ≥ 80% for new code

### 9.4 Documentation
- [ ] Component Storybook stories created
- [ ] API documentation updated
- [ ] README.md updated (if feature-level changes)
- [ ] Changelog entry added

### 9.5 Performance
- [ ] No performance regressions (Lighthouse comparison)
- [ ] Images optimized (WebP, proper sizing)
- [ ] Code splitting implemented (lazy loading)
- [ ] Memoization applied where beneficial

### 9.6 Accessibility
- [ ] Semantic HTML used throughout
- [ ] ARIA labels present where needed
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast verified

### 9.7 SEO (Public Pages Only)
- [ ] Meta tags implemented (title, description, OG)
- [ ] Structured data (JSON-LD) added
- [ ] Canonical URLs set
- [ ] Breadcrumbs implemented
- [ ] Sitemap updated

---

## 10. Implementation Phase Gates

### Gate 0: Foundation Setup
**Entrance Criteria**:
- [ ] Repository cloned and configured
- [ ] Node.js 20+ installed
- [ ] Dependencies installed (`npm install`)

**Exit Criteria**:
- [ ] Next.js app runs locally (`npm run dev`)
- [ ] ESLint, TypeScript, Prettier configured
- [ ] Vitest configured and running
- [ ] Playwright configured for E2E
- [ ] CI/CD pipeline passing

**Deliverable**: Working development environment

---

### Gate 1: Core Infrastructure
**Entrance Criteria**: Gate 0 passed

**Scope**:
- API client layer
- TanStack Query setup
- Zustand store setup
- Utility functions
- Type definitions

**Exit Criteria**:
- [ ] API client can fetch from backend
- [ ] Query hooks functional
- [ ] Global state manageable
- [ ] All utilities tested
- [ ] Types aligned with backend

**Deliverable**: Infrastructure ready for feature development

---

### Gate 2: Layout System
**Entrance Criteria**: Gate 1 passed

**Scope**:
- PublicLayout
- AdminLayout
- TopicLayout
- DocumentLayout
- Navigation components

**Exit Criteria**:
- [ ] All layouts render correctly
- [ ] Navigation functional
- [ ] Responsive behavior verified
- [ ] Accessibility audit passed

**Deliverable**: Shell application with navigation

---

### Gate 3: Rendering Engine
**Entrance Criteria**: Gate 2 passed

**Scope**:
- BlockRenderer
- All content block types
- Formula rendering (KaTeX)
- Quran reference rendering

**Exit Criteria**:
- [ ] All block types render correctly
- [ ] KaTeX formulas display properly
- [ ] Nested blocks supported
- [ ] Performance acceptable (<100ms render)

**Deliverable**: Topic content fully renderable

---

### Gate 4: Public Content Features
**Entrance Criteria**: Gate 3 passed

**Scope**:
- Topic pages
- Document pages
- Category browsing
- Quran section

**Exit Criteria**:
- [ ] All public routes functional
- [ ] SSR working correctly
- [ ] SEO metadata implemented
- [ ] Internal linking correct

**Deliverable**: Public-facing site operational

---

### Gate 5: Search System
**Entrance Criteria**: Gate 4 passed

**Scope**:
- Global search
- Formula search
- Filters and facets
- Suggestions
- Failed search tracking

**Exit Criteria**:
- [ ] Search returns relevant results
- [ ] Filters work correctly
- [ ] URL sync functional
- [ ] Analytics tracking active

**Deliverable**: Full-text search operational

---

### Gate 6: Admin Dashboard
**Entrance Criteria**: Gate 5 passed

**Scope**:
- Authentication
- Dashboard overview
- Content management
- Batch imports
- Analytics views

**Exit Criteria**:
- [ ] Auth flow secure
- [ ] CRUD operations functional
- [ ] Batch import processes correctly
- [ ] Analytics display accurate

**Deliverable**: Admin panel operational

---

### Gate 7: Export & Analytics
**Entrance Criteria**: Gate 6 passed

**Scope**:
- PDF exports
- CSV exports
- Usage analytics
- Health monitoring

**Exit Criteria**:
- [ ] Exports generate correctly
- [ ] Analytics track events
- [ ] Monitoring dashboard shows data

**Deliverable**: Export and monitoring complete

---

### Gate 8: Optimization & Polish
**Entrance Criteria**: Gate 7 passed

**Scope**:
- Performance optimization
- Bundle size reduction
- Caching strategy
- Error boundaries
- Loading states

**Exit Criteria**:
- [ ] Lighthouse scores ≥ 90
- [ ] Bundle size within budget
- [ ] Error handling graceful
- [ ] Loading states polished

**Deliverable**: Production-ready application

---

### Gate 9: Production Deployment
**Entrance Criteria**: Gate 8 passed

**Scope**:
- Environment configuration
- CI/CD finalization
- Monitoring setup
- Rollback strategy

**Exit Criteria**:
- [ ] Production build successful
- [ ] Deployed to staging
- [ ] Smoke tests passed
- [ ] Deployed to production
- [ ] Monitoring alerts configured

**Deliverable**: Live production application

---

## 11. Enforcement Mechanisms

### 11.1 Automated Enforcement

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: ESLint
        run: npm run lint
        
      - name: TypeScript
        run: npm run typecheck
        
      - name: Unit tests
        run: npm run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
      - name: Build
        run: npm run build
        
      - name: E2E tests
        run: npm run test:e2e
```

### 11.2 Manual Review Checklist

Reviewers MUST verify:

- [ ] Architecture laws followed
- [ ] Folder structure compliant
- [ ] Component patterns consistent
- [ ] State management appropriate
- [ ] API integration correct
- [ ] Tests comprehensive
- [ ] Documentation updated
- [ ] Performance considered
- [ ] Accessibility addressed
- [ ] SEO implemented (if applicable)

### 11.3 Violation Handling

**Severity Levels**:

| Level | Description | Action |
|-------|-------------|--------|
| Critical | Security vulnerability, data loss | Block merge, immediate fix |
| High | Architecture violation, broken tests | Block merge, fix required |
| Medium | Code style, missing docs | Comment, fix before merge |
| Low | Minor optimization opportunity | Note for future refactor |

**Process**:
1. Reviewer identifies violation
2. Labels PR with severity
3. Author addresses violation
4. Reviewer re-verifies
5. Merge only after resolution

---

## 12. Continuous Improvement

### 12.1 Technical Debt Tracking

All technical debt MUST be documented:

```typescript
// Example: TODO with tracking
// TODO(#1234): Refactor this to use new API when backend v2 is ready
// DEBT(perf): This loop is O(n²), optimize with Map lookup
// FIXME(a11y): Add keyboard navigation support here
```

### 12.2 Retrospective Cadence

After each phase gate:
1. Review what worked well
2. Identify bottlenecks
3. Update this constitution if needed
4. Document lessons learned in `docs/retrospectives/`

### 12.3 Constitution Updates

This document evolves. Update process:

1. Propose change via PR
2. Discuss in team review
3. Vote (majority approves)
4. Merge and version bump
5. Communicate changes to all contributors

---

## Appendix A: Quick Reference

### Command Cheat Sheet

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint
npm run typecheck        # TypeScript check
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# E2E
npm run test:e2e         # Run Playwright tests
npm run test:e2e:ui      # UI mode

# Analysis
npm run analyze          # Bundle size analysis
npm run lighthouse       # Performance audit
```

### Common Patterns

```typescript
// Pattern: Fetch + Display with loading/error
const { data, isLoading, error } = useTopicQuery(id);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <NotFound />;

return <TopicView topic={data} />;

// Pattern: Optimistic update
const mutation = useUpdateTopicMutation({
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: topicKeys.detail(id) });
    const previous = queryClient.getQueryData(topicKeys.detail(id));
    queryClient.setQueryData(topicKeys.detail(id), newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(topicKeys.detail(id), context?.previous);
  },
});

// Pattern: Conditional rendering with fragments
<>
  {hasPermission && <EditButton />}
  {showMetadata && <MetadataPanel />}
  <MainContent />
</>
```

---

## Appendix B: Blueprint Alignment Matrix

| Blueprint Doc | Constitution Section | Alignment Status |
|--------------|---------------------|------------------|
| 01-system-architecture.md | Section 1 (Architecture Laws) | ✅ Aligned |
| 02-route-architecture.md | Section 3 (Folder Rules) | ✅ Aligned |
| 03-layout-architecture.md | Section 4 (Component Rules) | ✅ Aligned |
| 04-feature-modules.md | Section 3.2 (Feature Module Structure) | ✅ Aligned |
| 05-component-architecture.md | Section 4 (Component Rules) | ✅ Aligned |
| 06-state-architecture.md | Section 5 (State Rules) | ✅ Aligned |
| 07-api-layer.md | Section 6 (API Rules) | ✅ Aligned |
| 08-rendering-engine.md | Section 10 (Gate 3) | ✅ Aligned |
| 09-search-architecture.md | Section 10 (Gate 5) | ✅ Aligned |
| 10-admin-architecture.md | Section 10 (Gate 6) | ✅ Aligned |
| 11-seo-architecture.md | Section 9.7 (SEO DoD) | ✅ Aligned |
| 12-build-order.md | Section 10 (Phase Gates) | ✅ Aligned |
| 13-folder-structure.md | Section 3 (Folder Rules) | ✅ Aligned |
| 14-implementation-phases.md | Section 10 (Phase Gates) | ✅ Aligned |
| 15-coverage-matrix.md | Section 11 (Enforcement) | ✅ Aligned |

---

**Document Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained By**: Engineering Team  
**Review Cycle**: Per Phase Gate
