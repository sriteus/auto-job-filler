# Phase 2 — Profile Onboarding and Local Auth Progress

## Overview

Implemented the local-first onboarding, profile persistence, custom-field mapping, and web UI migration described in `implementstion.md`.

## Completed in This Pass

- Replaced the Ant Design web screens with native responsive UI and removed all web Ant Design imports.
- Added onboarding that requires only first name, last name, and email; all other profile data is optional and editable later.
- Added custom profile answers with add/remove support. Saved answers are persisted in Zustand/localStorage and cached for the extension.
- Added deterministic custom-field matching by label, key, id, placeholder, and nearby form text.
- Added local fallback authentication context plus `/login` and `/register` routes. Supabase credentials can be layered in without blocking local testing.
- Added a native extension test form fixture.
- Added Supabase browser auth with local fallback, including `/login` and `/register` error handling.
- Added `supabase/schema.sql` with per-user profile storage and row-level security policies.
- Added authenticated profile load/upsert from the web app.
- Added Supabase sign-in and per-user profile loading in the extension popup.
- Added setup instructions in `supabase/README.md` and `.env.example` files for both apps.

## Verification

- `npm --prefix apps/web run typecheck` ✅
- `npm --prefix apps/web run build` ✅ (Next reports an existing ESLint 9 option warning)
- `npm --prefix apps/extension run typecheck` ✅
- `npm --prefix apps/extension test -- --runInBand` ✅ (4 tests)
- `npm --prefix apps/web run build` ✅ (Next reports an existing ESLint 9 option warning)
- `npm --prefix apps/extension run build` ✅

## Monorepo Structure

```
ai-job-agent/
├── apps/
│   ├── web/          # Next.js 14 App Router + Ant Design 5 + Zustand 4
│   └── extension/    # Chrome Extension Manifest V3 + Vite
├── packages/
│   └── shared/       # Shared types, Zod schemas, constants
├── turbo.json        # Turborepo v2 config (tasks)
├── pnpm-workspace.yaml
├── package.json      # Root workspace config
├── tsconfig.json     # Root TypeScript config with project references
└── PHASE_PROGRESS.md # This file
```

## Completed Tasks

### 1. Root Configuration

- **package.json**: Root workspace with scripts (dev, build, lint, typecheck, test, format), pnpm@9, turbo, TypeScript, ESLint 9, Prettier
- **pnpm-workspace.yaml**: Workspaces for `apps/*` and `packages/*`
- **tsconfig.json**: Strict mode, composite, path aliases for `@ai-job-agent/shared`, `@ai-job-agent/web`, `@ai-job-agent/extension`
- **turbo.json**: Turborepo v2 `tasks` (not `pipeline`) with build/lint/typecheck/test pipelines
- **.gitignore**: Node modules, dist, build, .turbo, .next, pnpm-lock.yaml
- **.eslintrc.js**: Type-aware TypeScript ESLint config with Prettier integration
- **.prettierrc**: Consistent formatting (single quotes, 2-space indent, trailing commas)

### 2. Shared Package (`packages/shared`)

**Dependencies**: zod
**Exports**: Main entry at `src/index.ts` with namespaced schemas export to avoid type collisions

**Files Created**:

- `src/types/index.ts` - Core types:
  - `PersonalInfo`, `Education`, `Experience`, `Skills`, `Projects`, `Preferences`
  - `ApplicationAnswers`, `CandidateProfile` with `VerifiedFact<T>`
  - `ScannedField`, `JobInfo`, `FillPlan`, `FillPlanEntry`
  - `FieldClassificationType` (25+ values), `FieldClassification`
  - AI answer types, `ApplicationHistory`, `ExtensionMessage` types
  - `ApiResponse<T>`, `VerifiedFact<T>`
- `src/schemas/index.ts` - Zod schemas mirroring all types, `ApiResponseSchema` generic, re-inferred types at bottom
- `src/constants/index.ts` - All constants:
  - `FIELD_CLASSIFICATION_TYPES` array, `CONFIDENCE_THRESHOLDS`, `getConfidenceLevel`
  - `FILL_ACTIONS`, `FILL_PRIORITY`, `SENSITIVE_FIELD_TYPES`, `isSensitiveField`
  - `DETERMINISTIC_FIELD_PATTERNS`, field labels, status icons
  - `API_ENDPOINTS`, `EXTENSION_MESSAGE_TYPES`, `STORAGE_KEYS`, `DEFAULT_VALUES`
  - `JOB_EXTRACTION_PATTERNS`, `FORM_DETECTION_KEYWORDS`
  - Resume MIME types and extensions
- `src/index.ts` - Barrel export with `export * as schemas` to avoid collisions

### 3. Web App (`apps/web`)

**Dependencies**: next@14, react@18, antd@5, zustand@4, @ai-job-agent/shared
**Build**: Next.js App Router, transpiles shared package

**Files Created**:

- `next.config.js` - Transpile packages, optimize antd imports
- `src/app/layout.tsx` - Root layout with Inter font, Providers
- `src/app/providers.tsx` - Client provider with Ant Design ConfigProvider (primary #1890ff)
- `src/app/page.tsx` - Home page with 4 cards: Profile, Answers, Applications, Extension
- `src/app/globals.css` - Ant Design reset + custom CSS variables (no Tailwind)
- `src/lib/api.ts` - `ApiClient` class with get/post/put/patch/delete; profile/resume/application/jobs APIs
- `src/stores/profileStore.ts` - Zustand persist store `ai-job-agent-profile`
- `src/stores/uiStore.ts` - Zustand store for sidebar, tabs, notifications
- `src/components/ui/PageHeader.tsx` - Reusable page header component
- `tsconfig.json` - Extends root, includes shared package paths
- `next-env.d.ts` - Next.js type references

### 4. Chrome Extension (`apps/extension`)

**Dependencies**: webextension-polyfill, @ai-job-agent/shared
**Build**: Vite multi-entry (background, content, popup), path aliases

**Files Created**:

- `manifest.json` - MV3 with activeTab/storage/scripting permissions, `<all_urls>` host permission, service worker background, content script at document_idle, popup.html
- `vite.config.ts` - Multi-entry build, path aliases, ESNext modules
- `src/background/index.ts` - Service worker handling SCAN_PAGE, FILL_FORM, GET_PROFILE, UPDATE_PROFILE; tab update listener for job page detection; `callBackendAPI` to localhost:3000
- `src/content/index.ts` - Content script with:
  - DOM form field extraction (input, textarea, select, ARIA roles)
  - Label finding (explicit, parent, aria-labelledby)
  - Nearby text context extraction
  - Options extraction for select/radio/checkbox
  - Native value setters + input/change/blur events for React-controlled inputs
  - MutationObserver for dynamic forms
  - Fill functions for all element types with verification
- `src/popup/index.html` + `index.ts` - Popup UI with scan/fill buttons, field list, dashboard link
- `src/scanner/index.ts` - Placeholder (throws "not implemented yet")
- `src/mapper/index.ts` - Placeholder (throws "not implemented yet")
- `src/filler/index.ts` - Placeholder (throws "not implemented yet")
- `src/adapters/api.ts` - `ExtensionAPIClient` for backend communication
- `src/components/index.ts` - Empty export (no React in extension)
- `public/icons/icon-{16,48,128}.png` - Placeholder SVG content (need proper PNG generation)

### 5. Fixes Applied

- **Turbo config**: Changed `pipeline` → `tasks` for Turborepo v2.10.12
- **Shared barrel collision**: Fixed `FieldClassificationType`, `FillAction`, `CandidateProfile` conflicts by using `export * as schemas` and explicit constant exports
- **Extension tsconfig**: Added `../../packages/shared/src/**/*` to includes for project references
- **Content script DOM typing**: Fixed `HTMLElement` casts, `Array.from` for `HTMLOptionsCollection`/`NodeList`/`addedNodes`, `getAttribute('name')` instead of `.name`
- **Popup button typing**: Cast `getElementById` results to `HTMLButtonElement`/`HTMLDivElement`/etc. for `.disabled`, `.textContent`, `.innerHTML`
- **Postinstall script**: Removed failing `build:shared` postinstall hook
- **Web globals.css**: Removed `@tailwind` directives (Tailwind not installed)
- **Root tsconfig**: Removed `references` and `composite` from root (only in packages)

## Verification Status

| Check                       | Status       |
| --------------------------- | ------------ |
| `pnpm install`              | ✅ Completed |
| Shared package typecheck    | ⏳ Pending   |
| Extension package typecheck | ⏳ Pending   |
| Web package typecheck       | ⏳ Pending   |
| `pnpm build`                | ⏳ Pending   |
| `pnpm lint`                 | ⏳ Pending   |

## Known Issues / Risks

1. **Extension icons**: `public/icons/icon-*.png` contain SVG markup, not actual PNG binary. Need proper PNG generation for Chrome Web Store.

2. **TypeScript verification pending**: Typecheck commands were timing out in the classifier. Need to run manually:

   ```bash
   npx tsc --noEmit -p packages/shared/tsconfig.json
   npx tsc --noEmit -p apps/extension/tsconfig.json
   npx tsc --noEmit -p apps/web/tsconfig.json
   ```

3. **ESLint config**: ESLint 9 flat config may need adjustments for TypeScript project references.

4. **Build scripts**: Individual package build scripts need verification (Vite for extension, Next.js for web).

## Next Phase Prerequisites

Phase 2 (Database - PostgreSQL, Prisma) requires:

- Phase 1 typecheck/build/lint all passing
- Shared package types stabilized for Prisma schema generation
- Web app ready for database connection

## Commands to Complete Verification

```bash
# From root directory
cd /Users/sarthak/Desktop/job_applier

# Typecheck all packages
npx tsc --noEmit -p packages/shared/tsconfig.json
npx tsc --noEmit -p apps/extension/tsconfig.json
npx tsc --noEmit -p apps/web/tsconfig.json

# Build all packages
pnpm build

# Lint all packages
pnpm lint
```

## Implementation Notes

- **No AI implementation** in Phase 1 (per README: "Do not implement AI, form filling as a product feature, or database business logic in Phase 1")
- **No database** - Phase 2 will add Prisma/PostgreSQL
- **Extension never holds LLM keys** - Backend validates structured decisions
- **Safety rules preserved**: No auto-submit, no fabricated data, no CAPTCHA bypass, prompt injection protection via treating webpage content as untrusted
- **Fill Plan architecture**: Deterministic mapping first, LLM only for ambiguous fields, confidence thresholds enforced
