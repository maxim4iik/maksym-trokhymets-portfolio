# Maksym Trokhymets Portfolio

Static bilingual portfolio website (EN + UA) optimized for fast Vercel hosting. Vanilla HTML/CSS/JS, no framework, no build step.

## Local Run

```bash
npm run dev
```

Open `http://localhost:4173`.

## Validation

```bash
npm run build
```

Runs `scripts/validate-static.mjs` — a lightweight check that required files exist and that both `index.html` and `ua/index.html` contain the expected landmarks. No dependency install required.

## Vercel

- Framework preset: `Other`
- Build command: `npm run build`
- Output directory: `.`
- Install command: leave default or empty

The site is static-first, so Vercel serves it without serverless functions. Caching, redirects, and security headers are configured in [`vercel.json`](./vercel.json).

## Cache strategy

HTML pages: `max-age=0, must-revalidate` (always fresh).
Assets under `/assets/`, `/images/`, `/files/`, `/previews/`: `max-age=31536000, immutable`. Bust the cache for CSS/JS by bumping the `?v=YYYYMMDD-tag` query in `<link>`/`<script>` tags inside both `index.html` and `ua/index.html`.

## Screenshot Previews

The capture script writes screenshots directly to `previews/` at the repo root (not `public/`). HTML refers to them as `/previews/<slug>.webp`.

Prerequisites (not declared in `package.json` — install on demand):

```bash
npm install --no-save playwright sharp
npx playwright install chromium
```

Then:

```bash
npm run capture:previews
```

PNG snapshots are gitignored via `.vercelignore` / `.gitignore`; the `.webp` outputs ship.
