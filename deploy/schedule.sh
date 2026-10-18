#!/usr/bin/env bash
# Hourly maintenance: refresh forecasts people are using and clear expired data.
# Run once after the first deploy (and again if the maintenance key changes).
set -euo pipefail

PROJECT=${PROJECT:-first-lift}
REGION=${REGION:-europe-west1}
SERVICE=${SERVICE:-snowfolk}
URL=$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')
KEY=$(gcloud secrets versions access latest --secret maintenance-key --project "$PROJECT")

args=(--project "$PROJECT" --location "$REGION" --schedule "5 * * * *" --time-zone "Etc/UTC"
  --uri "$URL/api/internal/maintenance" --http-method POST --attempt-deadline 900s)
if gcloud scheduler jobs describe first-lift-maintenance --project "$PROJECT" --location "$REGION" >/dev/null 2>&1; then
  gcloud scheduler jobs update http first-lift-maintenance "${args[@]}" --update-headers "X-Maintenance-Key=$KEY"
else
  gcloud scheduler jobs create http first-lift-maintenance "${args[@]}" --headers "X-Maintenance-Key=$KEY"
fi
