// Inventory Item Manage Page - View item details, transactions, and perform inventory operations

import {
  IonRefresher,
  IonRefresherContent,
  type RefresherEventDetail,
  useIonLoading,
} from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CenteredLayout, PageWithCollapsibleHeader } from '@/components/layouts';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import PageLoadingState from '@/components/shared/PageLoadingState';
import PageNotFoundState from '@/components/shared/PageNotFoundState';
import {
  useDeleteInventoryItem,
  useDeletePackageSize,
  useInventoryItem,
  useInventoryTransactionsInfinite,
  usePackageSizes,
  useUpdateInventoryItem,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { PackageSize } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import AdjustInventoryModal from '../../components/items/modals/AdjustInventoryModal';
import InventoryItemDetailContent from '../../components/items/sections/InventoryItemDetailContent';
import InitiateCountModal from '../../components/items/modals/InitiateCountModal';
import InventoryItemFormModal from '../../components/items/modals/InventoryItemFormModal';
import PackageSizeFormModal from '../../components/package-sizes/modals/PackageSizeFormModal';
import ReceiveInventoryModal from '../../components/items/modals/ReceiveInventoryModal';

interface RouteParams {
  itemId: string;
}

const InventoryItemManagePage: React.FC = () => {
  const { itemId } = useParams<RouteParams>();
  const history = useHistory();

  // Hooks
  const { currentShop, hasPermission } = useShop();
  const { data: item, isLoading: itemLoading, refetch: refetchItem } = useInventoryItem(itemId);
  const deleteItem = useDeleteInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  // Package size mutations
  const deletePackageSize = useDeletePackageSize();

  // Modal states
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showPackageSizeModal, setShowPackageSizeModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageSize | null>(null);
  const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);
  const [selectedFilter] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<'transactions' | 'manage'>('transactions');

  // Transactions with infinite scroll
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInventoryTransactionsInfinite(
    itemId,
    selectedFilter ? { transactionType: selectedFilter, pageSize: 5 } : { pageSize: 5 }
  );

  // Flatten paginated transactions data
  const transactions = transactionsData?.pages.flatMap((page) => page.data) ?? [];

  // Package sizes
  const { data: packageSizes } = usePackageSizes(itemId);

  // Permissions
  const canEdit = hasPermission('staff');
  const canDelete = hasPermission('manager');

  // Delete handler
  const handleDelete = async () => {
    if (!item) return;

    try {
      await present({ message: 'Deleting...' });
      await deleteItem.mutateAsync(itemId);
      showSuccess('Inventory item deleted successfully');
      history.replace(`/shops/${currentShop?.id}/inventory`);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to delete inventory item');
    } finally {
      await dismiss();
    }
  };

  // Handlers
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([refetchItem(), refetchTransactions()]);
    event.detail.complete();
  };

  const navigateToEdit = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    refetchItem();
  };

  const handleViewAllTransactions = () => {
    history.push(`/shops/${currentShop?.id}/inventory/${itemId}/transactions`);
  };

  const navigateToTransactionDetails = (transactionId: string) => {
    history.push(`/shops/${currentShop?.id}/inventory/${itemId}/transactions/${transactionId}`);
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
    if (!deletingPackageId) return;

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
    if (!item) return;
    try {
      await updateItem.mutateAsync({ itemId, data: { image_url: url } });
      refetchItem();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to update image');
    }
  };

  // Create currency formatter with shop's currency
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Loading state
  if (itemLoading) {
    return <PageLoadingState backHref={`/shops/${currentShop?.id}/inventory`} />;
  }

  if (!item) {
    return (
      <PageNotFoundState
        backHref={`/shops/${currentShop?.id}/inventory`}
        title="Item Not Found"
        message="Item not found"
      />
    );
  }

  return (
    <PageWithCollapsibleHeader
      title={item.name}
      backHref={`/shops/${currentShop?.id}/inventory`}
      isLoading={itemLoading}
      notFound={!itemLoading && !item}
    >
      {/* Pull to refresh */}
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

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
          onImageUploaded={handleImageUploaded}
          onSegmentChange={setSelectedSegment}
          onReceive={() => setShowReceiveModal(true)}
          onAdjust={() => setShowAdjustModal(true)}
          onInitiateCount={() => setShowCountModal(true)}
          onTransactionClick={navigateToTransactionDetails}
          onReceiveClick={() => setShowReceiveModal(true)}
          onLoadMore={() => fetchNextPage()}
          onAddPackageSize={handleAddPackageSize}
          onEditPackageSize={handleEditPackageSize}
          onDeletePackageSize={handleDeletePackageSize}
          onDeleteItem={() => setShowDeleteAlert(true)}
          onViewAllTransactions={handleViewAllTransactions}
        />
      </CenteredLayout>

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


      {/* Delete Confirmation */}
      {item && (
        <DeleteConfirmationAlert
          isOpen={showDeleteAlert}
          onDismiss={() => setShowDeleteAlert(false)}
          onConfirm={handleDelete}
          itemName={item.name}
          itemType="Inventory Item"
        />
      )}

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

      {/* Delete Package Size Confirmation */}
      <DeleteConfirmationAlert
        isOpen={deletingPackageId !== null}
        onConfirm={confirmDeletePackageSize}
        onDismiss={() => setDeletingPackageId(null)}
        itemName="package size"
      />
    </PageWithCollapsibleHeader>
  );
};

export default InventoryItemManagePage;
