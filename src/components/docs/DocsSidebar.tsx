import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Braces,
  Terminal,
  Database,
  Layers,
  Archive,
  ArrowUpRight,
  Search,
  ChevronRight,
  X,
} from "lucide-react";
import {
  type DocRecord,
  docURL,
  versionLabel,
  STABLE,
} from "../../lib/documentation";
const links = [
  ["Overview", "/docs", BookOpen],
  ["Modules", "/docs/modules", Braces],
  ["Wiki & cookbooks", "/docs/collections/wiki", BookOpen],
  ["Tutorials & KEMI", "/docs/collections/tutorial", Terminal],
  ["APIs & exports", "/docs/collections/reference", Layers],
  ["Database schemas", "/docs/collections/database", Database],
  ["Legacy archive", "/docs/collections/legacy", Archive],
] as const;
export default function DocsSidebar({
  catalog,
  record,
  open,
  onClose,
}: {
  catalog: DocRecord[];
  record?: DocRecord;
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation(),
    navigate = useNavigate();
  const [filter, setFilter] = useState("");
  useEffect(() => {
    onClose();
  }, [location.pathname]);
  const activeVersion = record?.version || STABLE;
  const options = [
    ...new Set(
      catalog.filter((r) => r.kind === record?.kind).map((r) => r.version),
    ),
  ].sort((a, b) =>
    a === "general"
      ? -1
      : b === "general"
        ? 1
        : b.localeCompare(a, undefined, { numeric: true }),
  );
  const peers = catalog.filter(
    (r) =>
      r.kind === record?.kind &&
      (r.version === activeVersion || r.version === "general") &&
      [r.title, r.description]
        .join(" ")
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  const groups = [...new Set(peers.map((r) => r.category))].sort();
  return (
    <>
      {open && (
        <button
          className="docs-sidebar-backdrop"
          aria-label="Close documentation menu"
          onClick={onClose}
        />
      )}
      <aside
        id="documentation-navigation"
        className={`docs-sidebar ${open ? "sidebar-open" : ""}`}
        aria-label="Documentation sidebar"
      >
        <div className="docs-sidebar-title">
          <Link to="/docs">
            <BookOpen size={18} />
            <span>
              Knowledge network<small>KAMAILIO DOCUMENTATION</small>
            </span>
          </Link>
          <button aria-label="Close documentation menu" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {record && (
          <label className="docs-sidebar-version">
            <span>DOCUMENTATION RELEASE</span>
            <select
              aria-label="Switch document release"
              value={activeVersion}
              onChange={(e) => {
                const version = e.target.value;
                const counterpart = catalog.find(
                  (r) =>
                    r.kind === record.kind &&
                    r.title === record.title &&
                    r.version === version,
                );
                navigate(
                  counterpart
                    ? docURL(counterpart)
                    : record.kind === "module"
                      ? "/docs/modules/" + version
                      : "/docs/collections/" + record.kind,
                );
              }}
            >
              {options.map((v) => (
                <option key={v} value={v}>
                  {versionLabel(v)}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="docs-sidebar-links">
          {links.map(([t, u, Icon]) => (
            <Link
              key={u}
              to={u}
              className={
                (record?.kind === "module" && u === "/docs/modules") ||
                (record && u.endsWith("/" + record.kind))
                  ? "sidebar-current"
                  : ""
              }
            >
              <Icon size={15} />
              {t}
              <ChevronRight size={12} />
            </Link>
          ))}
        </div>
        {record && (
          <>
            <div className="docs-sidebar-filter">
              <Search size={14} />
              <input
                aria-label="Filter documentation navigation"
                placeholder="Filter this collection…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="docs-sidebar-tree">
              {groups.map((g) => (
                <details key={g} open={filter ? true : record.category === g}>
                  <summary>
                    {g.replace(/-/g, " ")}
                    <ChevronRight size={12} />
                  </summary>
                  {peers
                    .filter((r) => r.category === g)
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((r) => (
                      <Link
                        to={docURL(r)}
                        key={r.id}
                        className={r.id === record.id ? "tree-active" : ""}
                        title={r.title}
                      >
                        {r.title}
                      </Link>
                    ))}
                </details>
              ))}
            </div>
          </>
        )}
        <div className="docs-sidebar-source">
          <span className="status-dot" />
          IMPORTED FROM OFFICIAL SOURCES
          <Link to="/docs/sources">
            View coverage & attribution
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </aside>
    </>
  );
}
