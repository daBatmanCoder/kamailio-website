import { readFile, access } from "node:fs/promises";
import assert from "node:assert/strict";
const content = JSON.parse(await readFile("src/data/content.json", "utf8"));
const sync = JSON.parse(await readFile("src/data/sync.json", "utf8"));
assert.equal(
  content.length,
  sync.pages + sync.posts,
  "Content index must match imported totals",
);
assert.equal(
  new Set(content.map((p) => p.id)).size,
  content.length,
  "Duplicate content ID",
);
assert.equal(
  new Set(content.map((p) => p.type + "/" + p.slug)).size,
  content.length,
  "Duplicate content route",
);
for (const entry of content) {
  const file = `public/content/${entry.id}.json`;
  await access(file);
  const body = JSON.parse(await readFile(file, "utf8"));
  assert.equal(body.id, entry.id, file);
  assert.equal(typeof body.html, "string", file);
  assert.equal(
    new URL(entry.url).hostname,
    "www.kamailio.org",
    "Unexpected content source",
  );
}
console.log(
  `Verified ${sync.pages} pages, ${sync.posts} posts, unique routes, source URLs, and all lazy-loaded content files.`,
);
