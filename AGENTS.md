# PROJECT: PULSERA APP

## CONTEXT
Mobile blog app for spiritual healer Dina Kanunikova (pulsera.ru).
Content: spiritual practices, art therapy, meditations.
Free + premium subscription content.

## TECH STACK
- React Native + Expo SDK 54
- Expo Router (file-based routing)
- TypeScript (strict mode)
- Zustand (state management)
- Supabase (auth, database, storage, realtime)
- ЮКасса + Stripe (subscriptions, WebView payment)
- Expo Video (native), HTML5 (web) for video playback
- expo-av for audio playback
- react-native-keyboard-aware-scroll-view
- react-native-markdown-display (article body rendering)
- expo-file-system/legacy (offline caching + uploads)
- expo-document-picker (admin file uploads)

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
- src/app/(tabs)/ - bottom navigation tabs (Home, Catalog, Community, Profile)
- src/app/admin/ - admin panel screens
- src/components/ - reusable UI components
- src/hooks/ - custom React hooks
- src/services/supabase.ts - Supabase client with Database types
- src/services/api.ts - API functions
- src/store/ - Zustand stores (auth, theme, download, bookmark)
- src/utils/ - utility functions (theme, offline cache, upload, storage)
- src/types/ - shared TypeScript types

## THEME SYSTEM
- Dual theme: light + dark via `useTheme()` hook
- Default: light (`mode: 'light'`)
- Light: `#fffee0` bg, `#014960` primary (deep teal), `#fcb900` gold, `#a5593b` copper
- Dark: `#1a1a2e` bg, `#6c63ff` primary accent
- Key tokens: `cardBorder`, `cardIconBg`, `cardIconColor`, `inputBg`, `textMuted`
- Copper is light-theme only; dark uses gray `#333333` borders

## SUBSCRIPTION MODEL
- NOT RevenueCat — custom ЮКасса + Stripe via WebView payment
- Tiers: Free, Путь (paid content), Пробуждение (Путь + разборы + chat)
- Admin test toggles for subscription simulation
- Webhook via Supabase Edge Functions (TODO)

## OFFLINE CACHING
- Downloads: articles (.txt), audio (.mp3), video (.mp4)
- Preview images + body images from markdown saved locally
- Markdown image URLs rewritten to local paths on download
- Metadata stored in AsyncStorage key `@pulsera_downloads`
- Files in `{documentDirectory}downloads/`
- DownloadButton subscribes to store via selectors (not local useState)

## NAVIGATION
- Tabs: Home (home), Catalog (book), Community (comment-o), Profile (user)
- Inactive tab tint: `colors.textSecondary`
- Admin panel: accessible from profile menu (role-based)
- Subscription screen: accessible from profile "Улучшить подписку"

## ICONS
- All UI icons: FontAwesome (`@expo/vector-icons`)
- No emoji in UI

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
- `expo-file-system` legacy API: use `expo-file-system/legacy` for `readAsStringAsync` + `EncodingType`
- Supabase RLS: SELECT (public), UPDATE/DELETE (own + admin), INSERT (own profile via `auth.uid() = id`)
- `comments.user_id` references `auth.users`, NOT `profiles` — no PostgREST relationship; use two separate queries
- Android ExoPlayer always re-buffers on replay — platform limitation, accepted as-is

## DOCUMENTATION
- **Architecture:** `/docs/architecture.md` — full project structure, tech stack, decisions
- **Progress:** `/docs/progress.md` — completed features
- **Database schema:** `/docs/database-schema.md` — tables, migrations, RLS, triggers
