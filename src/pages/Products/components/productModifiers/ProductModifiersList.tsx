// Product Modifiers List Component - Display and manage linked global modifier groups

import type { ItemReorderEventDetail } from '@ionic/react';
import { IonButton, IonIcon, IonReorderGroup, IonToggle } from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { designSystem } from '@/theme/designSystem';
import type { ModifierGroupWithModifiers } from '@/types';
import ProductModifierGroupListItem from './ProductModifierGroupListItem';

interface ProductModifiersListProps {
  /** Array of linked modifier groups */
  linkedGroups: ModifierGroupWithModifiers[];
  /** Record of modifier IDs to price override amounts */
  priceOverrides: Record<string, number>;
  /** Function to format currency values */
  formatCurrency: (amount: number) => string;
  /** Handler for adding a new modifier group */
  onAdd: () => void;
  /** Handler for editing a modifier group (managing price overrides) */
  onEdit: (group: ModifierGroupWithModifiers) => void;
  /** Handler for reordering modifier groups */
  onReorder?: (event: CustomEvent<ItemReorderEventDetail>) => void;
  /** Whether user can edit modifiers */
  canEdit: boolean;
}

// Styled components - matching ProductsListPage pattern
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

const ProductModifiersList: React.FC<ProductModifiersListProps> = ({
  linkedGroups,
  priceOverrides,
  onAdd,
  onEdit,
  onReorder,
  canEdit,
}) => {
  const [reorderEnabled, setReorderEnabled] = useState(false);

  // Check if a group has any price overrides
  const hasOverrides = (group: ModifierGroupWithModifiers): boolean => {
    return group.modifiers.some((modifier) => priceOverrides[modifier.id] !== undefined);
  };

  return (
    <CardContainer
      noPadding={true}
      title={`Modifiers (${linkedGroups.length})`}
      actionButton={
        <IonButton
          fill="clear"
          color="primary"
          onClick={onAdd}
          aria-label="Add modifier group"
          disabled={!canEdit}
          shape="round"
        >
          <IonIcon slot="icon-only" icon={add} />
        </IonButton>
      }
    >
      {linkedGroups.length === 0 ? (
        <EmptyContainer>
          <h3>No Modifiers Linked</h3>
          <p>Click the + button to add modifier groups from the shop library</p>
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
            {linkedGroups.map((group) => (
              <ProductModifierGroupListItem
                key={group.id}
                group={group}
                hasOverrides={hasOverrides(group)}
                onClick={() => onEdit(group)}
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

export default ProductModifiersList;
