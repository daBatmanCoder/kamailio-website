import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
export const Arrow = ({ diagonal = false }: { diagonal?: boolean }) =>
  diagonal ? <ArrowUpRight size={18} /> : <ArrowRight size={18} />;
export function Mark() {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path
        d="M7 5v26M29 5 7 18l22 13M7 18h24"
        stroke="currentColor"
        strokeWidth="3.6"
      />
    </svg>
  );
}
export function Button({
  to,
  children,
  secondary = false,
  className = "",
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  const cls = `button ${secondary ? "button-secondary" : ""} ${className}`;
  return to.startsWith("http") ? (
    <a href={to} className={cls}>
      {children}
      <Arrow />
    </a>
  ) : (
    <Link to={to} className={cls}>
      {children}
      <Arrow />
    </Link>
  );
}
export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="eyebrow">
      <span className="tiny-cross">+</span>
      {children}
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
}) {
  return (
    <div className="section-heading reveal">
      <Label>{eyebrow}</Label>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
export const clean = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&#8211;|&#8212;/g, "—")
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/\s+/g, " ")
    .trim();
export const date = (s: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(s));
