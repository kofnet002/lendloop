#!/usr/bin/env bash
# Imports the generated workflows into the running n8n container and publishes them.
# Re-runnable: workflows keep fixed IDs, so imports overwrite instead of duplicating.
set -euo pipefail

WORKFLOW_IDS=(lendloopErrors01 lendloopEvents01 lendloopOverdue1)
n8n() { docker compose exec -T n8n n8n "$@"; }

n8n import:workflow --separate --input=/workflows
for id in "${WORKFLOW_IDS[@]}"; do n8n publish:workflow --id="$id"; done
docker compose restart n8n
