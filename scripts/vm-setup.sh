#!/usr/bin/env bash
# =================================================================
# AEGIS Core Shield: VM Setup & Connectivity Verification Script
# =================================================================
# Run this script inside the VM where OpenClaw is installed.
# It configures the required environment variables and fires a
# test event at the AEGIS Steward to confirm end-to-end connectivity.
#
# USAGE:
#   chmod +x vm-setup.sh
#   AEGIS_STEWARD_URL=http://<host-ip>:8787 ./vm-setup.sh
#
# OPTIONAL ENV VARS (override defaults):
#   AEGIS_STEWARD_URL   - URL of the AEGIS Steward on the host (required)
#   AEGIS_AUTH_TOKEN    - Bearer token if the Steward requires auth
#   AEGIS_AGENT_ID      - Agent ID to use (default: vm-openclaw-agent)
#   AEGIS_SWARM_ID      - Swarm ID to use (default: vm-swarm)
# =================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────
STEWARD_URL="${AEGIS_STEWARD_URL:-http://localhost:8787}"
AUTH_TOKEN="${AEGIS_AUTH_TOKEN:-}"
AGENT_ID="${AEGIS_AGENT_ID:-vm-openclaw-agent}"
SWARM_ID="${AEGIS_SWARM_ID:-vm-swarm}"
REQUEST_ID="probe-$(date +%s)"
SESSION_ID="vm-session-$(date +%s)"

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║         AEGIS Core Shield: VM Setup Probe         ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "  Steward URL : $STEWARD_URL"
echo "  Agent ID    : $AGENT_ID"
echo "  Swarm ID    : $SWARM_ID"
echo "  Auth Token  : ${AUTH_TOKEN:+(set)}"
echo ""

# ─── Step 1: Health Check ────────────────────────────────────────
echo "[1/3] Pinging Steward /health ..."
HEALTH=$(curl -sf --max-time 5 "$STEWARD_URL/health" 2>&1 || echo "FAILED")

if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "      ✓ Steward is reachable: $HEALTH"
else
  echo "      ✗ Could not reach Steward at $STEWARD_URL"
  echo "        Response: $HEALTH"
  echo ""
  echo "  TROUBLESHOOTING:"
  echo "    - Ensure the host firewall allows TCP port 8787"
  echo "    - Verify AEGIS Steward is running (npm run steward)"
  echo "    - Check AEGIS_STEWARD_URL is set to the host IP"
  exit 1
fi

# ─── Step 2: Fire Test OpenClaw Event ────────────────────────────
echo ""
echo "[2/3] Sending test OpenClaw event to $STEWARD_URL/openclaw/event ..."

AUTH_HEADER=""
if [ -n "$AUTH_TOKEN" ]; then
  AUTH_HEADER="-H 'Authorization: Bearer $AUTH_TOKEN'"
fi

PAYLOAD=$(cat <<EOF
{
  "agentId": "$AGENT_ID",
  "sessionId": "$SESSION_ID",
  "requestId": "$REQUEST_ID",
  "prompt": "AEGIS VM connectivity probe: Hello from OpenClaw in the VM!",
  "metadata": {
    "source": "vm-setup.sh",
    "swarmId": "$SWARM_ID",
    "probeTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
)

RESPONSE=$(curl -sf --max-time 10 \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-AEGIS-Agent-ID: $AGENT_ID" \
  ${AUTH_TOKEN:+-H "Authorization: Bearer $AUTH_TOKEN"} \
  -d "$PAYLOAD" \
  "$STEWARD_URL/openclaw/event" 2>&1 || echo "FAILED")

if echo "$RESPONSE" | grep -q '"gate"'; then
  echo "      ✓ Event accepted by AEGIS Steward!"
  
  ADMITTED=$(echo "$RESPONSE" | grep -o '"admitted":[^,}]*' | head -1)
  echo "      → Gate result: $ADMITTED"
  
  QUARANTINE=$(echo "$RESPONSE" | grep -o '"path":"[^"]*"' | head -1)
  if [ -n "$QUARANTINE" ]; then
    echo "      → Routing: $QUARANTINE"
  fi
elif echo "$RESPONSE" | grep -q '"error"'; then
  echo "      ⚠  Steward returned an error: $RESPONSE"
else
  echo "      ✗ Unexpected response: $RESPONSE"
  exit 1
fi

# ─── Step 3: Summary ─────────────────────────────────────────────
echo ""
echo "[3/3] Connectivity Verification Complete"
echo ""
echo "  NEXT STEPS:"
echo "    1. Check the Mirror Prime Dashboard for the registered VM Steward"
echo "    2. Send real OpenClaw prompts through AEGIS by pointing OpenClaw at:"
echo "       $STEWARD_URL/openclaw/event"
echo ""
echo "  To configure OpenClaw, set its webhook/hook URL to:"
echo "    $STEWARD_URL/openclaw/event"
if [ -n "$AUTH_TOKEN" ]; then
  echo "  With Authorization header: Bearer $AUTH_TOKEN"
fi
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║               AEGIS Connection Active             ║"
echo "╚═══════════════════════════════════════════════════╝"
