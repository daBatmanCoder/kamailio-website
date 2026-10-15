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
for (const record of content) {
  routes.add(`${record.type === "post" ? "news" : "content"}/${record.slug}`);
  routes.add(new URL(record.url).pathname.replace(/^\/+|\/+$/g, ""));
}
for (const route of routes) {
  const target = resolve(dist, route, "index.html");
  if (!target.startsWith(dist + sep))
    throw new Error(`Invalid route: ${route}`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, template);
}
await writeFile(resolve(dist, "404.html"), template);
await writeFile(resolve(dist, ".nojekyll"), "");
console.log(
  `Prepared ${routes.size} clean route entry documents for GitHub Pages.`,
);
