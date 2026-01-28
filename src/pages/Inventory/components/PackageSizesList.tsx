// Package Sizes List Component - Display and manage inventory item package sizes

import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonText,
} from '@ionic/react';
import { add, checkmark } from 'ionicons/icons';
import type React from 'react';
import { CardContainer } from '@/components/shared';
import type { PackageSize } from '@/types';

interface PackageSizesListProps {
  /** Array of package sizes */
  packageSizes: PackageSize[];
  /** Base unit of measure for the item */
  baseUom: string;
  /** Function to format currency values */
  formatCurrency: (amount: number) => string;
  /** Handler for adding a new package size */
  onAdd: () => void;
  /** Handler for editing a package size */
  onEdit: (packageSize: PackageSize) => void;
  /** Handler for deleting a package size */
  onDelete: (packageSizeId: string) => void;
  /** Whether user can edit package sizes */
  canEdit: boolean;
}

const PackageSizesList: React.FC<PackageSizesListProps> = ({
  packageSizes,
  baseUom,
  formatCurrency,
  onAdd,
  onEdit,
  canEdit,
}) => {
  return (
    <CardContainer
      noPadding={true}
      title={`Package Sizes (${packageSizes.length})`}
      actionButton={
        <IonButton
          fill="clear"
          color="primary"
          onClick={onAdd}
          aria-label="Add package size"
          disabled={!canEdit}
        >
          <IonIcon slot="icon-only" icon={add} />
        </IonButton>
      }
    >
      <IonList lines="full">
        <IonListHeader className="ion-justify-content-between ion-align-items-content-around">
          <IonLabel>{packageSizes.length > 0 && <IonText>Base Unit: {baseUom}</IonText>}</IonLabel>
        </IonListHeader>

        {packageSizes.length === 0 ? (
          <IonItem>
            <IonLabel color="medium" className="ion-text-center" style={{ padding: '24px 0' }}>
              <p>No package sizes defined yet</p>
              <IonText color="medium" style={{ fontSize: '0.875rem' }}>
                <p>Click "Add Package Size" to define how this item is purchased or received</p>
              </IonText>
            </IonLabel>
          </IonItem>
        ) : (
          packageSizes.map((pkg) => (
            <IonItem
              key={pkg.id}
              button={canEdit}
              detail={false}
              onClick={() => canEdit && onEdit(pkg)}
            >
              <IonLabel>
                <h3>
                  {pkg.package_name}
                  {pkg.is_default && (
                    <IonIcon icon={checkmark} color="success" style={{ marginLeft: '8px' }} />
                  )}
                </h3>
                <p>
                  1 {pkg.package_uom} = {pkg.units_per_package} {baseUom}
                </p>
                {pkg.cost_per_package && (
                  <p>Typical cost: {formatCurrency(pkg.cost_per_package)}</p>
                )}
              </IonLabel>
            </IonItem>
          ))
        )}
      </IonList>
    </CardContainer>
  );
};

export default PackageSizesList;
