import { useState } from "react";
import { Link } from "react-router-dom";
import { Label, Button } from "../components/UI";
import {
  ArrowUpRight,
  GitBranch,
  BookOpen,
  Download as DownloadIcon,
  Copy,
  Check,
} from "lucide-react";
import { PageHero, ResourceCard } from "../components/ExploreUI";

const installs = [
  {
    id: "source",
    name: "Build from source",
    label: "LATEST STABLE BRANCH · 6.1",
    text: "Clone the stable branch and build locally. Development libraries and optional module dependencies must be installed for your system.",
    code: "git clone --branch 6.1 --single-branch \\\n  https://github.com/kamailio/kamailio.git\ncd kamailio\nmake cfg\nmake all\nsudo make install",
    url: "https://www.kamailio.org/docs/tutorials/6.1.x/kamailio-install-guide-git/",
  },
  {
    id: "debian",
    name: "Debian / Ubuntu",
    label: "APT PACKAGES",
    text: "Follow the official repository instructions for your OS release and the 6.1 branch, then install the packages you need. Run these commands after configuring that repository.",
    code: "sudo apt update\nsudo apt install kamailio",
    url: "https://www.kamailio.org/wikidocs/packages/debs/",
  },
  {
    id: "rpm",
    name: "RPM distributions",
    label: "FEDORA / RHEL / OPENSUSE",
    text: "Select your distribution and the stable branch using the official RPM guide. With the repository configured, install Kamailio using your distribution’s package manager.",
    code: "# Fedora / RHEL with the Kamailio repository configured\nsudo dnf install kamailio",
    url: "https://www.kamailio.org/wikidocs/packages/rpms/",
  },
];
export function Download() {
  const [tab, setTab] = useState(0),
    [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const install = installs[tab];
  async function copy() {
    try {
      await navigator.clipboard.writeText(install.code);
      setCopied(true);
      setError("");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Select the commands below and copy them manually.");
    }
  }
  return (
    <>
      <PageHero
        label="YOUR NEXT CONNECTION STARTS HERE"
        title={
          <>
            Ready. Set.
            <br />
            <span className="green">Build.</span>
          </>
        }
        description="Get Kamailio 6.1.5, the current stable release. Open source under GPLv2+, with source archives and packages for Linux and Unix systems."
      />
      <section className="section download-section">
        <div className="download-release">
          <div>
            <span className="release-pill">
              <span className="status-dot" />
              STABLE RELEASE
            </span>
            <h2>
              Kamailio <span className="green">6.1.5</span>
            </h2>
            <p>Released 15 October 2026</p>
          </div>
          <div>
            <Button to="https://www.kamailio.org/pub/kamailio/latest/src/">
              Download source archives
            </Button>
            <Link to="/news/kamailio-v6-1-5-released" className="text-link">
              Read release notes <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="install-box">
          <div
            className="install-tabs"
            role="tablist"
            aria-label="Installation method"
          >
            {installs.map((x, i) => (
              <button
                key={x.id}
                id={`install-${i}`}
                role="tab"
                aria-selected={tab === i}
                aria-controls="install-panel"
                tabIndex={tab === i ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const next = (tab + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                    setTab(next);
                    setCopied(false);
                    document.getElementById(`install-${next}`)?.focus();
                  }
                }}
                onClick={() => {
                  setTab(i);
                  setCopied(false);
                  setError("");
                }}
              >
                {x.name}
              </button>
            ))}
          </div>
          <div
            className="install-content"
            role="tabpanel"
            id="install-panel"
            aria-labelledby={`install-${tab}`}
          >
            <div>
              <Label>{install.label}</Label>
              <h3>{install.name}</h3>
              <p>{install.text}</p>
              <a className="text-link" href={install.url}>
                Full installation guide <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="install-code">
              <button onClick={copy} aria-label="Copy installation commands">
                {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied ? "Copied" : "Copy"}
              </button>
              <pre>{install.code}</pre>
              <span role="status">{error}</span>
            </div>
          </div>
        </div>
        <div className="resource-grid space-top">
          <ResourceCard
            title="All releases"
            to="https://www.kamailio.org/pub/kamailio/"
            icon={DownloadIcon}
          >
            Browse source archives, binaries, and changelogs for current and
            historical releases.
          </ResourceCard>
          <ResourceCard
            title="Upgrading to 6.1"
            to="https://www.kamailio.org/wikidocs/install/upgrade/6.0.x-to-6.1.0/"
            icon={GitBranch}
          >
            Check configuration and database changes before migrating from an
            earlier major branch.
          </ResourceCard>
          <ResourceCard
            title="Original download reference"
            to="/content/download"
            icon={BookOpen}
          >
            Access the complete project download page, including archived
            installation notes.
          </ResourceCard>
        </div>
      </section>
    </>
  );
}
