// Inventory Item Manage Page - View item details, transactions, and perform inventory operations

import {
  IonActionSheet,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  type RefresherEventDetail,
  useIonLoading,
} from '@ionic/react';
import { close, cubeOutline, list, trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CenteredLayout, PageWithCollapsibleHeader } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import PageLoadingState from '@/components/shared/PageLoadingState';
import PageNotFoundState from '@/components/shared/PageNotFoundState';
import {
  useDeleteInventoryItem,
  useDeletePackageSize,
  useInventoryItem,
  useInventoryTransactionsInfinite,
  usePackageSizes,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { PackageSize } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import AdjustInventoryModal from './components/AdjustInventoryModal';
import InitiateCountModal from './components/InitiateCountModal';
import InventoryActionButtons from './components/InventoryActionButtons';
import InventoryItemFormModal from './components/InventoryItemFormModal';
import InventoryItemSummary from './components/InventoryItemSummary';
import InventoryTransactionsList from './components/InventoryTransactionsList';
import PackageSizeFormModal from './components/PackageSizeFormModal';
import PackageSizesList from './components/PackageSizesList';
import ReceiveInventoryModal from './components/ReceiveInventoryModal';

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
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  // Package size mutations
  const deletePackageSize = useDeletePackageSize();

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
  const [selectedFilter] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<'transactions' | 'manage'>('transactions');

  // Ref for collapsible header
  const itemNameRef = useRef<HTMLDivElement>(null);
  const observedElementRef = itemNameRef as React.RefObject<HTMLElement>;

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
  const canDelete = hasPermission('admin');

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

  const handleOptions = () => {
    setShowOptionsSheet(true);
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
      observedElementRef={observedElementRef}
      isLoading={itemLoading}
      notFound={!itemLoading && !item}
    >
      {/* Pull to refresh */}
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      {/* Top Section - Item Summary and Action Buttons */}
      <Div
        style={{
          paddingBottom: '24px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--ion-color-light-shade)',
        }}
      >
        <CenteredLayout>
          <Div style={{ maxWidth: '800px', width: '100%', padding: '16px' }}>
            {/* Item Summary Section */}
            <div ref={itemNameRef}>
              <InventoryItemSummary
                name={item.name}
                description={item.description}
                sku={item.sku}
                imageUrl={item.image_url}
                unitCost={item.unit_cost}
                currentCount={item.current_count}
                base_uom={item.base_uom}
                formatCurrency={formatCurrency}
              />
            </div>

            {/* Action Buttons */}
            <InventoryActionButtons
              onEdit={navigateToEdit}
              onReceive={() => setShowReceiveModal(true)}
              onAdjust={() => setShowAdjustModal(true)}
              onOptions={handleOptions}
              disabled={!canEdit}
            />
          </Div>
        </CenteredLayout>
      </Div>

      {/* Segment Control */}
      <CenteredLayout>
        <Div style={{ maxWidth: '800px', width: '100%' }}>
          <IonSegment
            color="dark"
            value={selectedSegment}
            onIonChange={(e) => setSelectedSegment(e.detail.value as 'transactions' | 'manage')}
          >
            <IonSegmentButton value="transactions" color="dark">
              <IonLabel color="dark" className="ion-text-capitalize">
                Transactions
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="manage" color="dark">
              <IonLabel color="dark" className="ion-text-capitalize">
                Manage
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </Div>
      </CenteredLayout>

      {/* Content Section - Conditional based on segment */}
      <CenteredLayout>
        {selectedSegment === 'transactions' ? (
          <InventoryTransactionsList
            transactions={transactions}
            isLoading={transactionsLoading}
            baseUom={item.base_uom}
            canEdit={canEdit}
            onTransactionClick={navigateToTransactionDetails}
            onReceiveClick={() => setShowReceiveModal(true)}
            onLoadMore={() => fetchNextPage()}
            hasMore={hasNextPage ?? false}
            isLoadingMore={isFetchingNextPage}
          />
        ) : (
          <>
            {/* Manage Section - Package Sizes */}
            <PackageSizesList
              packageSizes={packageSizes || []}
              baseUom={item.base_uom}
              formatCurrency={formatCurrency}
              onAdd={handleAddPackageSize}
              onEdit={handleEditPackageSize}
              onDelete={handleDeletePackageSize}
              canEdit={canEdit}
            />
          </>
        )}
      </CenteredLayout>

      {/* Modals */}
      <ReceiveInventoryModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        itemId={item.id}
        itemName={item.name}
        defaultUnitCost={item.unit_cost}
        baseUom={item.base_uom}
      />

      <AdjustInventoryModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        itemId={item.id}
        itemName={item.name}
      />

      <InitiateCountModal isOpen={showCountModal} onClose={() => setShowCountModal(false)} />

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
              history.push(`/shops/${currentShop?.id}/inventory/${item?.id}/packages`);
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
