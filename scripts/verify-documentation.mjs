import { readFile, access } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import assert from "node:assert/strict";
const root = "public/documentation/";
const catalog = JSON.parse(await readFile(root + "catalog.json", "utf8"));
const manifest = JSON.parse(await readFile(root + "manifest.json", "utf8"));
assert.equal(catalog.length, manifest.documents, "Import count mismatch");
assert.equal(
  new Set(catalog.map((r) => r.id)).size,
  catalog.length,
  "Duplicate document routes",
);
const ids = new Set(catalog.map((r) => r.id));
for (const route of [
  "modules",
  "presentations",
  ...manifest.versions.map((v) => "modules/" + v),
  ...["wiki", "tutorial", "reference", "database", "legacy", "events"].map(
    (k) => "collections/" + k,
  ),
])
  ids.add(route);
for (const id of [
  "modules/6.1.x/dispatcher",
  "modules/6.1.x/auth_db",
  "modules/6.1.x/rtpengine",
  "wiki/cookbooks/6.1.x/core",
  "wiki/packages/debs",
  "tutorials/6.1.x/kamailio-install-guide-git",
])
  assert.ok(ids.has(id), "Missing essential document " + id);
let words = 0;
for (const record of catalog) {
  assert.ok(!record.file.includes(".."), "Unsafe payload path");
  const path = root + record.file;
  await access(path);
  const body = JSON.parse(gunzipSync(await readFile(path)).toString("utf8"));
  assert.equal(body.id, record.id, "Mismatched payload " + record.id);
  assert.equal(typeof body.html, "string", "Missing HTML " + record.id);
  assert.ok(
    !/This topic does not exist yet/i.test(record.title),
    "Missing topic imported " + record.id,
  );
  assert.ok(
    !JSON.stringify(body).includes("/Users/jonathankandel/"),
    "Local source path exposed " + record.id,
  );
  for (const match of body.html.matchAll(/__DOC_BASE__docs\/([^"#?<>]+)/g))
    assert.ok(ids.has(match[1]), "Missing internal document " + match[1]);
  assert.ok(Array.isArray(body.toc), "Missing outline " + record.id);
  assert.equal(
    new Set(body.toc.map((h) => h.id)).size,
    body.toc.length,
    "Duplicate outline IDs " + record.id,
  );
  words += record.words;
}
let published = 0,
  unavailable = 0;
for (const index of manifest.publishedModuleIndexes || [])
  for (const module of index.modules) {
    published++;
    if (!ids.has(`modules/${index.version}/${module.name}`)) {
      assert.ok(
        manifest.unavailable.some((f) => f.url === module.source),
        "Unaccounted published manual " + module.source,
      );
      unavailable++;
    }
  }
console.log(
  `Verified ${catalog.length.toLocaleString()} local documents, ${manifest.versions.length} release branches, ${words.toLocaleString()} words, payload integrity, unique routes/outlines, and ${published.toLocaleString()} published module-index entries (${unavailable} unavailable upstream URLs accounted for).`,
);
