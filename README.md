# Maksym Trokhymets — Portfolio

Bilingual personal portfolio for **Maksym Trokhymets**, a business analyst with an engineering and marketing background. Built as a fast static site — vanilla HTML, CSS, and JS, no framework, no bundler, no runtime dependencies.

**Live:** [maksym-trokhymets-portfolio.vercel.app](https://maksym-trokhymets-portfolio.vercel.app)
&nbsp;·&nbsp; **EN:** [/](https://maksym-trokhymets-portfolio.vercel.app/)
&nbsp;·&nbsp; **UA:** [/ua/](https://maksym-trokhymets-portfolio.vercel.app/ua/)

## What's on the site

- Chronological **timeline** of roles (Ukrposhta → Karavan → Oskar Cinemas) with sticky markers and a vertical scroll progress indicator.
- **Selected websites** gallery with in-page iframe previews and graceful fallback to captured screenshots for domains that block embedding.
- **Education + Languages** sourced from the CV (KPI Igor Sikorsky, Master's + Bachelor's; EN C1/C2 and DE B1/B2 with certificate links).
- **GitHub activity** widget pulling public events for `@maxim4iik`.
- Downloadable CV (PDF) and direct contact links.

## Engineering notes

A few decisions worth flagging, since the repo doubles as a small case study:

- **Static-first.** Every page is plain HTML served from the edge. `package.json` has no runtime `dependencies`; `npm run build` only runs a validator. Cold deploys take seconds.
- **Bilingual without i18n libraries.** `/` and `/ua/` are independently authored HTML files. Each carries `hreflang` and canonical metadata, with a shared sitemap.
- **Theme.** Light/dark with `prefers-color-scheme` auto-detect plus a toggle button that persists the override in `localStorage`. A tiny `theme-init.js` runs before paint to avoid FOUC.
- **Caching.** HTML stays `must-revalidate`; assets under `/assets/`, `/images/`, `/files/`, `/previews/` are served `immutable, max-age=31536000` with manual `?v=YYYYMMDD-tag` cache-busting on CSS/JS.
- **Security headers** are set in [`vercel.json`](./vercel.json): `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`, and a baseline `Content-Security-Policy` for HTML. Iframe previews are sandboxed.
- **SEO & sharing.** Canonical URLs, Open Graph + Twitter card metadata, `x-default` hreflang, JSON-LD `Person` schema, `robots.txt`, `sitemap.xml`.
- **A11y basics.** Skip link, `aria-*` attributes on the preview modal, focus management, `prefers-reduced-motion` honored for scroll progress, theme-status pulse, and timeline animations.
- **Telemetry.** Vercel Speed Insights + Web Analytics loaded via `/_vercel/...` edge endpoints — no third-party network calls.


## Licensing

The source code is public so it can be read, reviewed, and learned from. **Personal content** — the CV, photographs, biographical text, and screenshots of client projects — is not licensed for reuse. If you want to base your own site on this code, please replace all personal content with your own.

Reach out via [email](mailto:trokhimets0402@gmail.com) or [Telegram](https://t.me/maxim4iik).
