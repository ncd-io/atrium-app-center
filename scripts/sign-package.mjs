#!/usr/bin/env node
"use strict";

// Sign a single app package tarball's metadata (ad-hoc / testing helper — the
// normal path is build-catalog.mjs, which signs every version + the catalog).
//
//   node app-center/sign-package.mjs \
//     --app machine-health --version 1.1.0 \
//     --file dist/machine-health-1.1.0.tar.gz \
//     [--kid ncd-pkg-2026a]
//
// Prints the sha256 and the signature token to embed as the version's `sig` in
// catalog.json. Uses the package-signing key at ~/.atrium-licensing/<kid>.pem.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_KID = "ncd-pkg-2026a";
function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
function die(msg) { console.error("error: " + msg); process.exit(1); }

const app = arg("app");
const version = arg("version");
const file = arg("file");
const kid = arg("kid", DEFAULT_KID);
if (!app) die("--app is required");
if (!version) die("--version is required");
if (!file) die("--file is required (path to the .tar.gz)");

const privPath = path.join(os.homedir(), ".atrium-licensing", `${kid}.pem`);
let privPem;
try { privPem = fs.readFileSync(privPath, "utf8"); }
catch (e) { die(`Cannot read package-signing key ${privPath} — run keygen-pkg.mjs first (or pass --kid).`); }

let bytes;
try { bytes = fs.readFileSync(file); } catch (e) { die(`Cannot read ${file}`); }
const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");

const body = { v: 1, kid, id: app, version, sha256 };
const part = Buffer.from(JSON.stringify(body)).toString("base64url");
const sig = crypto.sign(null, Buffer.from(part), crypto.createPrivateKey(privPem)).toString("base64url");
const token = `${part}.${sig}`;

console.log(`\napp:     ${app}`);
console.log(`version: ${version}`);
console.log(`sha256:  ${sha256}`);
console.log(`kid:     ${kid}`);
console.log(`\nsig (paste into the version entry in catalog.json):\n${token}\n`);
