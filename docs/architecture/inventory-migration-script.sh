#!/bin/bash

# Inventory Folder Reorganization Migration Script
# This script reorganizes the Inventory folder structure from flat to feature-based organization
#
# Usage: bash docs/architecture/inventory-migration-script.sh
#
# NOTE: This script is for reference. Review and test in a feature branch before running.

set -e  # Exit on error

INVENTORY_PATH="src/pages/Inventory"
COMPONENTS_PATH="${INVENTORY_PATH}/components"

echo "=========================================="
echo "Inventory Folder Reorganization Script"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will reorganize the Inventory folder structure."
echo "⚠️  Make sure you have committed all changes and are on a feature branch!"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Starting migration..."
echo ""

# Phase 1: Create new directory structure
echo "Phase 1: Creating new directory structure..."
mkdir -p "${INVENTORY_PATH}/pages"
mkdir -p "${COMPONENTS_PATH}/items/panels"
mkdir -p "${COMPONENTS_PATH}/items/cards"
mkdir -p "${COMPONENTS_PATH}/items/lists"
mkdir -p "${COMPONENTS_PATH}/items/modals"
mkdir -p "${COMPONENTS_PATH}/items/sections"
mkdir -p "${COMPONENTS_PATH}/transactions/panels"
mkdir -p "${COMPONENTS_PATH}/transactions/cards"
mkdir -p "${COMPONENTS_PATH}/transactions/lists"
mkdir -p "${COMPONENTS_PATH}/transactions/sections"
mkdir -p "${COMPONENTS_PATH}/package-sizes/modals"
mkdir -p "${COMPONENTS_PATH}/package-sizes/lists"
mkdir -p "${COMPONENTS_PATH}/package-sizes/cards"
mkdir -p "${COMPONENTS_PATH}/categories"
mkdir -p "${COMPONENTS_PATH}/shared"
echo "✓ Directory structure created"
echo ""

# Phase 2: Move page components
echo "Phase 2: Moving page components..."
git mv "${INVENTORY_PATH}/InventoryListPage.tsx" "${INVENTORY_PATH}/pages/" 2>/dev/null || mv "${INVENTORY_PATH}/InventoryListPage.tsx" "${INVENTORY_PATH}/pages/"
git mv "${INVENTORY_PATH}/InventoryItemManagePage.tsx" "${INVENTORY_PATH}/pages/" 2>/dev/null || mv "${INVENTORY_PATH}/InventoryItemManagePage.tsx" "${INVENTORY_PATH}/pages/"
git mv "${INVENTORY_PATH}/InventoryTransactionsPage.tsx" "${INVENTORY_PATH}/pages/" 2>/dev/null || mv "${INVENTORY_PATH}/InventoryTransactionsPage.tsx" "${INVENTORY_PATH}/pages/"
git mv "${INVENTORY_PATH}/InventoryTransactionDetailsPage.tsx" "${INVENTORY_PATH}/pages/" 2>/dev/null || mv "${INVENTORY_PATH}/InventoryTransactionDetailsPage.tsx" "${INVENTORY_PATH}/pages/"
git mv "${INVENTORY_PATH}/InventoryCategoriesListPage.tsx" "${INVENTORY_PATH}/pages/" 2>/dev/null || mv "${INVENTORY_PATH}/InventoryCategoriesListPage.tsx" "${INVENTORY_PATH}/pages/"
git mv "${INVENTORY_PATH}/PackageSizesPage.tsx" "${INVENTORY_PATH}/pages/" 2>/dev/null || mv "${INVENTORY_PATH}/PackageSizesPage.tsx" "${INVENTORY_PATH}/pages/"
echo "✓ Page components moved"
echo ""

# Phase 3: Move item-related components
echo "Phase 3: Moving item-related components..."

# Panels
git mv "${COMPONENTS_PATH}/InventoryItemDetailPanel.tsx" "${COMPONENTS_PATH}/items/panels/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryItemDetailPanel.tsx" "${COMPONENTS_PATH}/items/panels/"

# Cards
git mv "${COMPONENTS_PATH}/details/InventoryGeneralDetailsCard.tsx" "${COMPONENTS_PATH}/items/cards/" 2>/dev/null || mv "${COMPONENTS_PATH}/details/InventoryGeneralDetailsCard.tsx" "${COMPONENTS_PATH}/items/cards/"
git mv "${COMPONENTS_PATH}/details/InventoryActionsCard.tsx" "${COMPONENTS_PATH}/items/cards/" 2>/dev/null || mv "${COMPONENTS_PATH}/details/InventoryActionsCard.tsx" "${COMPONENTS_PATH}/items/cards/"
git mv "${COMPONENTS_PATH}/InventoryItemSummary.tsx" "${COMPONENTS_PATH}/items/cards/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryItemSummary.tsx" "${COMPONENTS_PATH}/items/cards/"

# Lists
git mv "${COMPONENTS_PATH}/InventoryItemListItem.tsx" "${COMPONENTS_PATH}/items/lists/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryItemListItem.tsx" "${COMPONENTS_PATH}/items/lists/"

# Modals
git mv "${COMPONENTS_PATH}/InventoryItemFormModal.tsx" "${COMPONENTS_PATH}/items/modals/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryItemFormModal.tsx" "${COMPONENTS_PATH}/items/modals/"
git mv "${COMPONENTS_PATH}/ReceiveInventoryModal.tsx" "${COMPONENTS_PATH}/items/modals/" 2>/dev/null || mv "${COMPONENTS_PATH}/ReceiveInventoryModal.tsx" "${COMPONENTS_PATH}/items/modals/"
git mv "${COMPONENTS_PATH}/AdjustInventoryModal.tsx" "${COMPONENTS_PATH}/items/modals/" 2>/dev/null || mv "${COMPONENTS_PATH}/AdjustInventoryModal.tsx" "${COMPONENTS_PATH}/items/modals/"
git mv "${COMPONENTS_PATH}/InitiateCountModal.tsx" "${COMPONENTS_PATH}/items/modals/" 2>/dev/null || mv "${COMPONENTS_PATH}/InitiateCountModal.tsx" "${COMPONENTS_PATH}/items/modals/"

# Sections
git mv "${COMPONENTS_PATH}/details/InventoryItemDetailContent.tsx" "${COMPONENTS_PATH}/items/sections/" 2>/dev/null || mv "${COMPONENTS_PATH}/details/InventoryItemDetailContent.tsx" "${COMPONENTS_PATH}/items/sections/"
git mv "${COMPONENTS_PATH}/details/InventoryImageSection.tsx" "${COMPONENTS_PATH}/items/sections/" 2>/dev/null || mv "${COMPONENTS_PATH}/details/InventoryImageSection.tsx" "${COMPONENTS_PATH}/items/sections/"
git mv "${COMPONENTS_PATH}/details/InventoryActionButtons.tsx" "${COMPONENTS_PATH}/items/sections/" 2>/dev/null || mv "${COMPONENTS_PATH}/details/InventoryActionButtons.tsx" "${COMPONENTS_PATH}/items/sections/"

echo "✓ Item components moved"
echo ""

# Phase 4: Move transaction-related components
echo "Phase 4: Moving transaction-related components..."

# Panels
git mv "${COMPONENTS_PATH}/InventoryTransactionsListPanel.tsx" "${COMPONENTS_PATH}/transactions/panels/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryTransactionsListPanel.tsx" "${COMPONENTS_PATH}/transactions/panels/"
git mv "${COMPONENTS_PATH}/InventoryTransactionDetailsPanel.tsx" "${COMPONENTS_PATH}/transactions/panels/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryTransactionDetailsPanel.tsx" "${COMPONENTS_PATH}/transactions/panels/"

# Cards
git mv "${COMPONENTS_PATH}/InventoryTransactionsSummaryCard.tsx" "${COMPONENTS_PATH}/transactions/cards/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryTransactionsSummaryCard.tsx" "${COMPONENTS_PATH}/transactions/cards/"
git mv "${COMPONENTS_PATH}/details/InventoryTransactionSummaryCard.tsx" "${COMPONENTS_PATH}/transactions/cards/" 2>/dev/null || mv "${COMPONENTS_PATH}/details/InventoryTransactionSummaryCard.tsx" "${COMPONENTS_PATH}/transactions/cards/"

# Lists
git mv "${COMPONENTS_PATH}/InventoryTransactionsList.tsx" "${COMPONENTS_PATH}/transactions/lists/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryTransactionsList.tsx" "${COMPONENTS_PATH}/transactions/lists/"
git mv "${COMPONENTS_PATH}/transactions/InventoryTransactionsContent.tsx" "${COMPONENTS_PATH}/transactions/lists/" 2>/dev/null || mv "${COMPONENTS_PATH}/transactions/InventoryTransactionsContent.tsx" "${COMPONENTS_PATH}/transactions/lists/"

# Sections
git mv "${COMPONENTS_PATH}/InventoryTransactionDetailsContent.tsx" "${COMPONENTS_PATH}/transactions/sections/" 2>/dev/null || mv "${COMPONENTS_PATH}/InventoryTransactionDetailsContent.tsx" "${COMPONENTS_PATH}/transactions/sections/"

echo "✓ Transaction components moved"
echo ""

# Phase 5: Move package size components
echo "Phase 5: Moving package size components..."

# Modals
git mv "${COMPONENTS_PATH}/PackageSizeFormModal.tsx" "${COMPONENTS_PATH}/package-sizes/modals/" 2>/dev/null || mv "${COMPONENTS_PATH}/PackageSizeFormModal.tsx" "${COMPONENTS_PATH}/package-sizes/modals/"

# Lists
git mv "${COMPONENTS_PATH}/PackageSizesList.tsx" "${COMPONENTS_PATH}/package-sizes/lists/" 2>/dev/null || mv "${COMPONENTS_PATH}/PackageSizesList.tsx" "${COMPONENTS_PATH}/package-sizes/lists/"
git mv "${COMPONENTS_PATH}/PackageSizeListItem.tsx" "${COMPONENTS_PATH}/package-sizes/lists/" 2>/dev/null || mv "${COMPONENTS_PATH}/PackageSizeListItem.tsx" "${COMPONENTS_PATH}/package-sizes/lists/"

echo "✓ Package size components moved"
echo ""

# Phase 6: Clean up old directories
echo "Phase 6: Cleaning up old directories..."
rmdir "${COMPONENTS_PATH}/details" 2>/dev/null || echo "  Note: details/ directory not empty or already removed"
rmdir "${COMPONENTS_PATH}/transactions" 2>/dev/null || echo "  Note: transactions/ directory not empty or already removed"
echo "✓ Cleanup complete"
echo ""

# Phase 7: Create index.ts files for barrel exports
echo "Phase 7: Creating index.ts files for barrel exports..."

cat > "${COMPONENTS_PATH}/items/index.ts" << 'EOF'
// Item panels
export { default as InventoryItemDetailPanel } from './panels/InventoryItemDetailPanel';

// Item cards
export { default as InventoryGeneralDetailsCard } from './cards/InventoryGeneralDetailsCard';
export { default as InventoryActionsCard } from './cards/InventoryActionsCard';
export { default as InventoryItemSummary } from './cards/InventoryItemSummary';

// Item lists
export { default as InventoryItemListItem } from './lists/InventoryItemListItem';

// Item modals
export { default as InventoryItemFormModal } from './modals/InventoryItemFormModal';
export { default as ReceiveInventoryModal } from './modals/ReceiveInventoryModal';
export { default as AdjustInventoryModal } from './modals/AdjustInventoryModal';
export { default as InitiateCountModal } from './modals/InitiateCountModal';

// Item sections
export { default as InventoryItemDetailContent } from './sections/InventoryItemDetailContent';
export { default as InventoryImageSection } from './sections/InventoryImageSection';
export { default as InventoryActionButtons } from './sections/InventoryActionButtons';
EOF

cat > "${COMPONENTS_PATH}/transactions/index.ts" << 'EOF'
// Transaction panels
export { default as InventoryTransactionsListPanel } from './panels/InventoryTransactionsListPanel';
export { default as InventoryTransactionDetailsPanel } from './panels/InventoryTransactionDetailsPanel';

// Transaction cards
export { default as InventoryTransactionsSummaryCard } from './cards/InventoryTransactionsSummaryCard';
export { default as InventoryTransactionSummaryCard } from './cards/InventoryTransactionSummaryCard';

// Transaction lists
export { default as InventoryTransactionsList } from './lists/InventoryTransactionsList';
export { default as InventoryTransactionsContent } from './lists/InventoryTransactionsContent';

// Transaction sections
export { default as InventoryTransactionDetailsContent } from './sections/InventoryTransactionDetailsContent';
EOF

cat > "${COMPONENTS_PATH}/package-sizes/index.ts" << 'EOF'
// Package size modals
export { default as PackageSizeFormModal } from './modals/PackageSizeFormModal';

// Package size lists
export { default as PackageSizesList } from './lists/PackageSizesList';
export { default as PackageSizeListItem } from './lists/PackageSizeListItem';
EOF

echo "✓ Index files created"
echo ""

echo "=========================================="
echo "Migration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update import paths in all files that import these components"
echo "2. Run TypeScript compiler to check for errors: npm run type-check"
echo "3. Run tests: npm test"
echo "4. Run the application and test manually"
echo "5. Update the main index.ts file if needed"
echo ""
echo "Import path update hints:"
echo "  Old: import X from './components/X'"
echo "  New: import X from './components/items/panels/X'  (or use barrel: ./components/items)"
echo ""
echo "  Old: import X from './components/details/X'"
echo "  New: import X from './components/items/cards/X'  (or sections/)"
echo ""
echo "  Old: import X from './components/transactions/X'"
echo "  New: import X from './components/transactions/lists/X'"
echo ""
