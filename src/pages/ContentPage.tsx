import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { Label, Button, clean, date } from "../components/UI";
import { ArrowUpRight } from "lucide-react";
import content from "../data/content.json";
import { NotFound } from "./NotFound";

export function ContentPage() {
  const { slug } = useParams();
  const location = useLocation();
  const isNews = location.pathname.startsWith("/news/");
  const page = location.pathname.startsWith("/w/")
    ? content.find(
        (p) =>
          new URL(p.url).pathname.replace(/\/$/, "") ===
          location.pathname.replace(/\/$/, ""),
      )
    : content.find(
        (p) => p.slug === slug && p.type === (isNews ? "post" : "page"),
      );
  const [html, setHtml] = useState(""),
    [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    setHtml("");
    setLoaded(false);
    setFailed(false);
    if (!page) return;
    const abort = new AbortController();
    fetch(`/content/${page.id}.json`, { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Content unavailable");
        return r.json();
      })
      .then((data) => {
        const doc = new DOMParser().parseFromString(
          DOMPurify.sanitize(data.html, {
            FORBID_TAGS: [
              "form",
              "input",
              "button",
              "iframe",
              "style",
              "script",
            ],
            FORBID_ATTR: ["style", "width", "height", "srcset"],
          }),
          "text/html",
        );
        doc.querySelectorAll("a").forEach((a) => {
          const href = a.getAttribute("href");
          if (!href) return;
          try {
            const url = new URL(href, page.url);
            const target = content.find(
              (p) =>
                new URL(p.url).pathname.replace(/\/$/, "") ===
                  url.pathname.replace(/\/$/, "") &&
                new URL(p.url).hostname === url.hostname,
            );
            if (target)
              a.setAttribute(
                "href",
                `${target.type === "post" ? "/news/" : "/content/"}${target.slug}${url.hash}`,
              );
            else a.setAttribute("href", url.href);
          } catch {
            /* sanitizer removes unsafe protocols */
          }
        });
        doc.querySelectorAll("img").forEach((img) => {
          const src = img.getAttribute("src");
          if (src) img.setAttribute("src", new URL(src, page.url).href);
          img.setAttribute("loading", "lazy");
        });
        setHtml(doc.body.innerHTML);
        setLoaded(true);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setFailed(true);
      });
    return () => abort.abort();
  }, [page]);
  if (!page) return <NotFound />;
  return (
    <>
      <div className="section article-heading">
        <Link className="text-link" to={isNews ? "/news" : "/resources"}>
          ← {isNews ? "All updates" : "Resource library"}
        </Link>
        <Label>
          {isNews ? "FROM THE KAMAILIO NEWSROOM" : "KAMAILIO PROJECT REFERENCE"}
        </Label>
        <h1>{clean(page.title)}</h1>
        {isNews && <time>{date(page.date)}</time>}
      </div>
      <div className="section article-layout">
        <aside>
          <Label>IN THIS PROJECT</Label>
          <Link to="/download">
            Download Kamailio <ArrowUpRight size={15} />
          </Link>
          <Link to="/developers">
            Documentation <ArrowUpRight size={15} />
          </Link>
          <Link to="/community">
            Community & support <ArrowUpRight size={15} />
          </Link>
          <Link to="/resources">
            All resources <ArrowUpRight size={15} />
          </Link>
          <div className="source-note">
            From the Kamailio project.
            <br />
            <a href={page.url}>View original page ↗</a>
            <p>
              Historical articles and references retain their original dates and
              version information. For new installations, use the current
              download guide.
            </p>
          </div>
        </aside>
        <article className="prose">
          {loaded ? (
            html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p>
                This original page uses a dynamic listing or submission form.{" "}
                <a href={page.url}>Open the original page to continue ↗</a>
              </p>
            )
          ) : failed ? (
            <p>
              Could not load this page.{" "}
              <a href={page.url}>Read it on kamailio.org ↗</a>
            </p>
          ) : (
            <p role="status">Loading project content…</p>
          )}
          <div className="article-end">
            <span>THANK YOU FOR FLYING KAMAILIO.</span>
            <Button to="/community" secondary>
              Continue the conversation
            </Button>
          </div>
        </article>
      </div>
    </>
  );
}
