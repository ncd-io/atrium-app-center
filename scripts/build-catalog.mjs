#!/usr/bin/env node
"use strict";

// Build + sign the App Center catalog.json that gateways browse.
//
//   node app-center/build-catalog.mjs \
//     [--dir apps]                 # root holding <id>/<version>/ folders
//     [--repo ncd-io/atrium-app-center] \
//     [--branch main] \
//     [--kid ncd-pkg-2026a] \      # package-signing key (from keygen-pkg.mjs)
//     [--out catalog.json]
//
// Expected layout under --dir:
//   <id>/<version>/app.json
//   <id>/<version>/README.md          (optional)
//   <id>/<version>/CHANGELOG.md        (optional)
//   <id>/<version>/<id>-<version>.tar.gz   (the built package; also uploaded as
//                                           a GitHub Release asset)
//
// Each version is signed { v:1, kid, id, version, sha256 } and the whole
// catalog is signed { v:1, kid, generated_at, sha256(JSON.stringify(apps)) }.
// The private key lives in ~/.atrium-licensing/<kid>.pem (never committed).
//
// README.md is pre-rendered to sanitized HTML here (escape-first, whitelist
// subset) so NO markdown dependency ships to the gateway.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ── args ────────────────────────────────────────────────────────────────────
const DEFAULT_KID = "ncd-pkg-2026a";
function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
function die(msg) { console.error("error: " + msg); process.exit(1); }

const appsDir = path.resolve(arg("dir", "apps"));
const repo = arg("repo", "ncd-io/atrium-app-center");
const branch = arg("branch", "main");
const kid = arg("kid", DEFAULT_KID);
const outFile = path.resolve(arg("out", "catalog.json"));

if (!fs.existsSync(appsDir)) die(`apps dir not found: ${appsDir}`);

const privPath = path.join(os.homedir(), ".atrium-licensing", `${kid}.pem`);
let privPem;
try { privPem = fs.readFileSync(privPath, "utf8"); }
catch (e) { die(`Cannot read package-signing key ${privPath} — run keygen-pkg.mjs first (or pass --kid).`); }
const privKey = crypto.createPrivateKey(privPem);

// ── signing (matches atrium-api/src/lib/pkgsign.js token format) ─────────────
function sign(payload) {
  const body = { ...payload, kid };
  const part = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = crypto.sign(null, Buffer.from(part), privKey).toString("base64url");
  return `${part}.${sig}`;
}

// ── minimal, dependency-free Markdown → sanitized HTML ───────────────────────
// Safe by construction: raw HTML is escaped FIRST, then a whitelist of markdown
// constructs is applied, so no author-supplied tags survive.
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function safeHref(url) {
  return /^https?:\/\//i.test(url) ? url : "#";
}
function inline(text) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, t, u) => `<a href="${esc(safeHref(u))}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  return s;
}
function md2html(md) {
  if (!md) return "";
  const src = String(md).replace(/\r\n/g, "\n");
  const out = [];
  const lines = src.split("\n");
  let i = 0;
  const isUl = (l) => /^\s*[-*+]\s+/.test(l);
  const isOl = (l) => /^\s*\d+[.)]\s+/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    // fenced code
    if (/^```/.test(line)) {
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(esc(lines[i])); i++; }
      i++; // closing fence
      out.push(`<pre><code>${buf.join("\n")}</code></pre>`);
      continue;
    }
    if (/^(\s*)([-*_])(\s*\2){2,}\s*$/.test(line)) { out.push("<hr>"); i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const lvl = Math.min(h[1].length + 2, 6); out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); i++; continue; }
    if (isUl(line)) {
      const items = [];
      while (i < lines.length && isUl(lines[i])) { items.push(inline(lines[i].replace(/^\s*[-*+]\s+/, ""))); i++; }
      out.push(`<ul>${items.map((it) => `<li>${it}</li>`).join("")}</ul>`);
      continue;
    }
    if (isOl(line)) {
      const items = [];
      while (i < lines.length && isOl(lines[i])) { items.push(inline(lines[i].replace(/^\s*\d+[.)]\s+/, ""))); i++; }
      out.push(`<ol>${items.map((it) => `<li>${it}</li>`).join("")}</ol>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s+/.test(lines[i]) && !isUl(lines[i]) && !isOl(lines[i]) && !/^```/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

// ── semver compare (desc sort) ───────────────────────────────────────────────
function cmp(a, b) {
  const pa = String(a).replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let k = 0; k < 3; k++) { if ((pa[k] || 0) > (pb[k] || 0)) return 1; if ((pa[k] || 0) < (pb[k] || 0)) return -1; }
  return 0;
}
function readIf(p) { try { return fs.readFileSync(p, "utf8"); } catch { return null; } }
function firstParagraph(md) {
  if (!md) return "";
  for (const raw of md.replace(/\r\n/g, "\n").split("\n")) {
    const l = raw.trim();
    if (l && !l.startsWith("#")) return l.replace(/[*_`]/g, "");
  }
  return "";
}

// ── scan apps ────────────────────────────────────────────────────────────────
const releaseBase = `https://github.com/${repo}/releases/download`;
const rawBase = `https://raw.githubusercontent.com/${repo}/${branch}/${path.basename(appsDir)}`;

const apps = [];
for (const id of fs.readdirSync(appsDir).sort()) {
  const idDir = path.join(appsDir, id);
  if (!fs.statSync(idDir).isDirectory()) continue;

  const versions = [];
  let meta = null;
  for (const version of fs.readdirSync(idDir).sort(cmp)) {
    const vDir = path.join(idDir, version);
    if (!fs.statSync(vDir).isDirectory()) continue;

    const manifest = JSON.parse(readIf(path.join(vDir, "app.json")) || "null");
    if (!manifest) die(`${id}/${version}: missing app.json`);
    if (String(manifest.id) !== id) die(`${id}/${version}: app.json id "${manifest.id}" != folder "${id}"`);
    if (String(manifest.version) !== version) die(`${id}/${version}: app.json version "${manifest.version}" != folder "${version}"`);

    const tarball = fs.readdirSync(vDir).find((f) => f.endsWith(".tar.gz"));
    if (!tarball) die(`${id}/${version}: no .tar.gz package present`);
    const tarPath = path.join(vDir, tarball);
    const bytes = fs.readFileSync(tarPath);
    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");

    const readme = readIf(path.join(vDir, "README.md"));
    const changelog = readIf(path.join(vDir, "CHANGELOG.md")) || "";

    versions.push({
      version,
      minPlatformVersion: manifest.minPlatformVersion || null,
      models: Array.isArray(manifest.models) ? manifest.models : [],
      released_at: Math.floor(fs.statSync(tarPath).mtimeMs),
      size: bytes.length,
      sha256,
      tarball_url: `${releaseBase}/${id}-v${version}/${tarball}`,
      readme_url: `${rawBase}/${id}/${version}/README.md`,
      readme_html: md2html(readme),
      changelog: changelog.trim(),
      sig: sign({ v: 1, id, version, sha256 }),
    });

    // Latest version wins for the app-level display metadata.
    if (!meta || cmp(version, meta.version) > 0) {
      meta = {
        version,
        name: manifest.name || id,
        icon: (manifest.ui && manifest.ui.icon) || null,
        subtitle: (manifest.ui && manifest.ui.subtitle) || null,
        description: manifest.description || "",
        license_required: !!(manifest.license && manifest.license.required),
        summary: manifest.description || firstParagraph(readme),
      };
    }
  }
  if (!versions.length) continue;
  versions.sort((a, b) => cmp(b.version, a.version)); // newest first

  apps.push({
    id,
    name: meta.name,
    icon: meta.icon,
    subtitle: meta.subtitle,
    description: meta.description,
    summary: meta.summary,
    license_required: meta.license_required,
    latest: versions[0].version,
    versions,
  });
}

// ── sign the catalog + write ─────────────────────────────────────────────────
const generated_at = Date.now();
const appsHash = crypto.createHash("sha256").update(JSON.stringify(apps)).digest("hex");
const catalog = {
  schema: 1,
  generated_at,
  sig: sign({ v: 1, generated_at, sha256: appsHash }),
  apps,
};

fs.writeFileSync(outFile, JSON.stringify(catalog, null, 2) + "\n");
console.log(`\nWrote ${outFile}`);
console.log(`  apps:     ${apps.length}`);
console.log(`  versions: ${apps.reduce((n, a) => n + a.versions.length, 0)}`);
console.log(`  signed:   kid=${kid}\n`);
console.log("Next: commit catalog.json and upload each <id>-<version>.tar.gz as a");
console.log(`Release asset under tag <id>-v<version> in ${repo}.\n`);
