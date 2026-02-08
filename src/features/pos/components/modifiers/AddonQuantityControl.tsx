// AddonQuantityControl - Quantity selector for product addons

import { IonIcon } from '@ionic/react';
import { addOutline, removeOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { PriceDisplay } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';
import type { ProductAddon } from '@/types';

interface AddonQuantityControlProps {
  addon: ProductAddon;
  quantity: number;
  onQuantityChange: (addonId: string, quantity: number) => void;
  currency?: string;
}

const AddonContainer = styled.div<{ $isSelected: boolean }>`
	display: flex;
	align-items: center;
	gap: ${designSystem.spacing.md};
	padding: ${designSystem.spacing.md};
	opacity: ${(props) => (props.$isSelected ? 1 : 0.6)};
	transition: opacity 0.2s ease;
`;

const AddonInfo = styled.div`
	flex: 1;
	min-width: 0;
	cursor: pointer;
	user-select: none;

	&:active {
		opacity: 0.7;
	}
`;

const AddonName = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
`;

const AddonPrice = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin-top: 2px;
`;

const QuantityControls = styled.div`
	display: flex;
	align-items: center;
	gap: ${designSystem.spacing.sm};
`;

const QuantityButton = styled.button`
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: ${designSystem.borderRadius.full};
	background: ${designSystem.colors.gray[100]};
	border: none;
	cursor: pointer;
	transition: background 0.2s ease;

	&:hover {
		background: ${designSystem.colors.gray[200]};
	}

	&:active {
		background: ${designSystem.colors.gray[300]};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const QuantityDisplay = styled.span`
	width: 32px;
	text-align: center;
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
`;

export const AddonQuantityControl: React.FC<AddonQuantityControlProps> = ({
  addon,
  quantity,
  onQuantityChange,
  currency = 'USD',
}) => {
  const handleIncrease = () => {
    onQuantityChange(addon.id, quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > 0) {
      onQuantityChange(addon.id, quantity - 1);
    }
  };

  return (
    <AddonContainer $isSelected={quantity > 0}>
      {/* Addon Info */}
      <AddonInfo onClick={handleIncrease}>
        <AddonName>{addon.name}</AddonName>
        <AddonPrice>
          +<PriceDisplay amount={addon.price} currency={currency} />
        </AddonPrice>
      </AddonInfo>

      {/* Quantity Controls */}
      <QuantityControls>
        <QuantityButton
          type="button"
          onClick={handleDecrease}
          disabled={quantity === 0}
          aria-label="Decrease quantity"
        >
          <IonIcon icon={removeOutline} />
        </QuantityButton>

        <QuantityDisplay>{quantity}</QuantityDisplay>

        <QuantityButton type="button" onClick={handleIncrease} aria-label="Increase quantity">
          <IonIcon icon={addOutline} />
        </QuantityButton>
      </QuantityControls>
    </AddonContainer>
  );
};

export default AddonQuantityControl;
