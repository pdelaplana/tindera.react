// InventoryItemDetailContent - Shared inventory item detail content

import type React from 'react';
import styled from 'styled-components';
import { CardContainer, DeleteButton } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import type { InventoryItemWithCategory, InventoryTransaction, PackageSize } from '@/types';
import PackageSizesList from '../../package-sizes/lists/PackageSizesList';
import InventoryActionsCard from '../cards/InventoryActionsCard';
import InventoryGeneralDetailsCard from '../cards/InventoryGeneralDetailsCard';
import InventoryTransactionSummaryCard from '../cards/InventoryTransactionSummaryCard';
import InventoryImageSection from './InventoryImageSection';

interface InventoryItemDetailContentProps {
  item: InventoryItemWithCategory;
  shopId: string;
  transactions: InventoryTransaction[];
  transactionsLoading: boolean;
  packageSizes: PackageSize[];
  selectedSegment: 'transactions' | 'manage';
  formatCurrency: (amount: number) => string;
  canEdit: boolean;
  canDelete: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalReceipts?: number;
  totalSales?: number;
  totalValueIn?: number;
  totalValueOut?: number;
  onImageUploaded: (url: string) => void;
  onSegmentChange: (segment: 'transactions' | 'manage') => void;
  onReceive: () => void;
  onAdjust: () => void;
  onInitiateCount: () => void;
  onTransactionClick: (transactionId: string) => void;
  onReceiveClick: () => void;
  onLoadMore: () => void;
  onAddPackageSize: () => void;
  onEditPackageSize: (pkg: PackageSize) => void;
  onDeletePackageSize: (packageId: string) => void;
  onDeleteItem: () => void;
  onViewAllTransactions?: () => void;
}

const DangerCardContainer = styled(CardContainer)`
  margin-top: ${designSystem.spacing.xl};
  border: 1px solid ${designSystem.colors.danger};

  h2 {
    color: ${designSystem.colors.danger};
  }
`;

const DangerZoneContent = styled.div`
  padding: ${designSystem.spacing.md};
  display: flex;
  flex-direction: column;
`;

const DangerZoneDescription = styled.p`
  margin: 0 0 ${designSystem.spacing.md} 0;
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const InventoryItemDetailContent: React.FC<InventoryItemDetailContentProps> = ({
  item,
  shopId,
  packageSizes,
  formatCurrency,
  canEdit,
  canDelete,
  totalReceipts,
  totalSales,
  totalValueIn,
  totalValueOut,
  onImageUploaded,
  onReceive,
  onAdjust,
  onInitiateCount,
  onAddPackageSize,
  onEditPackageSize,
  onDeletePackageSize,
  onDeleteItem,
  onViewAllTransactions,
}) => {
  return (
    <>
      {/* Image Section */}
      <InventoryImageSection
        imageUrl={item.image_url}
        itemId={item.id}
        shopId={shopId}
        onImageUploaded={onImageUploaded}
        disabled={!canEdit}
      />

      {/* General Details Card */}
      <InventoryGeneralDetailsCard item={item} disabled={!canEdit} />

      {/* Transaction Summary Card */}
      <InventoryTransactionSummaryCard
        baseUom={item.base_uom}
        currentCount={item.current_count}
        unitCost={item.unit_cost}
        totalReceipts={totalReceipts}
        totalSales={totalSales}
        totalValueIn={totalValueIn}
        totalValueOut={totalValueOut}
        formatCurrency={formatCurrency}
        onViewAllClick={onViewAllTransactions}
      />

      {/* Actions Card */}
      <InventoryActionsCard
        onReceive={onReceive}
        onAdjust={onAdjust}
        onInitiateCount={onInitiateCount}
        disabled={!canEdit}
      />
      {/* Package Sizes */}
      <PackageSizesList
        packageSizes={packageSizes}
        baseUom={item.base_uom}
        formatCurrency={formatCurrency}
        onAdd={onAddPackageSize}
        onEdit={onEditPackageSize}
        onDelete={onDeletePackageSize}
        canEdit={canEdit}
      />

      {/* Danger Zone */}
      {canDelete && (
        <DangerCardContainer title="Danger Zone">
          <DangerZoneContent>
            <DangerZoneDescription>
              Deleting this inventory item will permanently remove it and all its transaction
              history. This action cannot be undone.
            </DangerZoneDescription>
            <DeleteButton
              isDeleting={false}
              onClick={onDeleteItem}
              label="Delete Inventory Item"
              fill="solid"
              expand="block"
            />
          </DangerZoneContent>
        </DangerCardContainer>
      )}
    </>
  );
};

export default InventoryItemDetailContent;
