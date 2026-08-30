# PROJECT: PULSERA APP

## CONTEXT
Mobile blog app for spiritual healer Dina Kanunikova (pulsera.ru).
Content: spiritual practices, art therapy, meditations.
Free + premium subscription content.

## TECH STACK
- React Native + Expo (latest)
- Expo Router (file-based routing)
- TypeScript (strict mode)
- Zustand (state management)
- Supabase (auth, database, storage)
- RevenueCat (subscriptions)

## CODE STANDARDS
1. Use TypeScript with strict types
2. Functional components with typed props
3. Custom hooks must start with "use"
4. Wrap all async operations in try-catch
5. Use named exports (not default)
6. Comments in Russian
7. Each file should be self-contained

## PROJECT STRUCTURE
- src/app/ - screens (Expo Router file-based routing)
- src/app/(tabs)/ - bottom navigation tabs
- src/components/ - reusable UI components
- src/hooks/ - custom React hooks
- src/services/supabase.ts - Supabase client
- src/services/api.ts - API functions
- src/store/ - Zustand stores
- src/utils/ - utility functions
- src/types/ - shared TypeScript types

## CURRENT PROGRESS
See docs/progress.md for actual status.

## RULES
- Work on one task at a time
- Update docs/progress.md after completing each task
- If task is complex, propose plan first
- Document architecture decisions in docs/architecture.md
- Follow Expo best practices
- Use functional programming patterns
- **COMMITS: Only commit and push to Git when the user explicitly asks for it**

## IMPORTANT
- Always check existing code before creating new files
- Follow existing patterns in the codebase
- Suggest improvements if you see them
- Explain your decisions briefly