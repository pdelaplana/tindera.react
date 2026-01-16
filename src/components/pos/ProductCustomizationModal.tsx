// ProductCustomizationModal - Modal for selecting modifiers and addons before adding to cart

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import BaseModal from '@/components/shared/BaseModal';
import { PriceDisplay } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';
import type { CartItemAddon, CartItemModifier, Product, ProductWithDetails } from '@/types';
import { AddonQuantityControl } from './AddonQuantityControl';
import { ModifierGroupControl } from './ModifierGroupControl';

interface ProductCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  productDetails: ProductWithDetails | null;
  existingAddons?: CartItemAddon[];
  existingModifiers?: CartItemModifier[];
  onSave: (selectedAddons: CartItemAddon[], selectedModifiers: CartItemModifier[]) => void;
  currency?: string;
}

const ProductHeader = styled.div`
	margin-bottom: ${designSystem.spacing.lg};
	padding-bottom: ${designSystem.spacing.md};
	border-bottom: 1px solid ${designSystem.colors.gray[200]};
`;

const ProductName = styled.h2`
	font-size: ${designSystem.typography.fontSize.xl};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.xs} 0;
`;

const ProductBasePrice = styled.p`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
	margin: 0;
`;

const SectionDivider = styled.div`
	height: 1px;
	background: ${designSystem.colors.gray[200]};
	margin: ${designSystem.spacing.lg} 0;
`;

const SectionTitle = styled.h3`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.md} 0;
`;

const PriceSummary = styled.div`
	margin-top: ${designSystem.spacing.lg};
	padding: ${designSystem.spacing.md};
	background: ${designSystem.colors.gray[50]};
	border-radius: ${designSystem.borderRadius.md};
`;

const PriceRow = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: ${designSystem.spacing.xs};
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
`;

const TotalRow = styled.div`
	display: flex;
	justify-content: space-between;
	padding-top: ${designSystem.spacing.sm};
	border-top: 1px solid ${designSystem.colors.gray[200]};
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
`;

const EmptyState = styled.div`
	text-align: center;
	padding: ${designSystem.spacing.xl};
	color: ${designSystem.colors.text.secondary};
`;

export const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
  isOpen,
  onClose,
  product,
  productDetails,
  existingAddons = [],
  existingModifiers = [],
  onSave,
  currency = 'USD',
}) => {
  // State for modifier selections
  const [modifierSelections, setModifierSelections] = useState<Record<string, string[]>>({});

  // State for addon selections (addon_id -> quantity)
  const [addonSelections, setAddonSelections] = useState<Record<string, number>>({});

  // Track if we've initialized for the current modal session
  const hasInitializedRef = useRef(false);

  // Initialize modifier and addon selections when modal opens
  useEffect(() => {
    // When modal closes, reset the initialization flag
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    // Only initialize once per modal opening
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Initialize modifiers
    if (productDetails) {
      const initialModifierSelections: Record<string, string[]> = {};

      // If editing, use existing modifiers
      if (existingModifiers.length > 0) {
        existingModifiers.forEach((mod) => {
          if (!initialModifierSelections[mod.modifier_group_id]) {
            initialModifierSelections[mod.modifier_group_id] = [];
          }
          initialModifierSelections[mod.modifier_group_id].push(mod.modifier_id);
        });
      } else {
        // Otherwise, select defaults
        productDetails.linkedModifierGroups?.forEach((group) => {
          const defaults = group.modifiers.filter((m) => m.is_default).map((m) => m.id);
          if (defaults.length > 0) {
            initialModifierSelections[group.id] = defaults;
          }
        });
      }

      setModifierSelections(initialModifierSelections);
    }

    // Initialize addons
    const initialAddonSelections: Record<string, number> = {};

    // If editing, use existing addons
    if (existingAddons.length > 0) {
      existingAddons.forEach((addon) => {
        initialAddonSelections[addon.addon_id] = addon.quantity;
      });
    }

    setAddonSelections(initialAddonSelections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle modifier selection change
  const handleModifierChange = useCallback((groupId: string, modifierIds: string[]) => {
    setModifierSelections((prev) => ({
      ...prev,
      [groupId]: modifierIds,
    }));
  }, []);

  // Handle addon quantity change
  const handleAddonQuantityChange = useCallback((addonId: string, quantity: number) => {
    setAddonSelections((prev) => ({
      ...prev,
      [addonId]: quantity,
    }));
  }, []);

  // Separate required and optional modifier groups
  const requiredGroups = useMemo(
    () => productDetails?.linkedModifierGroups?.filter((g) => g.is_required) || [],
    [productDetails]
  );

  const optionalGroups = useMemo(
    () => productDetails?.linkedModifierGroups?.filter((g) => !g.is_required) || [],
    [productDetails]
  );

  // Validate all modifier groups (required and optional)
  const isValid = useMemo(() => {
    if (!productDetails?.linkedModifierGroups) return true;

    // Check all groups for constraint violations
    for (const group of productDetails.linkedModifierGroups) {
      const selections = modifierSelections[group.id] || [];

      // Required groups must meet min_select
      if (group.is_required && selections.length < group.min_select) {
        return false;
      }

      // All groups must not exceed max_select
      if (group.max_select && selections.length > group.max_select) {
        return false;
      }
    }

    return true;
  }, [productDetails, modifierSelections]);

  // Calculate total modifier price adjustment
  const modifierTotal = useMemo(() => {
    if (!productDetails?.linkedModifierGroups) return 0;

    let total = 0;
    for (const group of productDetails.linkedModifierGroups) {
      const selectedIds = modifierSelections[group.id] || [];
      for (const modifierId of selectedIds) {
        const modifier = group.modifiers.find((m) => m.id === modifierId);
        if (modifier) {
          total += modifier.price_adjustment;
        }
      }
    }
    return total;
  }, [productDetails, modifierSelections]);

  // Calculate total addon price
  const addonTotal = useMemo(() => {
    if (!productDetails) return 0;

    let total = 0;
    for (const addon of productDetails.addons) {
      const quantity = addonSelections[addon.id] || 0;
      total += addon.price * quantity;
    }
    return total;
  }, [productDetails, addonSelections]);

  // Calculate total price (base + modifiers + addons)
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    return product.price + modifierTotal + addonTotal;
  }, [product, modifierTotal, addonTotal]);

  // Handle save
  const handleSave = () => {
    if (!productDetails) return;

    // Convert modifier selections to CartItemModifier[]
    const selectedModifiers: CartItemModifier[] = [];
    if (productDetails.linkedModifierGroups) {
      for (const group of productDetails.linkedModifierGroups) {
        const selectedIds = modifierSelections[group.id] || [];
        for (const modifierId of selectedIds) {
          const modifier = group.modifiers.find((m) => m.id === modifierId);
          if (modifier) {
            selectedModifiers.push({
              modifier_group_id: group.id,
              modifier_group_name: group.name,
              modifier_id: modifier.id,
              modifier_name: modifier.name,
              price_adjustment: modifier.price_adjustment,
              inventory_item_id: modifier.inventory_item_id, // Link to inventory
              quantity: modifier.quantity, // Quantity per product for inventory decrement
            });
          }
        }
      }
    }

    // Convert addon selections to CartItemAddon[]
    const selectedAddons: CartItemAddon[] = [];
    for (const addon of productDetails.addons) {
      const quantity = addonSelections[addon.id] || 0;
      if (quantity > 0) {
        selectedAddons.push({
          addon_id: addon.id,
          name: addon.name,
          quantity: quantity,
          price: addon.price,
          item_id: addon.inventory_item_id, // Link to inventory for auto-decrement
        });
      }
    }

    onSave(selectedAddons, selectedModifiers);
  };

  // Render content
  const renderContent = () => {
    if (!product || !productDetails) {
      return <EmptyState>No product selected</EmptyState>;
    }

    return (
      <>
        {/* Product Header */}
        <ProductHeader>
          <ProductName>{product.name}</ProductName>
          <ProductBasePrice>
            Base Price: <PriceDisplay amount={product.price} currency={currency} />
          </ProductBasePrice>
        </ProductHeader>

        {/* Required Modifiers */}
        {requiredGroups.length > 0 && (
          <>
            <SectionTitle>Required Options</SectionTitle>
            {requiredGroups.map((group) => (
              <ModifierGroupControl
                key={group.id}
                group={group}
                selectedModifierIds={modifierSelections[group.id] || []}
                onSelectionChange={handleModifierChange}
                currency={currency}
              />
            ))}
          </>
        )}

        {/* Optional Modifiers */}
        {optionalGroups.length > 0 && (
          <>
            {requiredGroups.length > 0 && <SectionDivider />}
            <SectionTitle>Optional Choices</SectionTitle>
            {optionalGroups.map((group) => (
              <ModifierGroupControl
                key={group.id}
                group={group}
                selectedModifierIds={modifierSelections[group.id] || []}
                onSelectionChange={handleModifierChange}
                currency={currency}
              />
            ))}
          </>
        )}

        {/* Addons */}
        {productDetails.addons.length > 0 && (
          <>
            {(requiredGroups.length > 0 || optionalGroups.length > 0) && <SectionDivider />}
            <SectionTitle>Add-ons</SectionTitle>
            {productDetails.addons.map((addon) => (
              <AddonQuantityControl
                key={addon.id}
                addon={addon}
                quantity={addonSelections[addon.id] || 0}
                onQuantityChange={handleAddonQuantityChange}
                currency={currency}
              />
            ))}
          </>
        )}

        {/* Price Summary */}
        <PriceSummary>
          <PriceRow>
            <span>Base Price:</span>
            <span>
              <PriceDisplay amount={product.price} currency={currency} />
            </span>
          </PriceRow>
          {modifierTotal !== 0 && (
            <PriceRow>
              <span>Modifiers:</span>
              <span>
                {modifierTotal > 0 && '+'}
                <PriceDisplay amount={modifierTotal} currency={currency} />
              </span>
            </PriceRow>
          )}
          {addonTotal > 0 && (
            <PriceRow>
              <span>Add-ons:</span>
              <span>
                +<PriceDisplay amount={addonTotal} currency={currency} />
              </span>
            </PriceRow>
          )}
          <TotalRow>
            <span>Total:</span>
            <span>
              <PriceDisplay amount={totalPrice} currency={currency} />
            </span>
          </TotalRow>
        </PriceSummary>
      </>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize"
      initialBreakpoint={1}
      breakpoints={[0, 0.5, 0.75, 1]}
      showFooterButton
      footerButtonLabel="Add to Cart"
      onFooterButtonClick={handleSave}
      footerButtonDisabled={!isValid}
      contentPadding={true}
      scrollY={true}
    >
      <div>{renderContent()}</div>
    </BaseModal>
  );
};

export default ProductCustomizationModal;
