#!/bin/bash
# Grant allowlisted ADMIN roles on the production server over SSH.

set -euo pipefail

REMOTE_USER="${REMOTE_USER:-geoai}"
REMOTE_HOST="${REMOTE_HOST:-cegs.kmitl.ac.th}"
JUMP_HOST="${JUMP_HOST:-geoai@161.246.18.204}"
PROJECT_PATH="${PROJECT_PATH:-/home/geoai/geoai}"

read -p "Grant ADMIN roles on $REMOTE_USER@$REMOTE_HOST via $JUMP_HOST? (y/n) " -n 1 -r
echo
if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
  echo "Operation aborted."
  exit 1
fi

ssh -tt -J "$JUMP_HOST" "$REMOTE_USER@$REMOTE_HOST" "if [ -f /home/geoai/geoai/docker-compose.prod.yml ]; then PROJECT_DIR=/home/geoai/geoai; elif [ -f /home/geoai/docker-compose.prod.yml ]; then PROJECT_DIR=/home/geoai; else echo 'ERROR: docker-compose.prod.yml not found in /home/geoai/geoai or /home/geoai'; exit 1; fi && \
  if [ ! -f \"\$PROJECT_DIR/.env.production\" ]; then echo \"ERROR: Missing env file at \$PROJECT_DIR/.env.production\"; exit 1; fi && \
  cd \"\$PROJECT_DIR\" && \
  sudo docker compose --env-file \"\$PROJECT_DIR/.env.production\" -f \"\$PROJECT_DIR/docker-compose.prod.yml\" run --rm backend npm run db:grant-admins"

echo "Completed: admin roles granted on production database."
