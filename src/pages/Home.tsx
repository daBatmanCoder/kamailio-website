import { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Route,
  Globe2,
  ShieldCheck,
  Code2,
  ArrowUpRight,
  Terminal,
  Check,
  Copy,
  Radio,
} from "lucide-react";
import {
  Button,
  Label,
  SectionTitle,
  Mark,
  clean,
  date,
} from "../components/UI";
import { capabilities } from "../data/navigation";
import content from "../data/content.json";
const Globe = lazy(() => import("../components/Globe"));
const icons = [Route, Globe2, ShieldCheck, Code2];
const scenarios = [
  {
    name: "SIP load balancing",
    from: ["SIP phone", "SIP trunk"],
    to: ["Asterisk", "FreeSWITCH"],
    description:
      "Distribute signaling across media servers with health checks and routing failover.",
  },
  {
    name: "WebRTC gateway",
    from: ["Browser", "Mobile app"],
    to: ["SIP network", "Media server"],
    description:
      "Bridge WebSocket signaling from browser applications to your existing SIP infrastructure.",
  },
  {
    name: "IMS / VoLTE",
    from: ["Mobile device", "Access network"],
    to: ["IMS core", "Application server"],
    description:
      "Build P-CSCF, I-CSCF, and S-CSCF signaling functions with Kamailio’s IMS modules.",
  },
];
export default function Home() {
  const [scenario, setScenario] = useState(0),
    [copied, setCopied] = useState(false);
  const s = scenarios[scenario];
  const posts = content.filter((x) => x.type === "post").slice(0, 3);
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        "git clone --branch 6.1 --single-branch https://github.com/kamailio/kamailio.git",
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }
  return (
    <>
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <Link className="release-pill" to="/news/kamailio-v6-1-5-released">
            <span className="status-dot" />
            KAMAILIO 6.1.5 IS HERE
            <span className="release-divider" />
            See what’s new
            <ArrowUpRight size={13} />
          </Link>
          <h1>
            The world
            <br />
            connects <span className="green">here.</span>
          </h1>
          <p className="hero-description">
            Open source at the core.
            <br />
            Real-time communications at any scale.
          </p>
          <p className="hero-detail">
            The high-performance SIP server for voice, video,
            <br className="desktop-break" /> messaging, and a world of
            possibilities.
          </p>
          <div className="hero-actions">
            <Button to="/download">Start building</Button>
            <Button to="/platform" secondary>
              Explore Kamailio
            </Button>
          </div>
          <div className="hero-footnote">
            <span className="status-dot" />
            OPEN SOURCE. COMMUNITY BUILT. SINCE 2001.
          </div>
        </div>
        <div className="hero-art">
          <div className="globe-aura" />
          <Suspense fallback={<div className="globe-placeholder" />}>
            <Globe />
          </Suspense>
          <div className="globe-label label-berlin">
            <span className="status-dot" />
            <span>
              BERLIN, DE
              <br />
              <small>WHERE IT ALL STARTED</small>
            </span>
          </div>
          <div className="globe-label label-signal">
            <Radio size={16} />
            <span>REAL-TIME. WORLDWIDE.</span>
          </div>
          <div className="art-coordinate">52°31′12.0″N 13°24′18.0″E</div>
          <div className="art-index">01 / GLOBAL CONNECTIVITY</div>
        </div>
        <a href="#possibilities" className="scroll-cue">
          SCROLL TO CONNECT<span>↓</span>
        </a>
      </section>
      <section className="proof-bar" aria-label="Project facts">
        <div>
          <strong>
            25<span>years</span>
          </strong>
          <p>of open source evolution</p>
        </div>
        <div>
          <strong>
            100%<span>open</span>
          </strong>
          <p>GPLv2+ licensed. Yours to build.</p>
        </div>
        <div>
          <strong>
            One<span>community</span>
          </strong>
          <p>connecting the world</p>
        </div>
        <Link to="/about" className="proof-link">
          Built for the long run.
          <br />
          <span>
            Meet the project <ArrowUpRight size={15} />
          </span>
        </Link>
      </section>
      <section className="section capabilities" id="possibilities">
        <div className="section-intro">
          <SectionTitle
            eyebrow="ONE PLATFORM. ENDLESS POSSIBILITIES."
            title={
              <>
                Your network.
                <br />
                <span className="muted">Without limits.</span>
              </>
            }
          />
          <div className="intro-side">
            <p>
              From your first SIP deployment to global communications
              infrastructure. The flexibility to build what comes next.
            </p>
            <Link className="text-link" to="/platform">
              Discover all capabilities <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <div className="capability-grid">
          {capabilities.map((c, i) => {
            const Icon = icons[i];
            return (
              <Link
                to={`/platform#capability-${i}`}
                key={c.title}
                className={`capability-card reveal card-${i}`}
              >
                <div className="card-top">
                  <Icon size={26} strokeWidth={1.2} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                <div className="card-tags">
                  {c.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <ArrowUpRight className="card-arrow" size={19} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="section architecture light-section">
        <div className="architecture-copy reveal">
          <Label>BUILT TO FIT YOUR WORLD</Label>
          <h2>
            The power
            <br />
            between
            <br />
            <span className="soft">every connection.</span>
          </h2>
          <p>
            Kamailio is the intelligent signaling layer that brings your
            communications stack together. Route, secure, and scale — on your
            terms.
          </p>
          <div
            className="scenario-tabs"
            role="tablist"
            aria-label="Architecture use case"
          >
            {scenarios.map((x, i) => (
              <button
                id={`scenario-tab-${i}`}
                aria-controls="scenario-panel"
                key={x.name}
                role="tab"
                aria-selected={scenario === i}
                tabIndex={scenario === i ? 0 : -1}
                onKeyDown={(e) => {
                  if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
                    e.preventDefault();
                    const next =
                      (scenario + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                    setScenario(next);
                    document.getElementById(`scenario-tab-${next}`)?.focus();
                  }
                }}
                onClick={() => setScenario(i)}
              >
                {x.name}
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
          <Link to="/content/related-projects" className="text-link">
            Explore the ecosystem <ArrowUpRight size={17} />
          </Link>
        </div>
        <div
          className="network-diagram reveal"
          id="scenario-panel"
          role="tabpanel"
          aria-labelledby={`scenario-tab-${scenario}`}
        >
          <div className="diagram-top">
            <span>NETWORK TOPOLOGY</span>
            <span className="diagram-status">
              <i />
              ILLUSTRATIVE FLOW
            </span>
          </div>
          <div className="diagram-stack">
            <div className="endpoint-row">
              {s.from.map((x, i) => (
                <div key={x} className="endpoint">
                  <span>{i ? "↗" : "⌘"}</span>
                  {x}
                </div>
              ))}
            </div>
            <div className="connector connector-in">
              <i />
              <i />
              <span className="packet" />
            </div>
            <div className="core-node">
              <Mark />
              <span>
                kamailio<small>THE SIGNALING LAYER</small>
              </span>
              <span className="node-pulse" />
            </div>
            <div className="connector connector-out">
              <i />
              <i />
              <span className="packet" />
            </div>
            <div className="endpoint-row">
              {s.to.map((x) => (
                <div key={x} className="endpoint">
                  <span>▤</span>
                  {x}
                </div>
              ))}
            </div>
          </div>
          <p className="diagram-caption" aria-live="polite">
            {s.description}
          </p>
          <div className="diagram-bottom">
            <span>SIP / TLS / WEBSOCKET</span>
            <span>FLEXIBLE BY DESIGN ↗</span>
          </div>
        </div>
      </section>
      <section className="section developer-section">
        <div className="developer-text reveal">
          <Label>MADE FOR THE BUILDERS</Label>
          <h2>
            Less friction.
            <br />
            <span className="green">More possibility.</span>
          </h2>
          <p>
            A lean C core. An extensible module system. Your choice of scripting
            language. Get the control you need, without giving up the freedom
            you want.
          </p>
          <div className="developer-links">
            <Link to="/developers">
              <Terminal size={18} />
              Read the documentation
              <ArrowUpRight size={17} />
            </Link>
            <a href="https://github.com/kamailio/kamailio">
              <Code2 size={18} />
              Explore the source
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
        <div className="code-window reveal">
          <div className="window-top">
            <div className="window-dots">
              <i />
              <i />
              <i />
            </div>
            <span>your-next-connection.sh</span>
            <button onClick={copy} aria-label="Copy clone command">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <div className="code-content">
            <span className="comment">
              # Great things start with an open foundation.
            </span>
            <div>
              <span className="prompt">$</span> git clone{" "}
              <span className="code-lime">--branch 6.1</span> \
            </div>
            <div className="code-indent">--single-branch \</div>
            <div className="code-indent">
              https://github.com/kamailio/kamailio.git
            </div>
            <br />
            <div>
              <span className="prompt">$</span> cd kamailio
            </div>
            <div>
              <span className="prompt">$</span> make cfg
            </div>
            <div>
              <span className="prompt">$</span> make all
            </div>
            <br />
            <span className="comment">
              # Your network. Your rules. Your code.
            </span>
            <div>
              <span className="prompt">$</span>{" "}
              <span className="terminal-cursor" />
            </div>
          </div>
          <div className="code-bottom">
            <span>
              <i />
              OPEN SOURCE, ALL THE WAY DOWN
            </span>
            <span aria-live="polite">
              {copied ? "COMMAND COPIED" : "GPLv2+"}
            </span>
          </div>
        </div>
      </section>
      <section className="ecosystem-strip">
        <span>PART OF A CONNECTED ECOSYSTEM</span>
        <div>
          <Link to="/content/related-projects">
            asterisk<span className="brand-star">✳</span>
          </Link>
          <Link to="/content/related-projects" className="freeswitch">
            FreeSWITCH
          </Link>
          <Link to="/content/related-projects">
            WebRTC<span className="brand-small">↗</span>
          </Link>
          <Link to="/content/used-by">
            sipgate<span className="green">●</span>
          </Link>
          <Link to="/content/used-by" className="fraunhofer">
            Fraunhofer
            <br />
            <small>FOKUS</small>
          </Link>
        </div>
      </section>
      <section className="section news-section">
        <div className="section-intro">
          <SectionTitle
            eyebrow="THE PROJECT NEVER STANDS STILL"
            title={
              <>
                On the <span className="muted">wire.</span>
              </>
            }
          />
          <Link className="text-link" to="/news">
            All news & updates <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="news-grid">
          {posts.map((p, i) => (
            <Link
              to={`/news/${p.slug}`}
              key={p.id}
              className="news-card reveal"
            >
              <div className={`news-art news-art-${i}`}>
                {i === 0 ? (
                  <>
                    <span className="release-version">6.1.5</span>
                    <span className="news-art-label">THE NEXT CONNECTION</span>
                    <Mark />
                  </>
                ) : i === 1 ? (
                  <>
                    <span className="meeting-city">
                      DÜSSEL
                      <br />
                      DORF<span>↗</span>
                    </span>
                    <span className="news-art-label">
                      DEVELOPERS MEETING / 2026
                    </span>
                  </>
                ) : (
                  <>
                    <span className="sipexer-art">
                      &gt;_
                      <i />
                    </span>
                    <span className="news-art-label">
                      TOOLS FOR THE BUILDERS
                    </span>
                  </>
                )}
              </div>
              <div className="news-meta">
                <span>
                  {p.title.toLowerCase().includes("released")
                    ? "RELEASE"
                    : "COMMUNITY"}
                </span>
                <time>{date(p.date)}</time>
              </div>
              <h3>
                {clean(p.title)}
                <ArrowUpRight size={19} />
              </h3>
              <p>
                {clean(p.excerpt)
                  .slice(0, 128)
                  .replace(/\s+\S*$/, "")}
                …
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section className="community-banner">
        <div className="community-orbit" aria-hidden="true">
          <div />
          <div />
          <div />
          <Mark />
        </div>
        <div className="community-banner-copy">
          <Label>OPEN CODE. OPEN CONVERSATIONS.</Label>
          <h2>
            Built by people.
            <br />
            For a connected world.
          </h2>
          <p>
            Bring your questions, your ideas, your next contribution.
            <br />
            There’s a place for you in the Kamailio community.
          </p>
          <Button to="/community">Find your community</Button>
        </div>
        <Link to="/content/donations" className="support-link">
          Keep the connections coming.
          <span>
            Support the project <ArrowUpRight size={17} />
          </span>
        </Link>
      </section>
      <section className="closing section">
        <Label>YOUR NEXT CHAPTER STARTS HERE</Label>
        <h2>
          Let’s make
          <br />
          <span className="green">connections.</span>
          <ArrowUpRight />
        </h2>
        <div className="closing-bottom">
          <p>Open source. No boundaries. Just possibilities.</p>
          <Button to="/download">Build with Kamailio</Button>
        </div>
      </section>
    </>
  );
}
