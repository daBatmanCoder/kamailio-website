import { mkdir, readFile, writeFile, readdir, access } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile as rawExec } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
const execFile = promisify(rawExec),
  root = resolve("work/documentation-sources");
await mkdir(root, { recursive: true });
const resumeHTML = process.argv.includes("--resume-html");
const previous = resumeHTML
  ? JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"))
  : null;
const manifest = {
  sources: previous?.sources || [],
  moduleIndexes: previous?.moduleIndexes || [],
  pages: previous?.pages.filter((p) => p.kind === "module") || [],
  failures:
    previous?.failures.filter((f) =>
      /\/docs\/modules\/|codeload\.github\.com|\/pub\/kamailio\//.test(f.url),
    ) || [],
  discovered: [],
  syncedAt: new Date().toISOString(),
};
const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastFetch = 0;
let fetchSlot = Promise.resolve();
async function cached(url, binary = false) {
  const path = resolve(
    root,
    "cache",
    createHash("sha256").update(url).digest("hex") +
      (binary ? ".tgz" : ".html"),
  );
  await mkdir(resolve(root, "cache"), { recursive: true });
  if (await exists(path))
    return binary ? readFile(path) : await readFile(path, "utf8");
  if (new URL(url).hostname.endsWith("kamailio.org")) {
    fetchSlot = fetchSlot.then(async () => {
      await sleep(Math.max(0, 1100 - (Date.now() - lastFetch)));
      lastFetch = Date.now();
    });
    await fetchSlot;
  }
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(60000),
        headers: {
          "User-Agent":
            "KamailioWebsite documentation migration (public open-source documentation)",
        },
      });
      if (response.ok) break;
      if (response.status === 404) break;
    } catch (e) {
      if (attempt === 2) throw e;
    }
    await sleep(2000 * (attempt + 1));
  }
  if (!response?.ok)
    throw new Error(`${response?.status || "network error"} ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path, bytes);
  return binary ? bytes : bytes.toString("utf8");
}
async function sourceArchive(name, url) {
  const target = resolve(root, name),
    ready = resolve(target, ".ready");
  if (!(await exists(ready))) {
    const archive = resolve(root, `${name}.tgz`);
    await writeFile(archive, await cached(url, true));
    await mkdir(target, { recursive: true });
    const { stdout } = await execFile("tar", ["-tzf", archive], {
      maxBuffer: 32 * 1024 * 1024,
    });
    const members = stdout
      .split("\n")
      .filter(
        (x) =>
          x &&
          !x.endsWith("/") &&
          (/\/doc\//.test(x) ||
            /\/(README[^/]*|LICENSE[^/]*|COPYING[^/]*)$/.test(x) ||
            name.includes("wiki") ||
            name.includes("tutorial")),
      );
    const memberFile = resolve(root, `${name}-members.txt`);
    await writeFile(memberFile, members.join("\n") + "\n");
    await execFile(
      "tar",
      ["-xzf", archive, "-C", target, "--strip-components=1", "-T", memberFile],
      { maxBuffer: 4 * 1024 * 1024 },
    );
    await writeFile(ready, url);
  }
  return target;
}
if (!resumeHTML) {
  // Public source archives avoid thousands of repetitive requests to the project server.
  const branches = [
    "3.1",
    "3.2",
    "3.3",
    "4.0",
    "4.1",
    "4.2",
    "4.3",
    "4.4",
    "5.0",
    "5.1",
    "5.2",
    "5.3",
    "5.4",
    "5.5",
    "5.6",
    "5.7",
    "5.8",
    "6.0",
    "6.1",
    "master",
  ];
  let queue = [...branches];
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (queue.length) {
        const branch = queue.shift();
        const version = branch === "master" ? "devel" : branch + ".x";
        const url = `https://codeload.github.com/kamailio/kamailio/tar.gz/refs/heads/${branch}`;
        try {
          const path = await sourceArchive(`modules-${version}`, url);
          manifest.sources.push({
            kind: "modules",
            version,
            branch,
            path,
            archive: url,
          });
          console.log(`Source ready: modules ${version}`);
        } catch (e) {
          manifest.failures.push({ url, error: e.message });
          console.log(e.message);
        }
      }
    }),
  );
  for (const [name, repo, branch] of [
    ["wiki", "kamailio-wiki", "main"],
    ["tutorials", "kamailio-docs", "master"],
    ["tutorials-extra", "kamailio-tutorials", "master"],
  ]) {
    const url = `https://codeload.github.com/kamailio/${repo}/tar.gz/refs/heads/${branch}`;
    try {
      const path = await sourceArchive(name, url);
      manifest.sources.push({ kind: name, path, archive: url });
    } catch (e) {
      manifest.failures.push({ url, error: e.message });
    }
  }
  const releases = {
    "0.9.x": "0.9.5",
    "1.0.x": "1.0.1",
    "1.1.x": "1.1.1",
    "1.2.x": "1.2.3",
    "1.3.x": "1.3.4",
    "1.4.x": "1.4.5",
    "1.5.x": "1.5.5",
    "3.0.x": "3.0.4",
  };
  for (const [version, release] of Object.entries(releases)) {
    const index = `https://www.kamailio.org/pub/kamailio/${release}/src/`;
    try {
      const $ = cheerio.load(await cached(index));
      const names = $("a[href]")
        .map((_, a) => $(a).attr("href"))
        .get()
        .filter((x) => /\.tar\.gz$/.test(x) && /src|source/.test(x));
      const file = names.find((x) => !x.includes("notls")) || names[0];
      if (!file) throw new Error("No source archive listed");
      const url = new URL(file, index).href;
      const path = await sourceArchive(`modules-${version}`, url);
      manifest.sources.push({
        kind: "modules",
        version,
        branch: release,
        path,
        archive: url,
      });
      console.log(`Source ready: modules ${version}`);
    } catch (e) {
      manifest.failures.push({ url: index, error: e.message });
      console.log(e.message);
    }
  }
  for (const source of manifest.sources.filter((s) => s.kind === "modules")) {
    const index = `https://www.kamailio.org/docs/modules/${source.version}/`;
    try {
      const $ = cheerio.load(await cached(index));
      const modules = [];
      $("tr").each((_, row) => {
        const cells = $(row).children("td"),
          a = cells.first().find('a[href$=".html"]').first();
        if (!a.length) return;
        const href = a.attr("href"),
          name = href
            .split("/")
            .pop()
            .replace(/\.html$/, "");
        modules.push({
          name,
          source: new URL(href, index).href,
          description: cells.eq(1).text().trim(),
          status: cells.eq(2).text().trim(),
        });
      });
      manifest.moduleIndexes.push({
        version: source.version,
        url: index,
        modules,
      });
      for (const module of modules) {
        let present = false;
        for (const folder of [
          "src/modules",
          "modules",
          "modules_k",
          "modules_s",
        ])
          if (await exists(resolve(source.path, folder, module.name, "README")))
            present = true;
        if (!present) {
          try {
            const raw = await cached(module.source),
              cache = resolve(
                root,
                "cache",
                createHash("sha256").update(module.source).digest("hex") +
                  ".html",
              );
            manifest.pages.push({
              url: module.source,
              cache,
              kind: "module",
              version: source.version,
              ...module,
            });
          } catch (e) {
            manifest.failures.push({ url: module.source, error: e.message });
          }
        }
      }
      console.log(
        `Audited published module index ${source.version}: ${modules.length} manuals.`,
      );
    } catch (e) {
      manifest.failures.push({ url: index, error: e.message });
    }
  }
  await writeFile(
    resolve(root, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    "Module and wiki source archives complete. Scanning HTML references…",
  );
}
// Walk the published document trees, not login pages, revision histories, binary
// software downloads, mailing-list messages, or third-party websites.
const pending = [
  "https://www.kamailio.org/docs/tutorials/",
  "https://www.kamailio.org/docs/docbooks/",
  "https://www.kamailio.org/docs/db-tables/",
  "https://www.kamailio.org/wiki/",
  "https://www.kamailio.org/dokuwiki/doku.php/start",
  "https://www.kamailio.org/dokuwiki/doku.php?do=index",
  "https://www.kamailio.org/events/",
];
const seen = new Set();
const normalize = (input) => {
  const u = new URL(input);
  u.protocol = "https:";
  u.hostname = "www.kamailio.org";
  u.hash = "";
  // DokuWiki repeats the same sitemap beneath every current page path.
  // Canonicalize that navigation so each namespace is visited once.
  if (u.pathname.includes("/dokuwiki/doku.php") && u.searchParams.has("idx")) {
    const namespace = u.searchParams.get("idx");
    u.pathname = "/dokuwiki/doku.php/start";
    u.search = "?idx=" + encodeURIComponent(namespace);
  } else if (
    u.pathname.includes("/dokuwiki/doku.php") &&
    u.searchParams.get("do") === "index"
  ) {
    u.pathname = "/dokuwiki/doku.php";
    u.search = "?do=index";
  }
  return u.href;
};
const queued = new Set(pending.map(normalize));
let completed = 0;
async function scan(url) {
  seen.add(url);
  try {
    const raw = await cached(url),
      $ = cheerio.load(raw);
    const isIndex = $("title").text().startsWith("Index of");
    const inLegacy = url.includes("/dokuwiki/");
    const inWiki = url.includes("/wiki/");
    const wikiIndex =
      inLegacy &&
      (new URL(url).searchParams.has("idx") ||
        new URL(url).searchParams.get("do") === "index");
    const missingTopic = /This topic does not exist yet/i.test($("h1").text());
    if (missingTopic) {
      manifest.failures.push({ url, error: "Source topic does not exist" });
      return;
    }
    if (!isIndex && !inWiki && !wikiIndex) {
      manifest.pages.push({
        url,
        cache: resolve(
          root,
          "cache",
          createHash("sha256").update(url).digest("hex") + ".html",
        ),
        kind: inLegacy
          ? "legacy"
          : url.includes("/events/")
            ? "events"
            : url.includes("/db-tables/")
              ? "database"
              : url.includes("/docbooks/")
                ? "reference"
                : "tutorial",
      });
    }
    $("a[href]").each((_, a) => {
      const href = $(a).attr("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      let target;
      try {
        target = new URL(href, url);
      } catch {
        return;
      }
      if (!["kamailio.org", "www.kamailio.org"].includes(target.hostname))
        return;
      const path = target.pathname;
      if (/\.(pdf|mp4|webm|pptx?|odp|zip|tgz|gz|bz2)$/i.test(path)) {
        if (path.startsWith("/events/"))
          manifest.discovered.push({
            url: target.href,
            title: $(a).text().trim(),
            kind: "presentation",
          });
        return;
      }
      const indexNavigation =
        inLegacy &&
        path.includes("/dokuwiki/doku.php") &&
        (target.searchParams.has("idx") ||
          target.searchParams.get("do") === "index") &&
        [...target.searchParams.keys()].every((k) =>
          ["idx", "do", "id"].includes(k),
        );
      if (target.search && !indexNavigation) return;
      const doc =
        /^\/docs\/(tutorials|docbooks|db-tables)\//.test(path) &&
        /\/$|\.html?$/.test(path) &&
        !/\/(css|js|img|images|site_libs)\//.test(path);
      const legacy =
        inLegacy &&
        !$(a).hasClass("wikilink2") &&
        /^\/dokuwiki\/doku\.php\//.test(path) &&
        !href.includes("do=") &&
        !path.includes("/wiki:") &&
        !path.includes("/doku>");
      const events = path.startsWith("/events/") && /\/$|\.html?$/.test(path);
      if (doc || legacy || events || indexNavigation) {
        const next = normalize(target.href);
        if (!queued.has(next) && !seen.has(next)) {
          queued.add(next);
          pending.push(next);
        }
      }
    });
  } catch (e) {
    manifest.failures.push({ url, error: e.message });
  }
  completed++;
  if (completed % 25 === 0) {
    await writeFile(
      resolve(root, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.log(
      `Scanned ${seen.size} URLs; ${pending.length} queued; ${manifest.pages.length} documents; ${manifest.discovered.length} presentations.`,
    );
  }
}
// Limit requests to three in flight while spacing request starts by the
// documented crawl delay. Cached pages need no network slot.
const activeScans = new Set();
while (pending.length || activeScans.size) {
  while (pending.length && activeScans.size < 3) {
    const url = normalize(pending.shift());
    if (seen.has(url)) continue;
    const task = scan(url).finally(() => activeScans.delete(task));
    activeScans.add(task);
  }
  if (activeScans.size) await Promise.race(activeScans);
}
await writeFile(
  resolve(root, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);
console.log(
  `Finished: ${manifest.sources.length} source collections, ${manifest.pages.length} HTML documents, ${manifest.discovered.length} presentation links. ${manifest.failures.length} unavailable sources recorded.`,
);
