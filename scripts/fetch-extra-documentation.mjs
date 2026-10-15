import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
const root = resolve("work/documentation-sources");
const manifestPath = resolve(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const pending = new Set(["https://www.kamailio.org/docs/"]);
const accepts = (u) =>
  ["www.kamailio.org", "kamailio.org"].includes(u.hostname) &&
  /^\/docs\//.test(u.pathname) &&
  !/^\/docs\/(modules|tutorials|docbooks|db-tables)\//.test(u.pathname) &&
  !u.search &&
  /\/$|\.html?$|\/INSTALL[^/]*$/i.test(u.pathname);
for (const name of await readdir("public/content")) {
  if (!name.endsWith(".json")) continue;
  const content = JSON.parse(await readFile("public/content/" + name, "utf8"));
  const $ = cheerio.load(content.html || content.content || "");
  $("a[href]").each((_, a) => {
    try {
      const u = new URL($(a).attr("href"), "https://www.kamailio.org/");
      if (accepts(u)) {
        u.hash = "";
        pending.add(u.href);
      }
    } catch {}
  });
}
const seen = new Set(manifest.pages.map((p) => p.url));
let last = 0,
  added = 0;
for (const input of pending) {
  const u = new URL(input);
  u.protocol = "https:";
  u.hostname = "www.kamailio.org";
  u.hash = "";
  const url = u.href;
  if (seen.has(url)) continue;
  seen.add(url);
  const cache = resolve(
    root,
    "cache",
    createHash("sha256").update(url).digest("hex") + ".html",
  );
  try {
    let raw;
    try {
      raw = await readFile(cache, "utf8");
    } catch {
      await new Promise((r) =>
        setTimeout(r, Math.max(0, 1100 - (Date.now() - last))),
      );
      last = Date.now();
      const response = await fetch(url, {
        signal: AbortSignal.timeout(60000),
        headers: {
          "User-Agent": "KamailioWebsite public documentation migration",
        },
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      raw = await response.text();
      await writeFile(cache, raw);
    }
    const $ = cheerio.load(raw),
      index = $("title").text().startsWith("Index of");
    const text = !/<(?:html|body|h1|title)[\s>]/i.test(raw);
    if (!index && u.pathname !== "/docs/") {
      manifest.pages.push({ url, cache, kind: "reference", plainText: text });
      added++;
    }
    if (!text)
      $("a[href]").each((_, a) => {
        try {
          const target = new URL($(a).attr("href"), url);
          target.hash = "";
          if (accepts(target) && !seen.has(target.href))
            pending.add(target.href);
        } catch {}
      });
  } catch (e) {
    if (!manifest.failures.some((f) => f.url === url))
      manifest.failures.push({ url, error: e.message });
  }
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log(
  `Additional documentation: ${added} pages, ${seen.size} source URLs accounted for.`,
);
