#!/usr/bin/env bash
# AIso Claude hook: forward this tool/lifecycle event to the AIso map. It only
# acts inside an AIso terminal (AISO_SESSION is injected there), and is fast and
# silent so it never blocks the agent — safe to install globally.
[ -z "$AISO_SESSION" ] && exit 0
[ -z "$AISO_INGEST" ] && exit 0
curl -s --max-time 1 -X POST "$AISO_INGEST" \
  -H "content-type: application/json" \
  -H "authorization: Bearer ${AISO_TOKEN}" \
  -H "x-aiso-session: ${AISO_SESSION}" \
  -H "x-aiso-tool: claude" \
  --data-binary @- >/dev/null 2>&1 || true
exit 0
