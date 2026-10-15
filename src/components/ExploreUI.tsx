import { Link } from "react-router-dom";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { Label } from "./UI";

export function PageHero({
  label,
  title,
  description,
}: {
  label: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <div className="page-hero section">
      <Label>{label}</Label>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function ResourceCard({
  to,
  title,
  children,
  icon: Icon = BookOpen,
}: {
  to: string;
  title: string;
  children: React.ReactNode;
  icon?: typeof BookOpen;
}) {
  const inner = (
    <>
      <Icon size={25} strokeWidth={1.3} />
      <ArrowUpRight className="resource-arrow" size={20} />
      <h3>{title}</h3>
      <p>{children}</p>
    </>
  );
  return to.startsWith("http") ? (
    <a className="resource-card" href={to}>
      {inner}
    </a>
  ) : (
    <Link className="resource-card" to={to}>
      {inner}
    </Link>
  );
}
