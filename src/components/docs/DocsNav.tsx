import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, BookOpen, Braces } from "lucide-react";
export default function DocsNav() {
  return (
    <nav className="docs-nav" aria-label="Documentation navigation">
      <Link className="docs-nav-brand" to="/docs">
        <BookOpen size={17} />
        Documentation<span> / </span>
      </Link>
      <div>
        <NavLink end to="/docs">
          Overview
        </NavLink>
        <NavLink to="/docs/modules">Modules</NavLink>
        <NavLink to="/docs/collections/wiki">Wiki</NavLink>
        <NavLink to="/docs/collections/tutorial">Guides</NavLink>
        <NavLink to="/docs/presentations">Talks</NavLink>
        <NavLink to="/docs/sources">Sources</NavLink>
      </div>
      <a href="https://github.com/kamailio/kamailio-wiki">
        <Braces size={15} />
        Contribute
        <ArrowUpRight size={13} />
      </a>
    </nav>
  );
}
