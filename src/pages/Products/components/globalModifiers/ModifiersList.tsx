// Modifiers List Component - Display and manage modifiers in a group

import type { ItemReorderEventDetail } from '@ionic/react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonReorder,
  IonReorderGroup,
  IonText,
  IonToggle,
} from '@ionic/react';
import { add, reorderTwoOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { useUpdateGlobalModifier } from '@/hooks';
import type { Modifier } from '@/types';

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
      <IonList lines="full" style={{ marginTop: '16px' }}>
        {modifiers.length === 0 ? (
          <IonItem>
            <IonLabel color="medium" className="ion-text-center" style={{ padding: '24px 0' }}>
              <p>No modifiers added yet</p>
              <IonText color="medium" style={{ fontSize: '0.875rem' }}>
                <p>Click the + button to add modifiers to this group</p>
              </IonText>
            </IonLabel>
          </IonItem>
        ) : (
          <IonReorderGroup disabled={!canEdit || !reorderEnabled} onIonReorderEnd={handleReorder}>
            {modifiers.map((modifier) => (
              <IonItem
                key={modifier.id}
                button={canEdit}
                detail={false}
                onClick={() => canEdit && onEdit(modifier)}
              >
                <IonLabel>
                  <h3>{modifier.name}</h3>
                  <p>
                    {formatCurrency(modifier.default_price_adjustment)}
                    {modifier.is_default && ' • Default'}
                  </p>
                </IonLabel>
                {canEdit && reorderEnabled && (
                  <IonReorder slot="end" className="ion-margin-top">
                    <IonIcon icon={reorderTwoOutline} size="small" />
                  </IonReorder>
                )}
              </IonItem>
            ))}
          </IonReorderGroup>
        )}
      </IonList>

      {/* Reorder Toggle - Only show if there are items and user can edit */}
      {modifiers.length > 0 && canEdit && (
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
    </CardContainer>
  );
};

export default ModifiersList;
