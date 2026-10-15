# Verification

Completed 15 October 2026.

- Production build: TypeScript strict checks and Vite build pass. The built site serves successfully with Vite preview; developer and empty-source-page routes were also checked against that production build.
- Content integrity: all 80 pages and 766 articles have valid content files, unique IDs and typed routes, and official source URLs.
- Curated internal routes: checked against the imported corpus; no missing page or article targets.
- Homepage: desktop visual inspection of the hero and WebGL globe; light architecture section reviewed in-browser.
- Architecture explorer: WebRTC tab updates source/destination labels and explanatory copy.
- Global search: query `6.1.5` returns the correct release; selecting it navigates and loads the original release article.
- Download: switching to Debian/Ubuntu updates the installation panel; copying commands shows the verified `Copied` state.
- News: release filter and search `6.1.5` return the correct dated article.
- Resources: page search `management` returns the management page.
- Mobile: homepage additionally checked at 320×740 with no horizontal overflow; main layouts inspected at 390×844. Homepage, resource library, news, platform, developers, community, download, about, feature reference, and management reference fit the viewport without horizontal overflow in the observed checks.
- Mobile navigation: menu opens, exposes main links, and closes on navigation.
- Article content: latest release and management text render; their official source attribution remains available.
- Browser console: no errors or warnings observed in the tested desktop home/article workflow.
- Source safety: imported HTML sanitized; executable embeds and legacy form controls removed. Empty/dynamic source pages show a useful original-page link rather than a perpetual loading message.

## Boundaries

Module manuals, the maintained wiki, existing legacy wiki topics, tutorials, API references, database schema books, and event archive pages have local document bodies. The source manifest records the imported release branches, unavailable original URLs, and README fallbacks. Conference slides/recordings, software binaries, mailing systems, issue trackers, and interactive services retain their official destinations. Historical remote assets can depend on their original hosts. Every record is checked for integrity; every document and article has not been manually read or visually reviewed. The globe and topology are illustrations, not live infrastructure measurements.

## GitHub Pages configuration

- Repository base path `/kamailio-website/` applied to built assets, font URLs, BrowserRouter, content fetching, and document links.
- The Pages build generates a physical entry document for each imported project/article/document route and collection, plus a 404 fallback.
- Local Pages-mode browser verification: homepage navigation resolves under the repository path; management content loads; imported profile links retain the base path; no console errors or warnings observed.
- GitHub Actions checks both content corpora, builds, uploads the artifact, and deploys on pushes to main.

## Documentation expansion

- Desktop hub and reader reviewed at 1440×1000; mobile readers at 390×844.
- Stable dispatcher manual, core cookbook, and database schema books render original technical content.
- Module release filtering checked with 5.8.x and rtpengine. Database collections show versioned schema books.
- Function search `ds_select_dst` resolves dispatcher and scrolls to its exported-function heading. The outline can independently filter and navigate that section. Global keyboard search includes documentation results.
- Copy controls show `Copied`. The first imported dispatcher example exactly matches its source XML text before presentation highlighting.
- Mobile navigation opens and closes; Escape restores focus to its trigger. Hidden navigation links are removed from keyboard navigation. Cookbook and database pages have no page-level horizontal overflow at 390px. Wide schema tables scroll within their own container.
- Published DocBook chapter headings are normalized under a single document title so database books expose their chapters in the outline.
- The integrity check verifies individually compressed payloads, unique IDs and outlines, local document links, exclusion of empty missing-topic pages, and coverage against every fetched published module index.
- No console errors or warnings observed in the tested documentation flows.

- Final corpus: 6,278 local documents/archive pages, 4,938 module manuals across 28 release branches, and 266 indexed conference files. All 266 published stable manuals are local. The check accounts for 4,858 published module-index entries; 17 historical manuals are unavailable upstream and recorded.
- Final Pages build: 8,016 physical route entry documents. Direct module, wiki, and guide URLs and compressed document payloads return HTTP 200 in local Pages preview. Module entry HTML contains its own title and description.
- Pages-mode browser checks: keyboard function search opens dispatcher and positions the matching heading; standalone historical TLS content loads; original WordPress documentation links point to local manuals, cookbooks, installation guides, and database books. No console warnings/errors observed.
