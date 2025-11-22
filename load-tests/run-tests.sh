#!/bin/bash

# DingleUP! Load Test Runner
# Fokozatos terheléses tesztelés 500 → 5,000 → 25,000 felhasználóig

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Check prerequisites
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DingleUP! Load Test Suite                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ K6 nincs telepítve!${NC}"
    echo "Telepítsd: brew install k6"
    exit 1
fi

echo -e "${GREEN}✅ K6 telepítve${NC}"

if [ -z "$BASE_URL" ]; then
    echo -e "${RED}❌ BASE_URL nincs beállítva!${NC}"
    echo "Másold át .env.example -> .env és töltsd ki"
    exit 1
fi

echo -e "${GREEN}✅ BASE_URL: $BASE_URL${NC}"

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_ANON_KEY nincs beállítva!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SUPABASE_ANON_KEY beállítva${NC}"
echo ""

# Test Level Selection
echo -e "${YELLOW}Válassz terhelési szintet:${NC}"
echo "1) Kezdő teszt (500 user)"
echo "2) Közepes teszt (5,000 user)"
echo "3) Maximum teszt (25,000 user)"
echo "4) Egyedi teszt (custom VU)"
echo ""
read -p "Válasz (1-4): " level

case $level in
  1)
    TARGET_VUS=500
    RAMP_UP=60s
    HOLD=120s
    TEST_NAME="Kezdő teszt"
    ;;
  2)
    TARGET_VUS=5000
    RAMP_UP=180s
    HOLD=300s
    TEST_NAME="Közepes teszt"
    ;;
  3)
    TARGET_VUS=25000
    RAMP_UP=300s
    HOLD=180s
    TEST_NAME="Maximum teszt"
    echo -e "${RED}⚠️  FIGYELEM: Ez nagyon magas terhelés!${NC}"
    read -p "Biztosan folytatod? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "Teszt megszakítva."
      exit 0
    fi
    ;;
  4)
    read -p "Hány virtuális felhasználó? " TARGET_VUS
    read -p "Ramp-up időtartam (s): " RAMP_UP
    read -p "Hold időtartam (s): " HOLD
    TEST_NAME="Egyedi teszt"
    RAMP_UP="${RAMP_UP}s"
    HOLD="${HOLD}s"
    ;;
  *)
    echo -e "${RED}Érvénytelen választás!${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  $TEST_NAME indítása...${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  VUs:          $TARGET_VUS${NC}"
echo -e "${BLUE}║  Ramp-up:      $RAMP_UP${NC}"
echo -e "${BLUE}║  Hold:         $HOLD${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create reports directory
mkdir -p reports

# Run K6 test
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="reports/test-${TARGET_VUS}vus-${TIMESTAMP}.json"

k6 run \
  -e BASE_URL="$BASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e TARGET_VUS="$TARGET_VUS" \
  -e RAMP_UP_DURATION="$RAMP_UP" \
  -e HOLD_DURATION="$HOLD" \
  --out json="$REPORT_FILE" \
  game-load-test.js

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Teszt sikeresen befejezve!${NC}"
  echo -e "${GREEN}   Report: $REPORT_FILE${NC}"
else
  echo ""
  echo -e "${RED}❌ Teszt sikertelen!${NC}"
  echo -e "${RED}   Ellenőrizd a report-ot: $REPORT_FILE${NC}"
  exit 1
fi
