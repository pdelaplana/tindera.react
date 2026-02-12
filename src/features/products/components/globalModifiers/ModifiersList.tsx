// Modifiers List Component - Display and manage modifiers in a group

import type { ItemReorderEventDetail } from '@ionic/react';
import { IonButton, IonIcon, IonReorderGroup, IonToggle } from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { useUpdateGlobalModifier } from '@/hooks';
import { designSystem } from '@/theme/designSystem';
import type { Modifier } from '@/types';
import ModifierListItem from './ModifierListItem';

interface ModifiersListProps {
  /** Array of modifiers */
  modifiers: Modifier[];
  /** Function to format currency values */
  formatCurrency: (amount: number) => string;
  /** Handler for adding a new modifier */
  onAdd: () => void;
  /** Handler for editing a modifier */
  onEdit: (modifier: Modifier) => void;
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

const ModifiersList: React.FC<ModifiersListProps> = ({
  modifiers,
  formatCurrency,
  onAdd,
  onEdit,
  canEdit,
}) => {
  const updateModifier = useUpdateGlobalModifier();
  const [reorderEnabled, setReorderEnabled] = useState(false);

  const handleReorder = async (event: CustomEvent<ItemReorderEventDetail>) => {
    event.stopPropagation();
    const from = event.detail.from;
    const to = event.detail.to;

    // Reorder array
    const reorderedModifiers = [...modifiers];
    const [movedItem] = reorderedModifiers.splice(from, 1);
    reorderedModifiers.splice(to, 0, movedItem);

    // Update sequences for changed items
    for (let i = 0; i < reorderedModifiers.length; i++) {
      if (reorderedModifiers[i].sequence !== i) {
        await updateModifier.mutateAsync({
          modifierId: reorderedModifiers[i].id,
          updates: { sequence: i },
        });
      }
    }

    event.detail.complete();
  };

  return (
    <CardContainer
      noPadding={true}
      title={`Modifiers (${modifiers.length})`}
      actionButton={
        <IonButton
          fill="clear"
          color="primary"
          onClick={onAdd}
          aria-label="Add modifier"
          disabled={!canEdit}
        >
          <IonIcon slot="icon-only" icon={add} />
        </IonButton>
      }
    >
      {modifiers.length === 0 ? (
        <EmptyContainer>
          <h3>No Modifiers Yet</h3>
          <p>Click the + button to add modifiers to this group</p>
        </EmptyContainer>
      ) : (
        <>
          <IonReorderGroup
            disabled={!canEdit || !reorderEnabled}
            onIonReorderEnd={handleReorder}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: designSystem.spacing.sm,
              padding: designSystem.spacing.md,
            }}
          >
            {modifiers.map((modifier) => (
              <ModifierListItem
                key={modifier.id}
                modifier={modifier}
                onClick={() => onEdit(modifier)}
                formatCurrency={formatCurrency}
                canEdit={canEdit}
                showReorderHandle={canEdit && reorderEnabled}
              />
            ))}
          </IonReorderGroup>

          {/* Reorder Toggle - Only show if there are items and user can edit */}
          {canEdit && (
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

export default ModifiersList;
