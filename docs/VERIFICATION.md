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

External module documentation, wikis, download archives, mailing systems, and conference sites remain official outbound destinations. Historic linked assets may depend on their original hosts. Every record was checked for integrity; every article was not manually read or visually reviewed. The globe and topology are illustrations, not live infrastructure measurements. No public deployment was performed.
