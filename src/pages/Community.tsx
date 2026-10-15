import { Link } from "react-router-dom";
import { Label } from "../components/UI";
import {
  MessageCircle,
  Users,
  Code2,
  Heart,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import { PageHero, ResourceCard } from "../components/ExploreUI";

export function Community() {
  return (
    <>
      <PageHero
        label="PEOPLE MAKE THE CONNECTION"
        title={
          <>
            Open source.
            <br />
            <span className="green">Open to you.</span>
          </>
        }
        description="A worldwide community of developers, operators, and curious builders. Share what you know. Ask what you don’t. Help shape what comes next."
      />
      <section className="section">
        <div className="resource-grid">
          <ResourceCard
            title="Join the conversation"
            to="/content/mailing-lists"
            icon={MessageCircle}
          >
            The sr-users and sr-dev mailing lists are the home of technical
            questions, discussion, and development.
          </ResourceCard>
          <ResourceCard
            title="Meet in real time"
            to="https://riot.kamailio.dev/#/room/#kamailio:matrix.kamailio.dev"
            icon={Users}
          >
            Connect in the community Matrix room: #kamailio:matrix.kamailio.dev.
          </ResourceCard>
          <ResourceCard
            title="Build with us"
            to="https://github.com/kamailio/kamailio"
            icon={Code2}
          >
            Contribute code, improve documentation, report bugs, and help test
            the next release.
          </ResourceCard>
        </div>
      </section>
      <section className="section event-section light-section">
        <Label>MEET THE COMMUNITY</Label>
        <h2>
          Good connections.
          <br />
          Great conversations.
        </h2>
        <div className="event-grid">
          <Link
            to="/news/kamailio-developers-meeting-dec-1-2-2026-in-dusseldorf"
            className="event-card"
          >
            <span className="eyebrow">01—02 DECEMBER 2026</span>
            <h3>Developers Meeting</h3>
            <p>Düsseldorf, Germany</p>
            <span className="text-link">
              See the announcement <ArrowUpRight size={18} />
            </span>
          </Link>
          <a href="https://www.kamailioworld.com" className="event-card">
            <span className="eyebrow">CONFERENCE & ECOSYSTEM</span>
            <h3>Kamailio World</h3>
            <p>
              Talks, workshops, and people pushing real-time communications
              forward.
            </p>
            <span className="text-link">
              Visit Kamailio World <ArrowUpRight size={18} />
            </span>
          </a>
        </div>
      </section>
      <section className="section">
        <div className="resource-grid">
          <ResourceCard
            title="Support the project"
            to="/content/donations"
            icon={Heart}
          >
            Help sustain Kamailio’s infrastructure, development, and community
            activities.
          </ResourceCard>
          <ResourceCard
            title="Find professional support"
            to="/content/business-directory"
            icon={Users}
          >
            Explore the directory of companies and individuals offering
            commercial Kamailio services.
          </ResourceCard>
          <ResourceCard
            title="Contact & security"
            to="/content/contact-us"
            icon={Shield}
          >
            Find project contacts and the dedicated channel for reporting
            security issues.
          </ResourceCard>
        </div>
        <p className="quiet-note">
          Community support is offered on a best-effort basis.{" "}
          <Link to="/content/support">Read the support guide ↗</Link>
        </p>
      </section>
    </>
  );
}
