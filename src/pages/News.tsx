import { useState } from "react";
import { Link } from "react-router-dom";
import { clean, date } from "../components/UI";
import { Search, ArrowUpRight, ArrowRight } from "lucide-react";
import content from "../data/content.json";
import { PageHero } from "../components/ExploreUI";

export function News() {
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("All updates"),
    [year, setYear] = useState("All years"),
    [limit, setLimit] = useState(12);
  const posts = content.filter((x) => x.type === "post");
  const years = [...new Set(posts.map((x) => x.date.slice(0, 4)))];
  const filtered = posts.filter(
    (x) =>
      (clean(x.title) + " " + clean(x.excerpt))
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (year === "All years" || x.date.startsWith(year)) &&
      (category === "All updates" ||
        (category === "Releases"
          ? /release/i.test(x.title)
          : /meeting|world|conference|cluecon|fosdem|astricon/i.test(x.title))),
  );
  return (
    <>
      <PageHero
        label="NEWS, RELEASES & COMMUNITY"
        title={
          <>
            On the
            <br />
            <span className="green">wire.</span>
          </>
        }
        description="Every release, every gathering, every step forward. Explore the complete Kamailio news archive."
      />
      <section className="section archive-section">
        <div className="archive-controls">
          <div className="filter-tabs" aria-label="Filter news">
            {["All updates", "Releases", "Events"].map((x) => (
              <button
                key={x}
                aria-pressed={category === x}
                onClick={() => {
                  setCategory(x);
                  setLimit(12);
                }}
              >
                {x}
              </button>
            ))}
          </div>
          <label className="archive-search">
            <Search size={17} />
            <input
              placeholder="Search news…"
              aria-label="Search news"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLimit(12);
              }}
            />
          </label>
          <select
            aria-label="Filter by year"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setLimit(12);
            }}
          >
            <option>All years</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="archive-count" aria-live="polite">
          {filtered.length} updates
        </div>
        <div className="news-list">
          {filtered.slice(0, limit).map((p) => (
            <Link key={p.id} to={`/news/${p.slug}`}>
              <time>{date(p.date)}</time>
              <div>
                <h2>{clean(p.title)}</h2>
                <p>{clean(p.excerpt).slice(0, 175)}…</p>
              </div>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <Search />
            <h2>No signals found.</h2>
            <p>Try a different search or year.</p>
            <button
              className="button"
              onClick={() => {
                setQ("");
                setYear("All years");
                setCategory("All updates");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        {filtered.length > limit && (
          <button
            className="button button-secondary space-top"
            onClick={() => setLimit((n) => n + 12)}
          >
            Load more updates <ArrowRight size={16} />
          </button>
        )}
      </section>
    </>
  );
}
