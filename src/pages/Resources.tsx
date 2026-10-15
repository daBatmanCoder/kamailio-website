import { useState } from "react";
import { Link } from "react-router-dom";
import { Label, SectionTitle, clean } from "../components/UI";
import { Search, ArrowUpRight } from "lucide-react";
import { resourceGroups } from "../data/navigation";
import content from "../data/content.json";
import { PageHero } from "../components/ExploreUI";

export function Resources() {
  const [q, setQ] = useState("");
  const pages = content.filter(
    (x) =>
      x.type === "page" &&
      clean(x.title).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHero
        label="THE COMPLETE RESOURCE DIRECTORY"
        title={
          <>
            Find your
            <br />
            <span className="green">way forward.</span>
          </>
        }
        description="Every part of the project, connected. Documentation, community channels, business resources, history, and the full page archive."
      />
      <section className="section resource-directory">
        {resourceGroups.map((g) => (
          <div key={g.title}>
            <Label>{g.title}</Label>
            {g.items.map(([t, u]) => (
              <a href={u} key={t}>
                {t}
                <ArrowUpRight size={16} />
              </a>
            ))}
          </div>
        ))}
      </section>
      <section className="section light-section">
        <SectionTitle
          eyebrow="ALL 80 ORIGINAL PAGES"
          title="The project library."
        />
        <label className="archive-search">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all project pages…"
            aria-label="Search project pages"
          />
        </label>
        <div className="page-library">
          {pages.map((p) => (
            <Link key={p.id} to={`/content/${p.slug}`}>
              {clean(p.title)}
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
        {!pages.length && <p role="status">No pages match your search.</p>}
      </section>
    </>
  );
}
