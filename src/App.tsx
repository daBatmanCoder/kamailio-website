import { siteHref } from "./lib/urls";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Search,
  Menu,
  X,
  ArrowUpRight,
  Github,
  ArrowRight,
} from "lucide-react";
import Home from "./pages/Home";
import { Platform } from "./pages/Platform";
import { Developers } from "./pages/Developers";
import { Community } from "./pages/Community";
import { Download } from "./pages/Download";
import { About } from "./pages/About";
import { News } from "./pages/News";
import { Resources } from "./pages/Resources";
import { ContentPage } from "./pages/ContentPage";
import { NotFound } from "./pages/NotFound";
import { Mark, clean } from "./components/UI";
import { resourceGroups } from "./data/navigation";
import content from "./data/content.json";
const DocsHome = lazy(() => import("./pages/docs/DocsHome"));
const DocsLibrary = lazy(() => import("./pages/docs/DocsLibrary"));
const DocReader = lazy(() => import("./pages/docs/DocReader"));
const DocsSources = lazy(() =>
  import("./pages/docs/DocsSources").then((m) => ({ default: m.DocsSources })),
);
const DocsPresentations = lazy(() =>
  import("./pages/docs/DocsSources").then((m) => ({
    default: m.DocsPresentations,
  })),
);
import {
  loadDocumentation,
  findDocs,
  docSearchURL,
  kinds,
  versionLabel,
  type DocRecord,
} from "./lib/documentation";
function Header() {
  const [menu, setMenu] = useState(false),
    [q, setQ] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    dialog.current?.close();
  }, [location]);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  function openSearch() {
    loadDocumentation()
      .then((data) => setDocs(data.catalog))
      .catch(() => {});
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.focus());
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        dialog.current?.open ? dialog.current.close() : openSearch();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    document.body.classList.toggle("menu-open", menu);
    return () => document.body.classList.remove("menu-open");
  }, [menu]);
  const results = q.trim()
    ? content
        .filter((x) =>
          (clean(x.title) + " " + clean(x.excerpt))
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .slice(0, 10)
    : content.filter((x) =>
        [
          "features",
          "documentation",
          "download",
          "support",
          "business-directory",
          "management",
        ].includes(x.slug),
      );
  const docResults = findDocs(docs, q, 8);
  return (
    <>
      <header className="site-header">
        <Link to="/" className="wordmark" aria-label="Kamailio home">
          <Mark />
          kamailio<span>®</span>
        </Link>
        <nav aria-label="Primary navigation" className={menu ? "is-open" : ""}>
          {[
            ["Platform", "/platform"],
            ["Documentation", "/docs"],
            ["Community", "/community"],
            ["About", "/about"],
            ["Resources", "/resources"],
          ].map(([t, u]) => (
            <NavLink key={u} to={u}>
              {t}
              {t === "Resources" && <span className="nav-plus">+</span>}
            </NavLink>
          ))}
          <Link className="mobile-download" to="/download">
            Get Kamailio <ArrowUpRight size={15} />
          </Link>
        </nav>
        <div className="header-actions">
          <button
            className="search-trigger"
            aria-label="Search Kamailio"
            onClick={openSearch}
          >
            <Search size={17} />
            <kbd>⌘ K</kbd>
          </button>
          <Link className="header-download" to="/download">
            Get Kamailio
            <ArrowUpRight size={15} />
          </Link>
          <button
            className="menu-toggle"
            aria-expanded={menu}
            aria-label={menu ? "Close menu" : "Open menu"}
            onClick={() => setMenu((x) => !x)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-label="Search Kamailio content"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="search-dialog-top">
          <Search size={22} />
          <input
            ref={input}
            placeholder="Search the Kamailio universe…"
            aria-label="Search all pages and news"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            aria-label="Close search"
            onClick={() => dialog.current?.close()}
          >
            <X size={21} />
          </button>
        </div>
        <div className="search-results">
          <LabelSmall>{q ? "SEARCH RESULTS" : "QUICK CONNECTIONS"}</LabelSmall>
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                navigate(
                  `${p.type === "post" ? "/news/" : "/content/"}${p.slug}`,
                );
                setQ("");
              }}
            >
              <span>
                {clean(p.title)}
                <small>
                  {p.type === "post" ? "News & updates" : "Project reference"}
                </small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))}
          {!!docResults.length && <LabelSmall>DOCUMENTATION</LabelSmall>}
          {docResults.map((record) => (
            <button
              key={record.id}
              onClick={() => {
                navigate(docSearchURL(record, q));
                setQ("");
              }}
            >
              <span>
                {record.title}
                <small>
                  {kinds[record.kind]} · {versionLabel(record.version)}
                </small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))}
          {!results.length && !docResults.length && (
            <p>No results. Try “routing”, “TLS”, or “release”.</p>
          )}
        </div>
        <div className="search-dialog-bottom">
          {(content.length + docs.length).toLocaleString()} pages & documents
          connected<span>ESC TO CLOSE</span>
        </div>
      </dialog>
    </>
  );
}
function LabelSmall({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}
function Footer() {
  return (
    <footer className="site-footer section">
      <div className="footer-top">
        <div>
          <Link to="/" className="wordmark">
            <Mark />
            kamailio<span>®</span>
          </Link>
          <p>The world connects here.</p>
          <a
            href="https://github.com/kamailio/kamailio"
            className="github-link"
            aria-label="Kamailio on GitHub"
          >
            <Github size={19} />
            <span>Open source, always.</span>
            <ArrowUpRight size={15} />
          </a>
        </div>
        {resourceGroups.slice(0, 4).map((g) => (
          <div className="footer-column" key={g.title}>
            <h3>{g.title}</h3>
            {g.items.slice(0, 5).map(([t, u]) => (
              <a href={siteHref(u)} key={t}>
                {t}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} The Kamailio SIP Server Project</p>
        <div>
          <span className="status-dot" />
          COMMUNITY BUILT. GPLv2+ LICENSED.
        </div>
        <Link to="/resources">
          All resources <ArrowRight size={14} />
        </Link>
      </div>
      <div className="footer-giant" aria-hidden="true">
        kamailio<span>↗</span>
      </div>
    </footer>
  );
}
function PageEffects() {
  const location = useLocation();
  useEffect(() => {
    let timer: number;
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash)
      timer = window.setTimeout(
        () =>
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }),
        200,
      );
    else window.scrollTo(0, 0);
    const name =
      location.pathname === "/"
        ? "The world connects here."
        : location.pathname
            .split("/")
            .filter(Boolean)
            .pop()
            ?.replaceAll("-", " ");
    document.title = `Kamailio — ${name}`;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.06 },
    );
    document.querySelectorAll(".reveal").forEach((e) => observer.observe(e));
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location]);
  return null;
}
export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <PageEffects />
      <main id="main">
        <Suspense
          fallback={
            <div className="section" role="status">
              Connecting to the knowledge network…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<DocsHome />} />
            <Route path="/docs/modules" element={<DocsLibrary modules />} />
            <Route
              path="/docs/modules/:version"
              element={<DocsLibrary modules />}
            />
            <Route
              path="/docs/collections/:collection"
              element={<DocsLibrary />}
            />
            <Route path="/docs/presentations" element={<DocsPresentations />} />
            <Route path="/docs/sources" element={<DocsSources />} />
            <Route path="/docs/*" element={<DocReader />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/community" element={<Community />} />
            <Route path="/download" element={<Download />} />
            <Route path="/about" element={<About />} />
            <Route path="/news" element={<News />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/content/:slug" element={<ContentPage />} />
            <Route path="/news/:slug" element={<ContentPage />} />
            <Route path="/w/*" element={<ContentPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
