# Qefro Documentation

Official documentation website for **[Qefro](https://qefro.com)** — the AI Workspace Platform for Customer AI, Employee AI, and Business Actions.

Built with [Docusaurus 3](https://docusaurus.io/), React, TypeScript, and MDX.

## V1 Documentation Track

This repository now includes a full V1 adoption track focused on:
- onboarding speed
- production deployment
- security and reliability defaults
- copy-paste examples

Start at:
- /docs/v1
- /docs/v1/getting-started
- /docs/v1/quick-start
- /docs/v1/deployment

Runnable examples are available under [examples](examples/README.md).

## Quick start

```bash
npm install
npm run start
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Local dev server with hot reload |
| `npm run build` | Production static build → `build/` (runs `generate:llms` first) |
| `npm run generate:llms` | Refresh `static/llms.txt` + `static/llms-full.txt` |
| `npm run serve` | Serve the production build locally |
| `npm run typecheck` | TypeScript check |
| `npm run lint:md` | Markdown lint |
| `npm run check:links` | Internal link check (after `build`) |
| `node scripts/generate-docs.mjs` | Regenerate structured doc stubs |

## Stack

- Docusaurus 3 + classic preset
- `@docusaurus/theme-mermaid` for architecture diagrams
- `@easyops-cn/docusaurus-search-local` (docs + blog, `Ctrl/⌘ + K`)
- Prism syntax highlighting (Rust, TypeScript, Python, Bash, JSON, …)
- Qefro brand theme (Plus Jakarta Sans, violet `#7c3aed`, cyan accent `#0891b2`)

## Repository layout

```text
docs/           Documentation (getting-started, platform, guides, api, security, compare)
blog/           Product & engineering blog
src/components  Reusable MDX components
src/css         Brand theme
src/pages       Homepage
static/         Logos, robots.txt, assets
scripts/        Doc generator + link checker
.github/        CI, Cloudflare Pages, GitHub Pages
```

## Deployment

`npm run build` emits a fully static site suitable for:

- Cloudflare Pages (default CI deploy job)
- GitHub Pages (`pages.yml`)
- Netlify / Vercel / any static host

Set secrets for Cloudflare:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Production URL (canonical): `https://docs.qefro.com`

Cloudflare Pages is the production deploy path (`.github/workflows/ci.yml`). The GitHub Pages workflow is **manual-only** fallback and is not required for launch.

### AI discovery (GEO)

| Endpoint | Purpose |
| --- | --- |
| https://docs.qefro.com/llms.txt | Curated doc map ([llmstxt.org](https://llmstxt.org)) |
| https://docs.qefro.com/llms-full.txt | Full Markdown dump of all docs |

Regenerated automatically on `npm run build` / `start`.

## Contributing

1. Prefer clear definitions first (GEO-friendly).
2. Link related concepts (no orphan pages).
3. Include Mermaid for architecture-heavy topics.
4. Keep compare pages factual — no misleading claims.
5. Run `npm run build` before opening a PR.

## License

Documentation © Qefro. Source code for this site is available under the repository license terms.
