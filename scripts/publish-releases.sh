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

for tar in "$DIR"/*/*/*.tar.gz; do
  file="$(basename "$tar")"
  # derive id/version from apps/<id>/<version>/<file>
  version="$(basename "$(dirname "$tar")")"
  id="$(basename "$(dirname "$(dirname "$tar")")")"
  tag="$id-v$version"

  echo "== $tag ($file)"
  rel="$(curl -fsS "${auth[@]}" "$API/releases/tags/$tag" 2>/dev/null || true)"
  rid="$(printf '%s' "$rel" | sed -n 's/.*"id": *\([0-9]\{1,\}\).*/\1/p' | head -1)"
  if [ -z "$rid" ]; then
    rel="$(curl -fsS "${auth[@]}" -X POST "$API/releases" \
      -d "{\"tag_name\":\"$tag\",\"target_commitish\":\"main\",\"name\":\"$id $version\",\"body\":\"Atrium App Center package for $id v$version.\"}")"
    rid="$(printf '%s' "$rel" | sed -n 's/.*"id": *\([0-9]\{1,\}\).*/\1/p' | head -1)"
    echo "   created release id=$rid"
  else
    echo "   release exists id=$rid"
  fi
  [ -n "$rid" ] || { echo "   ERROR: could not resolve release id"; exit 1; }

  existing="$(curl -fsS "${auth[@]}" "$API/releases/$rid/assets" | grep -c "\"name\": \"$file\"" || true)"
  if [ "$existing" != "0" ]; then
    echo "   asset already uploaded, skipping"
    continue
  fi
  curl -fsS "${auth[@]}" -H "Content-Type: application/gzip" \
    --data-binary @"$tar" \
    "$UPLOADS/$rid/assets?name=$file" >/dev/null
  echo "   uploaded asset $file"
done

echo "done."
