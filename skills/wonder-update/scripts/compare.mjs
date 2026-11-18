#!/usr/bin/env node
/**
 * Finds a merchant's changes to a Wonder theme and moves them to a new version.
 *
 *   node compare.mjs <current-theme> [version]
 *       Which files differ from the original release, and for code files which
 *       lines are the merchant's own (line numbers in their file).
 *
 *   node compare.mjs <current-theme> --merge <new-theme> [--version X]
 *       Applies those changes to <new-theme> (a pulled copy of the newer Wonder):
 *       copies the merchant's own files, copies over files Wonder didn't change,
 *       and three-way merges the rest. Conflicts get <<<<<<< markers.
 *
 * Privacy: the original theme code is never downloaded and your files are never
 * uploaded. The script downloads fingerprints (short hashes) of the original
 * release from https://mcp.wonder-theme.com and does all comparing locally.
 * Needs Node 18+ (Shopify CLI already requires it).
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const SERVER = "https://mcp.wonder-theme.com";
const THEME_DIRS = ["assets", "blocks", "config", "layout", "locales", "sections", "snippets", "templates"];
const TEXT = /\.(liquid|css|js|mjs|json|svg|txt|md)$/i;
const LINE_DIFFABLE = /\.(liquid|css|js|mjs|svg)$/i;

// ---------------------------------------------------------------------------
// Fingerprints. MUST stay identical to src/lib/file-hash.ts in the Wonder MCP server.

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
const sha = (data, n) => createHash("sha256").update(data).digest("hex").slice(0, n);
function fingerprint(path, buf) {
  return sha(TEXT.test(path) ? normaliseText(path, buf.toString("utf8")) : buf, 16);
}
/**
 * Lines of a code file as written (kept for output) and their 8-hex fingerprints
 * (same normalisation as fingerprint(): no CR, no trailing whitespace, no blank
 * lines at the end of the file).
 */
function linesOf(path, buf) {
  const text = buf.toString("utf8");
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const trimmed = lines.map((l) => l.replace(/[ \t]+$/, ""));
  let n = trimmed.length;
  while (n > 1 && trimmed[n - 1] === "") n--;
  return { lines: lines.slice(0, n), hashes: trimmed.slice(0, n).map((l) => sha(l, 8)), eol: text.includes("\r\n") ? "\r\n" : "\n" };
}

// ---------------------------------------------------------------------------
// Diff (Myers) on fingerprint arrays: returns matched index pairs [i, j].

function matches(a, b) {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let s = 0;
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  const A = a.slice(p, a.length - s);
  const B = b.slice(p, b.length - s);
  const N = A.length;
  const M = B.length;
  const out = [];
  for (let i = 0; i < p; i++) out.push([i, i]);

  if (N && M) {
    const max = N + M;
    const off = max + 1;
    const v = new Int32Array(2 * max + 3);
    const trace = [];
    search: for (let d = 0; d <= max; d++) {
      for (let k = -d; k <= d; k += 2) {
        let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
        let y = x - k;
        while (x < N && y < M && A[x] === B[y]) {
          x++;
          y++;
        }
        v[off + k] = x;
        if (x >= N && y >= M) {
          trace.push(v.slice(off - d, off + d + 1));
          break search;
        }
      }
      trace.push(v.slice(off - d, off + d + 1));
    }
    const mid = [];
    let x = N;
    let y = M;
    for (let d = trace.length - 1; d > 0; d--) {
      const prev = trace[d - 1];
      const at = (k) => prev[k + d - 1];
      const k = x - y;
      const pk = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
      const px = at(pk);
      const py = px - pk;
      while (x > px && y > py) mid.push([--x, --y]);
      x = px;
      y = py;
    }
    while (x > 0 && y > 0) mid.push([--x, --y]);
    for (const [i, j] of mid.reverse()) out.push([i + p, j + p]);
  }

  for (let t = s; t > 0; t--) out.push([a.length - t, b.length - t]);
  return out;
}

/** The merchant's changes: ranges of their own lines, and original lines they removed (count only). */
function changes(baseHashes, ours) {
  const pairs = matches(baseHashes, ours.hashes);
  pairs.push([baseHashes.length, ours.hashes.length]);
  const hunks = [];
  let i = 0;
  let j = 0;
  for (const [bi, oj] of pairs) {
    if (bi > i || oj > j) {
      hunks.push({
        yourLines: oj > j ? `${j + 1}-${oj}` : null,
        afterYourLine: j, // 0 = start of file
        added: oj - j,
        removedOriginal: bi - i,
        preview: ours.lines.slice(j, Math.min(oj, j + 12)),
      });
    }
    i = bi + 1;
    j = oj + 1;
  }
  return hunks;
}

/** Three-way merge. The original is known only by fingerprints; output uses only ours/theirs lines. */
function merge3(baseHashes, ours, theirs, labels) {
  const mA = new Int32Array(baseHashes.length).fill(-1);
  const mC = new Int32Array(baseHashes.length).fill(-1);
  for (const [i, j] of matches(baseHashes, ours.hashes)) mA[i] = j;
  for (const [i, j] of matches(baseHashes, theirs.hashes)) mC[i] = j;
  const eq = (x, xs, xe, y, ys, ye) => xe - xs === ye - ys && x.slice(xs, xe).every((h, n) => h === y[ys + n]);

  const out = [];
  let conflicts = 0;
  let i = 0;
  let a = 0;
  let c = 0;
  for (;;) {
    let j = i;
    while (j < baseHashes.length && !(mA[j] >= a && mC[j] >= c)) j++;
    const done = j >= baseHashes.length;
    const aEnd = done ? ours.hashes.length : mA[j];
    const cEnd = done ? theirs.hashes.length : mC[j];
    const oursChanged = !eq(ours.hashes, a, aEnd, baseHashes, i, j);
    const theirsChanged = !eq(theirs.hashes, c, cEnd, baseHashes, i, j);
    if (!oursChanged) out.push(...theirs.lines.slice(c, cEnd));
    else if (!theirsChanged || eq(ours.hashes, a, aEnd, theirs.hashes, c, cEnd)) out.push(...ours.lines.slice(a, aEnd));
    else {
      conflicts++;
      out.push(`<<<<<<< ${labels.ours}`, ...ours.lines.slice(a, aEnd), "=======", ...theirs.lines.slice(c, cEnd), `>>>>>>> ${labels.theirs}`);
    }
    if (done) break;
    out.push(theirs.lines[cEnd]); // stable line, same in all three
    i = j + 1;
    a = aEnd + 1;
    c = cEnd + 1;
  }
  const eol = theirs.eol ?? "\n";
  return { text: out.join(eol) + eol, conflicts };
}

// ---------------------------------------------------------------------------
// Theme folders

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
async function themeFiles(dir) {
  const out = [];
  for (const d of THEME_DIRS) out.push(...(await walk(join(dir, d), dir).catch(() => [])));
  return out.filter((p) => !p.endsWith(".map") && !managedByShopify(p)).sort();
}
async function versionOf(dir) {
  // Not JSON.parse: Shopify accepts trailing commas in this file.
  const schema = await readFile(join(dir, "config/settings_schema.json"), "utf8").catch(() => "");
  return schema.match(/"theme_version"\s*:\s*"v?([\d.]+)"/)?.[1];
}
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}
const originalLines = async (version, path) =>
  (await getJson(`${SERVER}/lines/${version}/${path.split("/").map(encodeURIComponent).join("/")}`)).lines;

// ---------------------------------------------------------------------------
// main (skipped when imported, e.g. by tests)

export { changes, fingerprint, linesOf, matches, merge3 };

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();

async function main() {
  const args = process.argv.slice(2);
  const fail = (msg) => {
    console.error(msg);
    process.exit(1);
  };
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args.splice(i, 2)[1] : undefined;
  };
  const mergeInto = opt("--merge");
  let version = opt("--version");
  const [current, positionalVersion] = args;
  if (!current) fail("Usage: node compare.mjs <current-theme> [version]\n       node compare.mjs <current-theme> --merge <new-theme>");
  version = (version ?? positionalVersion ?? (await versionOf(current)))?.replace(/^v/, "");
  if (!version) fail("Couldn't read the Wonder version from config/settings_schema.json. Pass it as the second argument.");

  let original;
  try {
    original = (await getJson(`${SERVER}/manifests/${version}.json`)).files;
  } catch (e) {
    fail(`No file list for Wonder ${version} (${e.message}). Check the version.`);
  }

  const files = await themeFiles(current);
  const modified = [];
  const added = [];
  let unchanged = 0;
  const buffers = new Map();
  for (const p of files) {
    if (!(p in original)) {
      added.push(p);
      continue;
    }
    const buf = await readFile(join(current, p));
    if (fingerprint(p, buf) === original[p]) unchanged++;
    else {
      modified.push(p);
      buffers.set(p, buf);
    }
  }
  const present = new Set(files);
  const deleted = Object.keys(original).filter((p) => !managedByShopify(p) && !present.has(p));
  const known = files.length - added.length;
  const warning =
    known && modified.length / known > 0.4
      ? `${modified.length} of ${known} Wonder files differ. The folder may not be Wonder ${version}, or it was reformatted (e.g. by Prettier). Check the version before going on.`
      : undefined;

  if (!mergeInto) {
    // Detect mode: which files, and for code files which lines.
    const details = {};
    for (const p of modified.filter((p) => LINE_DIFFABLE.test(p))) {
      try {
        details[p] = changes(await originalLines(version, p), linesOf(p, buffers.get(p)));
      } catch (e) {
        details[p] = { error: e.message };
      }
    }
    console.log(JSON.stringify({ version, compared: files.length, unchanged, modified, added, deleted, ...(warning ? { warning } : {}), changes: details }, null, 2));
    return;
  }

  // Merge mode
  if (warning) fail(warning);
  const toVersion = await versionOf(mergeInto);
  if (!toVersion) fail(`${mergeInto} doesn't look like a Wonder theme (no config/settings_schema.json).`);
  const labels = { ours: `your change (Wonder ${version}, customised)`, theirs: `Wonder ${toVersion}` };
  const report = { from: version, to: toVersion, copiedOwn: [], copiedOver: [], merged: [], conflicts: [], manual: [], nameClash: [], removedUpstream: [], deleted };

  const copy = async (p) => {
    await mkdir(dirname(join(mergeInto, p)), { recursive: true });
    await copyFile(join(current, p), join(mergeInto, p));
  };
  for (const p of added) {
    const exists = await readFile(join(mergeInto, p)).then(() => true, () => false);
    if (exists) report.nameClash.push(p);
    else {
      await copy(p);
      report.copiedOwn.push(p);
    }
  }
  for (const p of modified) {
    const theirsBuf = await readFile(join(mergeInto, p)).catch(() => null);
    if (!theirsBuf) {
      report.removedUpstream.push(p);
    } else if (fingerprint(p, theirsBuf) === original[p]) {
      await copy(p); // Wonder didn't change it: the merchant's version is the merge
      report.copiedOver.push(p);
    } else if (!LINE_DIFFABLE.test(p)) {
      report.manual.push({ path: p, reason: p.startsWith("locales/") ? "translations: re-apply your own texts" : "not a code file: merge by hand" });
    } else {
      try {
        const m = merge3(await originalLines(version, p), linesOf(p, buffers.get(p)), linesOf(p, theirsBuf), labels);
        await writeFile(join(mergeInto, p), m.text);
        if (m.conflicts) report.conflicts.push({ path: p, conflicts: m.conflicts });
        else report.merged.push(p);
      } catch (e) {
        report.manual.push({ path: p, reason: e.message });
      }
    }
  }
  console.log(JSON.stringify(report, null, 2));
}
