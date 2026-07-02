# AGENTS.md

Guidance for OpenCode sessions working in this repo (ImanHub — Expo/React Native Islamic companion app).

## Commands

- `npm start` — Expo dev server (`expo start`). Press `a`/`i` for Android/iOS.
- `npm run lint` — ESLint via `expo lint` (flat config, `eslint-config-expo/flat`).
- `npx tsc --noEmit` — typecheck (strict mode, extends `expo/tsconfig.base`).
- `npx expo export --platform all` — verify the bundle actually compiles.
- `npm run doctor` — run `react-doctor` (diagnostics/lint/accessibility triage).
- `npm run reset-project` — **broken**: references `scripts/reset-project.js` which does not exist. Do not run it.
- No test framework is configured. There are no test files and no `test` script.

## Verification order (matches CI in `.github/workflows/build.yml`)

`npm run lint` -> `npx tsc --noEmit` -> `npx expo export --platform all`

Run all three before considering work done. `tsc` passing does not guarantee the bundle exports successfully.

## Environment

- Only one app-level env var: `EXPO_PUBLIC_MISTRAL_API_KEY`, consumed by `utils/aiService.ts` (AI chatbot, model `devstral-2512`). Without it the chatbot throws "Mistral API key is not configured".
- `.env` is gitignored and exists locally. Create it with `EXPO_PUBLIC_MISTRAL_API_KEY=...` for chatbot features.
- Supabase (`EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY`) and OpenAI keys seen in `docs/` are **not** implemented — see "Docs are aspirational" below.

## Architecture

- **Expo Router** file-based routing; entry is `expo-router/entry` (`package.json` `main`). Root `app/_layout.tsx` wraps everything in `GestureHandlerRootView` -> `ThemeProvider` -> `Stack`.
- `(tabs)/` group holds the main tab screens; other `app/<feature>/` dirs are stack screens registered explicitly in `app/_layout.tsx` (`quran/[id]`, `athkar/[id]`, `athkar/counter/[category]`, `chatbot`, `duaa`, `knowledge`). Add new stack routes there or they won't render.
- **Path alias**: `@/*` -> repo root (e.g. `@/utils/storage`, `@/context/ThemeContext`). Use it for cross-dir imports.
- **New Architecture, React Compiler, and typed routes are all enabled** (`app.json` `experiments`). Consequences: follow the Rules of Hooks strictly (React Compiler enforces), and expo-router route params are type-checked.
- **Theming**: color palette in `constants/theme.ts`, state in `context/ThemeContext.tsx`. The React Navigation theme is derived from this palette inside `app/_layout.tsx` — update both when changing theme colors. Arabic font `Amiri` (Regular/Bold) is loaded in the root layout and used for Quran/Arabic text.
- **Storage**: `utils/storage.ts` is an AsyncStorage wrapper that *mimics* the MMKV API. `react-native-mmkv` is listed as a dependency but is **not** used; AsyncStorage is the actual backend. Storage keys are centralized in `KEYS` there.
- Platform-specific files are in use (e.g. `components/MosquesMap.tsx` vs `MosquesMap.web.tsx`). Respect the `.web`/native split when editing.
- App is Arabic-first / RTL.

## Data assets

- `assets/data/quran_text.json` (~3.7 MB) and `quran_tafsir.json` (~4.3 MB) are large committed JSON files imported directly by the app (not fetched). Do not open/edit them casually; regeneration is not scripted.
- Smaller JSON (`athkar_data.json`, `duaa_data.json`, `prophets_stories.json`, `sunnah_teachings.json`, `surahs.json`) holds feature content.

## Docs are aspirational, not implemented

- `docs/AUTHENTICATION_SYSTEM.md` (Supabase auth, OAuth) and `docs/TAJWID_WORKFLOW.md` (Whisper backend, voice scoring) describe **planned features that are not built**. There is no Supabase dependency, no `context/AuthContext.tsx`, no `app/tajwid/` routes, no backend server.
- Top-level `DESIGN.md`, `DESIGN_ARCHITECTURE.md`, `PRODUCT.md`, `IMPLEMENTATION_SUMMARY.md`, `report.md` are planning/design notes. Trust the code and config over these when they conflict.
- README "Future Enhancements" (MMKV, audio recitation, widgets) are not done.

## Git conventions

- Branch style: `fix/<topic>` (e.g. `fix/prayerTime`, `fix/refactoring`); `main` is the integration branch.
- Commit messages are loose/informal (`feat :`, `fix :`, `add :`, `chore:` — spacing varies). Match existing style; don't impose a strict convention.
