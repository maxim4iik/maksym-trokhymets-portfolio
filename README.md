# Maksym Trokhymets — Portfolio

Bilingual personal portfolio for **Maksym Trokhymets**, a business analyst with an engineering and marketing background. Built as a fast static site — vanilla HTML, CSS, and JS, no framework, no bundler, no runtime dependencies.

**Live:** [maksym-trokhymets-portfolio.vercel.app](https://maksym-trokhymets-portfolio.vercel.app)
&nbsp;·&nbsp; **EN:** [/](https://maksym-trokhymets-portfolio.vercel.app/)
&nbsp;·&nbsp; **UA:** [/ua/](https://maksym-trokhymets-portfolio.vercel.app/ua/)

## What's on the site

- Chronological **timeline** of roles (Ukrposhta → Karavan → Oskar Cinemas) with sticky markers and progress indicator.
- **Selected websites** gallery with in-page iframe previews and graceful fallback to captured screenshots for domains that block embedding.
- **Education + Languages** sourced from the CV (KPI Igor Sikorsky, Master's + Bachelor's; EN C1/C2 and DE B1/B2 with cert links).
- **GitHub activity** widget pulling public events for `@maxim4iik`.
- Downloadable CV (PDF) and direct contact links.

## Engineering notes

The repo doubles as a small case study, so a few decisions worth flagging:

- **Static-first**: every page is plain HTML served from the edge. `package.json` has no `dependencies`; `npm run build` only runs a lightweight validator script. Cold deploys take seconds.
- **Bilingual without i18n libraries**: `/` and `/ua/` are independently authored HTML files. Each carries `hreflang` and canonical metadata, with a shared sitemap.
- **Theme**: light/dark with `prefers-color-scheme` auto-detect plus a toggle button that persists the override in `localStorage`. A tiny `theme-init.js` runs before paint to avoid FOUC.
- **Caching**: HTML stays `must-revalidate`; assets under `/assets/`, `/images/`, `/files/`, `/previews/` are served `immutable, max-age=31536000` with manual `?v=YYYYMMDD-tag` cache-busting on CSS/JS.
- **Security headers** are set in [`vercel.json`](./vercel.json): `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`, and a baseline `Content-Security-Policy` for HTML responses. Iframe previews are sandboxed.
- **SEO & sharing**: canonical URLs, Open Graph + Twitter card metadata, `x-default` hreflang, JSON-LD `Person` schema, `robots.txt`, `sitemap.xml`.
- **A11y basics**: skip link, `aria-*` attributes on the preview modal, focus management, `prefers-reduced-motion` honored for scroll progress, theme-status pulse, and timeline animations.
- **Telemetry**: Vercel Speed Insights + Web Analytics loaded via `/_vercel/...` edge endpoints (no third-party network calls).

## Local development

```bash
npm run dev
```

Opens a tiny Node HTTP server at `http://localhost:4173`.

```bash
npm run build
```

Runs [`scripts/validate-static.mjs`](./scripts/validate-static.mjs) — a lightweight check that required files exist and that both `index.html` and `ua/index.html` contain expected landmarks (viewport meta, language alternates, main landmark, timeline / websites / contact sections). No dependency install required.

## Updating screenshot previews

The capture script writes WebP screenshots of each portfolio site to `previews/`. The HTML refers to them as `/previews/<slug>.webp`.

Prerequisites (intentionally not in `package.json` — install on demand):

```bash
npm install --no-save playwright sharp
npx playwright install chromium
npm run capture:previews
```

PNG snapshots are gitignored via `.vercelignore` / `.gitignore`; only the `.webp` outputs ship.

## Vercel configuration

If you re-deploy a fork, the project preset is:

- Framework preset: `Other`
- Build command: `npm run build`
- Output directory: `.`
- Install command: leave default or empty

Caching, redirects, and security headers are all declared in [`vercel.json`](./vercel.json) — no Vercel dashboard tweaks required to reproduce the configuration.

## Repository layout

```
.
├── index.html          ← English landing page
├── ua/index.html       ← Ukrainian landing page
├── assets/             ← CSS, JS, logos, favicon
├── images/             ← portrait + raster assets
├── files/              ← CV PDF
├── previews/           ← captured screenshots of portfolio sites
├── scripts/            ← Node helpers (validate, serve, capture)
├── robots.txt
├── sitemap.xml
└── vercel.json
```

## Usage and licensing

The source code in this repository is public so it can be read, reviewed, and learned from. **Personal content** — the CV, photographs, biographical text, and screenshots of client projects — is not licensed for reuse. If you want to base your own site on this code, please replace all personal content with your own.

For any questions, reach out via [email](mailto:trokhimets0402@gmail.com) or [Telegram](https://t.me/maxim4iik).
