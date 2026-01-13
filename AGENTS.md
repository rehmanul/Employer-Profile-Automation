# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Next.js App Router UI. `app/page.tsx` is the main dashboard, `app/layout.tsx` defines the shell, and `app/globals.css` contains global styles.
- `public/` stores static assets (e.g., `public/favicon.ico`).
- `index.html` is a standalone static frontend, separate from the Next.js app.
- Automation assets live at the repo root: `COMPLETE_BLUEPRINT.json` (Make.com scenario) and `BENEFITS_LIST.txt` (benefit keywords).
- Root config files include `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, plus deployment configs `netlify.toml` and `render.yaml`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the local Next.js dev server at `http://localhost:3000`.
- `npm run build` builds the production bundle.
- `npm run start` serves the production build locally (run after `npm run build`).
- `npm run lint` runs ESLint with the Next.js core web vitals rules.

## Coding Style & Naming Conventions
- TypeScript + React with Tailwind utility classes in JSX. Keep UI changes in `app/` and use `.tsx`.
- Follow existing formatting: 2-space indentation, semicolons, and single quotes in TS/JS.
- Components are `PascalCase`, hooks/utilities are `camelCase`, and route files follow Next.js conventions (`page.tsx`, `layout.tsx`).

## Testing Guidelines
- No automated test runner or coverage rules are configured yet (no `npm test` script).
- Validate changes by running `npm run lint` and `npm run build`, then verify UI flows via `npm run dev`.
- If you add tests, use `*.test.ts`/`*.test.tsx` naming and document the runner and coverage expectations in `package.json`.

## Commit & Pull Request Guidelines
- Match the existing commit style: short, imperative summaries with optional prefixes like `feat:` or `fix:` (e.g., `feat: add toolbar to grid view`).
- PRs should explain behavior/UI changes, link related issues, and include screenshots or GIFs for visual updates.
- Call out any changes to Make.com scenarios, webhook payloads, or the blueprint file in the PR description.

## Security & Configuration Tips
- Do not commit API keys or secrets; Brandfetch credentials are managed in Make.com.
- The default webhook URL is defined in `app/page.tsx`; update it locally for your Make.com scenario when testing.
- Keep deployment configs (`netlify.toml`, `render.yaml`) aligned with hosting changes.
