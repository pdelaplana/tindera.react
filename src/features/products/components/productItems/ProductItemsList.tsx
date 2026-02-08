// Product Items List Component - Display and manage product ingredients/components

import type { ItemReorderEventDetail } from '@ionic/react';
import { IonButton, IonIcon, IonReorderGroup, IonToggle } from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { designSystem } from '@/theme/designSystem';
import type { ProductItem } from '@/types';
import ProductItemListItem from './ProductItemListItem';

interface ProductItemsListProps {
  /** Array of product items (ingredients/components) */
  items: ProductItem[];
  /** Function to format currency values */
  formatCurrency: (amount: number) => string;
  /** Handler for adding a new item */
  onAdd: () => void;
  /** Handler for editing an item */
  onEdit: (item: ProductItem) => void;
  /** Handler for reordering items */
  onReorder?: (event: CustomEvent<ItemReorderEventDetail>) => void;
  /** Whether user can edit items */
  canEdit: boolean;
}

// Styled components - matching ProductModifiersList pattern
const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${designSystem.spacing['2xl']};
  text-align: center;
  color: ${designSystem.colors.text.secondary};
  gap: ${designSystem.spacing.sm};

  h3 {
    font-size: ${designSystem.typography.fontSize.lg};
    font-weight: ${designSystem.typography.fontWeight.semibold};
    color: ${designSystem.colors.text.primary};
    margin: 0;
  }

  p {
    font-size: ${designSystem.typography.fontSize.sm};
    margin: 0;
  }
`;

const TotalCostContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: ${designSystem.spacing.md};
  border-top: 1px solid ${designSystem.colors.gray[200]};
  background: ${designSystem.colors.surface.variant};
`;

const TotalCostLabel = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
`;

const ProductItemsList: React.FC<ProductItemsListProps> = ({
  items,
  formatCurrency,
  onAdd,
  onEdit,
  onReorder,
  canEdit,
}) => {
  const [reorderEnabled, setReorderEnabled] = useState(false);

  // Calculate total cost of all items
  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

  return (
    <CardContainer
      title={`Ingredients/Components (${items.length})`}
      actionButton={
        <IonButton
          fill="clear"
          color="primary"
          onClick={onAdd}
          aria-label="Add item"
          disabled={!canEdit}
          shape="round"
        >
          <IonIcon slot="icon-only" icon={add} />
        </IonButton>
      }
      noPadding={true}
    >
      {items.length === 0 ? (
        <EmptyContainer>
          <h3>No Ingredients Added</h3>
          <p>Click the + button to add ingredients or components to this product</p>
        </EmptyContainer>
      ) : (
        <>
          <IonReorderGroup
            disabled={!canEdit || !onReorder || !reorderEnabled}
            onIonItemReorder={onReorder}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: designSystem.spacing.sm,
              padding: designSystem.spacing.md,
            }}
          >
            {items.map((item) => (
              <ProductItemListItem
                key={item.id}
                item={item}
                formatCurrency={formatCurrency}
                onClick={() => onEdit(item)}
                canEdit={canEdit}
                showReorderHandle={canEdit && reorderEnabled && !!onReorder}
              />
            ))}
          </IonReorderGroup>

          {/* Total Cost Footer */}
          <TotalCostContainer>
            <TotalCostLabel>Total Cost: {formatCurrency(totalCost)}</TotalCostLabel>
          </TotalCostContainer>

          {/* Reorder Toggle - Only show if there are items and user can edit */}
          {canEdit && onReorder && (
            <Div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '12px 16px',
                gap: '8px',
              }}
            >
              <IonToggle
                checked={reorderEnabled}
                onIonChange={(e) => setReorderEnabled(e.detail.checked)}
                labelPlacement="start"
              >
                Reorder
              </IonToggle>
            </Div>
          )}
        </>
      )}
    </CardContainer>
  );
};

export default ProductItemsList;
