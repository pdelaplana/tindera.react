// CartItem - Single line item in the cart

import { IonIcon } from '@ionic/react';
import { addOutline, removeOutline, trashOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { PriceDisplay } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';
import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
  currency?: string;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
  onTap?: () => void;
  className?: string;
}

const ItemContainer = styled.div<{ $isTappable: boolean }>`
	display: flex;
	align-items: flex-start;
	gap: ${designSystem.spacing.md};
	padding: ${designSystem.spacing.md};
	cursor: ${(props) => (props.$isTappable ? 'pointer' : 'default')};
	transition: background 0.2s ease;

	${(props) =>
    props.$isTappable &&
    `
		&:hover {
			background: ${designSystem.colors.gray[50]};
		}

		&:active {
			background: ${designSystem.colors.gray[100]};
		}
	`}
`;

const ProductInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const ProductName = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
	margin-top: 4px;
`;

const ProductPrice = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin-top: 5px;
`;

const AddonsList = styled.div`
	margin-top: ${designSystem.spacing.xs};
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const AddonItem = styled.div`
	display: flex;
	align-items: center;
	gap: ${designSystem.spacing.xs};
	font-size: ${designSystem.typography.fontSize.xs};
	color: ${designSystem.colors.text.secondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
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
`;

const QuantityDisplay = styled.span`
	width: 32px;
	text-align: center;
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
`;

const LineTotal = styled.div`
	text-align: right;
	min-width: 80px;
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
	margin-top: 4px;
`;

export const CartItem: React.FC<CartItemProps> = ({
  item,
  currency = 'USD',
  onQuantityChange,
  onRemove,
  onTap,
  className = '',
}) => {
  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger onTap
    if (item.quantity > 1) {
      onQuantityChange?.(item.quantity - 1);
    } else {
      onRemove?.();
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger onTap
    onQuantityChange?.(item.quantity + 1);
  };

  const hasModifiers = item.modifiers.length > 0;
  const hasAddons = item.addons.length > 0;

  return (
    <ItemContainer className={className} $isTappable={!!onTap} onClick={() => onTap?.()}>
      {/* Product Info */}
      <ProductInfo>
        <ProductName>{item.product.name}</ProductName>
        <ProductPrice>
          <PriceDisplay amount={item.product.price} currency={currency} /> each
        </ProductPrice>
        {hasModifiers && (
          <AddonsList>
            {item.modifiers.map((modifier, index) => (
              <AddonItem key={`${modifier.modifier_group_id}-${modifier.modifier_id}-${index}`}>
                • {modifier.modifier_name}
                {modifier.price_adjustment !== 0 && (
                  <>
                    {' '}
                    ({modifier.price_adjustment > 0 ? '+' : ''}
                    <PriceDisplay amount={modifier.price_adjustment} currency={currency} />)
                  </>
                )}
              </AddonItem>
            ))}
          </AddonsList>
        )}
        {hasAddons && (
          <AddonsList>
            {item.addons.map((addon) => (
              <AddonItem key={addon.addon_id}>
                + {addon.quantity}x {addon.name}
              </AddonItem>
            ))}
          </AddonsList>
        )}
      </ProductInfo>

      {/* Quantity Controls */}
      <QuantityControls>
        <QuantityButton type="button" onClick={handleDecrease} aria-label="Decrease quantity">
          <IonIcon icon={item.quantity === 1 ? trashOutline : removeOutline} />
        </QuantityButton>

        <QuantityDisplay>{item.quantity}</QuantityDisplay>

        <QuantityButton type="button" onClick={handleIncrease} aria-label="Increase quantity">
          <IonIcon icon={addOutline} />
        </QuantityButton>
      </QuantityControls>

      {/* Line Total */}
      <LineTotal>
        <PriceDisplay amount={item.amount} currency={currency} />
      </LineTotal>
    </ItemContainer>
  );
};

export default CartItem;
