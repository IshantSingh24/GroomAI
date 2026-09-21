#!/usr/bin/env bash
# =============================================================================
# upload_secrets.sh — Upload .env secrets to Google Secret Manager
# =============================================================================
# Usage:
#   chmod +x scripts/upload_secrets.sh
#   ./scripts/upload_secrets.sh
#
# Run this from the repo root: /home/thunder/GroomAI/
# Prerequisites:
#   - gcloud auth login  (already done)
#   - gcloud config set project groomai-prod
#   - gcloud services enable secretmanager.googleapis.com
# =============================================================================

set -euo pipefail

ENV_FILE="${1:-.env}"           # default to .env in current dir
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌  No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Uploading secrets → GCP project: $PROJECT_ID"
echo "  Source file: $ENV_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Enable Secret Manager API (safe to run multiple times)
gcloud services enable secretmanager.googleapis.com --quiet

SECRET_FLAGS=()   # will collect --set-secrets flags for Cloud Run

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" == \#* ]] && continue

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Skip keys that are empty
  [[ -z "$KEY" || -z "$VALUE" ]] && continue

  echo ""
  echo "▶  Processing: $KEY"

  # Check if secret already exists
  if gcloud secrets describe "$KEY" --project="$PROJECT_ID" &>/dev/null; then
    echo "   Secret exists — adding new version"
    echo -n "$VALUE" | gcloud secrets versions add "$KEY" \
      --data-file=- \
      --project="$PROJECT_ID" \
      --quiet
  else
    echo "   Creating new secret"
    echo -n "$VALUE" | gcloud secrets create "$KEY" \
      --data-file=- \
      --replication-policy=automatic \
      --project="$PROJECT_ID" \
      --quiet
  fi

  # Build the --set-secrets flag entry: ENV_VAR=SECRET_NAME:latest
  SECRET_FLAGS+=("${KEY}=${KEY}:latest")

done < "$ENV_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  All secrets uploaded to Secret Manager!"
echo ""
echo "📋  Copy the --set-secrets flag below into your gcloud run deploy command:"
echo ""

# Join array with commas
JOINED=$(IFS=","; echo "${SECRET_FLAGS[*]}")
echo "--set-secrets=\"${JOINED}\""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Remember to also grant Cloud Run SA access to secrets:"
echo ""
echo "PROJECT_NUMBER=\$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')"
echo "gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "  --member=\"serviceAccount:\${PROJECT_NUMBER}-compute@developer.gserviceaccount.com\" \\"
echo "  --role=\"roles/secretmanager.secretAccessor\""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
