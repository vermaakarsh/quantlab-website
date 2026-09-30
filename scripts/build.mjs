// Build: assemble src/pages with src/partials into dist/, rewrite links between the two pages,
// and copy assets and static files. Node 18+, no dependencies.  Usage: npm run build
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "src"), out = join(root, "dist");
const PAGES = ["index.html", "features.html"];
const partial = name => readFileSync(join(src, "partials", `${name}.html`), "utf8");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const built = {};
for (const file of PAGES) {
  let html = readFileSync(join(src, "pages", file), "utf8");
  const tag = html.match(/<!-- @page (\{.*?\}) -->\n?/s);
  if (!tag) throw new Error(`${file}: missing <!-- @page {...} --> header`);
  const meta = JSON.parse(tag[1]);
  html = html.replace(tag[0], "");
  html = html.replace(/<!-- @include ([a-z-]+) -->/g, (_, name) => partial(name));
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in meta)) throw new Error(`${file}: no value for {{${key}}}`);
    return meta[key].replace(/"/g, "&quot;");
  });
  built[file] = html;
}

// In-page links (#id) that point at a section on the other page become cross-page links.
const ids = Object.fromEntries(PAGES.map(p => [p, new Set([...built[p].matchAll(/\bid="([^"]+)"/g)].map(m => m[1]))]));
for (const file of PAGES) {
  const other = PAGES.find(p => p !== file);
  built[file] = built[file].replace(/href="#([\w-]+)"/g, (match, id) => {
    if (ids[file].has(id)) return match;
    if (id === "features" && file !== "features.html") return 'href="features.html"';
    if (ids[other].has(id)) return `href="${other}#${id}"`;
    throw new Error(`${file}: link to #${id} has no target on either page`);
  });
  writeFileSync(join(out, file), built[file]);
}

cpSync(join(src, "assets"), join(out, "assets"), { recursive: true });
for (const f of readdirSync(join(src, "static"))) cpSync(join(src, "static", f), join(out, f));
console.log(`Built ${PAGES.join(" and ")} into dist/`);
