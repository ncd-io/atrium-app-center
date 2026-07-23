#!/bin/bash
# Create a GitHub Release (tag <id>-v<version>) for every staged app package and
# upload its .tar.gz as a Release asset. Idempotent: skips a release/asset that
# already exists.
#
#   ./scripts/publish-releases.sh [--repo ncd-io/atrium-app-center] [--dir apps]
#
# Auth: reads the GitHub token from the local git credential helper
# (`git credential fill`), so no PAT needs to be exported. The account must have
# push/contents:write access to the repo. Requires curl + a pushed `main`.
set -euo pipefail

REPO="ncd-io/atrium-app-center"
DIR="apps"
while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --dir)  DIR="$2";  shift 2 ;;
    *) echo "unknown arg: $1"; exit 1 ;;
  esac
done

TOKEN="$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill | sed -n 's/^password=//p')"
[ -n "$TOKEN" ] || { echo "error: no GitHub token from git credential helper"; exit 1; }

API="https://api.github.com/repos/$REPO"
UPLOADS="https://uploads.github.com/repos/$REPO"
auth=(-H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json")

release_id() {  # tag -> release id ("" if none). 404 for a missing tag is fine.
  { curl -sS "${auth[@]}" "$API/releases/tags/$1" 2>/dev/null \
    | sed -n 's/.*"id": *\([0-9]\{1,\}\).*/\1/p' | head -1; } || true
}

# Pass 1 — ensure a release exists for every staged package.
echo "== pass 1: releases"
for tar in "$DIR"/*/*/*.tar.gz; do
  version="$(basename "$(dirname "$tar")")"
  id="$(basename "$(dirname "$(dirname "$tar")")")"
  tag="$id-v$version"
  rid="$(release_id "$tag")"
  if [ -n "$rid" ]; then
    echo "   $tag exists (id=$rid)"
  else
    curl -fsS "${auth[@]}" -X POST "$API/releases" \
      -d "{\"tag_name\":\"$tag\",\"target_commitish\":\"main\",\"name\":\"$id $version\",\"body\":\"Atrium App Center package for $id v$version.\"}" >/dev/null
    echo "   $tag created"
  fi
done

# A just-created release briefly rejects asset uploads (400) while GitHub settles
# it, so give the new releases a head start before pass 2 (which also retries).
sleep 30

# Pass 2 — upload the asset to each (now-settled) release.
echo "== pass 2: assets"
for tar in "$DIR"/*/*/*.tar.gz; do
  file="$(basename "$tar")"
  version="$(basename "$(dirname "$tar")")"
  id="$(basename "$(dirname "$(dirname "$tar")")")"
  tag="$id-v$version"
  rid="$(release_id "$tag")"
  [ -n "$rid" ] || { echo "   ERROR: no release for $tag"; exit 1; }

  if curl -fsS "${auth[@]}" "$API/releases/$rid/assets" | grep -q "\"name\": \"$file\""; then
    echo "   $file already uploaded"
    continue
  fi
  ok=""
  for attempt in 1 2 3 4 5 6 7 8; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' "${auth[@]}" \
      -H "Content-Type: application/gzip" --data-binary @"$tar" \
      "$UPLOADS/$rid/assets?name=$file")"
    if [ "$code" = "201" ]; then ok=1; break; fi
    echo "   $file attempt $attempt got HTTP $code, retrying..."; sleep 5
  done
  [ -n "$ok" ] || { echo "   ERROR: asset upload failed for $file"; exit 1; }
  echo "   uploaded $file"
done

echo "done."
