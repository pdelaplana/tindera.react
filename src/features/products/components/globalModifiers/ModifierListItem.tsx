// ModifierListItem - Styled modifier card matching ProductListItem pattern

import { IonBadge, IonIcon, IonReorder } from '@ionic/react';
import { reorderTwoOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';
import type { Modifier } from '@/types';

interface ModifierListItemProps {
  modifier: Modifier;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
  canEdit: boolean;
  showReorderHandle?: boolean;
}

// Styled components - matching ProductListItem pattern
const Card = styled.div<{ isSelected: boolean; canEdit: boolean }>`
  background: ${(props) =>
    props.isSelected ? designSystem.colors.surface.variant : designSystem.colors.surface.base};
  border-radius: ${designSystem.borderRadius.md};
  padding: ${designSystem.spacing.md};
  cursor: ${(props) => (props.canEdit ? 'pointer' : 'default')};
  transition: all ${designSystem.transitions.base};
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border: 1px solid
    ${(props) =>
      props.isSelected ? designSystem.colors.brand.primary : designSystem.colors.gray[200]};

  ${(props) =>
    props.canEdit &&
    `
    &:hover {
      background: ${designSystem.colors.surface.variant};
      box-shadow: ${designSystem.shadows.sm};
    }

    &:active {
      transform: scale(0.99);
    }
  `}
`;

const CardContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${designSystem.spacing.md};
`;

const LeftContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ModifierName = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: ${designSystem.spacing.xs};
`;

const ModifierMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  font-size: ${designSystem.typography.fontSize.sm};
  color: ${designSystem.colors.text.secondary};
`;

const RightContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  flex-shrink: 0;
`;

const DefaultBadge = styled(IonBadge)`
  --background: ${designSystem.colors.status.paid};
  --color: white;
  font-size: ${designSystem.typography.fontSize.xs};
  font-weight: ${designSystem.typography.fontWeight.medium};
  padding: 2px 8px;
`;

const ModifierListItem: React.FC<ModifierListItemProps> = ({
  modifier,
  onClick,
  formatCurrency,
  canEdit,
  showReorderHandle = false,
}) => {
  return (
    <Card
      isSelected={false}
      canEdit={canEdit && !showReorderHandle}
      onClick={() => canEdit && !showReorderHandle && onClick()}
      role={canEdit && !showReorderHandle ? 'button' : undefined}
      tabIndex={canEdit && !showReorderHandle ? 0 : undefined}
    >
      <CardContent>
        
        <LeftContent>
          <ModifierName>{modifier.name}</ModifierName>
          <ModifierMeta>
            <span>{formatCurrency(modifier.default_price_adjustment)}</span>
          </ModifierMeta>
        </LeftContent>

        <RightContent>
          {modifier.is_default && <DefaultBadge>Default</DefaultBadge>}
        </RightContent>
        {showReorderHandle && (
          <IonReorder slot="start">
            <IonIcon icon={reorderTwoOutline} size="small" />
          </IonReorder>
        )}

      </CardContent>
    </Card>
  );
};

export default ModifierListItem;
