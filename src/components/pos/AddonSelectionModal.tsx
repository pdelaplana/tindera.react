// AddonSelectionModal - Modal for selecting and customizing product addons

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { BaseModal } from '@/components/shared';
import { PriceDisplay } from '@/components/ui';
import { productService } from '@/services/product.service';
import { designSystem } from '@/theme/designSystem';
import type { CartItemAddon, Product, ProductWithDetails } from '@/types';
import { AddonQuantityControl } from './AddonQuantityControl';

interface AddonSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  existingAddons?: CartItemAddon[];
  onSave: (selectedAddons: CartItemAddon[]) => void;
  currency?: string;
}

interface AddonSelection {
  [addonId: string]: number;
}

const ModalContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.lg};
`;

const ProductHeader = styled.div`
	padding-bottom: ${designSystem.spacing.md};
	border-bottom: 1px solid ${designSystem.colors.gray[200]};
`;

const ProductName = styled.h3`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.xs} 0;
`;

const BasePrice = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
`;

const AddonsSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
`;

const SectionTitle = styled.h4`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.sm} 0;
`;

const EmptyState = styled.div`
	padding: ${designSystem.spacing.xl};
	text-align: center;
	color: ${designSystem.colors.text.secondary};
	font-size: ${designSystem.typography.fontSize.sm};
`;

const PriceSummary = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
	padding: ${designSystem.spacing.md};
	background: ${designSystem.colors.gray[50]};
	border-radius: ${designSystem.borderRadius.md};
`;

const SummaryRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
`;

const TotalRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: ${designSystem.spacing.sm};
	border-top: 1px solid ${designSystem.colors.gray[200]};
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
`;

export const AddonSelectionModal: React.FC<AddonSelectionModalProps> = ({
  isOpen,
  onClose,
  product,
  existingAddons,
  onSave,
  currency = 'USD',
}) => {
  const [addonSelections, setAddonSelections] = useState<AddonSelection>({});
  const [productDetails, setProductDetails] = useState<ProductWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selections from existing addons (for editing)
  useEffect(() => {
    if (existingAddons && existingAddons.length > 0) {
      const selections: AddonSelection = {};
      for (const addon of existingAddons) {
        selections[addon.addon_id] = addon.quantity;
      }
      setAddonSelections(selections);
    } else {
      setAddonSelections({});
    }
  }, [existingAddons]);

  // Fetch product details when modal opens
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!product) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await productService.getProduct(product.id);
        if (fetchError) throw fetchError;
        setProductDetails(data);
      } catch (err) {
        setError('Failed to load addons');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && product) {
      fetchProductDetails();
    }
  }, [isOpen, product]);

  const handleAddonQuantityChange = (addonId: string, quantity: number) => {
    setAddonSelections((prev) => ({
      ...prev,
      [addonId]: quantity,
    }));
  };

  const { basePrice, addonsTotal, totalPrice } = useMemo(() => {
    const base = product?.price || 0;

    const addons =
      productDetails?.addons.reduce((sum, addon) => {
        const qty = addonSelections[addon.id] || 0;
        return sum + addon.price * qty;
      }, 0) || 0;

    return {
      basePrice: base,
      addonsTotal: addons,
      totalPrice: base + addons,
    };
  }, [product, productDetails, addonSelections]);

  const handleSave = () => {
    if (!productDetails) return;

    // Convert selections to CartItemAddon array
    const selectedAddons: CartItemAddon[] = productDetails.addons
      .filter((addon) => (addonSelections[addon.id] || 0) > 0)
      .map((addon) => ({
        addon_id: addon.id,
        name: addon.name,
        quantity: addonSelections[addon.id],
        price: addon.price,
        item_id: addon.inventory_item_id, // Link to inventory for auto-decrement
      }));

    onSave(selectedAddons);
    onClose();
  };

  const actionButtonLabel = existingAddons ? 'Save Changes' : 'Add to Cart';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Customize ${product?.name || 'Product'}`}
      showActionButton
      actionButtonLabel={actionButtonLabel}
      onActionClick={handleSave}
      actionButtonDisabled={isLoading || !!error}
      initialBreakpoint={0.75}
      breakpoints={[0, 0.75, 1]}
      isLoading={isLoading}
      loadingMessage="Loading addons..."
    >
      {error ? (
        <EmptyState>{error}</EmptyState>
      ) : (
        <ModalContent>
          {/* Product Info Header */}
          <ProductHeader>
            <ProductName>{product?.name}</ProductName>
            <BasePrice>
              <PriceDisplay amount={product?.price || 0} currency={currency} /> base price
            </BasePrice>
          </ProductHeader>

          {/* Addons List */}
          <AddonsSection>
            <SectionTitle>Select Addons</SectionTitle>
            {productDetails?.addons.length === 0 ? (
              <EmptyState>No addons available for this product</EmptyState>
            ) : (
              productDetails?.addons.map((addon) => (
                <AddonQuantityControl
                  key={addon.id}
                  addon={addon}
                  quantity={addonSelections[addon.id] || 0}
                  onQuantityChange={handleAddonQuantityChange}
                  currency={currency}
                />
              ))
            )}
          </AddonsSection>

          {/* Price Summary */}
          <PriceSummary>
            <SummaryRow>
              <span>Base Price:</span>
              <PriceDisplay amount={basePrice} currency={currency} />
            </SummaryRow>
            {addonsTotal > 0 && (
              <SummaryRow>
                <span>Addons:</span>
                <PriceDisplay amount={addonsTotal} currency={currency} />
              </SummaryRow>
            )}
            <TotalRow>
              <span>Total:</span>
              <PriceDisplay amount={totalPrice} currency={currency} />
            </TotalRow>
          </PriceSummary>
        </ModalContent>
      )}
    </BaseModal>
  );
};

export default AddonSelectionModal;
