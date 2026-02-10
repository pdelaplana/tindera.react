// ProductDetailPanel - Right panel container for product details

import type { ItemReorderEventDetail } from '@ionic/react';
import { useIonLoading } from '@ionic/react';
import { pricetagOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { CenteredLayout } from '@/components/layouts';
import { DetailPanelHeader } from '@/components/shared';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { LoadingSpinner } from '@/components/ui';
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
import { designSystem } from '@/theme/designSystem';
import type { ModifierGroupWithModifiers, ProductAddon, ProductItem } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import {
  ProductAddonModal,
  ProductDetailContent,
  ProductItemModal,
  ProductModifierModal,
  ProductModifierSelectModal,
} from './';

interface ProductDetailPanelProps {
  productId: string | null;
  onProductDeleted: () => void;
}

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

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  width: 100%;
`;

const ProductDetailPanel: React.FC<ProductDetailPanelProps> = ({ productId, onProductDeleted }) => {
  const { currentShop, hasPermission } = useShop();
  const { data: product, isLoading, refetch: refetchProduct } = useProduct(productId ?? undefined);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const removeProductItem = useRemoveProductItem();
  const removeProductAddon = useRemoveProductAddon();
  const unlinkModifierGroup = useUnlinkModifierGroup();
  const updateLinkSequence = useUpdateLinkSequence();
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  // Permissions
  const canEdit = hasPermission('staff');
  const canDelete = hasPermission('admin');

  // Currency formatter
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Modal states
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [showModifierSelectModal, setShowModifierSelectModal] = useState(false);
  const [showPriceOverridesModal, setShowPriceOverridesModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<ProductAddon | null>(null);
  const [selectedModifierGroup, setSelectedModifierGroup] =
    useState<ModifierGroupWithModifiers | null>(null);

  // Handlers
  const handleDeleteProduct = async () => {
    if (!product) return;
    try {
      await present({ message: 'Deleting...' });
      await deleteProduct.mutateAsync(product.id);
      showSuccess('Product deleted successfully');
      onProductDeleted();
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
    if (!product) return;
    try {
      await present({ message: 'Deleting...' });
      await removeProductItem.mutateAsync({ itemId: item.id, productId: product.id });
      showSuccess('Ingredient removed');
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
    if (!product) return;
    try {
      await present({ message: 'Deleting...' });
      await removeProductAddon.mutateAsync({ addonId: addon.id, productId: product.id });
      showSuccess('Add-on removed');
      setSelectedAddon(null);
      setShowAddonModal(false);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to remove add-on');
    } finally {
      await dismiss();
    }
  };

  const handleAddModifierGroup = () => {
    setShowModifierSelectModal(true);
  };

  const handleEditModifierGroup = (group: ModifierGroupWithModifiers) => {
    setSelectedModifierGroup(group);
    setShowPriceOverridesModal(true);
  };

  const handleUnlinkModifierGroup = async (group: ModifierGroupWithModifiers) => {
    if (!product) return;
    try {
      await present({ message: 'Unlinking...' });
      await unlinkModifierGroup.mutateAsync({ productId: product.id, groupId: group.id });
      showSuccess('Modifier group unlinked');
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
    event.detail.complete();
    if (from === to) return;

    const [movedItem] = linkedGroups.splice(from, 1);
    linkedGroups.splice(to, 0, movedItem);

    try {
      const updatePromises = linkedGroups.map((group, index) =>
        updateLinkSequence.mutateAsync({
          productId: product.id,
          groupId: group.id,
          sequence: index,
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to reorder modifier groups');
    }
  };


  // Empty state
  if (!productId) {
    return (
      <Container>
        <EmptyState>
          <EmptyText>Select a product to view details</EmptyText>
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

  // Not found
  if (!product) {
    return (
      <Container>
        <EmptyState>
          <EmptyText>Product not found</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <DetailPanelHeader
        title={product.name}
        icon={pricetagOutline}
        breadcrumbs={[{ label: product.name }]}
      />
      <ScrollContent>
        <CenteredLayout>
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
          />
        </CenteredLayout>
      </ScrollContent>

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

      <DeleteConfirmationAlert
        isOpen={showDeleteAlert}
        onDismiss={() => setShowDeleteAlert(false)}
        onConfirm={handleDeleteProduct}
        itemName={product.name}
        itemType="Product"
      />

      <ProductModifierSelectModal
        isOpen={showModifierSelectModal}
        onClose={() => {
          setShowModifierSelectModal(false);
          refetchProduct();
        }}
        productId={product.id}
        linkedGroupIds={(product.linkedModifierGroups || []).map((g) => g.id)}
      />

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
    </Container>
  );
};

export default ProductDetailPanel;
