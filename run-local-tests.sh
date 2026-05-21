#!/bin/bash
# =============================================================================
# run-local-tests.sh — MediPortal Enterprise Master Automation Suite
# =============================================================================
# Usage:   bash run-local-tests.sh
# Requires: Docker, Node.js 20+, npm
# =============================================================================

set -euo pipefail

# ── Color Codes ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Logger Functions ───────────────────────────────────────────────────────────
log_infra() { echo -e "${CYAN}[INFRA]${NC}  $1"; }
log_build() { echo -e "${YELLOW}[BUILD]${NC}  $1"; }
log_test()  { echo -e "${GREEN}[TEST]${NC}   $1"; }
log_error() { echo -e "${RED}[ERROR]${NC}  $1"; }
log_info()  { echo -e "${BOLD}[INFO]${NC}   $1"; }

# ── Config ─────────────────────────────────────────────────────────────────────
API_URL="http://localhost:3002/api/v1"
HEALTH_ENDPOINT="${API_URL}/health"
MAX_WAIT_SECONDS=60
PIDS=()

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# ── Cleanup Handler ────────────────────────────────────────────────────────────
cleanup() {
  log_info "Shutting down background dev servers..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

# =============================================================================
# STAGE 1: INFRASTRUCTURE
# =============================================================================
log_infra "=================================================="
log_infra "  Stage 1: Infrastructure & Database Setup"
log_infra "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  log_error "Docker is not running. Please start Docker and retry."
  exit 1
fi

# Check if containers are up; start if not
if docker compose ps | grep -q "running"; then
  log_infra "Docker containers already running ✓"
else
  log_infra "Starting Docker containers..."
  docker compose up -d
  log_infra "Waiting for database to be healthy..."
  sleep 5
fi

# Sync Prisma schema
log_infra "Pushing Prisma schema..."
cd packages/database
DATABASE_URL="postgresql://mediportal:mediportal123@localhost:5432/mediportal_db?schema=public" \
  npx prisma db push --skip-generate
cd "$ROOT_DIR"
log_infra "Database schema in sync ✓"

# Run seed (idempotent via upserts)
log_infra "Running database seed..."
cd packages/database
DATABASE_URL="postgresql://mediportal:mediportal123@localhost:5432/mediportal_db?schema=public" \
  npx ts-node prisma/seed.ts
cd "$ROOT_DIR"
log_infra "Seed complete ✓"

# =============================================================================
# STAGE 2: BUILD VERIFICATION
# =============================================================================
log_build "=================================================="
log_build "  Stage 2: Build Verification"
log_build "=================================================="

log_build "Installing dependencies..."
npm install --silent
log_build "Dependencies installed ✓"

log_build "Running TypeScript type-check for api-server..."
cd apps/api-server && npx tsc --noEmit && cd "$ROOT_DIR"
log_build "API Server types OK ✓"

log_build "Running TypeScript type-check for admin-hms..."
cd apps/admin-hms && npx tsc --noEmit && cd "$ROOT_DIR"
log_build "Admin HMS types OK ✓"

# =============================================================================
# STAGE 3: DEV SERVER STARTUP
# =============================================================================
log_infra "=================================================="
log_infra "  Stage 3: Dev Server Startup"
log_infra "=================================================="

log_infra "Starting API server (port 3002)..."
cd apps/api-server
npm run start:dev > /tmp/api-server.log 2>&1 &
PIDS+=($!)
cd "$ROOT_DIR"

# Wait for API to be healthy
log_infra "Waiting for API health check at ${HEALTH_ENDPOINT}..."
WAITED=0
until curl -sf "${HEALTH_ENDPOINT}" > /dev/null 2>&1; do
  if [ $WAITED -ge $MAX_WAIT_SECONDS ]; then
    log_error "API did not start within ${MAX_WAIT_SECONDS}s. Check /tmp/api-server.log"
    exit 1
  fi
  printf '.'
  sleep 2
  WAITED=$((WAITED + 2))
done
echo ""
log_infra "API is healthy ✓ (ready after ${WAITED}s)"

# =============================================================================
# STAGE 4: TEST EXECUTION
# =============================================================================
log_test "=================================================="
log_test "  Stage 4: Playwright Golden Path Execution"
log_test "=================================================="

cd apps/admin-hms

# Install Playwright browsers if needed
if ! npx playwright --version > /dev/null 2>&1; then
  log_test "Installing Playwright browsers..."
  npx playwright install --with-deps chromium
fi

# Run the test suite
log_test "Executing Golden Path tests..."
TEST_RESULT=0
npx playwright test tests/golden-path.spec.ts \
  --reporter=list \
  --timeout=60000 || TEST_RESULT=$?

cd "$ROOT_DIR"

# =============================================================================
# STAGE 5: FINAL REPORT
# =============================================================================
echo ""
echo -e "${BOLD}=================================================="
echo "  System Health Report"
echo -e "==================================================${NC}"
echo ""
echo "  API Health:      $(curl -sf ${HEALTH_ENDPOINT} | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo 'unreachable')"
echo "  DB Schema:       Synced (Prisma push)"
echo "  Seed Data:       admin@mediportal.com / Admin@123"
echo "  Seeded Doctor:   sarah.j@mediportal.com / Doctor@123"
echo ""

if [ $TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}${BOLD}  FINAL VERDICT: ✅ PASS${NC}"
  echo -e "${GREEN}  All Golden Path tests completed successfully.${NC}"
else
  echo -e "${RED}${BOLD}  FINAL VERDICT: ❌ FAIL${NC}"
  echo -e "${RED}  One or more tests failed. See output above for details.${NC}"
  exit 1
fi
