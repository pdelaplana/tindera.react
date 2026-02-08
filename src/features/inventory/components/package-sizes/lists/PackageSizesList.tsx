// Package Sizes List Component - Display and manage inventory item package sizes

import { IonButton, IonIcon } from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import type { PackageSize } from '@/types';
import PackageSizeListItem from './PackageSizeListItem';

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

// Styled components
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

const ListContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.sm};
  padding: ${designSystem.spacing.md};
`;

const BaseUomInfo = styled.div`
  padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
  background: ${designSystem.colors.surface.variant};
  border-radius: ${designSystem.borderRadius.sm};
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
  text-align: center;
  margin-bottom: ${designSystem.spacing.sm};
`;

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
          shape="round"
        >
          <IonIcon slot="icon-only" icon={add} />
        </IonButton>
      }
    >
      {packageSizes.length === 0 ? (
        <EmptyContainer>
          <h3>No Package Sizes Defined</h3>
          <p>Click the + button to define how this item is purchased or received</p>
        </EmptyContainer>
      ) : (
        <ListContent>
          <BaseUomInfo>Base Unit: {baseUom}</BaseUomInfo>
          {packageSizes.map((pkg) => (
            <PackageSizeListItem
              key={pkg.id}
              packageSize={pkg}
              baseUom={baseUom}
              formatCurrency={formatCurrency}
              onClick={() => onEdit(pkg)}
              canEdit={canEdit}
            />
          ))}
        </ListContent>
      )}
    </CardContainer>
  );
};

export default PackageSizesList;
