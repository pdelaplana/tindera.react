// InventoryActionsCard - Action buttons card for inventory operations

import type React from 'react';
import styled from 'styled-components';
import { CardContainer } from '@/components/shared';
import { designSystem } from '@/theme/designSystem';
import InventoryActionButtons from '../sections/InventoryActionButtons';

interface InventoryActionsCardProps {
  onEdit: () => void;
  onReceive: () => void;
  onAdjust: () => void;
  onOptions: () => void;
  disabled?: boolean;
}

const ActionsContent = styled.div`
  padding: ${designSystem.spacing.md};
`;

const InventoryActionsCard: React.FC<InventoryActionsCardProps> = ({
  onEdit,
  onReceive,
  onAdjust,
  onOptions,
  disabled = false,
}) => {
  return (
    <CardContainer title="Actions">
      <ActionsContent>
        <InventoryActionButtons
          onEdit={onEdit}
          onReceive={onReceive}
          onAdjust={onAdjust}
          onOptions={onOptions}
          disabled={disabled}
        />
      </ActionsContent>
    </CardContainer>
  );
};

export default InventoryActionsCard;
