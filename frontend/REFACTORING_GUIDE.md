# Project Refactoring Guide

This document outlines the refactoring to match recommended Vite project structure.

## New Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable UI components
│   ├── ui/          # Base UI components (shadcn/ui)
│   └── common/      # Common shared components
├── features/        # Feature-based modules
│   ├── auth/
│   │   └── components/
│   ├── tasks/
│   │   └── components/
│   ├── sheets/
│   │   └── components/
│   └── home/
│       └── components/
├── layouts/         # Layout components (Navigation, Footer, PageLayout)
├── pages/           # Page components (route components)
├── router/          # Routing configuration
├── stores/          # State management
├── hooks/           # Custom hooks
├── services/        # API services
├── lib/             # Utility libraries
├── utils/           # Utility functions
├── types/           # TypeScript types
├── styles/          # Global styles
├── i18n/            # Internationalization
├── App.tsx
└── main.tsx
```

## Import Path Aliases

All imports should use the `@/` alias:
- `@/components/*` - UI components
- `@/features/*` - Feature modules
- `@/pages/*` - Page components
- `@/layouts/*` - Layout components
- `@/router/*` - Router configuration
- `@/stores/*` - State management
- `@/services/*` - API services
- `@/types/*` - TypeScript types
- `@/utils/*` - Utility functions
- `@/hooks/*` - Custom hooks
- `@/lib/*` - Utility libraries
- `@/styles/*` - Global styles
- `@/i18n/*` - Internationalization

## Migration Status

### ✅ Completed
- Created new folder structure (features, pages, layouts, router)
- Moved page components to pages/
- Moved layout components to layouts/
- Created router configuration
- Updated App.tsx to use new router
- Updated core store and service imports

### 🔄 In Progress
- Updating import paths in all files
- Moving remaining feature components
- Consolidating API services

### 📝 Remaining Tasks
1. Update all relative imports (`../`) to use `@/` alias
2. Move remaining components to appropriate feature folders
3. Update all page component imports
4. Update feature component imports
5. Move request.sql to root directory
6. Test all routes and components

## Files That Need Import Updates

Run this command to find all files with relative imports:
```bash
grep -r "from ['\"]\.\./" frontend/src
```

Common patterns to update:
- `../store/` → `@/store/`
- `../services/` → `@/services/`
- `../types/` → `@/types/`
- `../components/` → `@/components/`
- `../utils/` → `@/utils/`
- `../hooks/` → `@/hooks/`
- `../layouts/` → `@/layouts/`
- `../pages/` → `@/pages/`

