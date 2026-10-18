#!/usr/bin/env bash
# Build the container from this repo and deploy it to Cloud Run (Belgium).
# Usage: CLOUDSDK_ACTIVE_CONFIG_NAME=first-lift deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT=${PROJECT:-first-lift}
REGION=${REGION:-europe-west1}
SERVICE=${SERVICE:-snowfolk}
INSTANCE="$PROJECT:$REGION:first-lift-db"
VERSION=$(git rev-parse --short HEAD)$(git diff --quiet HEAD -- . || echo "-dirty")
IMAGE="$REGION-docker.pkg.dev/$PROJECT/first-lift/app:$VERSION"

# Build in Google Cloud (no Docker needed locally)
gcloud builds submit --project "$PROJECT" --tag "$IMAGE" .

# CPU stays allocated while an instance is up, so the warm-up queue keeps fetching forecasts
# between requests; instances still scale to zero when idle.
gcloud run deploy "$SERVICE" \
  --project "$PROJECT" --region "$REGION" --image "$IMAGE" \
  --service-account "first-lift-run@$PROJECT.iam.gserviceaccount.com" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$INSTANCE" \
  --set-env-vars "NODE_ENV=production,PGHOST=/cloudsql/$INSTANCE,PGUSER=firstlift,PGDATABASE=firstlift" \
  --set-secrets "PGPASSWORD=db-app-password:latest,MAINTENANCE_KEY=maintenance-key:latest" \
  --cpu 1 --memory 1Gi --no-cpu-throttling \
  --min-instances 0 --max-instances 3 --concurrency 80 --timeout 900 \
  --quiet

gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)'
