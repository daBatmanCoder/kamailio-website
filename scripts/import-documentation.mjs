import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
  access,
  rm,
} from "node:fs/promises";
import { resolve, relative, dirname, extname, basename, sep } from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import * as cheerio from "cheerio";
import { marked } from "marked";
const root = resolve("work/documentation-sources"),
  out = resolve("public/documentation");
const manifest = JSON.parse(
  await readFile(resolve(root, "manifest.json"), "utf8"),
);
await rm(resolve(out, "pages"), { recursive: true, force: true });
await mkdir(resolve(out, "pages"), { recursive: true });
await mkdir(resolve(out, "assets"), { recursive: true });
const records = new Map(),
  aliases = new Map(),
  warnings = [],
  tagCounts = new Map();
const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const plain = (s) => cheerio.load(s).text().replace(/\s+/g, " ").trim();
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-|-$/g, "") || "section";
const normalize = (url) => {
  const u = new URL(url);
  return u.pathname
    .replace(/\/(index\.(html?|md))?$/, "")
    .replace(/\.md$/, "")
    .replace(/\.html?$/, "");
};
const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};
async function walk(dir) {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = resolve(dir, e.name);
    if (e.isDirectory()) result.push(...(await walk(p)));
    else if (e.isFile()) result.push(p);
  }
  return result;
}
function inferVersion(value) {
  return (
    value.match(/\b\d+\.\d+\.x\b/)?.[0] ||
    (value.includes("devel") ? "devel" : "general")
  );
}
function category(module) {
  if (/^(ims_|cdp)/.test(module)) return "IMS & mobile";
  if (/^(db|sql|redis|ndb|htable|memcache|cassandra|mongodb)/.test(module))
    return "Data & storage";
  if (
    /^(auth|tls|crypto|sec|jwt|ipsec|permissions|pike|sanity|topo)/.test(module)
  )
    return "Security";
  if (/^(app_|kemi|kex|kemix)/.test(module)) return "Scripting";
  if (/^(presence|pua|msrp|imc|xmpp|xcap|rls)/.test(module))
    return "Messaging & presence";
  if (/^(rtp|sdp|mediaproxy)/.test(module)) return "Media";
  if (
    /^(acc|dialog|stats|debug|sipcapture|siptrace|snmp|benchmark|log_|xlog)/.test(
      module,
    )
  )
    return "Operations";
  if (/^(http|xhttp|websocket|lwsc|json|xml|kafka|rabbit|evapi)/.test(module))
    return "Integrations";
  return "Routing & signaling";
}
function register(record, html) {
  const $ = cheerio.load(html, { xmlMode: false });
  $(
    "script,style,iframe,form,button,input,select,nav,header,footer,.navheader,.navfooter,.toc,.wy-breadcrumbs,.footer",
  ).remove();
  $("*").each((_, node) => {
    for (const name of Object.keys(node.attribs || {}))
      if (
        /^on/i.test(name) ||
        ["style", "width", "height", "srcset"].includes(name)
      )
        $(node).removeAttr(name);
  });
  // Generated DocBook books use h1 for every chapter. Keep one document
  // title, then nest chapter/section headings beneath the reader title.
  if ($("h1").length > 1) {
    const first = $("h1").first().get(0);
    $("h1,h2,h3,h4,h5,h6").each((_, node) => {
      if (node !== first)
        node.tagName = "h" + Math.min(6, Number(node.tagName.slice(1)) + 1);
    });
  }
  const used = new Set(),
    toc = [];
  $("h1,h2,h3,h4,h5,h6").each((_, node) => {
    const h = $(node),
      title = h.text().replace(/\s+/g, " ").trim();
    if (!title) return;
    let id = h.attr("id") || h.parent("section").attr("id") || slug(title);
    let candidate = id,
      i = 2;
    while (used.has(candidate)) candidate = id + "-" + i++;
    used.add(candidate);
    h.attr("id", candidate);
    toc.push({ id: candidate, title, level: Number(node.tagName.slice(1)) });
  });
  // Keep source anchor names as well as the new semantic heading IDs.
  $("a[name]").each((_, a) => {
    const name = $(a).attr("name");
    if (!$(a).attr("id")) $(a).attr("id", name);
  });
  const first = $("p,.doc-paragraph")
    .toArray()
    .map((p) => $(p).text().replace(/\s+/g, " ").trim())
    .find(
      (t) =>
        t.length > 65 &&
        !/^(Copyright|Version:|Edited by|This document)/i.test(t),
    );
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const description = (record.description || first || text).slice(0, 220);
  record = {
    ...record,
    description,
    words: text.split(/\s+/).length,
    headings: toc.length,
    search: toc
      .map((h) => h.title)
      .join(" ")
      .slice(0, 8000),
  };
  records.set(record.id, { ...record, html: $("body").html(), toc });
  aliases.set(normalize(record.source), record.id);
  for (const alias of record.aliases || [])
    aliases.set(normalize(alias), record.id);
}
// Expand local DocBook entities and XIncludes from official source archives.
// No external DTDs are fetched and no source code is executed.
function extractEntities(text, base, entries) {
  for (const match of text.matchAll(
    /<!ENTITY\s+(?!%)([\w.-]+)\s+(?:SYSTEM\s+["']([^"']+)["']|(["'])([\s\S]*?)\3)\s*>/g,
  ))
    entries.set(
      match[1],
      match[2] ? { file: resolve(base, match[2]) } : { value: match[4] },
    );
}
async function moduleHTML(main, sourceRoot) {
  const entities = new Map();
  const globalFiles = [
    resolve(sourceRoot, "doc/docbook/entities.xml"),
    resolve(sourceRoot, "docbook/entities.xml"),
  ];
  for (const file of globalFiles)
    if (await exists(file))
      extractEntities(await readFile(file, "utf8"), dirname(file), entities);
  const allowed = (p) => p.startsWith(sourceRoot + sep);
  async function expand(file, stack = []) {
    if (!allowed(file) || stack.includes(file)) return "";
    const buffer = await readFile(file);
    let raw = buffer.toString("utf8");
    if (raw.includes("\uFFFD")) raw = buffer.toString("latin1");
    extractEntities(raw, dirname(file), entities);
    for (const m of raw.matchAll(
      /<!ENTITY\s+%\s+[\w.-]+\s+SYSTEM\s+["']([^"']+)["']/g,
    )) {
      const target = resolve(dirname(file), m[1]);
      if (allowed(target) && (await exists(target)))
        extractEntities(
          await readFile(target, "utf8"),
          dirname(target),
          entities,
        );
    }
    raw = raw
      .replace(/<\?xml[^>]*\?>/g, "")
      .replace(/<!DOCTYPE[\s\S]*?\]>/g, "")
      .replace(/<!DOCTYPE[^>]*>/g, "");
    for (const m of [
      ...raw.matchAll(
        /<(?:xi:)?include\b[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/(?:xi:)?include>)?/g,
      ),
    ]) {
      const target = resolve(dirname(file), m[1]);
      if (allowed(target) && (await exists(target)))
        raw = raw.replace(m[0], await expand(target, [...stack, file]));
    }
    for (let depth = 0; depth < 12; depth++) {
      const names = [
        ...new Set(
          [...raw.matchAll(/&([A-Za-z][\w.-]*);/g)]
            .map((m) => m[1])
            .filter((n) => !["amp", "lt", "gt", "quot", "apos"].includes(n)),
        ),
      ];
      if (!names.length) break;
      let changed = false;
      for (const name of names) {
        const entry = entities.get(name);
        let value;
        if (entry?.file && allowed(entry.file) && (await exists(entry.file)))
          value = await expand(entry.file, [...stack, file]);
        else value = entry?.value;
        if (value !== undefined) {
          raw = raw.replaceAll("&" + name + ";", value);
          changed = true;
        }
      }
      if (!changed) break;
    }
    return raw;
  }
  const xml = await expand(main);
  const $ = cheerio.load(xml, { xmlMode: true, decodeEntities: true });
  const titleMap = new Map();
  $("[id]").each((_, node) =>
    titleMap.set(
      $(node).attr("id"),
      $(node).children("title").first().text() ||
        $(node).text().trim().slice(0, 90),
    ),
  );
  function render(node, depth = 0) {
    if (node.type === "text") return esc(node.data);
    if (node.type !== "tag") return "";
    const tag = node.name.toLowerCase(),
      a = node.attribs || {},
      children = () => node.children.map((n) => render(n, depth)).join(""),
      id = a.id ? ` id="${esc(a.id)}"` : "";
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    if (["toc", "colspec", "indexterm", "processing-instruction"].includes(tag))
      return "";
    if (["book", "article"].includes(tag)) return children();
    if (["bookinfo", "articleinfo"].includes(tag))
      return `<details class="doc-attribution"><summary>Authors & source attribution</summary>${children()}</details>`;
    if (
      tag === "title" &&
      ["bookinfo", "articleinfo"].includes(node.parent?.name)
    )
      return `<p class="source-title">${children()}</p>`;
    if (
      [
        "chapter",
        "section",
        "sect1",
        "sect2",
        "sect3",
        "sect4",
        "sect5",
        "appendix",
        "preface",
      ].includes(tag)
    ) {
      const sectionDepth = tag === "chapter" ? 0 : depth + 1;
      const title = node.children.find((n) => n.name === "title");
      const heading = Math.min(6, Math.max(2, sectionDepth + 1));
      return `<section>${title ? `<h${heading}${id}>${title.children.map((n) => render(n)).join("")}</h${heading}>` : ""}${node.children
        .filter((n) => n !== title)
        .map((n) => render(n, sectionDepth))
        .join("")}</section>`;
    }
    if (tag === "title") return `<h4${id}>${children()}</h4>`;
    if (["para", "simpara", "formalpara"].includes(tag))
      return `<div class="doc-paragraph"${id}>${children()}</div>`;
    if (["programlisting", "screen", "literallayout"].includes(tag))
      return `<pre${id}><code class="language-${esc(a.language || "kamailio")}">${esc($(node).text())}</code></pre>`;
    if (
      [
        "literal",
        "function",
        "varname",
        "parameter",
        "filename",
        "command",
        "option",
        "classname",
        "constant",
        "symbol",
        "type",
        "computeroutput",
        "userinput",
        "replaceable",
        "structname",
        "structfield",
        "systemitem",
      ].includes(tag)
    )
      return `<code>${children()}</code>`;
    if (tag === "ulink")
      return `<a href="${esc(a.url || "")}">${children() || esc(a.url)}</a>`;
    if (tag === "link")
      return `<a href="${a.linkend ? "#" + esc(a.linkend) : esc(a["xlink:href"] || "")}">${children()}</a>`;
    if (tag === "xref")
      return `<a href="#${esc(a.linkend || "")}">${esc(titleMap.get(a.linkend) || a.linkend || "reference")}</a>`;
    if (tag === "email")
      return `<a href="mailto:${esc($(node).text())}">${children()}</a>`;
    if (tag === "emphasis")
      return `<${a.role === "bold" ? "strong" : "em"}>${children()}</${a.role === "bold" ? "strong" : "em"}>`;
    if (tag === "itemizedlist") return `<ul>${children()}</ul>`;
    if (tag === "orderedlist") return `<ol>${children()}</ol>`;
    if (tag === "listitem") return `<li>${children()}</li>`;
    if (tag === "variablelist") return `<dl>${children()}</dl>`;
    if (tag === "varlistentry") return `<div>${children()}</div>`;
    if (tag === "term") return `<dt>${children()}</dt>`;
    if (["note", "warning", "caution", "tip", "important"].includes(tag))
      return `<aside class="doc-callout doc-callout-${tag}"${id}><strong>${tag[0].toUpperCase() + tag.slice(1)}</strong>${children()}</aside>`;
    if (["table", "informaltable"].includes(tag))
      return `<div class="doc-table-wrap"><table${id}>${children()}</table></div>`;
    if (tag === "tgroup") return children();
    if (tag === "tbody") return `<tbody>${children()}</tbody>`;
    if (tag === "thead") return `<thead>${children()}</thead>`;
    if (tag === "row") return `<tr>${children()}</tr>`;
    if (tag === "entry") return `<td>${children()}</td>`;
    if (tag === "example" || tag === "informalexample")
      return `<figure class="doc-example"${id}>${children()}</figure>`;
    if (tag === "imagedata")
      return `<img src="${esc(a.fileref || "")}" alt="${esc(a.format || "Documentation diagram")}" loading="lazy"/>`;
    if (
      [
        "author",
        "editor",
        "copyright",
        "affiliation",
        "address",
        "revhistory",
        "revision",
        "legalnotice",
        "abstract",
        "bibliography",
        "biblioentry",
      ].includes(tag)
    )
      return `<div class="doc-${tag}"${id}>${children()}</div>`;
    if (
      ["firstname", "surname", "year", "holder", "orgname", "contrib"].includes(
        tag,
      )
    )
      return children() + " ";
    if (tag === "quote") return "“" + children() + "”";
    if (tag === "footnote")
      return `<small class="doc-footnote">${children()}</small>`;
    if (tag === "simplelist") return `<ul>${children()}</ul>`;
    if (tag === "member") return `<li>${children()}</li>`;
    return children();
  }
  return $.root()
    .contents()
    .toArray()
    .map((n) => render(n))
    .join("");
}
for (const source of manifest.sources.filter((s) => s.kind === "modules")) {
  const files = await walk(source.path),
    modules = new Map();
  const priority = (folder) =>
    folder.includes("/src/modules/")
      ? 0
      : folder.includes("/modules_k/")
        ? 1
        : folder.includes("/modules/")
          ? 2
          : 3;
  for (const file of files) {
    let folder;
    if (
      basename(file) === "README" &&
      /\/modules(?:_[a-z])?\/[^/]+\/README$/.test(file)
    )
      folder = dirname(file);
    else if (
      file.endsWith(".xml") &&
      /\/modules(?:_[a-z])?\/[^/]+\/doc\/[^/]+\.xml$/.test(file) &&
      basename(file, ".xml") === basename(dirname(dirname(file)))
    )
      folder = dirname(dirname(file));
    if (folder) {
      const name = basename(folder);
      if (!modules.has(name) || priority(folder) < priority(modules.get(name)))
        modules.set(name, folder);
    }
  }
  let count = 0;
  for (const [name, folder] of modules) {
    const readme = resolve(folder, "README"),
      main = resolve(folder, "doc", name + ".xml");
    let html,
      format = "DocBook";
    try {
      if (!(await exists(main))) throw new Error("No DocBook entry");
      html = await moduleHTML(main, source.path);
      if (plain(html).length < 100) throw new Error("Empty DocBook");
    } catch (e) {
      format = "README";
      if (!(await exists(readme))) {
        warnings.push({
          version: source.version,
          module: name,
          reason: e.message.replaceAll(root, "<source cache>"),
        });
        continue;
      }
      const raw = await readFile(readme, "utf8");
      html = `<pre class="doc-source-readme"><code class="language-plaintext">${esc(raw)}</code></pre>`;
      warnings.push({
        version: source.version,
        module: name,
        reason: e.message.replaceAll(root, "<source cache>"),
      });
    }
    const description = plain(html).match(/Overview\s+(.{65,260})/)?.[1];
    register(
      {
        id: `modules/${source.version}/${name}`,
        title: name,
        kind: "module",
        version: source.version,
        category: category(name),
        source: `https://www.kamailio.org/docs/modules/${source.version}/modules/${name}.html`,
        sourceArchive: source.archive,
        sourceFileURL: source.archive.includes("codeload.github.com")
          ? `https://github.com/kamailio/kamailio/blob/${source.branch}/${relative(source.path, format === "README" ? readme : main)}`
          : undefined,
        sourceFormat: format,
        localSource: main,
        description,
        aliases: [
          `https://www.kamailio.org/docs/modules/${source.version}/${name}.html`,
          ...(source.version === "6.1.x"
            ? [
                `https://www.kamailio.org/docs/modules/stable/modules/${name}.html`,
                `https://www.kamailio.org/docs/modules/stable/${name}.html`,
              ]
            : []),
        ],
      },
      html,
    );
    count++;
  }
  console.log(`Rendered ${count} module manuals for ${source.version}`);
}
for (const source of manifest.sources.filter((s) => s.kind === "wiki")) {
  const docs = resolve(source.path, "docs");
  for (const file of (await walk(docs)).filter(
    (p) => p.endsWith(".md") && !p.endsWith("/sidebar.md"),
  )) {
    const rel = relative(docs, file).replace(/\\/g, "/").replace(/\.md$/, "");
    const path = rel === "index" ? "start" : rel;
    const md = await readFile(file, "utf8"),
      html = marked.parse(md, { gfm: true });
    const $ = cheerio.load(html);
    const title = $("h1").first().text() || path.split("/").at(-1);
    const version = inferVersion(rel + " " + md.slice(0, 500));
    register(
      {
        id: `wiki/${path}`,
        title,
        kind: "wiki",
        version,
        category:
          rel.split("/")[0] === "index" ? "Overview" : rel.split("/")[0],
        source: `https://www.kamailio.org/wikidocs/${rel === "index" ? "" : rel + "/"}`,
        sourceArchive: source.archive,
        sourceFormat: "Markdown",
        localSource: file,
        aliases: [
          `https://www.kamailio.org/wiki/${rel === "index" ? "" : rel}`,
        ],
      },
      html,
    );
  }
  await copyFile(
    resolve(source.path, "LICENSE"),
    resolve(out, "WIKI-LICENSE.txt"),
  );
}
// Additional tutorial source pages (including all public KEMI function pages).
for (const source of manifest.sources.filter((s) =>
  s.kind.startsWith("tutorials"),
)) {
  for (const file of (await walk(source.path)).filter(
    (p) => p.endsWith(".md") && p.includes("/docs/"),
  )) {
    const rel = relative(source.path, file).replace(/\\/g, "/"),
      [project, rest] = rel.split("/docs/");
    if (!rest) continue;
    const version = project.match(/kamailio-(\d+\.\d+)-/)?.[1];
    const branch = version
      ? version + ".x"
      : source.kind === "tutorials-extra"
        ? "general"
        : "devel";
    const guide = project.replace(/kamailio-\d+\.\d+-/, "kamailio-");
    const subpath = rest.replace(/\.md$/, "").replace(/index$/, "");
    const sourceURL = `https://www.kamailio.org/docs/tutorials/${branch}/${guide}/${subpath}${subpath && !subpath.endsWith("/") ? "/" : ""}`;
    const md = await readFile(file, "utf8"),
      html = marked.parse(md, { gfm: true }),
      $ = cheerio.load(html);
    const title = $("h1").first().text() || basename(file, ".md");
    const id = `tutorials/${branch}/${guide}/${subpath}`.replace(/\/+$/, "");
    register(
      {
        id,
        title,
        kind: "tutorial",
        version: branch,
        category: guide.includes("kemi") ? "KEMI framework" : "Installation",
        source: `https://github.com/kamailio/${source.kind === "tutorials-extra" ? "kamailio-tutorials" : "kamailio-docs"}/blob/master/${rel}`,
        aliases: [sourceURL],
        sourceFileURL: `https://github.com/kamailio/${source.kind === "tutorials-extra" ? "kamailio-tutorials" : "kamailio-docs"}/blob/master/${rel}`,
        sourceArchive: source.archive,
        sourceFormat: "Markdown",
        localSource: file,
      },
      html,
    );
  }
}
for (const page of manifest.pages) {
  if (
    page.kind === "reference" &&
    /\/docs\/(?:install|tls|openser-radius|ser-getting-started)/i.test(
      new URL(page.url).pathname,
    )
  )
    page.kind = "tutorial";
  const raw = await readFile(page.cache, "utf8"),
    $ = cheerio.load(raw);
  let area = $(".book").first();
  if (!area.length) area = $(".article").first();
  if (!area.length) area = $(".rst-content").first();
  if (!area.length) area = $(".dokuwiki .page").first();
  if (!area.length) area = $("main,article").first();
  if (!area.length) area = $("body");
  const url = new URL(page.url);
  const urlPath = decodeURIComponent(url.pathname);
  let id;
  if (page.kind === "module") id = `modules/${page.version}/${page.name}`;
  else if (page.kind === "legacy")
    id =
      "legacy/" +
      urlPath.replace(/^\/dokuwiki\/doku.php\//, "").replace(/\/+$/, "");
  else if (page.kind === "events")
    id =
      "events/" +
      urlPath
        .replace(/^\/events\//, "")
        .replace(/\.html?$/, "")
        .replace(/\/+$/, "");
  else
    id =
      (page.kind === "database"
        ? "database/"
        : page.kind === "reference"
          ? "reference/"
          : "tutorials/") +
      urlPath
        .replace(/^\/docs\/(?:(tutorials|docbooks|db-tables)\/)?/, "")
        .replace(/\/index\.html?$/, "")
        .replace(/\.html?$/, "")
        .replace(/\/+$/, "");
  const sourceKey = normalize(page.url);
  const duplicate = aliases.get(sourceKey);
  if (duplicate) id = duplicate;
  const title =
    page.name ||
    area.find("h1").first().text().trim() ||
    $("title").text().trim() ||
    id.split("/").at(-1);
  if (/This topic does not exist yet/i.test(title)) continue;
  register(
    {
      id,
      title,
      kind: page.kind,
      version: page.version || inferVersion(page.url),
      status: page.status,
      description: page.description,
      category:
        page.kind === "module"
          ? category(page.name)
          : page.kind === "database"
            ? "Database schema"
            : page.kind === "reference"
              ? "APIs & exports"
              : page.kind === "events"
                ? "Conference archive"
                : page.kind === "legacy"
                  ? "Legacy wiki"
                  : "Tutorials",
      source: page.url,
      sourceFormat: page.plainText ? "Published text" : "Published HTML",
    },
    page.plainText
      ? `<h1>${esc(title)}</h1><pre><code>${esc(raw)}</code></pre>`
      : area.html() || "",
  );
}
for (const index of manifest.moduleIndexes || [])
  for (const entry of index.modules) {
    const id = `modules/${index.version}/${entry.name}`,
      record = records.get(id);
    if (record) {
      record.source = entry.source;
      record.description = entry.description || record.description;
      record.status = entry.status;
      aliases.set(normalize(entry.source), id);
      aliases.set(
        normalize(
          `https://www.kamailio.org/docs/modules/${index.version}/${entry.name}.html`,
        ),
        id,
      );
      if (index.version === "6.1.x") {
        aliases.set(normalize(entry.source.replace("/6.1.x/", "/stable/")), id);
      }
    }
  }
const assetCache = new Map();
let mediaCount = 0;
async function localAsset(path) {
  if (
    !path.startsWith(root + sep) ||
    !/\.(png|jpe?g|gif|svg|webp)$/i.test(path)
  )
    return null;
  if (assetCache.has(path)) return assetCache.get(path);
  if (!(await exists(path))) return null;
  const bytes = await readFile(path);
  const name =
    createHash("sha256").update(bytes).digest("hex").slice(0, 20) +
    extname(path).toLowerCase();
  await writeFile(resolve(out, "assets", name), bytes);
  const result = `__DOC_BASE__documentation/assets/${name}`;
  assetCache.set(path, result);
  mediaCount++;
  return result;
}
const projectContent = JSON.parse(
  await readFile("src/data/content.json", "utf8"),
);
const projectRoutes = new Map(
  projectContent.map((r) => [
    normalize(r.url),
    `${r.type === "post" ? "news" : "content"}/${r.slug}`,
  ]),
);
projectRoutes.set("", "");
for (const [path, route] of [
  ["/docs", "docs"],
  ["/w/documentation", "docs"],
  ["/wiki", "docs/collections/wiki"],
  ["/wikidocs", "docs/collections/wiki"],
  ["/dokuwiki", "docs/collections/legacy"],
  ["/docs/tutorials", "docs/collections/tutorial"],
  ["/docs/docbooks", "docs/collections/reference"],
  ["/docs/db-tables", "docs/collections/database"],
  ["/events", "docs/presentations"],
  ["/docs/modules", "docs/modules"],
  ["/docs/modules/stable", "docs/modules/6.1.x"],
])
  projectRoutes.set(path, route);
for (const index of manifest.moduleIndexes || [])
  projectRoutes.set(normalize(index.url), `docs/modules/${index.version}`);
const catalog = [];
const publishedModuleIDs = new Set(
  (manifest.moduleIndexes || []).flatMap((index) =>
    index.modules.map((module) => `modules/${index.version}/${module.name}`),
  ),
);
const unavailableSources = new Set(
  manifest.failures.map((f) => normalize(f.url)),
);
for (const record of records.values()) {
  if (record.kind === "module" && !publishedModuleIDs.has(record.id))
    record.source =
      record.sourceFileURL || record.sourceArchive || record.source;
  if (unavailableSources.has(normalize(record.source)))
    record.sourceUnavailable = true;
  const $ = cheerio.load(record.html);
  $("a[href]").each((_, node) => {
    const href = $(node).attr("href");
    if (!href || href.startsWith("#") || /^(mailto|tel):/.test(href)) return;
    try {
      const u = new URL(href, record.source);
      if (["kamailio.org", "www.kamailio.org"].includes(u.hostname)) {
        const match = aliases.get(normalize(u.href));
        if (match) {
          $(node).attr("href", `__DOC_BASE__docs/${match}${u.hash}`);
          return;
        }
      }
      if (
        ["kamailio.org", "www.kamailio.org"].includes(u.hostname) &&
        projectRoutes.has(normalize(u.href))
      )
        $(node).attr(
          "href",
          `__DOC_BASE__${projectRoutes.get(normalize(u.href))}${u.hash}`,
        );
      else $(node).attr("href", u.href);
    } catch {
      $(node).removeAttr("href");
    }
  });
  for (const node of $("img[src]").toArray()) {
    const src = $(node).attr("src");
    if (!src) continue;
    let local;
    if (record.localSource && !/^https?:/.test(src))
      local = resolve(dirname(record.localSource), decodeURIComponent(src));
    const mapped = local ? await localAsset(local) : null;
    $(node).attr("src", mapped || new URL(src, record.source).href);
    $(node).attr("loading", "lazy");
  }
  const {
    html,
    toc,
    localSource,
    aliases: recordAliases,
    search,
    ...meta
  } = record;
  const body = { ...meta, html: $("body").html(), toc };
  const file = `pages/${record.id}.json.gz`;
  const target = resolve(out, file);
  if (!target.startsWith(out + sep)) throw new Error("Invalid document ID");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, gzipSync(JSON.stringify(body), { level: 9 }));
  catalog.push({ ...meta, file, search });
}
catalog.sort((a, b) => a.id.localeCompare(b.id));
const presentations = [
  ...new Map(
    manifest.discovered.map((p) => {
      const url = new URL(p.url);
      url.protocol = "https:";
      url.hostname = "www.kamailio.org";
      url.hash = "";
      return [url.href, { ...p, url: url.href }];
    }),
  ).values(),
].map((p) => ({
  ...p,
  title: /\.\.[>]?$/u.test(p.title)
    ? decodeURIComponent(new URL(p.url).pathname.split("/").pop())
    : p.title,
}));
const stats = {
  syncedAt: manifest.syncedAt,
  documents: catalog.length,
  modules: catalog.filter((r) => r.kind === "module").length,
  wiki: catalog.filter((r) => r.kind === "wiki").length,
  presentations: presentations.length,
  media: mediaCount,
  versions: [
    ...new Set(
      catalog.filter((r) => r.kind === "module").map((r) => r.version),
    ),
  ].sort((a, b) =>
    a === "devel"
      ? -1
      : b === "devel"
        ? 1
        : b.localeCompare(a, undefined, { numeric: true }),
  ),
  collections: manifest.sources.map(({ kind, version, archive }) => ({
    kind,
    version,
    archive,
  })),
  publishedModuleIndexes: (manifest.moduleIndexes || []).map((index) => ({
    version: index.version,
    url: index.url,
    modules: index.modules,
  })),
  unavailable: manifest.failures,
  sourceFallbacks: warnings,
};
await writeFile(resolve(out, "catalog.json"), JSON.stringify(catalog));
await writeFile(
  resolve(out, "routes.json"),
  JSON.stringify(catalog.map((r) => r.id)),
);
await writeFile(
  resolve(out, "aliases.json"),
  JSON.stringify(Object.fromEntries(aliases)),
);
await writeFile(
  resolve(out, "presentations.json"),
  JSON.stringify(presentations),
);
await writeFile(resolve(out, "manifest.json"), JSON.stringify(stats, null, 2));
await writeFile(
  resolve(out, "MODULES-LICENSE.txt"),
  "Module documentation is imported from official Kamailio GPL source archives. Individual author and copyright notices are retained in each document.\nhttps://github.com/kamailio/kamailio/blob/master/COPYING\n\n" +
    (await readFile(
      resolve(
        manifest.sources.find(
          (s) => s.kind === "modules" && s.version === "6.1.x",
        ).path,
        "COPYING",
      ),
      "utf8",
    )),
);
console.log(
  JSON.stringify(
    {
      documents: stats.documents,
      modules: stats.modules,
      wiki: stats.wiki,
      presentations: stats.presentations,
      versions: stats.versions.length,
      sourceFallbacks: warnings.length,
      unavailable: manifest.failures.length,
      media: mediaCount,
    },
    null,
    2,
  ),
);
