#!/usr/bin/env node
/**
 * Lists which files of a pulled Wonder theme differ from the original release.
 *
 *   node compare.mjs <theme-folder> [wonder-version]
 *
 * Reads the theme folder locally, downloads the release's file fingerprints from
 * https://mcp.wonder-theme.com/manifests/<version>.json and prints JSON:
 *   { version, compared, unchanged, modified[], added[], deleted[], warning? }
 *
 * Sends nothing: the only network request is that download. File contents never
 * leave this machine. Needs Node 18+ (Shopify CLI already requires it).
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const MANIFESTS = "https://mcp.wonder-theme.com/manifests";
const THEME_DIRS = ["assets", "blocks", "config", "layout", "locales", "sections", "snippets", "templates"];
const TEXT = /\.(liquid|css|js|mjs|json|svg|txt|md)$/i;

// Must stay identical to src/lib/file-hash.ts in the Wonder MCP server.
function normaliseText(path, text) {
  if (/\.json$/i.test(path)) {
    try {
      return JSON.stringify(sortKeys(JSON.parse(text.replace(/^\s*\/\*[\s\S]*?\*\//, ""))));
    } catch {
      // not strict JSON: use the text rules
    }
  }
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}
function fingerprint(path, buf) {
  const data = TEXT.test(path) ? normaliseText(path, buf.toString("utf8")) : buf;
  return createHash("sha256").update(data).digest("hex").slice(0, 16);
}

// Settings and content: Shopify carries these over on update, they're not customisations.
const managedByShopify = (p) =>
  p === "config/settings_data.json" ||
  (p.startsWith("templates/") && p.endsWith(".json")) ||
  (p.startsWith("sections/") && p.endsWith(".json"));

async function walk(dir, base) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p, base)));
    else out.push(relative(base, p).split(sep).join("/"));
  }
  return out;
}

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const dir = process.argv[2];
if (!dir) fail("Usage: node compare.mjs <theme-folder> [wonder-version]");

let version = process.argv[3]?.replace(/^v/, "");
if (!version) {
  try {
    // Not JSON.parse: Shopify accepts trailing commas in this file.
    const schema = await readFile(join(dir, "config/settings_schema.json"), "utf8");
    version = schema.match(/"theme_version"\s*:\s*"v?([\d.]+)"/)?.[1];
  } catch {
    // handled below
  }
  if (!version) fail("Couldn't read the Wonder version from config/settings_schema.json. Pass it: node compare.mjs <folder> 2.5.1");
}

const res = await fetch(`${MANIFESTS}/${version}.json`);
if (!res.ok) fail(`No file list for Wonder ${version} (HTTP ${res.status}). Check the version.`);
const { files: original } = await res.json();

const local = [];
for (const d of THEME_DIRS) {
  try {
    local.push(...(await walk(join(dir, d), dir)));
  } catch {
    // directory missing in this theme
  }
}
const files = local.filter((p) => !p.endsWith(".map") && !managedByShopify(p)).sort();

const modified = [];
const added = [];
let unchanged = 0;
for (const p of files) {
  if (!(p in original)) added.push(p);
  else if (fingerprint(p, await readFile(join(dir, p))) === original[p]) unchanged++;
  else modified.push(p);
}
const present = new Set(files);
const deleted = Object.keys(original).filter((p) => !managedByShopify(p) && !present.has(p));

const result = { version, compared: files.length, unchanged, modified, added, deleted };
const known = files.length - added.length;
if (known && modified.length / known > 0.4) {
  result.warning = `${modified.length} of ${known} Wonder files differ. The folder may not be Wonder ${version}, or it was reformatted (e.g. by Prettier). Check the version before planning.`;
}
console.log(JSON.stringify(result, null, 2));
