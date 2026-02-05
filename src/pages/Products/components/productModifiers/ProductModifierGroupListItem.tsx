// ProductModifierGroupListItem - Styled modifier group card using reusable CardItem

import { IonBadge, IonIcon } from '@ionic/react';
import { pricetagOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { CardItem } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import type { ModifierGroupWithModifiers } from '@/types';

interface ProductModifierGroupListItemProps {
  group: ModifierGroupWithModifiers;
  hasOverrides: boolean;
  onClick: () => void;
  canEdit: boolean;
  showReorderHandle?: boolean;
}

// Styled components for content
const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  margin-bottom: ${designSystem.spacing.xs};
  flex-wrap: wrap;
`;

const GroupName = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
`;

const RequiredBadge = styled(IonBadge)<{ isRequired: boolean }>`
  --background: ${(props) =>
    props.isRequired ? designSystem.colors.status.unpaid : designSystem.colors.gray[400]};
  --color: white;
  font-size: ${designSystem.typography.fontSize.xs};
  font-weight: ${designSystem.typography.fontWeight.medium};
  padding: 2px 8px;
`;

const GroupMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
  margin-bottom: ${designSystem.spacing.xs};
`;

const MetaDivider = styled.span`
  color: ${designSystem.colors.gray[300]};
`;

const OverrideIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.brand.primary};
  font-weight: ${designSystem.typography.fontWeight.medium};
`;

const ProductModifierGroupListItem: React.FC<ProductModifierGroupListItemProps> = ({
  group,
  hasOverrides,
  onClick,
  canEdit,
  showReorderHandle = false,
}) => {
  const modifierCount = group.modifiers?.length || 0;
  const selectionText = group.max_select
    ? `Select ${group.min_select}-${group.max_select}`
    : `Select ${group.min_select}+`;

  return (
    <CardItem
      canClick={canEdit}
      onClick={onClick}
      showReorderHandle={showReorderHandle}
      rightContent={
        hasOverrides ? (
          <IonIcon icon={pricetagOutline} color="primary" style={{ fontSize: '20px' }} />
        ) : undefined
      }
    >
      <GroupHeader>
        <GroupName>{group.name}</GroupName>
        <RequiredBadge isRequired={group.is_required}>
          {group.is_required ? 'Required' : 'Optional'}
        </RequiredBadge>
      </GroupHeader>

      <GroupMeta>
        <span>
          {modifierCount} {modifierCount === 1 ? 'modifier' : 'modifiers'}
        </span>
        <MetaDivider>·</MetaDivider>
        <span>{selectionText}</span>
      </GroupMeta>

      {hasOverrides && (
        <OverrideIndicator>
          <IonIcon icon={pricetagOutline} style={{ fontSize: '16px' }} />
          <span>Has price overrides</span>
        </OverrideIndicator>
      )}
    </CardItem>
  );
};

export default ProductModifierGroupListItem;
