import { mkdir, writeFile } from "node:fs/promises";
const base = "https://www.kamailio.org/w/wp-json/wp/v2";
async function load(type) {
  const first = await fetch(`${base}/${type}?per_page=100&page=1`);
  if (!first.ok) throw new Error(`${type}: ${first.status}`);
  let items = await first.json();
  const pages = Number(first.headers.get("x-wp-totalpages") || 1);
  for (let i = 2; i <= pages; i++) {
    const response = await fetch(`${base}/${type}?per_page=100&page=${i}`);
    if (!response.ok) throw new Error(`${type} page ${i}: ${response.status}`);
    items.push(...(await response.json()));
  }
  return items.map((x) => ({
    id: x.id,
    slug: x.slug,
    title: x.title.rendered,
    date: x.date,
    url: x.link,
    html: x.content.rendered,
    excerpt: x.excerpt?.rendered || "",
    type: type === "pages" ? "page" : "post",
  }));
}
const [pages, posts] = await Promise.all([load("pages"), load("posts")]);
await mkdir("public/content", { recursive: true });
await mkdir("src/data", { recursive: true });
const index = [...pages, ...posts].map(({ html, ...x }) => x);
await Promise.all(
  [...pages, ...posts].map((x) =>
    writeFile(`public/content/${x.id}.json`, JSON.stringify(x)),
  ),
);
await writeFile("src/data/content.json", JSON.stringify(index));
await writeFile(
  "src/data/sync.json",
  JSON.stringify(
    {
      source: "https://www.kamailio.org/w/",
      syncedAt: new Date().toISOString(),
      pages: pages.length,
      posts: posts.length,
    },
    null,
    2,
  ),
);
console.log(`Synced ${pages.length} pages and ${posts.length} articles.`);
