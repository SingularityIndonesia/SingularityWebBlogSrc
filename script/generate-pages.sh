#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

rm -rf "$ROOT/pages"
mkdir -p "$ROOT/pages"

count=0

while IFS= read -r -d '' filepath; do
  filename=$(basename "$filepath")
  name="${filename%.md}"
  slug=$(echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

  cat > "$ROOT/pages/$slug.html" <<HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>$name</title>
  <link rel="stylesheet" href="../lib/style.css" />
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
<script>window.PAGE = { name: "$name", file: "$filename", slug: "$slug" };</script>
<script src="../lib/app.js"></script>
</body>
</html>
HTMLEOF

  count=$((count + 1))
done < <(find "$ROOT" -maxdepth 1 -name "*.md" -not -name ".*" -print0 | sort -z)

echo "$count pages generated -> pages/"
