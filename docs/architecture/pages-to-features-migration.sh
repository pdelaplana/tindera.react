#!/bin/bash

# Enhanced Pages → Features Migration Script
# Performs two operations:
#   1. Renames src/pages → src/features
#   2. Converts feature directory names from PascalCase → lowercase
#
# Usage: bash docs/architecture/pages-to-features-migration.sh
#
# Prerequisites:
#   - Run from the project root directory
#   - All changes committed (clean working tree)
#   - On a feature branch

set -e  # Exit on first error

# ============================================================
# HELPERS
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

# Rename a directory with intermediate temp to handle case-insensitive filesystems (Windows/macOS)
rename_case() {
  local src="$1"
  local dst="$2"
  local tmp="${dst}-migration-tmp"

  if [ -d "$src" ]; then
    git mv "$src" "$tmp"
    git mv "$tmp" "$dst"
    ok "Renamed: $src → $dst"
  else
    warn "Skipping (not found): $src"
  fi
}

# Replace a string in all .ts/.tsx files
replace_in_source() {
  local from="$1"
  local to="$2"
  find src -type f \( -name "*.tsx" -o -name "*.ts" \) \
    -exec sed -i "s|${from}|${to}|g" {} +
}

# ============================================================
# PREFLIGHT CHECKS
# ============================================================

echo ""
echo "=========================================="
echo "  Pages → Features Migration Script"
echo "=========================================="
echo ""

# Check we're in the project root
if [ ! -f "package.json" ] || [ ! -d "src/pages" ]; then
  fail "Run this script from the project root (src/pages must exist)"
fi

# Check for clean working tree
if [ -n "$(git status --porcelain)" ]; then
  fail "Working tree is not clean. Please commit or stash changes first."
fi

# Confirm
echo "This script will:"
echo "  1. Rename src/pages → src/features"
echo "  2. Lowercase all feature directory names (e.g. Inventory → inventory)"
echo "  3. Update all import statements to reflect both changes"
echo ""
warn "Make sure you are on a feature branch before continuing!"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# ============================================================
# PHASE 1: RENAME pages → features (keep PascalCase temporarily)
# ============================================================

echo ""
echo "------------------------------------------"
echo "  Phase 1: pages → features"
echo "------------------------------------------"
echo ""

git mv src/pages src/features
ok "Renamed: src/pages → src/features"

echo ""
echo "Updating import statements..."

# @/pages/... → @/features/...
replace_in_source "from '@/pages/" "from '@/features/"

# ./pages/... → ./features/...
replace_in_source "from './pages/" "from './features/"

# ../pages/... → ../features/...
replace_in_source "from '../pages/" "from '../features/"

# ../../pages/... → ../../features/...
replace_in_source "from '../../pages/" "from '../../features/"

# ../../../pages/... → ../../../features/...
replace_in_source "from '../../../pages/" "from '../../../features/"

ok "Import statements updated"

echo ""
echo "Verifying Phase 1..."
REMAINING=$(grep -r "from '.*pages/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$REMAINING" -gt 0 ]; then
  warn "Found $REMAINING remaining 'pages' import(s) - may need manual review:"
  grep -r "from '.*pages/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
else
  ok "No remaining pages imports found"
fi

# ============================================================
# PHASE 2: LOWERCASE FEATURE DIRECTORY NAMES
# ============================================================

echo ""
echo "------------------------------------------"
echo "  Phase 2: PascalCase → lowercase"
echo "------------------------------------------"
echo ""

rename_case "src/features/Auth"     "src/features/auth"
rename_case "src/features/Home"     "src/features/home"
rename_case "src/features/Inventory" "src/features/inventory"
rename_case "src/features/Order"    "src/features/order"
rename_case "src/features/POS"      "src/features/pos"
rename_case "src/features/Products" "src/features/products"
rename_case "src/features/Sales"    "src/features/sales"
rename_case "src/features/Settings" "src/features/settings"
rename_case "src/features/Shop"     "src/features/shop"

echo ""
echo "Updating import statements for lowercase..."

replace_in_source "@/features/Auth"     "@/features/auth"
replace_in_source "@/features/Home"     "@/features/home"
replace_in_source "@/features/Inventory" "@/features/inventory"
replace_in_source "@/features/Order"    "@/features/order"
replace_in_source "@/features/POS"      "@/features/pos"
replace_in_source "@/features/Products" "@/features/products"
replace_in_source "@/features/Sales"    "@/features/sales"
replace_in_source "@/features/Settings" "@/features/settings"
replace_in_source "@/features/Shop"     "@/features/shop"

# Handle relative imports that contain feature names
replace_in_source "/features/Auth/"     "/features/auth/"
replace_in_source "/features/Home/"     "/features/home/"
replace_in_source "/features/Inventory/" "/features/inventory/"
replace_in_source "/features/Order/"    "/features/order/"
replace_in_source "/features/POS/"      "/features/pos/"
replace_in_source "/features/Products/" "/features/products/"
replace_in_source "/features/Sales/"    "/features/sales/"
replace_in_source "/features/Settings/" "/features/settings/"
replace_in_source "/features/Shop/"     "/features/shop/"

ok "Import statements updated"

echo ""
echo "Verifying Phase 2..."
REMAINING_CAPS=$(grep -rE "from '(@|\.\.?/).*features/[A-Z]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$REMAINING_CAPS" -gt 0 ]; then
  warn "Found $REMAINING_CAPS remaining PascalCase import(s) - may need manual review:"
  grep -rE "from '(@|\.\.?/).*features/[A-Z]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
else
  ok "No remaining PascalCase feature imports found"
fi

# ============================================================
# SUMMARY
# ============================================================

echo ""
echo "=========================================="
echo "  Migration Complete!"
echo "=========================================="
echo ""
echo "Final structure:"
find src/features -maxdepth 1 -type d | tail -n +2 | sort | while read dir; do
  feature=$(basename "$dir")
  file_count=$(find "$dir" -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
  echo "  src/features/$feature/ ($file_count files)"
done

echo ""
echo "Next steps:"
echo ""
echo "  1. Run TypeScript check:"
echo "       npx tsc --noEmit"
echo ""
echo "  2. Run linter:"
echo "       npm run lint"
echo ""
echo "  3. Start dev server and test all routes:"
echo "       npm run dev"
echo ""
echo "  4. If all good, commit:"
echo "       git add ."
echo "       git commit -m 'refactor: rename pages to features with lowercase directories'"
echo ""
