import { useEffect, useState } from "react";
import { gunzipSync, strFromU8 } from "fflate";
import { siteHref } from "./urls";
export type DocKind =
  | "module"
  | "wiki"
  | "tutorial"
  | "reference"
  | "database"
  | "legacy"
  | "events";
export interface DocRecord {
  id: string;
  title: string;
  kind: DocKind;
  version: string;
  category: string;
  description: string;
  source: string;
  file: string;
  search: string;
  words: number;
  headings: number;
  sourceFormat: string;
  status?: string;
  sourceArchive?: string;
  sourceFileURL?: string;
  sourceUnavailable?: boolean;
}
export interface DocHeading {
  id: string;
  title: string;
  level: number;
}
export interface DocBody extends DocRecord {
  html: string;
  toc: DocHeading[];
}
export interface DocsManifest {
  documents: number;
  modules: number;
  wiki: number;
  presentations: number;
  versions: string[];
  syncedAt: string;
  unavailable: { url: string; error: string }[];
  sourceFallbacks: { version: string; module: string; reason: string }[];
  collections: { kind: string; version?: string; archive: string }[];
}
export const STABLE = "6.1.x";
export const kinds: Record<DocKind, string> = {
  module: "Module reference",
  wiki: "Wiki & cookbooks",
  tutorial: "Tutorials & KEMI",
  reference: "APIs & exports",
  database: "Database schemas",
  legacy: "Legacy wiki",
  events: "Event archive",
};
let pending:
  Promise<{ catalog: DocRecord[]; manifest: DocsManifest }> | undefined;
export function loadDocumentation() {
  return (pending ??= Promise.all([
    fetch(siteHref("/documentation/catalog.json")).then((r) => {
      if (!r.ok) throw new Error("Documentation index unavailable");
      return r.json() as Promise<DocRecord[]>;
    }),
    fetch(siteHref("/documentation/manifest.json")).then((r) => {
      if (!r.ok) throw new Error("Source manifest unavailable");
      return r.json() as Promise<DocsManifest>;
    }),
  ])
    .then(([catalog, manifest]) => ({ catalog, manifest }))
    .catch((e) => {
      pending = undefined;
      throw e;
    }));
}
export function useDocumentation() {
  const [data, setData] =
      useState<Awaited<ReturnType<typeof loadDocumentation>>>(),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadDocumentation()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return { data, error };
}
const bodies = new Map<string, DocBody>();
export async function loadDoc(record: DocRecord, signal?: AbortSignal) {
  if (bodies.has(record.id)) return bodies.get(record.id)!;
  const response = await fetch(siteHref("/documentation/" + record.file), {
    signal,
  });
  if (!response.ok) throw new Error("This document could not be loaded.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  const text =
    bytes[0] === 31 && bytes[1] === 139
      ? strFromU8(gunzipSync(bytes))
      : new TextDecoder().decode(bytes);
  const body = JSON.parse(text) as DocBody;
  bodies.set(record.id, body);
  if (bodies.size > 20) bodies.delete(bodies.keys().next().value!);
  return body;
}
export function docURL(record: Pick<DocRecord, "id">) {
  return "/docs/" + record.id;
}
export function versionLabel(version: string) {
  return version === STABLE
    ? `${version} · stable`
    : version === "devel"
      ? "Development"
      : version === "general"
        ? "All versions"
        : version;
}
export function findDocs(catalog: DocRecord[], query: string, limit = 10) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return catalog
    .map((record) => {
      const title = record.title.toLowerCase(),
        text = [title, record.description, record.category, record.search]
          .join(" ")
          .toLowerCase();
      if (!words.every((w) => text.includes(w))) return { record, score: -1 };
      const exact = title === query.toLowerCase().trim() ? 100 : 0;
      const score =
        exact +
        words.reduce(
          (n, w) =>
            n +
            (title.includes(w)
              ? 20
              : record.description.toLowerCase().includes(w)
                ? 5
                : 1),
          0,
        ) +
        (record.version === STABLE
          ? 12
          : record.version === "general"
            ? 10
            : record.version === "devel"
              ? 2
              : 0);
      return { record, score };
    })
    .filter((x) => x.score >= 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.record.title.localeCompare(b.record.title),
    )
    .slice(0, limit)
    .map((x) => x.record);
}
export function documentationLink(input: string) {
  try {
    const u = new URL(input);
    if (!["www.kamailio.org", "kamailio.org"].includes(u.hostname))
      return input;
    let path = u.pathname.replace(/\/+$/, "");
    if (path === "/docs") return "/docs";
    if (path === "/docs/tutorials") return "/docs/collections/tutorial";
    if (path === "/docs/docbooks") return "/docs/collections/reference";
    if (path === "/docs/db-tables") return "/docs/collections/database";
    if (path === "/wiki" || path === "/wikidocs")
      return "/docs/collections/wiki";
    if (path === "/dokuwiki") return "/docs/collections/legacy";
    if (path === "/events") return "/docs/presentations";
    if (path.startsWith("/wikidocs/") || path.startsWith("/wiki/"))
      return (
        "/docs/wiki/" +
        path.replace(/^\/(wikidocs|wiki)\//, "").replace(/\.md$/, "") +
        u.hash
      );
    if (path.startsWith("/docs/modules"))
      return (
        path
          .replace("/stable", "/" + STABLE)
          .replace(/(\/docs\/modules\/[^/]+)\/modules\//, "$1/")
          .replace(/\.html?$/, "") + u.hash
      );
    if (path.startsWith("/docs/tutorials/"))
      return (
        path.replace(/\/index\.html?$/, "").replace(/\.html?$/, "") + u.hash
      );
    if (path.startsWith("/docs/docbooks/"))
      return (
        path
          .replace("/docs/docbooks/", "/docs/reference/")
          .replace(/\.html?$/, "") + u.hash
      );
    if (path.startsWith("/docs/db-tables/"))
      return (
        path
          .replace("/docs/db-tables/", "/docs/database/")
          .replace(/\.html?$/, "") + u.hash
      );
    if (path.startsWith("/dokuwiki/doku.php/"))
      return "/docs/legacy/" + path.replace("/dokuwiki/doku.php/", "") + u.hash;
    if (
      /^\/docs\/(?:install|tls|openser-radius|ser-getting-started)/i.test(path)
    )
      return (
        "/docs/tutorials/" +
        path
          .replace("/docs/", "")
          .replace(/\/index\.html?$/, "")
          .replace(/\.html?$/, "") +
        u.hash
      );
    if (path.startsWith("/docs/"))
      return (
        "/docs/reference/" +
        path
          .replace("/docs/", "")
          .replace(/\/index\.html?$/, "")
          .replace(/\.html?$/, "") +
        u.hash
      );
    return input;
  } catch {
    return input;
  }
}

let routesPending: Promise<Set<string>> | undefined;
export function loadDocumentationRoutes() {
  return (routesPending ??= fetch(siteHref("/documentation/routes.json"))
    .then((r) => {
      if (!r.ok) throw new Error("Documentation routes unavailable");
      return r.json() as Promise<string[]>;
    })
    .then((ids) => {
      const routes = new Set(ids.map((id) => "/docs/" + id));
      for (const id of ids)
        if (id.startsWith("modules/"))
          routes.add("/docs/" + id.split("/").slice(0, 2).join("/"));
      for (const kind of Object.keys(kinds))
        routes.add("/docs/collections/" + kind);
      return routes;
    })
    .catch((e) => {
      routesPending = undefined;
      throw e;
    }));
}
export function docSearchURL(record: Pick<DocRecord, "id">, query: string) {
  return docURL(record) + "?find=" + encodeURIComponent(query.trim());
}
