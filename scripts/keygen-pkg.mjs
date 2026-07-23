#!/usr/bin/env node
"use strict";

// One-time: generate an NCD PACKAGE-signing keypair (Ed25519) for the App
// Center. This is SEPARATE from the license-signing key (licensing/keygen.mjs)
// so package + license keys rotate independently.
//
//   node app-center/keygen-pkg.mjs [--kid ncd-pkg-2026a]
//
// Writes the PRIVATE key to ~/.atrium-licensing/<kid>.pem (mode 0600, OUTSIDE
// any git repo) and prints the PUBLIC key + the exact snippet to paste into the
// platform's package-signing PUBLIC_KEYS map (atrium-api/src/lib/pkgsign.js).
//
// KEY CUSTODY: whoever holds this private key can sign app packages + catalogs
// that every gateway will trust and install. Keep an offline backup. A leak
// means an attacker could publish a package the fleet would run — treat it with
// the same care as the license key.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

const kid = arg("kid", `ncd-pkg-${new Date().getFullYear()}a`);
if (!/^[a-z0-9-]+$/.test(kid)) {
  console.error(`Invalid --kid "${kid}" (use lowercase letters, digits, hyphens).`);
  process.exit(1);
}

const dir = path.join(os.homedir(), ".atrium-licensing");
const privPath = path.join(dir, `${kid}.pem`);
if (fs.existsSync(privPath)) {
  console.error(`Refusing to overwrite existing key: ${privPath}`);
  console.error("Pick a different --kid or move the old key aside first.");
  process.exit(1);
}

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const privPem = privateKey.export({ type: "pkcs8", format: "pem" });
const pubPem = publicKey.export({ type: "spki", format: "pem" });

fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
fs.writeFileSync(privPath, privPem, { mode: 0o600 });

console.log(`\nGenerated package-signing key "${kid}".`);
console.log(`Private key (KEEP SECRET, back up offline): ${privPath}\n`);
console.log("Paste this entry into PUBLIC_KEYS in atrium-api/src/lib/pkgsign.js:\n");
const oneLine = pubPem.replace(/\n/g, "\\n");
console.log(`  "${kid}": "${oneLine}",\n`);
console.log("Then set DEFAULT_KID in app-center/build-catalog.mjs to this kid (or pass --kid).\n");
