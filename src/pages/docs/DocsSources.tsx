import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  FileText,
  Download,
  CheckCircle2,
  Layers,
} from "lucide-react";
import DocsNav from "../../components/docs/DocsNav";
import { Label } from "../../components/UI";
import { useDocumentation, kinds, type DocKind } from "../../lib/documentation";
import { siteHref } from "../../lib/urls";
export function DocsSources() {
  const { data, error } = useDocumentation();
  return (
    <>
      <DocsNav />
      <section className="docs-library-hero">
        <Label>TRACEABLE BY DESIGN</Label>
        <h1>
          Open knowledge.
          <br />
          <span className="green">Original sources.</span>
        </h1>
        <p>
          Every imported document keeps its source, release context, and author
          attribution. This is the map behind the knowledge network.
        </p>
      </section>
      <section className="section docs-coverage">
        <div className="docs-coverage-grid">
          {Object.entries(kinds).map(([k, t]) => (
            <Link
              key={k}
              to={k === "module" ? "/docs/modules" : "/docs/collections/" + k}
            >
              <Layers size={22} />
              <strong>
                {data?.catalog
                  .filter((r) => r.kind === (k as DocKind))
                  .length.toLocaleString() || "—"}
              </strong>
              <span>{t}</span>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="docs-source-explanation">
          <Label>WHAT IS CONNECTED</Label>
          <h2>
            Content brought home.
            <br />
            <span className="muted">Context kept intact.</span>
          </h2>
          <p>
            Module manuals are imported from official release branches and
            source archives, then cross-checked against the published module
            indexes. The maintained wiki comes from Kamailio’s Markdown
            repository. Published tutorials, API references, database schemas,
            and the old wiki are imported from their original documentation
            sites.
          </p>
          <p>
            Conference materials are indexed in the talks library; downloadable
            slides and recordings remain at their original file URLs. Software
            binaries, mailing-list systems, issue trackers, and other
            interactive project services keep their official destinations.
          </p>
          <div className="docs-source-chips">
            <span>
              <CheckCircle2 size={14} />
              Versioned content
            </span>
            <span>
              <CheckCircle2 size={14} />
              Original attribution
            </span>
            <span>
              <CheckCircle2 size={14} />
              Local document bodies
            </span>
            <span>
              <CheckCircle2 size={14} />
              Refreshable import
            </span>
          </div>
        </div>
        <div className="docs-source-table">
          <div className="docs-source-row docs-source-row-head">
            <span>SOURCE COLLECTION</span>
            <span>RELEASE</span>
            <span>ORIGINAL SOURCE</span>
          </div>
          {data?.manifest.collections.map((s, i) => (
            <div className="docs-source-row" key={s.archive + i}>
              <span>
                {s.kind === "modules"
                  ? "Module documentation"
                  : s.kind === "wiki"
                    ? "Maintained documentation wiki"
                    : "Tutorial source repository"}
              </span>
              <span>{s.version || "General"}</span>
              <a href={s.archive}>
                Official archive
                <ArrowUpRight size={14} />
              </a>
            </div>
          ))}
        </div>
        <div className="docs-source-notes">
          <div>
            <h3>Licenses & credit</h3>
            <p>
              Module and wiki documentation comes from the official open source
              project. Original author and copyright notices remain in the
              documents. Published pages keep their source attribution.
            </p>
            <a href={siteHref("/documentation/WIKI-LICENSE.txt")}>
              Wiki license
              <ArrowUpRight size={14} />
            </a>
            <a href={siteHref("/documentation/MODULES-LICENSE.txt")}>
              Module attribution
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div>
            <h3>A verifiable snapshot</h3>
            <p>
              {data
                ? `Imported ${new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "Europe/Amsterdam" }).format(new Date(data.manifest.syncedAt))}. `
                : ""}
              The import manifest records original sources, any unavailable
              URLs, and manuals preserved in their original README format.
            </p>
            <a href={siteHref("/documentation/manifest.json")}>
              <Download size={14} />
              Download import manifest
            </a>
          </div>
        </div>
        {!!data?.manifest.unavailable.length && (
          <details className="docs-unavailable">
            <summary>
              {data.manifest.unavailable.length} unavailable source URLs
              recorded
            </summary>
            <p>
              These source URLs returned errors during import. They are retained
              here so the coverage can be inspected and the import can be
              retried.
            </p>
            {data.manifest.unavailable.map((s, i) => (
              <a href={s.url} key={s.url + i}>
                {s.url}
                <small>{s.error}</small>
              </a>
            ))}
          </details>
        )}
        <div className="docs-service-map">
          <Label>THE WIDER KAMAILIO NETWORK</Label>
          {[
            [
              "Software releases & packages",
              "https://www.kamailio.org/pub/kamailio/",
            ],
            ["Community mailing lists", "https://lists.kamailio.org/"],
            [
              "Source code & issue tracker",
              "https://github.com/kamailio/kamailio",
            ],
            ["Kamailio World", "https://www.kamailioworld.com"],
            ["SIP services directory", "/content/sip-services"],
            ["Business directory", "/content/business-directory"],
          ].map(([t, u]) => (
            <a key={u} href={siteHref(u)}>
              {t}
              <ArrowUpRight size={17} />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
interface Presentation {
  url: string;
  title: string;
  kind: string;
}
export function DocsPresentations() {
  const [all, setAll] = useState<Presentation[]>([]),
    [error, setError] = useState(""),
    [q, setQ] = useState(""),
    [year, setYear] = useState("All years"),
    [limit, setLimit] = useState(40);
  useEffect(() => {
    fetch(siteHref("/documentation/presentations.json"))
      .then((r) => {
        if (!r.ok) throw new Error("Talk library unavailable");
        return r.json();
      })
      .then(setAll)
      .catch((e) => setError(e.message));
  }, []);
  const years = [
    ...new Set(
      all.map((p) => p.url.match(/(?:19|20)\d{2}/)?.[0]).filter(Boolean),
    ),
  ]
    .sort()
    .reverse();
  const filtered = all.filter(
    (p) =>
      (p.title + " " + decodeURIComponent(p.url))
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (year === "All years" || p.url.includes(year)),
  );
  return (
    <>
      <DocsNav />
      <section className="docs-library-hero">
        <Label>THE COMMUNITY, ON RECORD</Label>
        <h1>
          Ideas travel.
          <br />
          <span className="green">Keep them moving.</span>
        </h1>
        <p>
          Explore the Kamailio event archive. Search conference slides,
          recordings, and published materials, connected to their original
          files.
        </p>
      </section>
      <section className="docs-library-body">
        <div className="docs-library-controls">
          <label className="docs-library-search">
            <Search size={19} />
            <input
              aria-label="Search conference materials"
              placeholder="Speaker, topic, or filename…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLimit(40);
              }}
            />
          </label>
          <label className="docs-select">
            <span>YEAR</span>
            <select
              aria-label="Conference year"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setLimit(40);
              }}
            >
              <option>All years</option>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="docs-library-meta">
          <span>{filtered.length.toLocaleString()} original files</span>
          <span>
            EVENT ARCHIVE
            <span className="status-dot" />
          </span>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="docs-talk-list">
          {filtered.slice(0, limit).map((p) => {
            const path = decodeURIComponent(new URL(p.url).pathname);
            const name =
              p.title || path.split("/").pop() || "Conference material";
            const extension = path.split(".").pop()?.toUpperCase();
            return (
              <a href={p.url} key={p.url}>
                <span className="docs-file-icon">
                  <FileText size={21} />
                  <small>{extension}</small>
                </span>
                <div>
                  <h2>
                    {name
                      .replace(
                        /\.(pdf|mp4|webm|pptx?|odp|zip|tgz|gz|bz2)$/i,
                        "",
                      )
                      .replaceAll("_", " ")}
                  </h2>
                  <p>{path.split("/").slice(2, -1).join(" / ")}</p>
                </div>
                <ArrowUpRight size={19} />
              </a>
            );
          })}
        </div>
        {!filtered.length && all.length > 0 && (
          <div className="empty-state">
            <Search />
            <h2>No matching materials.</h2>
            <p>Try another speaker, topic, or year.</p>
          </div>
        )}
        {filtered.length > limit && (
          <div className="docs-load-more">
            <button
              className="button button-secondary"
              onClick={() => setLimit((n) => n + 40)}
            >
              Load more materials<span>↓</span>
            </button>
          </div>
        )}
      </section>
    </>
  );
}
