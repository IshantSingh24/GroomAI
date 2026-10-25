#!/usr/bin/env bash
set -euo pipefail

IMAGE="asia-south1-docker.pkg.dev/master-crossing-441112-v3/groomai-repo/backend:latest"
REGION="asia-south1"
SERVICE_NAME="groomai-backend"

echo "Building backend container..."
docker build -t "$IMAGE" ./backend

echo "Pushing image..."
docker push "$IMAGE"

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$REGION" \
  --quiet

echo "Done!"
