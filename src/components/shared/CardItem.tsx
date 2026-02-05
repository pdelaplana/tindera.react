// CardItem - Reusable card component for list items

import { IonIcon, IonReorder } from '@ionic/react';
import { reorderTwoOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

interface CardItemProps {
  /** Whether the card is selected */
  isSelected?: boolean;
  /** Whether the card is clickable */
  canClick?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether to show reorder handle */
  showReorderHandle?: boolean;
  /** Main content */
  children: React.ReactNode;
  /** Optional left content (thumbnail, icon, etc.) */
  leftContent?: React.ReactNode;
  /** Optional right content (badges, icons, etc.) */
  rightContent?: React.ReactNode;
  /** Optional className for additional styling */
  className?: string;
}

const Card = styled.div<{ isSelected: boolean; canClick: boolean }>`
  background: ${(props) =>
    props.isSelected ? designSystem.colors.surface.variant : designSystem.colors.surface.base};
  border-radius: ${designSystem.borderRadius.md};
  padding: ${designSystem.spacing.md};
  cursor: ${(props) => (props.canClick ? 'pointer' : 'default')};
  transition: all ${designSystem.transitions.base};
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border: 1px solid
    ${(props) =>
      props.isSelected ? designSystem.colors.brand.primary : designSystem.colors.gray[200]};

  ${(props) =>
    props.canClick &&
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
  gap: ${designSystem.spacing.md};
  align-items: center;
  width: 100%;
`;

const LeftContent = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const MainContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RightContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  flex-shrink: 0;
`;

const CardItem: React.FC<CardItemProps> = ({
  isSelected = false,
  canClick = true,
  onClick,
  showReorderHandle = false,
  children,
  leftContent,
  rightContent,
  className,
}) => {
  const handleClick = () => {
    if (canClick && !showReorderHandle && onClick) {
      onClick();
    }
  };

  return (
    <Card
      isSelected={isSelected}
      canClick={canClick && !showReorderHandle}
      onClick={handleClick}
      role={canClick && !showReorderHandle ? 'button' : undefined}
      tabIndex={canClick && !showReorderHandle ? 0 : undefined}
      className={className}
    >
      <CardContent>
        {leftContent && <LeftContent>{leftContent}</LeftContent>}

        <MainContent>{children}</MainContent>

        {rightContent && <RightContent>{rightContent}</RightContent>}
        {showReorderHandle && (
          <IonReorder slot="start">
            <IonIcon icon={reorderTwoOutline} size="small" />
          </IonReorder>
        )}
      </CardContent>
    </Card>
  );
};

export default CardItem;
