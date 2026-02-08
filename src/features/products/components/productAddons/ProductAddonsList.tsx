// Product Addons List Component - Display and manage product add-ons

import type { ItemReorderEventDetail } from '@ionic/react';
import { IonButton, IonIcon, IonReorderGroup, IonToggle } from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { designSystem } from '@/theme/designSystem';
import type { ProductAddon } from '@/types';
import ProductAddonListItem from './ProductAddonListItem';

interface ProductAddonsListProps {
  /** Array of product add-ons */
  addons: ProductAddon[];
  /** Function to format currency values */
  formatCurrency: (amount: number) => string;
  /** Handler for adding a new addon */
  onAdd: () => void;
  /** Handler for editing an addon */
  onEdit: (addon: ProductAddon) => void;
  /** Handler for reordering addons */
  onReorder?: (event: CustomEvent<ItemReorderEventDetail>) => void;
  /** Whether user can edit addons */
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

const ProductAddonsList: React.FC<ProductAddonsListProps> = ({
  addons,
  formatCurrency,
  onAdd,
  onEdit,
  onReorder,
  canEdit,
}) => {
  const [reorderEnabled, setReorderEnabled] = useState(false);

  return (
    <CardContainer
      title={`Add-ons (${addons.length})`}
      noPadding={true}
      actionButton={
        <IonButton
          fill="clear"
          color="primary"
          onClick={onAdd}
          aria-label="Add addon"
          disabled={!canEdit}
          shape="round"
        >
          <IonIcon slot="icon-only" icon={add} />
        </IonButton>
      }
    >
      {addons.length === 0 ? (
        <EmptyContainer>
          <h3>No Add-ons Configured</h3>
          <p>Click the + button to create optional add-ons for this product</p>
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
            {addons.map((addon) => (
              <ProductAddonListItem
                key={addon.id}
                addon={addon}
                formatCurrency={formatCurrency}
                onClick={() => onEdit(addon)}
                canEdit={canEdit}
                showReorderHandle={canEdit && reorderEnabled && !!onReorder}
              />
            ))}
          </IonReorderGroup>

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

export default ProductAddonsList;
