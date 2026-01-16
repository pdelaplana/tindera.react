// Product Modifiers List Component - Display and manage linked global modifier groups

import {
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonReorder,
  IonReorderGroup,
  IonText,
  IonToggle,
  type ItemReorderEventDetail,
} from '@ionic/react';
import { add, pricetagOutline, reorderTwoOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { IonText2 } from '@/components/ui';
import type { ModifierGroupWithModifiers } from '@/types';

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
      <IonList lines="full">
        {linkedGroups.length === 0 ? (
          <IonItem>
            <IonLabel color="medium" className="ion-text-center" style={{ padding: '24px 0' }}>
              <p>No modifiers linked</p>
              <IonText color="medium" style={{ fontSize: '0.875rem' }}>
                <p>Click "+" to add modifier groups from the shop library</p>
              </IonText>
            </IonLabel>
          </IonItem>
        ) : (
          <IonReorderGroup
            disabled={!canEdit || !onReorder || !reorderEnabled}
            onIonReorderEnd={onReorder}
          >
            {linkedGroups.map((group) => {
              const modifierCount = group.modifiers?.length || 0;
              const groupHasOverrides = hasOverrides(group);
              const selectionText = group.max_select
                ? `Select ${group.min_select}-${group.max_select}`
                : `Select ${group.min_select}+`;

              return (
                <IonItem
                  key={group.id}
                  button={canEdit}
                  detail={false}
                  onClick={() => canEdit && onEdit(group)}
                >
                  <IonLabel>
                    <div className="flex items-center gap-2">
                      <h3>{group.name}</h3>
                      <IonBadge
                        color={group.is_required ? 'danger' : 'medium'}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {group.is_required ? 'Required' : 'Optional'}
                      </IonBadge>
                      {groupHasOverrides && (
                        <IonIcon
                          icon={pricetagOutline}
                          color="primary"
                          style={{ fontSize: '16px' }}
                        />
                      )}
                    </div>
                    <div>
                      <IonText2 color="medium" fontSize="0.85em">
                        {modifierCount} {modifierCount === 1 ? 'modifier' : 'modifiers'}
                      </IonText2>
                      <IonText2 color="medium" fontSize="0.85em">
                        • {selectionText}
                      </IonText2>
                    </div>
                    {groupHasOverrides && (
                      <IonText2 color="primary" fontSize="0.85em">
                        Has price overrides
                      </IonText2>
                    )}
                  </IonLabel>

                  {/* Reorder handle */}
                  {canEdit && onReorder && reorderEnabled && (
                    <IonReorder slot="end" className="ion-margin-top">
                      <IonIcon icon={reorderTwoOutline} size="small" />
                    </IonReorder>
                  )}
                </IonItem>
              );
            })}
          </IonReorderGroup>
        )}
      </IonList>

      {/* Reorder Toggle - Only show if there are items and user can edit */}
      {linkedGroups.length > 0 && canEdit && onReorder && (
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

export default ProductModifiersList;
