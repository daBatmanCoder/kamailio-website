# Kamailio — The world connects here.

A complete local redesign of the Kamailio project website: React 19, TypeScript, Vite, React Router, Three.js, and DOMPurify.

## Run

```sh
npm install
npm run dev
```

Vite prints the local URL (normally http://127.0.0.1:5173).

```sh
npm run content:check
npm run build
npm run preview
```

Deploy the generated `dist/` folder to any static host. Configure a fallback to `index.html` for client-side routes. `public/_redirects` includes a Netlify-compatible fallback. The Vite preview server also supports these routes.

## GitHub Pages

Live URL: https://dabatmancoder.github.io/kamailio-website/

Pushes to `main` run `.github/workflows/pages.yml`: install locked dependencies, verify the content corpus, build with the repository base path, and deploy to GitHub Pages. The workflow can also be started manually from Actions.

```sh
npm run build:pages
npm run preview -- --mode github-pages
```

The Pages build uses `/kamailio-website/` for assets, routing, content fetches, and document links. It creates physical HTML entry documents for every known project and legacy route, so direct links and refreshes work on GitHub Pages. `npm run dev` and the regular `npm run build` still target the domain root.

## Content

Imported on 15 October 2026 from Kamailio’s public WordPress REST API:

- **80 published pages**
- **766 published news articles**
- Latest verified stable release: **6.1.5**, released 15 October 2026

All original published page and post bodies are available in `public/content/{id}.json`. The lightweight search index lives in `src/data/content.json`. Article bodies load individually and are sanitized with DOMPurify before rendering. Original forms and executable embeds are removed; use the “View original page” link for legacy submissions. Historical technical instructions retain their original version information and are marked as historical references.

The new site preserves all 846 imported records; the resource library exposes every original page and the news archive exposes every article. Internal article links resolve to local routes where their targets are in the corpus. Legacy `/w/...` article routes are also supported. Module documentation, wikis, source archives, conference sites, and external services remain linked to their official homes; these separate sites are not mirrored.

Refresh the corpus:

```sh
npm run content:sync
```

This updates the records and search index. Homepage and download release highlights are deliberately curated; update the version/date and featured artwork when refreshing for a newer release. Review the refreshed content and rebuild before deploying.

## Structure

- `src/components/Globe.tsx` — interactive WebGL globe, reduced-motion support, visibility-aware rendering, resource cleanup, and CSS fallback
- `src/components/UI.tsx` — shared visual primitives
- `src/pages/Home.tsx` — homepage narrative and interactive architecture explorer
- `src/pages/` — individual platform, developer, community, download, about, news, library, and article page components
- `src/App.tsx` — navigation, keyboard search, routes, footer, and page effects
- `src/styles.css` — responsive design system and motion preferences
- `src/data/navigation.ts` — navigation and capability content
- `scripts/sync-content.mjs` — repeatable public-content import
- `docs/DESIGN.md` — design direction, references, and decisions
- `docs/VERIFICATION.md` — verification performed and boundaries

## Accessibility & privacy

Semantic landmarks, skip link, visible focus treatment, a native modal search dialog, keyboard shortcuts, keyboard-operated architecture tabs, labeled filters, reduced motion, responsive navigation, self-hosted fonts, and no analytics or tracking cookies. The globe is decorative illustration rather than live network telemetry. No backend or account creation is required.

## Attribution

Project content and Kamailio trademarks belong to their respective owners. The source software is GPLv2+; this does not imply that the original website text or trademarks carry the same license. Keep content attribution and confirm reuse rights before public release. Design references were used for composition and interaction research, with no copied proprietary assets. Manrope and IBM Plex Mono are distributed under the SIL Open Font License; license copies are in `public/fonts/`. Geographic point data is derived from Natural Earth via the public-domain `datasets/geo-countries` dataset.
