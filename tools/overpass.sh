#!/usr/bin/env bash
# Run one Overpass (OpenStreetMap) query, trying several public mirrors.
# Usage: tools/overpass.sh query.overpassql out.json
set -euo pipefail
QUERY_FILE="$1"; OUT="$2"
MIRRORS=(
  https://overpass-api.de/api/interpreter
  https://overpass.private.coffee/api/interpreter
  https://maps.mail.ru/osm/tools/overpass/api/interpreter
  https://overpass.kumi.systems/api/interpreter
)
for attempt in 1 2 3; do
  for m in "${MIRRORS[@]}"; do
    if curl -sf --max-time 120 -A 'gondrecourt-3d/0.1 (personal project)' -H 'Accept: */*' \
         "$m" --data-urlencode "data@${QUERY_FILE}" -o "$OUT.tmp" \
       && head -c 1 "$OUT.tmp" | grep -q '{'; then
      mv "$OUT.tmp" "$OUT"; echo "ok via $m"; exit 0
    fi
    echo "failed: $m" >&2
  done
  sleep $((attempt * 5))
done
rm -f "$OUT.tmp"; echo "all mirrors failed" >&2; exit 1
