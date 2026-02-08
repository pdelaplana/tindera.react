// PackageSizeListItem - Styled package size card using reusable CardItem

import { IonBadge, IonIcon } from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { CardItem } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import type { PackageSize } from '@/types';

interface PackageSizeListItemProps {
  packageSize: PackageSize;
  baseUom: string;
  formatCurrency: (amount: number) => string;
  onClick: () => void;
  canEdit: boolean;
}

// Styled components for content
const PackageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  margin-bottom: ${designSystem.spacing.xs};
  flex-wrap: wrap;
`;

const PackageName = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
`;

const DefaultBadge = styled(IonBadge)`
  --background: ${designSystem.colors.status.paid};
  --color: white;
  font-size: ${designSystem.typography.fontSize.xs};
  font-weight: ${designSystem.typography.fontWeight.medium};
  padding: 2px 8px;
`;

const ConversionInfo = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
  margin-bottom: ${designSystem.spacing.xs};
`;

const CostInfo = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const PackageSizeListItem: React.FC<PackageSizeListItemProps> = ({
  packageSize,
  baseUom,
  formatCurrency,
  onClick,
  canEdit,
}) => {
  return (
    <CardItem
      canClick={canEdit}
      onClick={onClick}
      rightContent={
        packageSize.is_default ? (
          <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: '24px' }} />
        ) : undefined
      }
    >
      <PackageHeader>
        <PackageName>{packageSize.package_name}</PackageName>
        {packageSize.is_default && <DefaultBadge>Default</DefaultBadge>}
      </PackageHeader>

      <ConversionInfo>
        1 {packageSize.package_uom} = {packageSize.units_per_package} {baseUom}
      </ConversionInfo>

      {packageSize.cost_per_package && (
        <CostInfo>Typical cost: {formatCurrency(packageSize.cost_per_package)}</CostInfo>
      )}
    </CardItem>
  );
};

export default PackageSizeListItem;
