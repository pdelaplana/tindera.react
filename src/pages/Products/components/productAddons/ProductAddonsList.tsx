// Product Addons List Component - Display and manage product add-ons

import { IonButton, IonIcon, IonItem, IonLabel, IonList, IonText } from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { CardContainer } from '@/components/shared';
import type { ProductAddon } from '@/types';

interface ProductAddonsListProps {
  /** Array of product add-ons */
  addons: ProductAddon[];
  /** Function to format currency values */
  formatCurrency: (amount: number) => string;
  /** Handler for adding a new addon */
  onAdd: () => void;
  /** Handler for editing an addon */
  onEdit: (addon: ProductAddon) => void;
  /** Whether user can edit addons */
  canEdit: boolean;
}

const ProductAddonsList: React.FC<ProductAddonsListProps> = ({
  addons,
  formatCurrency,
  onAdd,
  onEdit,
  canEdit,
}) => {
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
      <IonList lines="full">
        {addons.length === 0 ? (
          <IonItem>
            <IonLabel color="medium" className="ion-text-center" style={{ padding: '24px 0' }}>
              <p>No add-ons configured</p>
              <IonText color="medium" style={{ fontSize: '0.875rem' }}>
                <p>Click "Add Addon" to create optional add-ons for this product</p>
              </IonText>
            </IonLabel>
          </IonItem>
        ) : (
          addons.map((addon) => (
            <IonItem
              key={addon.id}
              button={canEdit}
              detail={false}
              onClick={() => canEdit && onEdit(addon)}
            >
              <IonLabel>
                <h3>{addon.name}</h3>
                <p>
                  +{formatCurrency(addon.price)}
                  {addon.inventory_item_id && addon.item_name && (
                    <>
                      {' '}
                      • uses {addon.quantity} {addon.item_name}
                    </>
                  )}
                </p>
              </IonLabel>
            </IonItem>
          ))
        )}
      </IonList>
    </CardContainer>
  );
};

export default ProductAddonsList;
