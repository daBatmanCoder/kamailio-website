import { Button, SectionTitle } from "../components/UI";
import { capabilities } from "../data/navigation";
import { GitBranch, Shield, Code2 } from "lucide-react";
import { PageHero, ResourceCard } from "../components/ExploreUI";

export function Platform() {
  return (
    <>
      <PageHero
        label="THE OPEN SOURCE SIP SERVER"
        title={
          <>
            Infrastructure.
            <br />
            <span className="green">On your terms.</span>
          </>
        }
        description="A high-performance signaling engine for voice, video, messaging, and presence. Build from a single instance to a distributed communications platform."
      />
      <section className="section platform-features">
        {capabilities.map((c, i) => (
          <div
            className="platform-feature"
            id={`capability-${i}`}
            key={c.title}
          >
            <span className="feature-num">0{i + 1}</span>
            <div>
              <h2>{c.title}</h2>
              <p>{c.desc}</p>
              <div className="card-tags">
                {c.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
      <section className="section light-section">
        <SectionTitle
          eyebrow="ENGINEERED FOR REAL-TIME"
          title="One core. Many capabilities."
        />
        <div className="resource-grid">
          <ResourceCard
            to="/content/features"
            title="Routing & transport"
            icon={GitBranch}
          >
            Stateful and stateless proxying, serial and parallel forking, UDP,
            TCP, TLS, SCTP, IPv4, IPv6, and WebSocket.
          </ResourceCard>
          <ResourceCard
            to="/content/features"
            title="Security & reliability"
            icon={Shield}
          >
            Digest authentication, authorization, ACLs, topology hiding, DNS
            failover, and high availability replication.
          </ResourceCard>
          <ResourceCard
            to="/content/features"
            title="Extensibility & operations"
            icon={Code2}
          >
            KEMI scripting, database connectors, JSONRPC, monitoring,
            accounting, and a modular architecture.
          </ResourceCard>
        </div>
        <Button to="/content/features" className="space-top">
          Read the complete feature reference
        </Button>
      </section>
      <section className="section">
        <SectionTitle
          eyebrow="YOUR STACK, CONNECTED"
          title="Works with your world."
          description="Interconnect with SIP phones, PSTN gateways, PBXs, and media servers including Asterisk, FreeSWITCH, and SEMS."
        />
        <Button to="/content/interoperability" secondary>
          Explore interoperability
        </Button>
      </section>
    </>
  );
}
