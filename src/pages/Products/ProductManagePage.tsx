// Product Manage Page - Manage product items, addons, and view product details

import {
  IonActionSheet,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonText,
  type ItemReorderEventDetail,
  type RefresherEventDetail,
  useIonLoading,
} from '@ionic/react';
import { close, trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CenteredLayout, PageWithCollapsibleHeader } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import PageLoadingState from '@/components/shared/PageLoadingState';
import PageNotFoundState from '@/components/shared/PageNotFoundState';
import { useUnlinkModifierGroup, useUpdateLinkSequence } from '@/hooks';
import {
  useDeleteProduct,
  useProduct,
  useRemoveProductAddon,
  useRemoveProductItem,
} from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { ModifierGroupWithModifiers, ProductAddon, ProductItem } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import {
  ProductActionButtons,
  ProductAddonModal,
  ProductAddonsList,
  ProductFormModal,
  ProductItemModal,
  ProductItemsList,
  ProductModifierModal,
  ProductModifierSelectModal,
  ProductModifiersList,
  ProductSummary,
} from './components';

interface RouteParams {
  id: string;
}

const ProductManagePage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();

  // Hooks
  const { currentShop, hasPermission } = useShop();
  const { data: product, isLoading: productLoading, refetch: refetchProduct } = useProduct(id);
  const deleteProduct = useDeleteProduct();
  const removeProductItem = useRemoveProductItem();
  const removeProductAddon = useRemoveProductAddon();
  const unlinkModifierGroup = useUnlinkModifierGroup();
  const updateLinkSequence = useUpdateLinkSequence();
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showModifierSelectModal, setShowModifierSelectModal] = useState(false);
  const [showPriceOverridesModal, setShowPriceOverridesModal] = useState(false);

  // Selected item/addon states
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<ProductAddon | null>(null);
  const [selectedModifierGroup, setSelectedModifierGroup] =
    useState<ModifierGroupWithModifiers | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<'manage' | 'sales'>('manage');

  // Ref for collapsible header
  const productNameRef = useRef<HTMLHeadingElement>(null);
  const observedElementRef = productNameRef as React.RefObject<HTMLElement>;

  // Permissions
  const canEdit = hasPermission('staff');
  const canDelete = hasPermission('admin');

  // Currency formatter
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Calculate total cost from product items
  const totalCost = useMemo(() => {
    if (!product?.items) return undefined;
    return product.items.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);
  }, [product?.items]);

  // Handlers
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetchProduct();
    event.detail.complete();
  };

  const handleEditProduct = () => {
    setShowProductFormModal(true);
  };

  const handleOptions = () => {
    setShowOptionsSheet(true);
  };

  const handleDeleteProduct = async () => {
    if (!product) return;

    try {
      await present({ message: 'Deleting...' });
      await deleteProduct.mutateAsync(id);
      showSuccess('Product deleted successfully');
      history.replace(`/shops/${currentShop?.id}/products`);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to delete product');
    } finally {
      await dismiss();
    }
  };

  const handleEditItem = (item: ProductItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (item: ProductItem) => {
    try {
      await present({ message: 'Deleting...' });
      await removeProductItem.mutateAsync({ itemId: item.id, productId: id });
      showSuccess('Ingredient removed successfully');
      setSelectedItem(null);
      setShowItemModal(false);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to remove ingredient');
    } finally {
      await dismiss();
    }
  };

  const handleEditAddon = (addon: ProductAddon) => {
    setSelectedAddon(addon);
    setShowAddonModal(true);
  };

  const handleDeleteAddon = async (addon: ProductAddon) => {
    try {
      await present({ message: 'Deleting...' });
      await removeProductAddon.mutateAsync({ addonId: addon.id, productId: id });
      showSuccess('Add-on removed successfully');
      setSelectedAddon(null);
      setShowAddonModal(false);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to remove add-on');
    } finally {
      await dismiss();
    }
  };

  // Global modifier handlers
  const handleAddModifierGroup = () => {
    setShowModifierSelectModal(true);
  };

  const handleEditModifierGroup = (group: ModifierGroupWithModifiers) => {
    setSelectedModifierGroup(group);
    setShowPriceOverridesModal(true);
  };

  const handleUnlinkModifierGroup = async (group: ModifierGroupWithModifiers) => {
    try {
      await present({ message: 'Unlinking...' });
      await unlinkModifierGroup.mutateAsync({ productId: id, groupId: group.id });
      showSuccess('Modifier group unlinked successfully');
      setSelectedModifierGroup(null);
      setShowPriceOverridesModal(false);
      refetchProduct();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to unlink modifier group');
    } finally {
      await dismiss();
    }
  };

  const handleReorderModifierGroup = async (event: CustomEvent<ItemReorderEventDetail>) => {
    if (!product?.linkedModifierGroups) {
      event.detail.complete();
      return;
    }

    const linkedGroups = [...product.linkedModifierGroups];
    const { from, to } = event.detail;

    // Complete the reorder animation immediately for smooth UX
    event.detail.complete();

    // If positions are the same, no need to update
    if (from === to) return;

    // Reorder the array
    const [movedItem] = linkedGroups.splice(from, 1);
    linkedGroups.splice(to, 0, movedItem);

    try {
      // Update all sequences to match new order
      const updatePromises = linkedGroups.map((group, index) =>
        updateLinkSequence.mutateAsync({
          productId: id,
          groupId: group.id,
          sequence: index,
        })
      );

      await Promise.all(updatePromises);

      // The query invalidation in the hook will refetch the product
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to reorder modifier groups');
    }
  };

  // Loading state
  if (productLoading) {
    return <PageLoadingState backHref={`/shops/${currentShop?.id}/products`} />;
  }

  if (!product) {
    return (
      <PageNotFoundState
        backHref={`/shops/${currentShop?.id}/products`}
        title="Product Not Found"
      />
    );
  }

  return (
    <PageWithCollapsibleHeader
      title={product.name}
      backHref={`/shops/${currentShop?.id}/products`}
      observedElementRef={observedElementRef}
      isLoading={productLoading}
      notFound={!productLoading && !product}
    >
      {/* Pull to refresh */}
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      {/* Top Section - Product Summary and Action Buttons */}
      <Div
        style={{
          paddingBottom: '24px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--ion-color-light-shade)',
        }}
      >
        <CenteredLayout>
          <Div style={{ maxWidth: '800px', width: '100%', padding: '16px' }}>
            <ProductSummary
              ref={productNameRef}
              name={product.name}
              description={product.description}
              price={product.price}
              cost={totalCost}
              category={product.category}
              imageUrl={product.image_url}
              itemsCount={product.items?.length || 0}
              addonsCount={product.addons?.length || 0}
              formatCurrency={formatCurrency}
            />

            <ProductActionButtons
              onEdit={handleEditProduct}
              onAddItem={() => setShowItemModal(true)}
              onAddAddon={() => setShowAddonModal(true)}
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
            value={selectedSegment}
            onIonChange={(e) => setSelectedSegment(e.detail.value as 'manage' | 'sales')}
          >
            <IonSegmentButton value="sales" color="dark">
              <IonLabel className="ion-text-capitalize">Sales</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="manage" color="dark">
              <IonLabel className="ion-text-capitalize">Manage</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </Div>
      </CenteredLayout>

      {/* Content Section - Conditional based on segment */}
      <CenteredLayout>
        {selectedSegment === 'manage' ? (
          <Div style={{ maxWidth: '800px', width: '100%' }}>
            {/* Global Modifiers */}
            <ProductModifiersList
              linkedGroups={product.linkedModifierGroups || []}
              priceOverrides={product.priceOverrides || {}}
              formatCurrency={formatCurrency}
              onAdd={handleAddModifierGroup}
              onEdit={handleEditModifierGroup}
              onReorder={handleReorderModifierGroup}
              canEdit={canEdit}
            />

            <ProductAddonsList
              addons={product.addons || []}
              formatCurrency={formatCurrency}
              onAdd={() => setShowAddonModal(true)}
              onEdit={handleEditAddon}
              canEdit={canEdit}
            />

            <ProductItemsList
              items={product.items || []}
              formatCurrency={formatCurrency}
              onAdd={() => setShowItemModal(true)}
              onEdit={handleEditItem}
              canEdit={canEdit}
            />
          </Div>
        ) : (
          <>
            {/* Sales Analytics Placeholder */}
            <Div
              style={{
                maxWidth: '800px',
                width: '100%',
                padding: '16px',
                textAlign: 'center',
                marginTop: '24px',
              }}
            >
              <IonText color="medium">
                <p>Sales analytics coming soon</p>
              </IonText>
            </Div>
          </>
        )}
      </CenteredLayout>

      {/* Modals */}
      <ProductAddonModal
        isOpen={showAddonModal}
        onClose={() => {
          setShowAddonModal(false);
          setSelectedAddon(null);
        }}
        addon={selectedAddon}
        productId={product.id}
        onDelete={handleDeleteAddon}
      />

      <ProductItemModal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        productId={product.id}
        onDelete={handleDeleteItem}
      />

      {/* Options Action Sheet */}
      <IonActionSheet
        isOpen={showOptionsSheet}
        onDidDismiss={() => setShowOptionsSheet(false)}
        header="Options"
        buttons={[
          ...(canDelete
            ? [
                {
                  text: 'Delete Product',
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

      {/* Product Delete Confirmation */}
      {product && (
        <DeleteConfirmationAlert
          isOpen={showDeleteAlert}
          onDismiss={() => setShowDeleteAlert(false)}
          onConfirm={handleDeleteProduct}
          itemName={product.name}
          itemType="Product"
        />
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showProductFormModal}
        onClose={() => setShowProductFormModal(false)}
        productId={id}
      />

      {/* Global Modifier Select Modal */}
      <ProductModifierSelectModal
        isOpen={showModifierSelectModal}
        onClose={() => {
          setShowModifierSelectModal(false);
          refetchProduct();
        }}
        productId={product.id}
        linkedGroupIds={(product.linkedModifierGroups || []).map((g) => g.id)}
      />

      {/* Product Modifier Modal */}
      <ProductModifierModal
        isOpen={showPriceOverridesModal}
        onClose={() => {
          setShowPriceOverridesModal(false);
          setSelectedModifierGroup(null);
          refetchProduct();
        }}
        productId={product.id}
        group={selectedModifierGroup}
        priceOverrides={product.priceOverrides || {}}
        formatCurrency={formatCurrency}
        onDelete={handleUnlinkModifierGroup}
      />
    </PageWithCollapsibleHeader>
  );
};

export default ProductManagePage;
