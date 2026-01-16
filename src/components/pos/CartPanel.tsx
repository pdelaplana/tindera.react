// CartPanel - Order summary panel (right side on tablet)

import { IonIcon } from '@ionic/react';
import { cartOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';
import type { CartItem as CartItemType } from '@/types';
import { CartItem } from './CartItem';
import { ChargeButton } from './ChargeButton';
import { OrderTotals } from './OrderTotals';

interface CartPanelProps {
  items: CartItemType[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  total: number;
  currency?: string;
  customerName?: string;
  onQuantityChange?: (cartItemId: string, quantity: number) => void;
  onRemoveItem?: (cartItemId: string) => void;
  onEditItem?: (cartItemId: string) => void;
  onCharge?: () => void;
  loading?: boolean;
  className?: string;
}

const PanelContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	background: ${designSystem.colors.surface.elevated};
`;

const PanelHeader = styled.div`
	padding: ${designSystem.spacing.lg};
	border-bottom: 1px solid ${designSystem.colors.gray[200]};
`;

const PanelTitle = styled.h2`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0;
`;

const CustomerName = styled.p`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin: ${designSystem.spacing.xs} 0 0 0;
`;

const ItemsList = styled.div`
	flex: 1;
	overflow-y: auto;
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${designSystem.spacing['3xl']} ${designSystem.spacing.lg};
	text-align: center;
	color: ${designSystem.colors.text.secondary};

	ion-icon {
		font-size: 64px;
		color: ${designSystem.colors.gray[300]};
		margin-bottom: ${designSystem.spacing.md};
	}

	h3 {
		font-size: ${designSystem.typography.fontSize.lg};
		font-weight: ${designSystem.typography.fontWeight.medium};
		color: ${designSystem.colors.text.primary};
		margin: 0 0 ${designSystem.spacing.xs} 0;
	}

	p {
		font-size: ${designSystem.typography.fontSize.sm};
		color: ${designSystem.colors.text.secondary};
		margin: 0;
	}
`;

const ItemsContainer = styled.div`
	& > * {
		border-bottom: 1px solid ${designSystem.colors.gray[100]};

		&:last-child {
			border-bottom: none;
		}
	}
`;

const PanelFooter = styled.div`
	border-top: 1px solid ${designSystem.colors.gray[200]};
	margin-top: auto;
`;

const ChargeButtonContainer = styled.div`
	padding: 0 ${designSystem.spacing.lg} ${designSystem.spacing.lg};
`;

export const CartPanel: React.FC<CartPanelProps> = ({
  items,
  subtotal,
  tax = 0,
  taxRate,
  discount = 0,
  total,
  currency = 'USD',
  customerName,
  onQuantityChange,
  onRemoveItem,
  onEditItem,
  onCharge,
  loading = false,
  className = '',
}) => {
  const isEmpty = items.length === 0;

  return (
    <PanelContainer className={className}>
      {/* Header */}
      <PanelHeader>
        <PanelTitle>Current Order</PanelTitle>
        {customerName && <CustomerName>{customerName}</CustomerName>}
      </PanelHeader>

      {/* Items List */}
      <ItemsList>
        {isEmpty ? (
          <EmptyState>
            <IonIcon icon={cartOutline} />
            <h3>Cart is empty</h3>
            <p>Tap products to add them to the order</p>
          </EmptyState>
        ) : (
          <ItemsContainer>
            {items.map((item) => (
              <CartItem
                key={item.cart_item_id}
                item={item}
                currency={currency}
                onQuantityChange={(qty) => onQuantityChange?.(item.cart_item_id, qty)}
                onRemove={() => onRemoveItem?.(item.cart_item_id)}
                onTap={() => onEditItem?.(item.cart_item_id)}
              />
            ))}
          </ItemsContainer>
        )}
      </ItemsList>

      {/* Totals & Charge Button */}
      {!isEmpty && (
        <PanelFooter>
          <OrderTotals
            subtotal={subtotal}
            tax={tax}
            taxRate={taxRate}
            discount={discount}
            total={total}
            currency={currency}
          />

          <ChargeButtonContainer>
            <ChargeButton amount={total} currency={currency} loading={loading} onClick={onCharge} />
          </ChargeButtonContainer>
        </PanelFooter>
      )}
    </PanelContainer>
  );
};

export default CartPanel;
