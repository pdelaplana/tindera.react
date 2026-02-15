// InventoryActionsCard - Action buttons card for inventory operations

import type React from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import InventoryActionButtons from '../sections/InventoryActionButtons';

interface InventoryActionsCardProps {
  onReceive: () => void;
  onAdjust: () => void;
  onInitiateCount: () => void;
  disabled?: boolean;
}

const ActionsContent = styled.div`
  padding: ${designSystem.spacing.md};
`;

const InventoryActionsCard: React.FC<InventoryActionsCardProps> = ({
  onReceive,
  onAdjust,
  onInitiateCount,
  disabled = false,
}) => {
  return (
    <CardContainer title="Actions">
      <ActionsContent>
        <InventoryActionButtons
          onReceive={onReceive}
          onAdjust={onAdjust}
          onInitiateCount={onInitiateCount}
          disabled={disabled}
        />
      </ActionsContent>
    </CardContainer>
  );
};

export default InventoryActionsCard;
