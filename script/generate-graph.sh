#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
}

# --- collect nodes ---
nodes_json=""
while IFS= read -r -d '' filepath; do
  filename=$(basename "$filepath")
  name="${filename%.md}"
  slug=$(slugify "$name")
  [ -n "$nodes_json" ] && nodes_json+=","
  nodes_json+="{\"id\":\"$slug\",\"name\":\"$name\"}"
done < <(find "$ROOT" -maxdepth 1 -name "*.md" -not -name ".*" -print0 | sort -z)

# --- collect edges ---
edges_json=""
while IFS= read -r -d '' filepath; do
  filename=$(basename "$filepath")
  name="${filename%.md}"
  source_slug=$(slugify "$name")

  while IFS= read -r target_name; do
    [ -z "$target_name" ] && continue
    target_slug=$(slugify "$target_name")
    [ -n "$edges_json" ] && edges_json+=","
    edges_json+="{\"source\":\"$source_slug\",\"target\":\"$target_slug\"}"
  done < <(grep -oE '\[\[[^]]+\]\]' "$filepath" | sed 's/\[\[//g; s/\]\]//g' || true)

done < <(find "$ROOT" -maxdepth 1 -name "*.md" -not -name ".*" -print0 | sort -z)

echo "{\"nodes\":[$nodes_json],\"edges\":[$edges_json]}" > "$ROOT/lib/graph.json"

node_count=$(echo "$nodes_json" | grep -o '"id"' | wc -l | tr -d ' ')
edge_count=$(echo "$edges_json" | grep -o '"source"' | wc -l | tr -d ' ')
echo "Graph generated -> lib/graph.json ($node_count nodes, $edge_count edges)"
