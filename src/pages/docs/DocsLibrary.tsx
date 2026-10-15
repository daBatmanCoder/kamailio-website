import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  Braces,
  BookOpen,
  ChevronRight,
  Filter,
} from "lucide-react";
import DocsNav from "../../components/docs/DocsNav";
import { Label } from "../../components/UI";
import {
  useDocumentation,
  docURL,
  docSearchURL,
  versionLabel,
  kinds,
  STABLE,
  type DocKind,
} from "../../lib/documentation";
export default function DocsLibrary({
  modules = false,
}: {
  modules?: boolean;
}) {
  const { collection, version: routeVersion } = useParams();
  const navigate = useNavigate();
  const { data, error } = useDocumentation();
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("All topics"),
    [letter, setLetter] = useState("All"),
    [limit, setLimit] = useState(36),
    [wikiVersion, setWikiVersion] = useState(
      ["wiki", "tutorial"].includes(collection || "wiki") ? "current" : "all",
    );
  useEffect(() => {
    setQ("");
    setCategory("All topics");
    setLetter("All");
    setLimit(36);
    setWikiVersion(
      ["wiki", "tutorial"].includes(collection || "wiki") ? "current" : "all",
    );
  }, [collection, modules]);
  const kind = (modules ? "module" : collection || "wiki") as DocKind;
  const version = modules
    ? routeVersion === "stable"
      ? STABLE
      : routeVersion || STABLE
    : wikiVersion;
  const all = data?.catalog.filter((r) => r.kind === kind) || [];
  const categories = [
    ...new Set(
      all
        .filter((r) => !modules || r.version === version)
        .map((r) => r.category),
    ),
  ].sort();
  const versions = [
    ...new Set(all.map((r) => r.version).filter((v) => v !== "general")),
  ].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const filtered = all
    .filter(
      (r) =>
        (modules
          ? r.version === version
          : version === "all" ||
            (version === "current"
              ? r.version === "general" ||
                r.version === STABLE ||
                r.version === "devel"
              : r.version === version)) &&
        (category === "All topics" || r.category === category) &&
        (letter === "All" || r.title.toUpperCase().startsWith(letter)) &&
        q
          .toLowerCase()
          .split(/\s+/)
          .every((w) =>
            (r.title + " " + r.description + " " + r.category + " " + r.search)
              .toLowerCase()
              .includes(w),
          ),
    )
    .sort((a, b) => {
      const rank = (v: string) =>
        v === STABLE ? 0 : v === "general" ? 1 : v === "devel" ? 2 : 3;
      return (
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) ||
        rank(a.version) - rank(b.version) ||
        b.version.localeCompare(a.version, undefined, { numeric: true })
      );
    });
  const title = modules
    ? "Your next capability."
    : kind === "wiki"
      ? "Knowledge, connected."
      : kind === "tutorial"
        ? "Learn. Build. Connect."
        : kind === "reference"
          ? "Under the hood."
          : kind === "database"
            ? "Every field, explained."
            : kind === "legacy"
              ? "The original signals."
              : "From the community.";
  function reset() {
    setQ("");
    setCategory("All topics");
    setLetter("All");
    setLimit(36);
  }
  return (
    <>
      <DocsNav />
      <section className="docs-library-hero">
        <div className="docs-breadcrumb">
          <Link to="/docs">Documentation</Link>
          <ChevronRight size={13} />
          <span>{kinds[kind]}</span>
        </div>
        <Label>
          {modules ? "THE MODULE REFERENCE" : kinds[kind]?.toUpperCase()}
        </Label>
        <h1>
          {title.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="green">{title.split(" ").at(-1)}</span>
        </h1>
        <p>
          {modules
            ? "Find the building blocks for your network. Browse every imported manual by release, purpose, name, or exported function."
            : kind === "legacy"
              ? "Historical documentation, preserved with its original context. These pages describe older releases; use the maintained wiki for current deployments."
              : "Original technical content, organized around the way you build. Search the collection or narrow it down by topic and release."}
        </p>
      </section>
      <section className="docs-library-body">
        <div className="docs-library-controls">
          <label className="docs-library-search">
            <Search size={19} />
            <input
              aria-label={`Search ${modules ? "modules" : "collection"}`}
              value={q}
              placeholder={
                modules
                  ? "Module, function, or keyword…"
                  : "Find a guide, concept, or parameter…"
              }
              onChange={(e) => {
                setQ(e.target.value);
                setLimit(36);
                setLetter("All");
              }}
            />
          </label>
          <label className="docs-select">
            <span>RELEASE</span>
            <select
              aria-label="Documentation release"
              value={version}
              onChange={(e) => {
                reset();
                modules
                  ? navigate("/docs/modules/" + e.target.value)
                  : setWikiVersion(e.target.value);
              }}
            >
              {modules ? (
                data?.manifest.versions.map((v) => (
                  <option key={v} value={v}>
                    {versionLabel(v)}
                  </option>
                ))
              ) : (
                <>
                  <option value="current">Current & general</option>
                  <option value="all">All releases</option>
                  {versions.map((v) => (
                    <option key={v} value={v}>
                      {versionLabel(v)}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
          <label className="docs-select">
            <span>TOPIC</span>
            <select
              aria-label="Documentation topic"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setLimit(36);
              }}
            >
              <option>All topics</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        {modules && (
          <div
            className="docs-alphabet"
            aria-label="Filter module alphabetically"
          >
            {["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((l) => (
              <button
                key={l}
                aria-pressed={letter === l}
                onClick={() => {
                  setLetter(l);
                  setLimit(36);
                }}
              >
                {l}
              </button>
            ))}
          </div>
        )}
        <div className="docs-library-meta">
          <span aria-live="polite">
            {data
              ? `${filtered.length.toLocaleString()} ${modules ? "modules" : "documents"}`
              : "Connecting to the documentation index…"}
          </span>
          <span>
            {modules ? versionLabel(version) : kinds[kind]}{" "}
            <span className="status-dot" />
          </span>
        </div>
        {modules && version !== STABLE && (
          <div
            className={`docs-version-notice ${version === "devel" ? "development-notice" : ""}`}
          >
            <GitNotice />
            <p>
              {version === "devel"
                ? "Development branch: features and interfaces may change before the next release."
                : "Archived release: these manuals retain their original configuration and API details."}{" "}
              <Link to={"/docs/modules/" + STABLE}>
                Browse the stable release ↗
              </Link>
            </p>
          </div>
        )}
        {kind === "legacy" &&
          version === "current" &&
          filtered.length === 0 && (
            <button
              className="button button-secondary"
              onClick={() => setWikiVersion("all")}
            >
              Browse all archived releases
            </button>
          )}
        {error && (
          <p role="alert" className="docs-error">
            {error}
          </p>
        )}
        <div className="docs-library-grid">
          {filtered.slice(0, limit).map((r) => (
            <Link
              to={q ? docSearchURL(r, q) : docURL(r)}
              key={r.id}
              className={`docs-result-card ${modules ? "module-result" : ""}`}
            >
              <div className="docs-result-meta">
                <span>{r.category.replace(/-/g, " ")}</span>
                <ArrowUpRight size={16} />
              </div>
              <h2>
                {modules ? <Braces size={20} /> : <BookOpen size={19} />}
                <span>{r.title}</span>
              </h2>
              <p>{r.description}</p>
              <div className="docs-result-bottom">
                <span>{versionLabel(r.version)}</span>
                <span>
                  {r.status && r.status !== "released"
                    ? r.status.toUpperCase()
                    : r.sourceFormat === "README"
                      ? "SOURCE REFERENCE"
                      : r.headings + " SECTIONS"}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {data && !filtered.length && (
          <div className="empty-state">
            <Filter />
            <h2>No matching signals.</h2>
            <p>Try another keyword, topic, or release.</p>
            <button
              className="button"
              onClick={() => {
                reset();
                if (!modules) setWikiVersion("all");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
        {filtered.length > limit && (
          <div className="docs-load-more">
            <button
              className="button button-secondary"
              onClick={() => setLimit((n) => n + 36)}
            >
              Load more {modules ? "modules" : "documents"}
              <span>↓</span>
            </button>
            <span>
              Showing {Math.min(limit, filtered.length)} of {filtered.length}
            </span>
          </div>
        )}
      </section>
    </>
  );
}
function GitNotice() {
  return <span className="docs-notice-icon">!</span>;
}
