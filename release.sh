#!/usr/bin/env bash
set -e

echo "==> Indexing notes..."
bash "$(dirname "$0")/script/indexing.sh"

echo "==> Generating pages..."
bash "$(dirname "$0")/script/generate-pages.sh"

echo "==> Generating index..."
bash "$(dirname "$0")/script/generate-index.sh"

echo ""
echo "Done. Serve with: python3 -m http.server 8080"
