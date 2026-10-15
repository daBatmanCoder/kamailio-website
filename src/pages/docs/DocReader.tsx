import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  Menu,
  List,
  Search,
  ArrowDown,
  Clock,
  ExternalLink,
} from "lucide-react";
import DocsSidebar from "../../components/docs/DocsSidebar";
import DocsSearch from "../../components/docs/DocsSearch";
import {
  useDocumentation,
  loadDoc,
  docURL,
  kinds,
  versionLabel,
  STABLE,
  type DocBody,
} from "../../lib/documentation";
import { highlight } from "../../lib/doc-highlighting";
import { NotFound } from "../NotFound";
export default function DocReader() {
  const params = useParams(),
    location = useLocation();
  const { data, error: indexError } = useDocumentation();
  let id = (params["*"] || "")
    .replace(/\/+$/, "")
    .replace(/\.html?$/, "")
    .replace(/^modules\/stable\//, "modules/" + STABLE + "/")
    .replace(/^(modules\/[^/]+)\/modules\//, "$1/");
  const record = data?.catalog.find((r) => r.id === id);
  const [body, setBody] = useState<DocBody>(),
    [html, setHtml] = useState(""),
    [error, setError] = useState(""),
    [menu, setMenu] = useState(false),
    [outline, setOutline] = useState(false),
    [filter, setFilter] = useState(""),
    [active, setActive] = useState(""),
    [copyStatus, setCopyStatus] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.body.classList.add("docs-reading");
    return () => document.body.classList.remove("docs-reading");
  }, []);
  useEffect(() => {
    if (!menu && !outline) return;
    const trigger = document.activeElement as HTMLElement | null;
    if (menu)
      document
        .querySelector<HTMLButtonElement>(".docs-sidebar-title button")
        ?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setOutline(false);
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("keydown", close);
      trigger?.focus();
    };
  }, [menu, outline]);
  useEffect(() => {
    setBody(undefined);
    setHtml("");
    setError("");
    setFilter("");
    if (!record) return;
    const abort = new AbortController();
    loadDoc(record, abort.signal)
      .then((doc) => {
        const parsed = new DOMParser().parseFromString(
          DOMPurify.sanitize(
            doc.html.replaceAll("__DOC_BASE__", import.meta.env.BASE_URL),
            {
              FORBID_TAGS: [
                "script",
                "iframe",
                "form",
                "input",
                "button",
                "style",
              ],
              FORBID_ATTR: ["style", "onerror", "onclick"],
            },
          ),
          "text/html",
        );
        const first = parsed.querySelector("h1");
        if (
          first &&
          (record.kind === "module" ||
            first.textContent?.trim() === record.title)
        )
          first.remove();
        parsed.querySelectorAll("pre").forEach((pre, i) => {
          let code = pre.querySelector("code");
          if (!code) {
            code = parsed.createElement("code");
            code.textContent = pre.textContent;
            pre.textContent = "";
            pre.appendChild(code);
          }
          const language =
            code.className.match(/language-([\w-]+)/)?.[1] ||
            (record.kind === "module" ? "kamailio" : "plaintext");
          code.innerHTML = highlight(
            (code.textContent || "").replace(
              /^(?:[ \t]*\r?\n)+|(?:\r?\n[ \t]*)+$/g,
              "",
            ),
            language,
          );
          code.id = `doc-code-${i}`;
          const frame = parsed.createElement("div");
          frame.className = "doc-code-frame";
          const bar = parsed.createElement("div");
          bar.className = "doc-code-bar";
          const label = parsed.createElement("span");
          label.textContent =
            language === "kamailio" ? "kamailio.cfg" : language;
          const button = parsed.createElement("button");
          button.type = "button";
          button.dataset.codeCopy = code.id;
          button.setAttribute("aria-label", `Copy code example ${i + 1}`);
          button.textContent = "Copy";
          bar.append(label, button);
          pre.replaceWith(frame);
          frame.append(bar, pre);
        });
        setBody(doc);
        setHtml(parsed.body.innerHTML);
        document.title = `${record.title} — ${versionLabel(record.version)} — Kamailio Docs`;
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, [record]);
  useEffect(() => {
    if (!html) return;
    const hash = decodeURIComponent(location.hash.slice(1));
    if (!hash) {
      const query = new URLSearchParams(location.search).get("find");
      if (query) {
        const match = body?.toc.find((h) =>
          h.title.toLowerCase().includes(query.toLowerCase()),
        );
        if (match) {
          setFilter(query);
          setActive(match.id);
          requestAnimationFrame(() =>
            document.getElementById(match.id)?.scrollIntoView(),
          );
        }
      }
    }
    if (hash)
      requestAnimationFrame(() =>
        document.getElementById(hash)?.scrollIntoView(),
      );
    const headings = contentRef.current?.querySelectorAll("h2,h3,h4,h5");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-60px 0px -70% 0px", threshold: 0 },
    );
    headings?.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [html, location.hash, location.search, body]);
  async function copy(e: React.MouseEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-code-copy]",
    );
    if (!target) return;
    const code = document.getElementById(target.dataset.codeCopy || "");
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.textContent || "");
      target.textContent = "Copied";
      setCopyStatus("Code example copied.");
      setTimeout(() => {
        target.textContent = "Copy";
        setCopyStatus("");
      }, 2000);
    } catch {
      setCopyStatus("Select the example text to copy it manually.");
    }
  }
  if (data && !record) return <NotFound />;
  const peers =
    data?.catalog
      .filter(
        (r) =>
          r.kind === record?.kind &&
          r.version === record?.version &&
          r.category === record?.category,
      )
      .sort((a, b) => a.title.localeCompare(b.title)) || [];
  const peerIndex = peers.findIndex((r) => r.id === record?.id);
  const previous = peers[peerIndex - 1],
    next = peers[peerIndex + 1];
  const headings =
    body?.toc.filter(
      (h) =>
        h.level !== 1 &&
        (filter
          ? h.title.toLowerCase().includes(filter.toLowerCase())
          : h.level <= 3),
    ) || [];
  return (
    <div className="docs-reader">
      <div className="docs-reader-toolbar">
        <button
          className="docs-menu-button"
          aria-label="Open documentation navigation"
          aria-expanded={menu}
          aria-controls="documentation-navigation"
          onClick={() => setMenu(true)}
        >
          <Menu size={17} />
          Navigation
        </button>
        <div className="docs-reader-breadcrumb">
          <Link to="/docs">Docs</Link>
          <ChevronRight size={12} />
          <Link
            to={
              record?.kind === "module"
                ? "/docs/modules/" + record.version
                : "/docs/collections/" + (record?.kind || "wiki")
            }
          >
            {record ? kinds[record.kind] : "Connecting…"}
          </Link>
          <ChevronRight size={12} />
          <span>{record?.title}</span>
        </div>
        <DocsSearch catalog={data?.catalog || []} />
        <button
          className="docs-outline-toggle"
          aria-label="Toggle page outline"
          aria-expanded={outline}
          aria-controls="documentation-outline"
          onClick={() => setOutline((x) => !x)}
        >
          <List size={18} />
        </button>
      </div>
      <div className="docs-reader-grid">
        <DocsSidebar
          catalog={data?.catalog || []}
          record={record}
          open={menu}
          onClose={() => setMenu(false)}
        />
        <article className="docs-article">
          <div className="docs-article-heading">
            <div className="docs-article-meta">
              <span>{record ? kinds[record.kind] : "DOCUMENTATION"}</span>
              <span
                className={`docs-release-tag ${record?.version === STABLE ? "stable-tag" : ""}`}
              >
                {record ? versionLabel(record.version) : "…"}
              </span>
            </div>
            <h1>{record?.title || "Connecting to the knowledge network…"}</h1>
            {record?.kind === "module" && (
              <p className="doc-module-description">{record.description}</p>
            )}
            <div className="docs-reading-meta">
              <span>
                <Clock size={12} />
                {record ? Math.max(1, Math.ceil(record.words / 220)) : 1} min
                read
              </span>
              <span>{record?.headings || 0} sections</span>
              {record && (
                <a
                  href={
                    record.sourceUnavailable
                      ? record.sourceFileURL ||
                        record.sourceArchive ||
                        record.source
                      : record.source
                  }
                >
                  Original source
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
          {record &&
            record.version !== STABLE &&
            record.version !== "general" && (
              <div className="doc-release-note">
                <span>
                  {record.version === "devel"
                    ? "DEVELOPMENT REFERENCE"
                    : "HISTORICAL REFERENCE"}
                </span>
                <p>
                  {record.version === "devel"
                    ? "This documentation follows the development branch. Interfaces can change before release."
                    : "These instructions describe an older release. The original technical details have been preserved."}{" "}
                  <Link to="/docs/modules/6.1.x">
                    Current stable documentation ↗
                  </Link>
                </p>
              </div>
            )}
          {record?.status &&
            ["archived", "renamed"].includes(record.status) && (
              <div className="doc-release-note">
                <span>{record.status.toUpperCase()} MODULE</span>
                <p>
                  This module is marked {record.status} in the published module
                  index. Its original documentation is preserved for reference.
                </p>
              </div>
            )}
          {record?.sourceFormat === "README" && (
            <div className="doc-release-note">
              <span>ORIGINAL SOURCE REFERENCE</span>
              <p>
                The original README is preserved below, including its formatting
                and attribution.
              </p>
            </div>
          )}
          {(error || indexError) && (
            <div role="alert" className="docs-error">
              {error || indexError}{" "}
              {record && (
                <a
                  href={
                    record.sourceUnavailable
                      ? record.sourceFileURL ||
                        record.sourceArchive ||
                        record.source
                      : record.source
                  }
                >
                  Open the original reference ↗
                </a>
              )}
            </div>
          )}
          {!body && !html && !error && !indexError && (
            <div className="doc-loading" role="status">
              <span />
              <span />
              <span />
              <p>Loading original technical content…</p>
            </div>
          )}
          <div
            ref={contentRef}
            className="doc-prose"
            onClick={copy}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div className="sr-only" role="status" aria-live="polite">
            {copyStatus}
          </div>
          {body && (
            <>
              <div className="docs-article-attribution">
                <BookSource />
                <div>
                  <strong>Open knowledge. Original authors.</strong>
                  <p>
                    Imported from the official Kamailio documentation. Original
                    credits and copyright notices are retained.{" "}
                    <Link to="/docs/sources">Source coverage & licenses ↗</Link>
                  </p>
                </div>
              </div>
              <div className="docs-adjacent">
                {previous ? (
                  <Link to={docURL(previous)}>
                    <span>
                      <ChevronLeft size={13} />
                      PREVIOUS
                    </span>
                    <strong>{previous.title}</strong>
                  </Link>
                ) : (
                  <div />
                )}
                {next && (
                  <Link to={docURL(next)}>
                    <span>
                      NEXT
                      <ChevronRight size={13} />
                    </span>
                    <strong>{next.title}</strong>
                  </Link>
                )}
              </div>
              <div className="docs-article-footer">
                <Link to="/docs">← Documentation home</Link>
                <a href="https://github.com/kamailio/kamailio-wiki">
                  Help improve the documentation
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </>
          )}
        </article>
        <aside
          id="documentation-outline"
          className={`docs-outline ${outline ? "outline-open" : ""}`}
        >
          <div className="docs-outline-title">
            <span>ON THIS PAGE</span>
            <button
              aria-label="Close page outline"
              onClick={() => setOutline(false)}
            >
              ×
            </button>
          </div>
          <label className="docs-outline-search">
            <Search size={12} />
            <input
              placeholder="Jump to a section…"
              aria-label="Filter page outline"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
          <nav aria-label="On this page">
            {headings.map((h) => (
              <Link
                key={h.id}
                to={"#" + h.id}
                className={`${h.level > 2 ? "outline-child" : ""} ${active === h.id ? "outline-active" : ""}`}
                onClick={() => setOutline(false)}
                title={h.title}
              >
                {h.title}
              </Link>
            ))}
          </nav>
          {body && !headings.length && <p>No matching section headings.</p>}
          <Link className="docs-to-bottom" to="#doc-bottom">
            End of document <ArrowDown size={12} />
          </Link>
        </aside>
      </div>
      <div id="doc-bottom" />
    </div>
  );
}
function BookSource() {
  return <span className="docs-source-symbol">↗</span>;
}
