# Maksym Trokhymets Portfolio

Static bilingual portfolio website optimized for fast Vercel hosting.

## Local Run

```bash
npm run dev
```

Open `http://localhost:4173`.

## Validation

```bash
npm run build
```

The build step is intentionally lightweight: this is a static site with no dependency install required.

## Vercel

- Framework preset: `Other`
- Build command: `npm run build`
- Output directory: `.`
- Install command: leave default or empty

The site is static-first, so Vercel serves it without serverless functions.

## Screenshot Previews

If Playwright is available locally:

```bash
npm run capture:previews
```

The script writes project screenshots to `public/previews/`.
