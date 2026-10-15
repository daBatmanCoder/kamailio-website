import { siteHref } from "../lib/urls";
import { SectionTitle } from "../components/UI";
import {
  Terminal,
  Code2,
  GitBranch,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { PageHero, ResourceCard } from "../components/ExploreUI";

export function Developers() {
  return (
    <>
      <PageHero
        label="THE DEVELOPER HUB"
        title={
          <>
            Build something
            <br />
            <span className="green">worth connecting.</span>
          </>
        }
        description="From your first configuration to your next contribution. Find the documentation, modules, and tools to make Kamailio your own."
      />
      <section className="section">
        <div className="resource-grid">
          <ResourceCard
            title="Start with the fundamentals"
            to="https://www.kamailio.org/wikidocs/"
            icon={Terminal}
          >
            Installation guides, configuration cookbooks, tutorials, and
            practical examples.
          </ResourceCard>
          <ResourceCard
            title="Explore the modules"
            to="https://www.kamailio.org/docs/modules/stable/"
            icon={Code2}
          >
            The complete module reference for the current stable branch.
            Parameters, functions, and examples.
          </ResourceCard>
          <ResourceCard
            title="Follow development"
            to="https://www.kamailio.org/docs/modules/devel/"
            icon={GitBranch}
          >
            Documentation for the development branch. Discover what’s being
            built next.
          </ResourceCard>
        </div>
      </section>
      <section className="section light-section">
        <SectionTitle
          eyebrow="FIND YOUR NEXT STEP"
          title="From idea to implementation."
        />
        <div className="link-rows">
          {[
            [
              "01",
              "Install Kamailio",
              "Get the current release and choose your distribution.",
              "/download",
            ],
            [
              "02",
              "Configure your server",
              "Explore the configuration language, parameters, and cookbooks.",
              "https://www.kamailio.org/wikidocs/",
            ],
            [
              "03",
              "Extend the platform",
              "Work with the module API and developer guide.",
              "https://www.asipto.com/pub/kamailio-devel-guide/",
            ],
            [
              "04",
              "Contribute upstream",
              "Browse the source, review issues, and propose changes.",
              "https://github.com/kamailio/kamailio",
            ],
          ].map(([n, t, d, u]) => (
            <a key={n} href={siteHref(u)} className="link-row">
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <ArrowUpRight />
            </a>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionTitle
          eyebrow="ALL THE REFERENCE MATERIAL"
          title="Go a little deeper."
        />
        <div className="resource-grid">
          <ResourceCard title="Documentation index" to="/content/documentation">
            The original documentation directory, including versioned references
            and external learning resources.
          </ResourceCard>
          <ResourceCard
            title="Release notes & upgrades"
            to="/content/kamailio-v6-1-0-release-notes"
          >
            Read the 6.1 release highlights, download links, and upgrade
            references.
          </ResourceCard>
          <ResourceCard
            title="Ask the community"
            to="/community"
            icon={MessageCircle}
          >
            Connect with people building and operating Kamailio around the
            world.
          </ResourceCard>
        </div>
      </section>
    </>
  );
}
