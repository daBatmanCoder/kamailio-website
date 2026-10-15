import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";

// GitHub Pages serves physical directories rather than SPA rewrites. Give every
// known route an entry document so refreshing and sharing clean URLs works.
const dist = resolve("dist");
const template = await readFile(resolve(dist, "index.html"), "utf8");
const content = JSON.parse(await readFile("src/data/content.json", "utf8"));
const routes = new Set([
  "platform",
  "developers",
  "community",
  "download",
  "about",
  "news",
  "resources",
]);
const documentation = JSON.parse(
  await readFile("public/documentation/catalog.json", "utf8"),
);
for (const route of [
  "docs",
  "docs/modules",
  "docs/modules/stable",
  "docs/sources",
  "docs/presentations",
  ...["wiki", "tutorial", "reference", "database", "legacy", "events"].map(
    (kind) => "docs/collections/" + kind,
  ),
])
  routes.add(route);
for (const record of documentation) {
  routes.add("docs/" + record.id);
  if (record.kind === "module") routes.add("docs/modules/" + record.version);
}
for (const record of content) {
  routes.add(`${record.type === "post" ? "news" : "content"}/${record.slug}`);
  routes.add(new URL(record.url).pathname.replace(/^\/+|\/+$/g, ""));
}
const metadata = new Map(
  documentation.map((record) => [
    "docs/" + record.id,
    {
      title: `${record.title} — ${record.version} — Kamailio Docs`,
      description: record.description,
    },
  ]),
);
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
for (const route of routes) {
  const target = resolve(dist, route, "index.html");
  if (!target.startsWith(dist + sep))
    throw new Error(`Invalid route: ${route}`);
  await mkdir(dirname(target), { recursive: true });
  const meta = metadata.get(route);
  const page = meta
    ? template
        .replace(
          /<title>[\s\S]*?<\/title>/,
          `<title>${escape(meta.title)}</title>`,
        )
        .replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
          `<meta name="description" content="${escape(meta.description)}" />`,
        )
    : template;
  await writeFile(target, page);
}
await writeFile(resolve(dist, "404.html"), template);
await writeFile(resolve(dist, ".nojekyll"), "");
console.log(
  `Prepared ${routes.size} clean route entry documents for GitHub Pages.`,
);
