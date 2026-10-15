import { Link } from "react-router-dom";
import {
  BookOpen,
  Braces,
  Terminal,
  Database,
  ArrowUpRight,
  Layers,
  Archive,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import DocsNav from "../../components/docs/DocsNav";
import DocsSearch from "../../components/docs/DocsSearch";
import { Label } from "../../components/UI";
import { useDocumentation, STABLE } from "../../lib/documentation";
const collections = [
  {
    icon: Braces,
    title: "The module universe.",
    desc: "Routing, security, data, and everything in between. Every imported module manual, across releases.",
    to: "/docs/modules",
    label: "REFERENCE",
    cls: "module-collection",
  },
  {
    icon: BookOpen,
    title: "Knowledge, connected.",
    desc: "Configuration cookbooks, variables, transformations, upgrades, and the maintained project wiki.",
    to: "/docs/collections/wiki",
    label: "WIKI & COOKBOOKS",
    cls: "",
  },
  {
    icon: Terminal,
    title: "From zero to signaling.",
    desc: "Installation walkthroughs, practical tutorials, and the KEMI scripting framework.",
    to: "/docs/collections/tutorial",
    label: "GUIDES & TUTORIALS",
    cls: "",
  },
  {
    icon: Layers,
    title: "Under the hood.",
    desc: "RPC interfaces, exported functions, counters, and development reference documents.",
    to: "/docs/collections/reference",
    label: "APIs & EXPORTS",
    cls: "",
  },
  {
    icon: Database,
    title: "Know your data.",
    desc: "Versioned schema documentation, tables, fields, types, and database relationships.",
    to: "/docs/collections/database",
    label: "DATABASE SCHEMAS",
    cls: "",
  },
  {
    icon: Archive,
    title: "Nothing left behind.",
    desc: "Historical wiki content and older release manuals, with their original version context.",
    to: "/docs/collections/legacy",
    label: "THE ARCHIVE",
    cls: "",
  },
];
export default function DocsHome() {
  const { data, error } = useDocumentation();
  const stableModules = data?.catalog.filter(
    (r) => r.kind === "module" && r.version === STABLE,
  ).length;
  return (
    <>
      <DocsNav />
      <section className="docs-home-hero">
        <div className="docs-hero-grid" />
        <div className="docs-hero-content">
          <Label>THE KAMAILIO KNOWLEDGE NETWORK</Label>
          <h1>
            Every signal.
            <br />
            <span className="green">Every answer.</span>
          </h1>
          <p>
            Your entire communications stack, documented.
            <br />
            Explore the modules. Understand the core. Build what’s next.
          </p>
          <DocsSearch catalog={data?.catalog || []} large />
          <div className="docs-quick-queries">
            <span>START WITH</span>
            <Link to="/docs/modules/6.1.x/dispatcher">dispatcher ↗</Link>
            <Link to="/docs/wiki/cookbooks/6.1.x/core">core cookbook ↗</Link>
            <Link to="/docs/wiki/packages/debs">installation ↗</Link>
          </div>
        </div>
        <div className="docs-hero-art" aria-hidden="true">
          <span className="docs-art-path">/ docs / knowledge / connected</span>
          <div className="docs-orbit orbit-one" />
          <div className="docs-orbit orbit-two" />
          <div className="docs-orbit orbit-three" />
          <div className="docs-art-core">
            <Braces strokeWidth={1} />
          </div>
          <span className="docs-floating-tag tag-config">kamailio.cfg</span>
          <span className="docs-floating-tag tag-function">
            ds_select_dst()
          </span>
          <span className="docs-floating-tag tag-module">loadmodule</span>
          <span className="docs-art-caption">
            OPEN KNOWLEDGE. NO BOUNDARIES.
          </span>
        </div>
      </section>
      <div className="docs-stat-strip">
        <div>
          <strong>{stableModules?.toLocaleString() || "—"}</strong>
          <span>stable module manuals</span>
        </div>
        <div>
          <strong>{data?.manifest.documents.toLocaleString() || "—"}</strong>
          <span>imported documents</span>
        </div>
        <div>
          <strong>{data?.manifest.versions.length || "—"}</strong>
          <span>module release branches</span>
        </div>
        <Link to="/docs/sources">
          Real sources.
          <br />
          <span>
            Fully connected <ArrowUpRight size={15} />
          </span>
        </Link>
      </div>
      {error && (
        <p role="alert" className="docs-error">
          {error}. Refresh to reconnect.
        </p>
      )}
      <section className="section docs-collections">
        <div className="section-intro">
          <div>
            <Label>FIND YOUR FREQUENCY</Label>
            <h2>
              A place for
              <br />
              <span className="muted">every question.</span>
            </h2>
          </div>
          <p>
            Original technical content.
            <br />A completely new way to find it.
          </p>
        </div>
        <div className="docs-collection-grid">
          {collections.map((c) => (
            <Link
              to={c.to}
              className={`docs-collection-card ${c.cls}`}
              key={c.to}
            >
              <div>
                <c.icon size={25} strokeWidth={1.3} />
                <span>{c.label}</span>
                <ArrowUpRight size={18} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <span className="docs-card-count">
                {data
                  ? data.catalog
                      .filter((r) =>
                        c.to.includes("modules")
                          ? r.kind === "module"
                          : c.to.endsWith("/" + r.kind),
                      )
                      .length.toLocaleString() + " DOCUMENTS"
                  : "EXPLORE COLLECTION"}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section docs-learning-path light-section">
        <Label>YOUR FIRST CONNECTION</Label>
        <h2>
          Find your footing.
          <br />
          <span className="soft">Then go further.</span>
        </h2>
        <div className="docs-learning-grid">
          {[
            [
              "01",
              "Install",
              "Get Kamailio running on your system.",
              "/docs/tutorials/6.1.x/kamailio-install-guide-git",
            ],
            [
              "02",
              "Configure",
              "Learn the shape of kamailio.cfg and the core settings.",
              "/docs/wiki/cookbooks/6.1.x/core",
            ],
            [
              "03",
              "Extend",
              "Choose the modules that make your architecture work.",
              "/docs/modules",
            ],
          ].map(([n, t, d, u]) => (
            <Link to={u} key={n}>
              <span>{n}</span>
              <h3>
                {t}
                <ArrowUpRight size={19} />
              </h3>
              <p>{d}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="section docs-bottom-cta">
        <div>
          <Label>KNOWLEDGE IS A COMMUNITY EFFORT</Label>
          <h2>
            Better together.
            <br />
            <span className="muted">Better documented.</span>
          </h2>
          <p>
            The original authors and sources stay connected to every page. Help
            improve the upstream documentation and keep the next connection
            moving.
          </p>
        </div>
        <div>
          <a href="https://github.com/kamailio/kamailio-wiki">
            <GitBranch size={22} />
            <span>Contribute to the wiki</span>
            <ArrowUpRight size={18} />
          </a>
          <Link to="/docs/presentations">
            <BookOpen size={22} />
            <span>Explore conference talks</span>
            <ArrowUpRight size={18} />
          </Link>
          <Link to="/docs/sources">
            <Layers size={22} />
            <span>Inspect import coverage</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
