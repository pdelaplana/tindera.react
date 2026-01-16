// Product Items List Component - Display and manage product ingredients/components

import { IonButton, IonIcon, IonItem, IonLabel, IonList, IonText } from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { CardContainer } from '@/components/shared';
import type { ProductItem } from '@/types';

interface ProductItemsListProps {
  /** Array of product items (ingredients/components) */
  items: ProductItem[];
  /** Function to format currency values */
  formatCurrency: (amount: number) => string;
  /** Handler for adding a new item */
  onAdd: () => void;
  /** Handler for editing an item */
  onEdit: (item: ProductItem) => void;
  /** Whether user can edit items */
  canEdit: boolean;
}

const ProductItemsList: React.FC<ProductItemsListProps> = ({
  items,
  formatCurrency,
  onAdd,
  onEdit,
  canEdit,
}) => {
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
      <IonList lines="full">
        {items.length === 0 ? (
          <IonItem lines="none">
            <IonLabel color="medium" className="ion-text-center" style={{ padding: '24px 0' }}>
              <p>No ingredients added yet</p>
              <IonText color="medium" style={{ fontSize: '0.875rem' }}>
                <p>Click "Add Item" to add ingredients or components to this product</p>
              </IonText>
            </IonLabel>
          </IonItem>
        ) : (
          items.map((item) => (
            <IonItem
              key={item.id}
              button={canEdit}
              detail={false}
              onClick={() => canEdit && onEdit(item)}
            >
              <IonLabel>
                <h3>{item.item_name}</h3>
                <p>
                  {item.quantity} {item.uom} @ {formatCurrency(item.unit_cost)} per {item.uom}
                </p>
              </IonLabel>
            </IonItem>
          ))
        )}
        {items.length > 0 ? (
          <IonItem lines="none">
            <IonLabel slot="end">
              <h3>{`Total Cost: ${formatCurrency(totalCost)}`}</h3>
            </IonLabel>
          </IonItem>
        ) : null}
      </IonList>
    </CardContainer>
  );
};

export default ProductItemsList;
