#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cat > "$ROOT/index.html" <<HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=pages/index.html" />
</head>
<body></body>
</html>
HTMLEOF

echo "index.html generated (redirects to pages/welcome.html)"
