import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowUpRight, X, Command } from "lucide-react";
import {
  findDocs,
  docSearchURL,
  kinds,
  versionLabel,
  type DocRecord,
} from "../../lib/documentation";
export default function DocsSearch({
  catalog,
  large = false,
}: {
  catalog: DocRecord[];
  large?: boolean;
}) {
  const resultID = useId(),
    navigate = useNavigate();
  const [q, setQ] = useState(""),
    [focused, setFocused] = useState(false);
  const results = findDocs(catalog, q, 8);
  return (
    <div className={`docs-search ${large ? "docs-search-large" : ""}`}>
      <div className="docs-search-field">
        <Search size={large ? 23 : 17} />
        <input
          aria-label="Search documentation"
          aria-expanded={focused && !!q}
          aria-controls={resultID}
          autoComplete="off"
          placeholder={
            large
              ? "Find a module, function, guide, or answer…"
              : "Search documentation…"
          }
          value={q}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setFocused(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              e.preventDefault();
              navigate(docSearchURL(results[0], q));
              setFocused(false);
              setQ("");
            }
            if (e.key === "ArrowDown" && results[0]) {
              e.preventDefault();
              e.currentTarget
                .closest(".docs-search")
                ?.querySelector<HTMLAnchorElement>(".docs-search-results > a")
                ?.focus();
            }
            if (e.key === "Escape") {
              setFocused(false);
              e.currentTarget.blur();
            }
          }}
        />
        {q ? (
          <button
            aria-label="Clear documentation search"
            onClick={() => setQ("")}
          >
            <X size={16} />
          </button>
        ) : (
          <Command size={15} />
        )}
      </div>
      {focused && q && (
        <div
          id={resultID}
          className="docs-search-results"
          role="region"
          aria-label="Documentation search results"
        >
          <div className="docs-search-caption">
            {results.length ? "DIRECT CONNECTIONS" : "NO MATCHES FOUND"}
            <button onClick={() => setFocused(false)}>Close</button>
          </div>
          {results.map((r) => (
            <Link
              key={r.id}
              to={docSearchURL(r, q)}
              onClick={() => {
                setFocused(false);
                setQ("");
              }}
            >
              <span className="search-doc-icon">
                {r.kind === "module" ? "{}" : "↗"}
              </span>
              <span>
                <strong>{r.title}</strong>
                <small>
                  {kinds[r.kind]} · {versionLabel(r.version)}
                </small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
          {!results.length && (
            <p>Try “dispatcher”, “TLS”, “ds_select_dst”, or “installation”.</p>
          )}
        </div>
      )}
    </div>
  );
}
