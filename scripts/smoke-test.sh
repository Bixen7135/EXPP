#!/bin/bash
# EXPP Smoke Test Script
# Tests all major API endpoints against a running Docker stack.
# Usage: bash scripts/smoke-test.sh [BASE_URL]

set -uo pipefail

BASE_URL="${1:-http://localhost:3002}"
EXPORT_URL="${2:-http://localhost:3001}"
PASS=0
FAIL=0
SKIP=0
COOKIE_JAR=$(mktemp)
CREATED_TASK_ID=""
CREATED_SHEET_ID=""

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}PASS${NC} $1"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}FAIL${NC} $1 — $2"; FAIL=$((FAIL + 1)); }
skip() { echo -e "  ${YELLOW}SKIP${NC} $1 — $2"; SKIP=$((SKIP + 1)); }

assert_status() {
  local label="$1" expected="$2" actual="$3" body="${4:-}"
  if [ "$actual" = "$expected" ]; then
    pass "$label (HTTP $actual)"
  else
    fail "$label" "expected HTTP $expected, got $actual. Body: ${body:0:200}"
  fi
}

# ============================================================================
echo ""
echo "========================================"
echo " EXPP Smoke Tests"
echo " Web:    $BASE_URL"
echo " Export: $EXPORT_URL"
echo "========================================"
echo ""

# ============================================================================
echo "--- 1. Health & Pages ---"

# Home page
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
assert_status "GET / (home page)" "200" "$STATUS"

# Sign-in page
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/signin")
assert_status "GET /auth/signin" "200" "$STATUS"

# Tasks page
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/tasks")
assert_status "GET /tasks (page)" "200" "$STATUS"

# Sheets page
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sheets")
assert_status "GET /sheets (page)" "200" "$STATUS"

# Export worker health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EXPORT_URL/health")
assert_status "GET /health (export worker)" "200" "$STATUS"

# ============================================================================
echo ""
echo "--- 2. Auth.js Endpoints ---"

# Session (unauthenticated)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/session")
assert_status "GET /api/auth/session (no auth)" "200" "$STATUS"

# Providers
BODY=$(curl -s "$BASE_URL/api/auth/providers")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/providers")
if echo "$BODY" | grep -q '"credentials"'; then
  pass "GET /api/auth/providers — credentials provider present"
else
  fail "GET /api/auth/providers" "credentials provider missing"
fi

# ============================================================================
echo ""
echo "--- 3. Registration ---"

TEST_EMAIL="smoketest_$(date +%s)@test.com"
TEST_PASSWORD="testpass123"

BODY=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Smoke\",\"lastName\":\"Test\"}")
STATUS=$(echo "$BODY" | tail -1)
RESPONSE=$(echo "$BODY" | head -n -1)

assert_status "POST /api/auth/register" "201" "$STATUS" "$RESPONSE"

# Extract user ID
USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$USER_ID" ]; then
  pass "Registered user ID: $USER_ID"
else
  fail "Register" "Could not extract user ID from: ${RESPONSE:0:200}"
fi

# ============================================================================
echo ""
echo "--- 4. Sign In (Credentials) ---"

# Get CSRF token first
CSRF_PAGE=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_PAGE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CSRF_TOKEN" ]; then
  fail "CSRF token" "Could not extract CSRF token"
else
  pass "Got CSRF token"

  # Sign in with credentials
  BODY=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/callback/credentials" \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "csrfToken=$CSRF_TOKEN&email=$TEST_EMAIL&password=$TEST_PASSWORD" \
    -L)
  STATUS=$(echo "$BODY" | tail -1)

  # Auth.js redirects on success (302 -> 200 after redirect with -L)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
    pass "POST /api/auth/callback/credentials (sign in)"
  else
    fail "POST /api/auth/callback/credentials" "got HTTP $STATUS"
  fi

  # Verify session
  BODY=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/session")
  if echo "$BODY" | grep -q '"email"'; then
    pass "Session verified — user is logged in"
  else
    fail "Session verification" "no email in session: ${BODY:0:200}"
  fi
fi

# ============================================================================
echo ""
echo "--- 5. Tasks CRUD ---"

# List tasks (empty)
BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/tasks")
STATUS=$(echo "$BODY" | tail -1)
assert_status "GET /api/tasks (list)" "200" "$STATUS"

# Create task
BODY=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_JAR" "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [{
      "text": "What is 2+2?",
      "type": "multiple_choice",
      "topic": "math",
      "difficulty": "easy",
      "answer": "4",
      "solution": "2+2=4",
      "tags": ["smoke-test"]
    }]
  }')
STATUS=$(echo "$BODY" | tail -1)
RESPONSE=$(echo "$BODY" | head -n -1)
assert_status "POST /api/tasks (create)" "201" "$STATUS" "$RESPONSE"

# Extract task ID
CREATED_TASK_ID=$(echo "$RESPONSE" | grep -o '"taskIds":\["[^"]*"' | grep -o '[0-9a-f-]\{36\}')
if [ -n "$CREATED_TASK_ID" ]; then
  pass "Created task ID: $CREATED_TASK_ID"
else
  fail "Create task" "Could not extract task ID from: ${RESPONSE:0:200}"
fi

# Get single task
if [ -n "$CREATED_TASK_ID" ]; then
  BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/tasks/$CREATED_TASK_ID")
  STATUS=$(echo "$BODY" | tail -1)
  assert_status "GET /api/tasks/:id" "200" "$STATUS"
fi

# Update task
if [ -n "$CREATED_TASK_ID" ]; then
  BODY=$(curl -s -w "\n%{http_code}" -X PATCH -b "$COOKIE_JAR" "$BASE_URL/api/tasks/$CREATED_TASK_ID" \
    -H "Content-Type: application/json" \
    -d '{"text": "What is 2+3?", "answer": "5"}')
  STATUS=$(echo "$BODY" | tail -1)
  assert_status "PATCH /api/tasks/:id (update)" "200" "$STATUS"
fi

# ============================================================================
echo ""
echo "--- 6. Sheets CRUD ---"

if [ -n "$CREATED_TASK_ID" ]; then
  # Create sheet
  BODY=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_JAR" "$BASE_URL/api/sheets" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Smoke Test Sheet\",
      \"description\": \"Created by smoke test\",
      \"tasks\": [\"$CREATED_TASK_ID\"],
      \"tags\": [\"smoke-test\"]
    }")
  STATUS=$(echo "$BODY" | tail -1)
  RESPONSE=$(echo "$BODY" | head -n -1)
  assert_status "POST /api/sheets (create)" "201" "$STATUS" "$RESPONSE"

  CREATED_SHEET_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$CREATED_SHEET_ID" ]; then
    pass "Created sheet ID: $CREATED_SHEET_ID"
  else
    fail "Create sheet" "Could not extract sheet ID from: ${RESPONSE:0:200}"
  fi

  # List sheets
  BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/sheets")
  STATUS=$(echo "$BODY" | tail -1)
  assert_status "GET /api/sheets (list)" "200" "$STATUS"

  # Get single sheet
  if [ -n "$CREATED_SHEET_ID" ]; then
    BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/sheets/$CREATED_SHEET_ID")
    STATUS=$(echo "$BODY" | tail -1)
    assert_status "GET /api/sheets/:id" "200" "$STATUS"

    # Copy sheet
    BODY=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_JAR" "$BASE_URL/api/sheets/$CREATED_SHEET_ID/copy" \
      -H "Content-Type: application/json" \
      -d '{"title": "Copied Smoke Sheet"}')
    STATUS=$(echo "$BODY" | tail -1)
    assert_status "POST /api/sheets/:id/copy" "201" "$STATUS"

    # Create version
    BODY=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_JAR" "$BASE_URL/api/sheets/$CREATED_SHEET_ID/versions" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"Version 1\",
        \"description\": \"First version\",
        \"tasks\": [\"$CREATED_TASK_ID\"]
      }")
    STATUS=$(echo "$BODY" | tail -1)
    assert_status "POST /api/sheets/:id/versions (create)" "201" "$STATUS"

    # List versions
    BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/sheets/$CREATED_SHEET_ID/versions")
    STATUS=$(echo "$BODY" | tail -1)
    assert_status "GET /api/sheets/:id/versions (list)" "200" "$STATUS"
  fi
else
  skip "Sheets CRUD" "no task ID available (task creation failed)"
fi

# ============================================================================
echo ""
echo "--- 7. Profile, Settings, Statistics ---"

# Profile
BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/profile")
STATUS=$(echo "$BODY" | tail -1)
assert_status "GET /api/profile" "200" "$STATUS"

# Settings
BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/settings")
STATUS=$(echo "$BODY" | tail -1)
assert_status "GET /api/settings" "200" "$STATUS"

# Statistics
BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/statistics")
STATUS=$(echo "$BODY" | tail -1)
assert_status "GET /api/statistics" "200" "$STATUS"

# Statistics progress
BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/statistics/progress")
STATUS=$(echo "$BODY" | tail -1)
assert_status "GET /api/statistics/progress" "200" "$STATUS"

# Search
BODY=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/search?q=test")
STATUS=$(echo "$BODY" | tail -1)
assert_status "GET /api/search?q=test" "200" "$STATUS"

# ============================================================================
echo ""
echo "--- 8. Task Submission ---"

if [ -n "$CREATED_TASK_ID" ]; then
  BODY=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_JAR" "$BASE_URL/api/submissions/task" \
    -H "Content-Type: application/json" \
    -d "{
      \"taskId\": \"$CREATED_TASK_ID\",
      \"answer\": \"4\",
      \"isCorrect\": true,
      \"timeSpent\": 30
    }")
  STATUS=$(echo "$BODY" | tail -1)
  RESPONSE=$(echo "$BODY" | head -n -1)
  assert_status "POST /api/submissions/task" "201" "$STATUS" "$RESPONSE"
else
  skip "Task submission" "no task ID"
fi

# ============================================================================
echo ""
echo "--- 9. Unauthenticated Access ---"

# API routes should return 401 without auth
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/tasks")
assert_status "GET /api/tasks (no auth)" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/profile")
assert_status "GET /api/profile (no auth)" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/settings")
assert_status "GET /api/settings (no auth)" "401" "$STATUS"

# ============================================================================
echo ""
echo "--- 10. Cleanup ---"

# Soft-delete created task
if [ -n "$CREATED_TASK_ID" ]; then
  BODY=$(curl -s -w "\n%{http_code}" -X DELETE -b "$COOKIE_JAR" "$BASE_URL/api/tasks" \
    -H "Content-Type: application/json" \
    -d "{\"taskIds\": [\"$CREATED_TASK_ID\"]}")
  STATUS=$(echo "$BODY" | tail -1)
  assert_status "DELETE /api/tasks (soft delete)" "200" "$STATUS"
fi

# Delete created sheet
if [ -n "$CREATED_SHEET_ID" ]; then
  BODY=$(curl -s -w "\n%{http_code}" -X DELETE -b "$COOKIE_JAR" "$BASE_URL/api/sheets" \
    -H "Content-Type: application/json" \
    -d "{\"sheetIds\": [\"$CREATED_SHEET_ID\"]}")
  STATUS=$(echo "$BODY" | tail -1)
  assert_status "DELETE /api/sheets" "200" "$STATUS"
fi

# ============================================================================
echo ""
echo "========================================"
echo -e " Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$SKIP skipped${NC}"
echo "========================================"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
