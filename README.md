# Atrium App Center

The public catalog the Atrium gateway's **Apps** page browses to install and
update apps over the network. This repo holds:

- `catalog.json` — the signed catalog index gateways fetch from the raw CDN.
- `apps/<id>/<version>/` — the source of truth each catalog entry is built from
  (`app.json`, `README.md`, `CHANGELOG.md`, and the built `.tar.gz`).
- `scripts/` — the NCD publishing tooling.

The gateway side lives in the platform repo
(`atrium-api/src/routes/app-center.js` and `atrium-api/src/lib/pkgsign.js`).

## How distribution works

1. Apps are built into `.tar.gz` packages (`atrium-apps/scripts/package-app.sh`).
2. Each package is signed and indexed into a single static, signed
   `catalog.json`, served from `raw.githubusercontent.com` — no GitHub API rate
   limits.
3. Tarballs are attached as **GitHub Release assets** (tag `<id>-v<version>`).
4. Gateways fetch `catalog.json`, verify its signature, download the tarball
   gateway-side, verify `sha256` + Ed25519 signature, then install through the
   existing pipeline.

The catalog is **public**: all apps (free + paid) are listed and downloadable.
Licensing still gates *execution* of paid apps — a downloaded paid app installs
but stays locked until a signed license bound to the gateway is entered.

## One-time: generate the package-signing key

```bash
node scripts/keygen-pkg.mjs --kid ncd-pkg-2026a
```

Writes the private key to `~/.atrium-licensing/ncd-pkg-2026a.pem` (never
committed) and prints the public-key snippet to paste into `PUBLIC_KEYS` in
`atrium-api/src/lib/pkgsign.js`. This key is **separate** from the license key so
they rotate independently. Keep an offline backup.

## Publish / update the catalog

1. Stage the app under `apps/<id>/<version>/` with `app.json`, `README.md`,
   `CHANGELOG.md`, and the built `<id>-<version>.tar.gz`.
2. Build + sign the catalog:

```bash
node scripts/build-catalog.mjs --dir apps --repo ncd-io/atrium-app-center --branch main --kid ncd-pkg-2026a
```

3. Commit `catalog.json` + the staged app, push to `main`.
4. Create a Release tagged `<id>-v<version>` and upload the `.tar.gz` as an
   asset (see `scripts/publish-releases.sh`).

### Sign one package ad-hoc

```bash
node scripts/sign-package.mjs --app <id> --version <version> --file dist/<id>-<version>.tar.gz
```

## catalog.json shape

- Top-level `sig` signs `{ v:1, kid, generated_at, sha256 }` where `sha256` is
  over `JSON.stringify(catalog.apps)` — guards against a swapped/rolled-back
  index.
- Each version `sig` signs `{ v:1, kid, id, version, sha256 }` binding that exact
  tarball hash — a tampered or substituted tarball fails verification.
- `readme_html` is pre-rendered + sanitized at build time (escape-first,
  whitelist subset) so no markdown dependency ships to the gateway.
