// OrderDetail - Receipt-style order details display

import { IonBadge, IonButton, IonIcon } from '@ionic/react';
import { mailOutline, printOutline } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { PriceDisplay } from '@/components/ui';
import { useUI } from '@/contexts/UIContext';
import { designSystem } from '@/theme/designSystem';
import type { OrderWithDetails, Shop } from '@/types';

interface OrderDetailProps {
  order: OrderWithDetails | null;
  shop: Shop;
  onVoid: () => void;
  onRefund: () => void;
}

// Styled components
const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	background: ${designSystem.colors.surface.base};
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: ${designSystem.spacing.xl};
	text-align: center;
`;

const EmptyText = styled.div`
	font-size: ${designSystem.typography.fontSize.lg};
	color: ${designSystem.colors.text.secondary};
`;

const ReceiptContainer = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: ${designSystem.spacing.lg};
`;

const Receipt = styled.div`
	max-width: 600px;
	margin: 0 auto;
	background: white;
	border-radius: ${designSystem.borderRadius.lg};
	box-shadow: ${designSystem.shadows.md};
	padding: ${designSystem.spacing.xl};
`;

const ReceiptHeader = styled.div`
	text-align: center;
	padding-bottom: ${designSystem.spacing.lg};
	border-bottom: 2px solid ${designSystem.colors.gray[200]};
	margin-bottom: ${designSystem.spacing.lg};
`;

const ShopName = styled.h2`
	font-size: ${designSystem.typography.fontSize['2xl']};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.xs} 0;
`;

const ShopLocation = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
`;

const OrderInfo = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: ${designSystem.spacing.md};
`;

const OrderNumber = styled.div`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
`;

const OrderDate = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
`;

const StatusBadgeStyled = styled(IonBadge)<{ statusType: 'completed' | 'voided' | 'refunded' }>`
	--background: ${(props) => {
    switch (props.statusType) {
      case 'completed':
        return designSystem.colors.status.paid;
      case 'voided':
        return designSystem.colors.danger;
      case 'refunded':
        return designSystem.colors.warning;
      default:
        return designSystem.colors.gray[400];
    }
  }};
	--color: white;
	font-size: ${designSystem.typography.fontSize.sm};
	font-weight: ${designSystem.typography.fontWeight.medium};
	padding: 4px 12px;
	margin-bottom: ${designSystem.spacing.md};
`;

const Section = styled.div`
	margin-bottom: ${designSystem.spacing.lg};
	padding-bottom: ${designSystem.spacing.lg};
	border-bottom: 1px solid ${designSystem.colors.gray[200]};

	&:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}
`;

const SectionTitle = styled.h3`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.md} 0;
`;

const LineItems = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.md};
`;

const LineItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.xs};
`;

const LineItemHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
`;

const LineItemName = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
	flex: 1;
`;

const LineItemQuantity = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin-right: ${designSystem.spacing.sm};
`;

const LineItemTotal = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
	min-width: 80px;
	text-align: right;
`;

const ModifiersList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	margin-left: ${designSystem.spacing.lg};
`;

const ModifierItem = styled.div`
	display: flex;
	justify-content: space-between;
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
`;

const AddonsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	margin-left: ${designSystem.spacing.lg};
`;

const AddonItem = styled.div`
	display: flex;
	justify-content: space-between;
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
`;

const TotalsSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
`;

const TotalRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.primary};
`;

const TotalRowSecondary = styled(TotalRow)`
	color: ${designSystem.colors.text.secondary};
	font-size: ${designSystem.typography.fontSize.sm};
`;

const DiscountRow = styled(TotalRow)`
	color: ${designSystem.colors.success};
`;

const GrandTotalRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: ${designSystem.spacing.md};
	margin-top: ${designSystem.spacing.sm};
	border-top: 2px solid ${designSystem.colors.gray[300]};
`;

const TotalLabel = styled.span`
	font-size: ${designSystem.typography.fontSize.xl};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.text.primary};
`;

const TotalAmount = styled.span`
	font-size: ${designSystem.typography.fontSize['2xl']};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.brand.primary};
`;

const PaymentInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
`;

const PaymentRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: ${designSystem.spacing.md};
`;

const PaymentLabel = styled.span`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
`;

const PaymentValue = styled.span`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
	text-align: right;
`;

const VoidRefundInfo = styled.div`
	background: ${designSystem.colors.gray[50]};
	border-radius: ${designSystem.borderRadius.md};
	padding: ${designSystem.spacing.md};
	margin-bottom: ${designSystem.spacing.lg};
`;

const VoidRefundTitle = styled.h4`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.sm} 0;
`;

const VoidRefundDetail = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin-bottom: ${designSystem.spacing.xs};

	&:last-child {
		margin-bottom: 0;
	}
`;

const ActionButtons = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: ${designSystem.spacing.sm};
	padding: ${designSystem.spacing.lg};
	border-top: 1px solid ${designSystem.colors.gray[200]};
	background: ${designSystem.colors.surface.variant};
`;

const ActionButton = styled(IonButton)`
	--padding-start: ${designSystem.spacing.md};
	--padding-end: ${designSystem.spacing.md};
	flex: 1;
	min-width: 140px;
`;

// Helper functions
const formatOrderNumber = (orderNumber: number | null, prefix: string | null): string => {
  if (!orderNumber) return 'N/A';
  const paddedNumber = orderNumber.toString().padStart(4, '0');
  return prefix ? `#${prefix}-${paddedNumber}` : `#${paddedNumber}`;
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Paid';
    case 'voided':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
};

const getDiscountLabel = (discountMethod: string | null, discountValue: number | null): string => {
  if (!discountMethod || discountValue === null) return 'Discount';

  if (discountMethod === 'percentage') {
    return `Discount (${discountValue}%)`;
  }
  return 'Discount (Fixed)';
};

export const OrderDetail: React.FC<OrderDetailProps> = ({ order, shop, onVoid, onRefund }) => {
  const { showInfo } = useUI();

  // Empty state
  if (!order) {
    return (
      <Container>
        <EmptyState>
          <EmptyText>Select an order to view details</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  // Calculate subtotal (sum of all items before tax/discount/tip)
  const subtotal = order.order_items.reduce((sum, item) => {
    const itemTotal = item.product_unit_price * item.quantity;
    const modifiersTotal = item.modifiers.reduce(
      (modSum, mod) => modSum + mod.price_adjustment * mod.quantity * item.quantity,
      0
    );
    const addonsTotal = item.addons.reduce(
      (addonSum, addon) => addonSum + addon.price * addon.quantity,
      0
    );
    return sum + itemTotal + modifiersTotal + addonsTotal;
  }, 0);

  const orderNumber = formatOrderNumber(order.order_number, shop.order_prefix);
  const orderDateTime = formatDateTime(order.order_date);
  const statusType = order.status as 'completed' | 'voided' | 'refunded';
  const statusLabel = getStatusLabel(order.status);
  const discountLabel = getDiscountLabel(order.discount_method, order.discount_value);

  const handlePrint = () => {
    showInfo('Print functionality coming soon');
  };

  const handleEmail = () => {
    showInfo('Email functionality coming soon');
  };

  const showActionButtons = order.status === 'completed';
  const showVoidRefundInfo = order.status === 'voided' || order.status === 'refunded';

  return (
    <Container>
      <ReceiptContainer>
        <Receipt>
          {/* Shop Header */}
          <ReceiptHeader>
            <ShopName>{shop.name}</ShopName>
            {shop.location && <ShopLocation>{shop.location}</ShopLocation>}
          </ReceiptHeader>

          {/* Order Info */}
          <OrderInfo>
            <div>
              <OrderNumber>{orderNumber}</OrderNumber>
              <OrderDate>{orderDateTime}</OrderDate>
            </div>
          </OrderInfo>

          {/* Status Badge */}
          <StatusBadgeStyled statusType={statusType}>{statusLabel}</StatusBadgeStyled>

          {/* Void/Refund Info */}
          {showVoidRefundInfo && (
            <VoidRefundInfo>
              <VoidRefundTitle>
                {order.status === 'voided' ? 'Void Information' : 'Refund Information'}
              </VoidRefundTitle>
              {order.status === 'voided' && (
                <>
                  <VoidRefundDetail>
                    <strong>Reason:</strong> {order.void_reason_id || 'Not specified'}
                  </VoidRefundDetail>
                  <VoidRefundDetail>
                    <strong>Voided by:</strong> {order.voided_by || 'Unknown'}
                  </VoidRefundDetail>
                  {order.voided_at && (
                    <VoidRefundDetail>
                      <strong>Voided at:</strong> {formatDateTime(order.voided_at)}
                    </VoidRefundDetail>
                  )}
                </>
              )}
              {order.status === 'refunded' && (
                <>
                  <VoidRefundDetail>
                    <strong>Reason:</strong> {order.refund_reason_id || 'Not specified'}
                  </VoidRefundDetail>
                  <VoidRefundDetail>
                    <strong>Amount:</strong>{' '}
                    <PriceDisplay amount={order.refund_amount || 0} currency={shop.currency_code} />
                  </VoidRefundDetail>
                  <VoidRefundDetail>
                    <strong>Refunded by:</strong> {order.refunded_by || 'Unknown'}
                  </VoidRefundDetail>
                  {order.refunded_at && (
                    <VoidRefundDetail>
                      <strong>Refunded at:</strong> {formatDateTime(order.refunded_at)}
                    </VoidRefundDetail>
                  )}
                </>
              )}
            </VoidRefundInfo>
          )}

          {/* Line Items */}
          <Section>
            <SectionTitle>Items</SectionTitle>
            <LineItems>
              {order.order_items.map((item) => {
                const itemSubtotal = item.product_unit_price * item.quantity;
                const modifiersTotal = item.modifiers.reduce(
                  (sum, mod) => sum + mod.price_adjustment * mod.quantity * item.quantity,
                  0
                );
                const addonsTotal = item.addons.reduce(
                  (sum, addon) => sum + addon.price * addon.quantity,
                  0
                );
                const itemTotal = itemSubtotal + modifiersTotal + addonsTotal;

                return (
                  <LineItem key={item.id}>
                    <LineItemHeader>
                      <LineItemName>{item.product_name}</LineItemName>
                      <LineItemQuantity>
                        {item.quantity} ×{' '}
                        <PriceDisplay
                          amount={item.product_unit_price}
                          currency={shop.currency_code}
                        />
                      </LineItemQuantity>
                      <LineItemTotal>
                        <PriceDisplay amount={itemTotal} currency={shop.currency_code} />
                      </LineItemTotal>
                    </LineItemHeader>

                    {/* Modifiers */}
                    {item.modifiers.length > 0 && (
                      <ModifiersList>
                        {item.modifiers.map((modifier) => (
                          <ModifierItem key={modifier.id}>
                            <span>{modifier.modifier_name}</span>
                            {modifier.price_adjustment !== 0 && (
                              <span>
                                {modifier.price_adjustment > 0 ? '+' : ''}
                                <PriceDisplay
                                  amount={modifier.price_adjustment}
                                  currency={shop.currency_code}
                                />
                              </span>
                            )}
                          </ModifierItem>
                        ))}
                      </ModifiersList>
                    )}

                    {/* Addons */}
                    {item.addons.length > 0 && (
                      <AddonsList>
                        {item.addons.map((addon) => (
                          <AddonItem key={addon.id}>
                            <span>
                              + {addon.name} (×{addon.quantity})
                            </span>
                            <span>
                              <PriceDisplay
                                amount={addon.price * addon.quantity}
                                currency={shop.currency_code}
                              />
                            </span>
                          </AddonItem>
                        ))}
                      </AddonsList>
                    )}
                  </LineItem>
                );
              })}
            </LineItems>
          </Section>

          {/* Totals */}
          <Section>
            <TotalsSection>
              {/* Subtotal */}
              <TotalRow>
                <span>Subtotal</span>
                <PriceDisplay amount={subtotal} currency={shop.currency_code} />
              </TotalRow>

              {/* Discount */}
              {order.discount_amount && order.discount_amount > 0 && (
                <DiscountRow>
                  <span>{discountLabel}</span>
                  <span>
                    -<PriceDisplay amount={order.discount_amount} currency={shop.currency_code} />
                  </span>
                </DiscountRow>
              )}

              {/* Tax Breakdown */}
              {order.order_taxes.length > 0 ? (
                order.order_taxes.map((tax) => (
                  <TotalRowSecondary key={tax.id}>
                    <span>
                      {tax.tax_name} ({tax.tax_rate}%)
                    </span>
                    <PriceDisplay amount={tax.tax_amount} currency={shop.currency_code} />
                  </TotalRowSecondary>
                ))
              ) : (
                <TotalRowSecondary>
                  <span>Tax</span>
                  <span>$0.00</span>
                </TotalRowSecondary>
              )}

              {/* Tip */}
              {order.tip_amount && order.tip_amount > 0 && (
                <TotalRow>
                  <span>Tip</span>
                  <PriceDisplay amount={order.tip_amount} currency={shop.currency_code} />
                </TotalRow>
              )}

              {/* Grand Total */}
              <GrandTotalRow>
                <TotalLabel>Total</TotalLabel>
                <TotalAmount>
                  <PriceDisplay amount={order.total_sale} currency={shop.currency_code} />
                </TotalAmount>
              </GrandTotalRow>
            </TotalsSection>
          </Section>

          {/* Payment Method */}
          <Section>
            <SectionTitle>Payment</SectionTitle>
            <PaymentInfo>
              <PaymentRow>
                <PaymentLabel>Method</PaymentLabel>
                <PaymentValue>{order.payment_type?.code || 'Not specified'}</PaymentValue>
              </PaymentRow>
              {order.payment_received && (
                <>
                  {order.payment_amount_received !== null && (
                    <PaymentRow>
                      <PaymentLabel>Amount Received</PaymentLabel>
                      <PaymentValue>
                        <PriceDisplay
                          amount={order.payment_amount_received}
                          currency={shop.currency_code}
                        />
                      </PaymentValue>
                    </PaymentRow>
                  )}
                  {order.payment_change !== null && order.payment_change > 0 && (
                    <PaymentRow>
                      <PaymentLabel>Change</PaymentLabel>
                      <PaymentValue>
                        <PriceDisplay amount={order.payment_change} currency={shop.currency_code} />
                      </PaymentValue>
                    </PaymentRow>
                  )}
                </>
              )}
            </PaymentInfo>
          </Section>
        </Receipt>
      </ReceiptContainer>

      {/* Action Buttons */}
      <ActionButtons>
        <ActionButton fill="outline" onClick={handlePrint}>
          <IonIcon slot="start" icon={printOutline} />
          Print
        </ActionButton>
        <ActionButton fill="outline" onClick={handleEmail}>
          <IonIcon slot="start" icon={mailOutline} />
          Email
        </ActionButton>
        {showActionButtons && (
          <>
            <ActionButton fill="outline" color="warning" onClick={onRefund}>
              Issue Refund
            </ActionButton>
            <ActionButton fill="outline" color="danger" onClick={onVoid}>
              Void Order
            </ActionButton>
          </>
        )}
      </ActionButtons>
    </Container>
  );
};

export default OrderDetail;
