#!/usr/bin/env bash
# Build the site and publish it to an Apache host over SSH, served at http://<host>/congress/.
# Run from the repository root on a machine whose ~/.ssh/config has the host:
#   deploy/brain.sh                 # host "Brain", docroot /var/www/html
#   HOST=other DOCROOT=/srv/www deploy/brain.sh
# The app is built for the /congress/ path (vite.config.js `base`), so it must be served there.
set -euo pipefail

HOST="${HOST:-Brain}"
DOCROOT="${DOCROOT:-/var/www/html}"
DEST="$DOCROOT/congress"

cd "$(dirname "$0")/.."
if command -v bun >/dev/null; then bun install && bun run build; else npm install && npm run build; fi
cp deploy/.htaccess dist/congress/.htaccess

ssh "$HOST" "mkdir -p '$DEST'"
# --delete removes files from earlier deploys that the new build no longer has.
rsync -az --delete --info=progress2 dist/congress/ "$HOST:$DEST/"
echo "Published to $HOST:$DEST — open http://<brain-address>/congress/"
