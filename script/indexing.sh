#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$ROOT/lib"

json="["
first=true

while IFS= read -r -d '' filepath; do
  file=$(basename "$filepath")
  name="${file%.md}"
  content=$(cat "$filepath")

  content="${content//\\/\\\\}"
  content="${content//\"/\\\"}"
  content="${content//$'\n'/\\n}"
  content="${content//$'\r'/}"
  content="${content//$'\t'/\\t}"

  slug=$(echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

  if [ "$first" = true ]; then
    first=false
  else
    json+=","
  fi

  json+="{\"name\":\"$name\",\"file\":\"$file\",\"slug\":\"$slug\",\"content\":\"$content\"}"

done < <(find "$ROOT" -maxdepth 1 -name "*.md" -not -name ".*" -print0 | sort -z)

json+="]"

echo "$json" > "$ROOT/lib/index.json"

count=$(find "$ROOT" -maxdepth 1 -name "*.md" -not -name ".*" | wc -l | tr -d ' ')
echo "$count notes indexed -> lib/index.json"
