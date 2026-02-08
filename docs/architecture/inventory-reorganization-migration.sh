#!/bin/bash

# Inventory Component Reorganization Migration Script
# Moves components from flat/inconsistent structure to feature-based subdirectories
#
# Usage: bash docs/architecture/inventory-reorganization-migration.sh
# Run from: project root

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

BASE="src/features/inventory"
COMP="${BASE}/components"

echo ""
echo "=========================================="
echo "  Inventory Component Reorganization"
echo "=========================================="
echo ""

# Preflight
[ ! -f "package.json" ] && fail "Run from project root"
[ -n "$(git status --porcelain)" ] && fail "Working tree not clean. Commit changes first."

echo "This script reorganizes inventory components into:"
echo "  components/items/{panels,cards,lists,modals,sections}"
echo "  components/transactions/{panels,cards,lists,sections}"
echo "  components/package-sizes/{modals,lists}"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
[[ ! $REPLY =~ ^[Yy]$ ]] && { echo "Aborted."; exit 0; }

# ============================================================
# PHASE 1: CREATE DIRECTORY STRUCTURE
# ============================================================

echo ""
echo "------------------------------------------"
echo "  Phase 1: Creating directory structure"
echo "------------------------------------------"
echo ""

mkdir -p "${COMP}/items/panels"
mkdir -p "${COMP}/items/cards"
mkdir -p "${COMP}/items/lists"
mkdir -p "${COMP}/items/modals"
mkdir -p "${COMP}/items/sections"
mkdir -p "${COMP}/transactions/panels"
mkdir -p "${COMP}/transactions/cards"
mkdir -p "${COMP}/transactions/lists"
mkdir -p "${COMP}/transactions/sections"
mkdir -p "${COMP}/package-sizes/modals"
mkdir -p "${COMP}/package-sizes/lists"
ok "Directory structure created"

# ============================================================
# PHASE 2: MOVE FILES
# ============================================================

echo ""
echo "------------------------------------------"
echo "  Phase 2: Moving files"
echo "------------------------------------------"
echo ""

echo "Items..."
git mv "${COMP}/InventoryItemDetailPanel.tsx"       "${COMP}/items/panels/"
git mv "${COMP}/details/InventoryGeneralDetailsCard.tsx" "${COMP}/items/cards/"
git mv "${COMP}/details/InventoryActionsCard.tsx"   "${COMP}/items/cards/"
git mv "${COMP}/InventoryItemSummary.tsx"           "${COMP}/items/cards/"
git mv "${COMP}/InventoryItemListItem.tsx"          "${COMP}/items/lists/"
git mv "${COMP}/InventoryItemFormModal.tsx"         "${COMP}/items/modals/"
git mv "${COMP}/ReceiveInventoryModal.tsx"          "${COMP}/items/modals/"
git mv "${COMP}/AdjustInventoryModal.tsx"           "${COMP}/items/modals/"
git mv "${COMP}/InitiateCountModal.tsx"             "${COMP}/items/modals/"
git mv "${COMP}/details/InventoryItemDetailContent.tsx" "${COMP}/items/sections/"
git mv "${COMP}/details/InventoryImageSection.tsx"  "${COMP}/items/sections/"
git mv "${COMP}/details/InventoryActionButtons.tsx" "${COMP}/items/sections/"
ok "Items moved"

echo "Transactions..."
git mv "${COMP}/InventoryTransactionsListPanel.tsx"    "${COMP}/transactions/panels/"
git mv "${COMP}/InventoryTransactionDetailsPanel.tsx"  "${COMP}/transactions/panels/"
git mv "${COMP}/InventoryTransactionsSummaryCard.tsx"  "${COMP}/transactions/cards/"
git mv "${COMP}/details/InventoryTransactionSummaryCard.tsx" "${COMP}/transactions/cards/"
git mv "${COMP}/InventoryTransactionsList.tsx"         "${COMP}/transactions/lists/"
git mv "${COMP}/transactions/InventoryTransactionsContent.tsx" "${COMP}/transactions/lists/"
git mv "${COMP}/InventoryTransactionDetailsContent.tsx" "${COMP}/transactions/sections/"
ok "Transactions moved"

echo "Package sizes..."
git mv "${COMP}/PackageSizeFormModal.tsx"  "${COMP}/package-sizes/modals/"
git mv "${COMP}/PackageSizesList.tsx"      "${COMP}/package-sizes/lists/"
git mv "${COMP}/PackageSizeListItem.tsx"   "${COMP}/package-sizes/lists/"
ok "Package sizes moved"

echo ""
echo "Cleaning up empty old directories..."
rmdir "${COMP}/details"    2>/dev/null && ok "Removed details/" || warn "details/ not empty or missing"
rmdir "${COMP}/transactions" 2>/dev/null && ok "Removed transactions/" || warn "transactions/ not empty or missing"

# ============================================================
# PHASE 3: UPDATE IMPORTS
# ============================================================

echo ""
echo "------------------------------------------"
echo "  Phase 3: Updating import paths"
echo "------------------------------------------"
echo ""

update() {
  find src -type f \( -name "*.tsx" -o -name "*.ts" \) \
    -exec sed -i "s|${1}|${2}|g" {} +
}

echo "Updating item imports..."
update "from './components/InventoryItemDetailPanel'"       "from './components/items/panels/InventoryItemDetailPanel'"
update "from '../components/InventoryItemDetailPanel'"      "from '../components/items/panels/InventoryItemDetailPanel'"
update "from './InventoryGeneralDetailsCard'"               "from './InventoryGeneralDetailsCard'"  # handled below via details/
update "from '../InventoryGeneralDetailsCard'"              "from '../items/cards/InventoryGeneralDetailsCard'"
update "from './details/InventoryGeneralDetailsCard'"       "from '../items/cards/InventoryGeneralDetailsCard'"
update "from '../details/InventoryGeneralDetailsCard'"      "from '../../items/cards/InventoryGeneralDetailsCard'"
update "from './InventoryActionsCard'"                      "from './InventoryActionsCard'"          # handled below
update "from '../InventoryActionsCard'"                     "from '../items/cards/InventoryActionsCard'"
update "from './details/InventoryActionsCard'"              "from '../items/cards/InventoryActionsCard'"
update "from '../details/InventoryActionsCard'"             "from '../../items/cards/InventoryActionsCard'"
update "from './components/InventoryItemSummary'"           "from './components/items/cards/InventoryItemSummary'"
update "from '../components/InventoryItemSummary'"          "from '../components/items/cards/InventoryItemSummary'"
update "from './components/InventoryItemListItem'"          "from './components/items/lists/InventoryItemListItem'"
update "from '../components/InventoryItemListItem'"         "from '../components/items/lists/InventoryItemListItem'"
update "from './components/InventoryItemFormModal'"         "from './components/items/modals/InventoryItemFormModal'"
update "from '../components/InventoryItemFormModal'"        "from '../components/items/modals/InventoryItemFormModal'"
update "from './InventoryItemFormModal'"                    "from '../items/modals/InventoryItemFormModal'"
update "from './components/ReceiveInventoryModal'"          "from './components/items/modals/ReceiveInventoryModal'"
update "from '../components/ReceiveInventoryModal'"         "from '../components/items/modals/ReceiveInventoryModal'"
update "from './ReceiveInventoryModal'"                     "from '../items/modals/ReceiveInventoryModal'"
update "from './components/AdjustInventoryModal'"           "from './components/items/modals/AdjustInventoryModal'"
update "from '../components/AdjustInventoryModal'"          "from '../components/items/modals/AdjustInventoryModal'"
update "from './AdjustInventoryModal'"                      "from '../items/modals/AdjustInventoryModal'"
update "from './components/InitiateCountModal'"             "from './components/items/modals/InitiateCountModal'"
update "from '../components/InitiateCountModal'"            "from '../components/items/modals/InitiateCountModal'"
update "from './InitiateCountModal'"                        "from '../items/modals/InitiateCountModal'"
update "from './details/InventoryItemDetailContent'"        "from '../items/sections/InventoryItemDetailContent'"
update "from '../details/InventoryItemDetailContent'"       "from '../../items/sections/InventoryItemDetailContent'"
update "from './details/InventoryImageSection'"             "from '../items/sections/InventoryImageSection'"
update "from './InventoryImageSection'"                     "from './InventoryImageSection'"         # handled below
update "from './details/InventoryActionButtons'"            "from '../items/sections/InventoryActionButtons'"
ok "Item imports updated"

echo "Updating transaction imports..."
update "from './components/InventoryTransactionsListPanel'"    "from './components/transactions/panels/InventoryTransactionsListPanel'"
update "from '../components/InventoryTransactionsListPanel'"   "from '../components/transactions/panels/InventoryTransactionsListPanel'"
update "from './InventoryTransactionsListPanel'"               "from '../transactions/panels/InventoryTransactionsListPanel'"
update "from './components/InventoryTransactionDetailsPanel'"  "from './components/transactions/panels/InventoryTransactionDetailsPanel'"
update "from '../components/InventoryTransactionDetailsPanel'" "from '../components/transactions/panels/InventoryTransactionDetailsPanel'"
update "from './InventoryTransactionDetailsPanel'"             "from '../transactions/panels/InventoryTransactionDetailsPanel'"
update "from './components/InventoryTransactionsSummaryCard'"  "from './components/transactions/cards/InventoryTransactionsSummaryCard'"
update "from '../components/InventoryTransactionsSummaryCard'" "from '../components/transactions/cards/InventoryTransactionsSummaryCard'"
update "from './InventoryTransactionsSummaryCard'"             "from '../transactions/cards/InventoryTransactionsSummaryCard'"
update "from '../details/InventoryTransactionSummaryCard'"     "from '../../transactions/cards/InventoryTransactionSummaryCard'"
update "from './InventoryTransactionSummaryCard'"              "from '../transactions/cards/InventoryTransactionSummaryCard'"
update "from './components/InventoryTransactionsList'"         "from './components/transactions/lists/InventoryTransactionsList'"
update "from '../components/InventoryTransactionsList'"        "from '../components/transactions/lists/InventoryTransactionsList'"
update "from './transactions/InventoryTransactionsContent'"    "from '../transactions/lists/InventoryTransactionsContent'"
update "from './components/transactions/InventoryTransactionsContent'" "from './components/transactions/lists/InventoryTransactionsContent'"
update "from './components/InventoryTransactionDetailsContent'" "from './components/transactions/sections/InventoryTransactionDetailsContent'"
update "from '../components/InventoryTransactionDetailsContent'" "from '../components/transactions/sections/InventoryTransactionDetailsContent'"
update "from './InventoryTransactionDetailsContent'"           "from '../transactions/sections/InventoryTransactionDetailsContent'"
ok "Transaction imports updated"

echo "Updating package size imports..."
update "from './components/PackageSizeFormModal'"   "from './components/package-sizes/modals/PackageSizeFormModal'"
update "from '../components/PackageSizeFormModal'"  "from '../components/package-sizes/modals/PackageSizeFormModal'"
update "from './PackageSizeFormModal'"              "from '../package-sizes/modals/PackageSizeFormModal'"
update "from './components/PackageSizesList'"       "from './components/package-sizes/lists/PackageSizesList'"
update "from '../components/PackageSizesList'"      "from '../components/package-sizes/lists/PackageSizesList'"
update "from '../PackageSizesList'"                 "from '../package-sizes/lists/PackageSizesList'"
update "from './PackageSizesList'"                  "from '../package-sizes/lists/PackageSizesList'"
update "from './components/PackageSizeListItem'"    "from './components/package-sizes/lists/PackageSizeListItem'"
update "from '../components/PackageSizeListItem'"   "from '../components/package-sizes/lists/PackageSizeListItem'"
update "from './PackageSizeListItem'"               "from '../package-sizes/lists/PackageSizeListItem'"
ok "Package size imports updated"

# ============================================================
# PHASE 4: VERIFY
# ============================================================

echo ""
echo "------------------------------------------"
echo "  Phase 4: Verifying"
echo "------------------------------------------"
echo ""

echo "Checking for broken imports in inventory..."
BROKEN=$(npx tsc --noEmit 2>&1 | grep "inventory" | grep "Cannot find module" | wc -l)
if [ "$BROKEN" -gt 0 ]; then
  warn "Found $BROKEN broken inventory imports:"
  npx tsc --noEmit 2>&1 | grep "inventory" | grep "Cannot find module"
else
  ok "No broken inventory imports"
fi

echo ""
echo "Final structure:"
find "${COMP}" -type f | sort | sed "s|${COMP}/||"

echo ""
echo "=========================================="
echo "  Done! Review output above then commit."
echo "=========================================="
echo ""
