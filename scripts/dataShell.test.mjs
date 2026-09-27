// After the build: the prerendered pages carry a small seed that points at versioned data files rather than
// embedding the data, and every file it names exists and parses.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist", "congress");
const seedOf = (html) => JSON.parse(html.match(/<script id="page-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const refs = (v, out = []) => {
  if (Array.isArray(v)) v.forEach((x) => refs(x, out));
  else if (v && typeof v === "object") (typeof v.$file === "string" ? out.push(v.$file) : Object.values(v).forEach((x) => refs(x, out)));
  return out;
};
const pages = ["index.html", "trades/index.html", "tickers/index.html", "filers/index.html", "filer/oge_donald_trump/index.html", "ticker/MSFT/index.html"];
for (const page of pages) {
  const html = fs.readFileSync(path.join(DIST, page), "utf8");
  const seedText = html.match(/<script id="page-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  // The rendered markup can be large (a filer with thousands of trades); the seed must not carry the data again.
  assert.ok(seedText.length < 100_000, `${page} seed is ${Math.round(seedText.length / 1024)} KB; its data should be in files`);
  const files = refs(seedOf(html));
  assert.ok(files.length > 0, `${page} seed names its data files`);
  for (const url of files) {
    assert.match(url, /^\/congress\/data\/.+\.json\?v=[0-9a-f]{12}$/, `${page}: versioned data URL ${url}`);
    const rel = decodeURIComponent(url.replace(/^\/congress\//, "").replace(/\?v=.*$/, ""));
    JSON.parse(fs.readFileSync(path.join(DIST, rel), "utf8"));
  }
}
console.log(`data shell: ${pages.length} pages point at versioned data files`);

// Every ticker page is discoverable from the sitemap, now that the tickers page no longer lists them all in a block
// of links under its table.
const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
const allTickers = JSON.parse(fs.readFileSync(path.join(DIST, "data", "tickers.json"), "utf8"));
const missing = allTickers.filter((t) => !sitemap.includes(`/congress/ticker/${t.ticker}<`) && !sitemap.includes(`/congress/ticker/${t.ticker}/<`));
assert.equal(missing.length, 0, `sitemap lists every ticker page (missing: ${missing.slice(0, 5).map((t) => t.ticker).join(", ")})`);
console.log(`sitemap: all ${allTickers.length} ticker pages listed`);
