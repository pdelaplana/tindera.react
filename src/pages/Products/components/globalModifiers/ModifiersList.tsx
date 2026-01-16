// Modifiers List Component - Display and manage modifiers in a group

import type { ItemReorderEventDetail } from '@ionic/react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonReorder,
  IonReorderGroup,
  IonText,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
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
    <IonList lines="full" style={{ marginTop: '16px' }}>
      <IonListHeader className="ion-justify-content-between ion-align-items-content-around">
        <IonLabel>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Modifiers ({modifiers.length})</h2>
        </IonLabel>
        <IonButton
          fill="clear"
          color="primary"
          onClick={onAdd}
          aria-label="Add modifier"
          disabled={!canEdit}
        >
          <IonIcon slot="icon-only" icon={add} />
        </IonButton>
      </IonListHeader>

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
        <IonReorderGroup disabled={!canEdit} onIonItemReorder={handleReorder}>
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
              {canEdit && <IonReorder slot="end" />}
            </IonItem>
          ))}
        </IonReorderGroup>
      )}
    </IonList>
  );
};

export default ModifiersList;
