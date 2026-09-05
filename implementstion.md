# Supabase Auth & Storage, shadcn/ui Migration, Custom Fields, and npm Workspace Migration Plan

## Goal Description

1. **Supabase Integration**: Implement Supabase Authentication (Login, Sign-up, Sign-out, Session Context) and cloud data persistence for Candidate Profiles, Custom Form Fields, and Application History.
2. **Custom Fields Support**: Empower users to define arbitrary custom fields (e.g. Security Clearance, Veteran Status, Custom Answers, Portfolio Passwords) in their profile, and expand the Deterministic Mapper & Form Filler to automatically detect and fill them.
3. **UI Migration to shadcn/ui + Tailwind CSS**: Completely remove Ant Design and replace all screens with modern Tailwind CSS and modular shadcn/ui components (`Button`, `Card`, `Input`, `Label`, `Tabs`, `Switch`, `Badge`, `Alert`, `Navbar`, `Dialog`).
4. **Package Manager Migration (pnpm $\rightarrow$ npm)**: Transition the monorepo to standard npm workspaces (`"workspaces": ["apps/*", "packages/*"]`), replacing `workspace:*` references and updating root scripts.
5. **Documentation**: Update `PHASE_PROGRESS.md` to reflect all architectural advancements.

---

## User Review Required

> [!IMPORTANT]
>
> - Supabase configuration will include client/server helpers with fallback to localStorage when Supabase environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are not yet set by the user, ensuring the app remains 100% testable immediately without mandatory cloud setup.
> - Ant Design will be completely removed from `apps/web`, significantly reducing bundle size and eliminating SSR/barrel-optimize hydration issues.

---

## Proposed Changes

### 1. Monorepo Configuration (npm Workspaces)

#### [MODIFY] [package.json](file:///Users/sarthak/Desktop/job_applier/package.json)

- Add `"workspaces": ["apps/*", "packages/*"]`.
- Update package manager field to `"npm"`.

#### [MODIFY] [apps/web/package.json](file:///Users/sarthak/Desktop/job_applier/apps/web/package.json)

- Remove `antd`.
- Add `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `clsx`, `tailwind-merge`, `tailwindcss`, `postcss`, `autoprefixer`.
- Update `@ai-job-agent/shared` to `*`.

#### [MODIFY] [apps/extension/package.json](file:///Users/sarthak/Desktop/job_applier/apps/extension/package.json)

- Update `@ai-job-agent/shared` to `*`.

#### [DELETE] `pnpm-workspace.yaml`

---

### 2. Shared Types & Mapper Custom Fields Support

#### [MODIFY] [packages/shared/src/types/index.ts](file:///Users/sarthak/Desktop/job_applier/packages/shared/src/types/index.ts)

- Add `CustomFieldEntry` interface (`id`, `label`, `key`, `value`, `verified`, `category`).
- Add `customFields` to `CandidateProfile`.

#### [MODIFY] [packages/shared/src/constants/index.ts](file:///Users/sarthak/Desktop/job_applier/packages/shared/src/constants/index.ts)

- Add default custom fields to `DEFAULT_CANDIDATE_PROFILE`.

#### [MODIFY] [apps/extension/src/mapper/index.ts](file:///Users/sarthak/Desktop/job_applier/apps/extension/src/mapper/index.ts)

- Enhance `DeterministicMapper` to match scanned fields against user-defined `customFields` by label, key, or name.

---

### 3. Supabase Integration

#### [NEW] `apps/web/src/lib/supabase/client.ts`

- Browser Supabase client singleton with graceful mock/fallback mode.

#### [NEW] `apps/web/src/lib/supabase/server.ts`

- Server-side Supabase client for Next.js Route Handlers / Server Actions.

#### [NEW] `apps/web/src/context/AuthContext.tsx`

- React context providing `user`, `session`, `signIn`, `signUp`, `signOut`, `isLoading`.

#### [NEW] `apps/web/src/app/login/page.tsx`

- Modern login page with email/password and demo login button.

#### [NEW] `apps/web/src/app/register/page.tsx`

- Registration page for creating accounts.

---

### 4. UI Overhaul (shadcn/ui + Tailwind CSS)

#### [NEW] `apps/web/tailwind.config.js` & `apps/web/postcss.config.js`

- Tailwind setup with CSS variables support.

#### [MODIFY] [apps/web/src/app/globals.css](file:///Users/sarthak/Desktop/job_applier/apps/web/src/app/globals.css)

- Tailwind base/components/utilities directives and color tokens.

#### [NEW] `apps/web/src/components/ui/`

- `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `tabs.tsx`, `switch.tsx`, `badge.tsx`, `alert.tsx`, `navbar.tsx`.

#### [MODIFY] [apps/web/src/app/layout.tsx](file:///Users/sarthak/Desktop/job_applier/apps/web/src/app/layout.tsx) & [apps/web/src/app/providers.tsx](file:///Users/sarthak/Desktop/job_applier/apps/web/src/app/providers.tsx)

- Wrap application with `AuthProvider` and clean Tailwind navbar.

#### [MODIFY] [apps/web/src/app/page.tsx](file:///Users/sarthak/Desktop/job_applier/apps/web/src/app/page.tsx)

- Redesigned landing dashboard using shadcn/ui cards and stats.

#### [MODIFY] [apps/web/src/app/profile/page.tsx](file:///Users/sarthak/Desktop/job_applier/apps/web/src/app/profile/page.tsx)

- Redesigned Profile manager with a dedicated **Custom Fields Manager** (add, edit, remove custom fields with live preview).

#### [MODIFY] [apps/web/src/app/test-forms/page.tsx](file:///Users/sarthak/Desktop/job_applier/apps/web/src/app/test-forms/page.tsx)

- Redesigned Test Forms Suite (LinkedIn, Greenhouse, Lever, Custom Fields, React Controlled forms).

---

### 5. Extension Rebuild & Verification

- Rebuild Chrome Extension with custom fields matching support.
- Run `npm run typecheck`, `npm run build`, `npm test`.
- Update `PHASE_PROGRESS.md`.

---

## Verification Plan

### Automated Tests

- `npm run typecheck` across all packages.
- `npm --prefix apps/extension test` to verify deterministic mapper & scanner tests with custom fields.
- `npm --prefix apps/web build` to verify Next.js builds cleanly with Tailwind.

### Manual Testing

- Open `http://localhost:3000/profile` and add a custom field (e.g. `Clearance Level: Top Secret`).
- Open `http://localhost:3000/test-forms` and run the Chrome Extension.
- Verify the extension auto-detects and fills the custom field along with standard profile fields.
