// Inventory Item Detail Panel - Right panel content for master-detail layout

import { IonActionSheet, useIonLoading } from '@ionic/react';
import { close, cubeOutline, list, trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { CenteredLayout, DetailPanel } from '@/components/layouts';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { LoadingSpinner } from '@/components/ui';
import {
  useDeleteInventoryItem,
  useDeletePackageSize,
  useInventoryItem,
  useInventoryItemTransactionsSummary,
  useInventoryTransactionsInfinite,
  usePackageSizes,
  useUpdateInventoryItem,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import { designSystem } from '@/theme/designSystem';
import type { PackageSize } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import PackageSizeFormModal from '../../package-sizes/modals/PackageSizeFormModal';
import InventoryTransactionDetailsPanel from '../../transactions/panels/InventoryTransactionDetailsPanel';
import AdjustInventoryModal from '../modals/AdjustInventoryModal';
import InitiateCountModal from '../modals/InitiateCountModal';
import InventoryItemFormModal from '../modals/InventoryItemFormModal';
import ReceiveInventoryModal from '../modals/ReceiveInventoryModal';
import InventoryItemDetailContent from '../sections/InventoryItemDetailContent';
import InventoryItemTransactionsPanel from './InventoryItemTransactionsPanel';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${designSystem.spacing.xl};
  text-align: center;
`;

const EmptyText = styled.div`
  font-size: ${designSystem.typography.fontSize.lg};
  color: ${designSystem.colors.text.secondary};
`;


interface InventoryItemDetailPanelProps {
  itemId: string | null;
  onItemDeleted?: () => void;
}

const InventoryItemDetailPanel: React.FC<InventoryItemDetailPanelProps> = ({
  itemId,
  onItemDeleted,
}) => {
  const { currentShop, hasPermission } = useShop();
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  // Fetch item data
  const { data: item, isLoading, refetch: refetchItem } = useInventoryItem(itemId || '');
  const deleteItem = useDeleteInventoryItem();
  const updateItem = useUpdateInventoryItem();

  // Modal states
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showPackageSizeModal, setShowPackageSizeModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageSize | null>(null);
  const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<'transactions' | 'manage'>('transactions');

  // Panel navigation state
  type PanelView = 'detail' | 'transactions' | 'transactionDetail';
  const [currentView, setCurrentView] = useState<PanelView>('detail');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Transactions with infinite scroll
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInventoryTransactionsInfinite(itemId || '', { pageSize: 10 });

  // Flatten paginated transactions data
  const transactions = transactionsData?.pages.flatMap((page) => page.data) ?? [];

  // Fetch aggregated transaction summary statistics from the server
  const { data: transactionSummary } = useInventoryItemTransactionsSummary(itemId || '');

  // Package sizes
  const { data: packageSizes } = usePackageSizes(itemId || '');
  const deletePackageSize = useDeletePackageSize();

  // Permissions
  const canEdit = hasPermission('staff');
  const canDelete = hasPermission('admin');

  // Currency formatter
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Delete handler
  const handleDelete = async () => {
    if (!item || !itemId) return;

    try {
      await present({ message: 'Deleting...' });
      await deleteItem.mutateAsync(itemId);
      showSuccess('Inventory item deleted successfully');
      onItemDeleted?.();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to delete inventory item');
    } finally {
      await dismiss();
    }
  };

  // Handlers
  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    refetchItem();
  };

  const handleOptions = () => {
    setShowOptionsSheet(true);
  };

  const handleViewAllTransactions = () => {
    setCurrentView('transactions');
  };

  const handleBackFromTransactions = () => {
    setCurrentView('detail');
  };

  const handleTransactionClick = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setCurrentView('transactionDetail');
  };

  const handleBackFromTransactionDetail = () => {
    setSelectedTransactionId(null);
    setCurrentView('transactions');
  };

  const handleBackToItemFromTransactionDetail = () => {
    setSelectedTransactionId(null);
    setCurrentView('detail');
  };

  // Package size handlers
  const handleAddPackageSize = () => {
    setEditingPackage(null);
    setShowPackageSizeModal(true);
  };

  const handleEditPackageSize = (pkg: PackageSize) => {
    setEditingPackage(pkg);
    setShowPackageSizeModal(true);
  };

  const handleDeletePackageSize = (packageId: string) => {
    setDeletingPackageId(packageId);
  };

  const confirmDeletePackageSize = async () => {
    if (!deletingPackageId || !itemId) return;

    await deletePackageSize.mutateAsync({
      packageId: deletingPackageId,
      itemId: itemId,
    });
    setDeletingPackageId(null);
  };

  const handleClosePackageSizeModal = () => {
    setShowPackageSizeModal(false);
    setEditingPackage(null);
  };

  // Image upload handler
  const handleImageUploaded = async (url: string) => {
    if (!item || !itemId) return;
    try {
      await updateItem.mutateAsync({ itemId, data: { image_url: url } });
      refetchItem();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to update image');
    }
  };

  // No selection state
  if (!itemId) {
    return (
      <Container>
        <EmptyState>
          <EmptyText>Select an inventory item to view details</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Container>
        <EmptyState>
          <LoadingSpinner />
        </EmptyState>
      </Container>
    );
  }

  // Not found state
  if (!item) {
    return (
      <Container>
        <EmptyState>
          <EmptyText>Inventory item not found</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  // Render appropriate panel based on current view
  const renderPanelContent = () => {
    if (currentView === 'transactions') {
      return (
        <InventoryItemTransactionsPanel
          itemId={itemId}
          itemName={item.name}
          onBack={handleBackFromTransactions}
          onTransactionClick={handleTransactionClick}
        />
      );
    }

    if (currentView === 'transactionDetail' && selectedTransactionId) {
      return (
        <InventoryTransactionDetailsPanel
          transactionId={selectedTransactionId}
          itemName={item.name}
          onBack={handleBackFromTransactionDetail}
          onBackToItem={handleBackToItemFromTransactionDetail}
        />
      );
    }

    // Default: detail view
    return (
      <DetailPanel
        title={item.name}
        icon={cubeOutline}
        breadcrumbs={[{ label: item.name }]}
      >
        <CenteredLayout>
          <InventoryItemDetailContent
            item={item}
            shopId={currentShop?.id || ''}
            transactions={transactions}
            transactionsLoading={transactionsLoading}
            packageSizes={packageSizes || []}
            selectedSegment={selectedSegment}
            formatCurrency={formatCurrency}
            canEdit={canEdit}
            canDelete={canDelete}
            hasNextPage={hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
            totalReceipts={transactionSummary?.totalReceipts}
            totalSales={transactionSummary?.totalSales}
            totalValueIn={transactionSummary?.totalValueIn}
            totalValueOut={transactionSummary?.totalValueOut}
            onImageUploaded={handleImageUploaded}
            onSegmentChange={setSelectedSegment}
            onEdit={handleEdit}
            onReceive={() => setShowReceiveModal(true)}
            onAdjust={() => setShowAdjustModal(true)}
            onOptions={handleOptions}
            onTransactionClick={handleTransactionClick}
            onReceiveClick={() => setShowReceiveModal(true)}
            onLoadMore={() => fetchNextPage()}
            onAddPackageSize={handleAddPackageSize}
            onEditPackageSize={handleEditPackageSize}
            onDeletePackageSize={handleDeletePackageSize}
            onDeleteItem={() => setShowDeleteAlert(true)}
            onViewAllTransactions={handleViewAllTransactions}
          />
        </CenteredLayout>
      </DetailPanel>
    );
  };

  return (
    <Container>
      {renderPanelContent()}

      {/* Modals */}
      <ReceiveInventoryModal
        isOpen={showReceiveModal}
        onClose={() => {
          setShowReceiveModal(false);
          refetchItem();
          refetchTransactions();
        }}
        itemId={item.id}
        itemName={item.name}
        defaultUnitCost={item.unit_cost}
        baseUom={item.base_uom}
      />

      <AdjustInventoryModal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false);
          refetchItem();
          refetchTransactions();
        }}
        itemId={item.id}
        itemName={item.name}
      />

      <InitiateCountModal isOpen={showCountModal} onClose={() => setShowCountModal(false)} />

      {/* Edit Item Modal */}
      <InventoryItemFormModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        itemId={itemId}
      />

      {/* Package Size Modal */}
      <PackageSizeFormModal
        isOpen={showPackageSizeModal}
        onClose={handleClosePackageSizeModal}
        itemId={itemId}
        baseUom={item.base_uom}
        editingPackage={editingPackage}
        packageSizesCount={packageSizes?.length || 0}
      />

      {/* Options Action Sheet */}
      <IonActionSheet
        isOpen={showOptionsSheet}
        onDidDismiss={() => setShowOptionsSheet(false)}
        header="Options"
        buttons={[
          {
            text: 'View Package Sizes',
            icon: cubeOutline,
            handler: () => {
              setSelectedSegment('manage');
            },
          },
          {
            text: 'Initiate Count',
            icon: list,
            handler: () => {
              setShowCountModal(true);
            },
          },
          ...(canDelete
            ? [
                {
                  text: 'Delete Item',
                  icon: trashOutline,
                  role: 'destructive' as const,
                  handler: () => {
                    setShowDeleteAlert(true);
                  },
                },
              ]
            : []),
          {
            text: 'Cancel',
            role: 'cancel',
            icon: close,
          },
        ]}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmationAlert
        isOpen={showDeleteAlert}
        onDismiss={() => setShowDeleteAlert(false)}
        onConfirm={handleDelete}
        itemName={item.name}
        itemType="Inventory Item"
      />

      {/* Delete Package Size Confirmation */}
      <DeleteConfirmationAlert
        isOpen={deletingPackageId !== null}
        onConfirm={confirmDeletePackageSize}
        onDismiss={() => setDeletingPackageId(null)}
        itemName="package size"
      />
    </Container>
  );
};

export default InventoryItemDetailPanel;
