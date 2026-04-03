#!/bin/bash
# 🚀 Deployment Script for GeoAI Platform

# Configuration
REMOTE_USER="geoai"
REMOTE_HOST="cegs.kmitl.ac.th"
JUMP_HOST="geoai@161.246.18.204"
PROJECT_PATH="/home/geoai/geoai"

# Ask for confirmation
read -p "Deploying to $REMOTE_USER@$REMOTE_HOST via $JUMP_HOST. Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment aborted."
    exit 1
fi

echo "📦 Creating compressed archive (INCLUDING .env)..."
tar -czf deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next' \
  ./backend ./frontend ./docker-compose.yml ./docker-compose.prod.yml ./package.json ./.env

echo "📁 Ensuring remote project directory exists..."
ssh -J "$JUMP_HOST" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $PROJECT_PATH"

echo "🚀 Sending archive to server..."
scp -J "$JUMP_HOST" deploy.tar.gz "$REMOTE_USER@$REMOTE_HOST:$PROJECT_PATH/"

echo "🔧 Extracting and restarting containers (using .env)..."
ssh -tt -J "$JUMP_HOST" "$REMOTE_USER@$REMOTE_HOST" "if [ -f /home/geoai/geoai/docker-compose.prod.yml ]; then PROJECT_DIR=/home/geoai/geoai; elif [ -f /home/geoai/docker-compose.prod.yml ]; then PROJECT_DIR=/home/geoai; else echo 'ERROR: docker-compose.prod.yml not found in /home/geoai/geoai or /home/geoai'; exit 1; fi && \
    if [ ! -f \"\$PROJECT_DIR/.env\" ]; then echo \"ERROR: Missing env file at \$PROJECT_DIR/.env\"; exit 1; fi && \
    cd \"\$PROJECT_DIR\" && \
    tar -xzf deploy.tar.gz && \
    rm deploy.tar.gz && \
  sudo docker compose --env-file \"\$PROJECT_DIR/.env\" -f \"\$PROJECT_DIR/docker-compose.prod.yml\" up -d --build --remove-orphans && \
  sudo docker compose --env-file \"\$PROJECT_DIR/.env\" -f \"\$PROJECT_DIR/docker-compose.prod.yml\" run --rm backend npm run db:push && \
  sudo docker compose --env-file \"\$PROJECT_DIR/.env\" -f \"\$PROJECT_DIR/docker-compose.prod.yml\" run --rm backend npm run db:seed && \
  sudo docker compose --env-file \"\$PROJECT_DIR/.env\" -f \"\$PROJECT_DIR/docker-compose.prod.yml\" run --rm backend npm run db:grant-admins"

# Clean up local zip
rm deploy.tar.gz

echo "✅ SUCCESS: Project deployed with secrets correctly!"

echo "✅ SUCCESS: Deployment process finished."
