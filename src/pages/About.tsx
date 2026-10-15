import { Button, SectionTitle } from "../components/UI";
import { Users, BookOpen, MessageCircle } from "lucide-react";
import { PageHero, ResourceCard } from "../components/ExploreUI";

export function About() {
  return (
    <>
      <PageHero
        label="A QUARTER CENTURY OF CONNECTIONS"
        title={
          <>
            Open from
            <br />
            <span className="green">the beginning.</span>
          </>
        }
        description="Born in Berlin in 2001. Built by a global community ever since. Kamailio carries forward the combined history of SIP Express Router and OpenSER."
      />
      <section className="section light-section">
        <SectionTitle
          eyebrow="THE EVOLUTION OF AN OPEN IDEA"
          title="25 years. Still moving forward."
        />
        <div className="timeline">
          {[
            [
              "2001",
              "The first signal",
              "SIP Express Router begins at Fraunhofer FOKUS in Berlin.",
            ],
            [
              "2002",
              "Open to the world",
              "SER is released as open source under the GPL.",
            ],
            [
              "2005",
              "A new branch",
              "OpenSER is created as a spin-off of SIP Express Router.",
            ],
            [
              "2008",
              "Hello, Kamailio",
              "OpenSER is renamed to Kamailio. Later that year, the SER and Kamailio teams begin reuniting their source trees.",
            ],
            [
              "2012",
              "Stronger together",
              "The integration of Kamailio and SER is completed under the Kamailio name.",
            ],
            [
              "2026",
              "The connection continues",
              "The project celebrates 25 years of development and the 6.1 release series.",
            ],
          ].map(([y, t, d]) => (
            <div key={y}>
              <span>{y}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <Button to="/content/history" className="space-top">
          Read the complete history
        </Button>
      </section>
      <section className="section">
        <div className="resource-grid">
          <ResourceCard
            title="Project management"
            to="/content/management"
            icon={Users}
          >
            Meet the management board, administration team, and working groups
            coordinating the project.
          </ResourceCard>
          <ResourceCard
            title="About the project"
            to="/content/info"
            icon={BookOpen}
          >
            Explore Kamailio’s mission, its open development model, and the ways
            you can contribute.
          </ResourceCard>
          <ResourceCard
            title="People using Kamailio"
            to="/content/used-by"
            icon={MessageCircle}
          >
            Discover companies, products, and services built with Kamailio.
          </ResourceCard>
        </div>
      </section>
    </>
  );
}
