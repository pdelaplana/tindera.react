// Product Manage Page - Mobile view with shared detail components

import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  type ItemReorderEventDetail,
  type RefresherEventDetail,
  useIonLoading,
} from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import PageLoadingState from '@/components/shared/PageLoadingState';
import PageNotFoundState from '@/components/shared/PageNotFoundState';
import { useUnlinkModifierGroup, useUpdateLinkSequence } from '@/hooks';
import {
  useDeleteProduct,
  useProduct,
  useRemoveProductAddon,
  useRemoveProductItem,
  useUpdateProduct,
} from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { ModifierGroupWithModifiers, ProductAddon, ProductItem } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import {
  ProductAddonModal,
  ProductDetailContent,
  ProductItemModal,
  ProductModifierModal,
  ProductModifierSelectModal,
} from '../../components';

interface RouteParams {
  id: string;
}

const ContentContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
`;

const ProductManagePage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();

  // Hooks
  const { currentShop, hasPermission } = useShop();
  const { data: product, isLoading: productLoading, refetch: refetchProduct } = useProduct(id);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const removeProductItem = useRemoveProductItem();
  const removeProductAddon = useRemoveProductAddon();
  const unlinkModifierGroup = useUnlinkModifierGroup();
  const updateLinkSequence = useUpdateLinkSequence();
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showModifierSelectModal, setShowModifierSelectModal] = useState(false);
  const [showPriceOverridesModal, setShowPriceOverridesModal] = useState(false);

  // Selected item/addon states
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<ProductAddon | null>(null);
  const [selectedModifierGroup, setSelectedModifierGroup] =
    useState<ModifierGroupWithModifiers | null>(null);

  // Permissions
  const canEdit = hasPermission('staff');
  const canDelete = hasPermission('manager');

  // Currency formatter
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Handlers
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetchProduct();
    event.detail.complete();
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

  const handleImageUploaded = async (url: string) => {
    if (!product) return;
    try {
      await updateProduct.mutateAsync({ productId: product.id, data: { image_url: url } });
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to update image');
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
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/shops/${currentShop?.id}/products`} />
          </IonButtons>
          <IonTitle>Product Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Pull to refresh */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <ContentContainer>
          <ProductDetailContent
            product={product}
            shopId={currentShop?.id || ''}
            formatCurrency={formatCurrency}
            canEdit={canEdit}
            canDelete={canDelete}
            onImageUploaded={handleImageUploaded}
            onAddModifierGroup={handleAddModifierGroup}
            onEditModifierGroup={handleEditModifierGroup}
            onReorderModifierGroup={handleReorderModifierGroup}
            onAddAddon={() => setShowAddonModal(true)}
            onEditAddon={handleEditAddon}
            onAddItem={() => setShowItemModal(true)}
            onEditItem={handleEditItem}
            onDeleteProduct={() => setShowDeleteAlert(true)}
            onViewSales={() =>
              history.push(`/shops/${currentShop?.id}/products/${id}/sales`)
            }
          />
        </ContentContainer>

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

        {/* Product Delete Confirmation */}
        <DeleteConfirmationAlert
          isOpen={showDeleteAlert}
          onDismiss={() => setShowDeleteAlert(false)}
          onConfirm={handleDeleteProduct}
          itemName={product.name}
          itemType="Product"
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
      </IonContent>
    </IonPage>
  );
};

export default ProductManagePage;
