// CheckoutModal - Complete order checkout with payment

import { IonIcon, IonText } from '@ionic/react';
import { card, cash, wallet } from 'ionicons/icons';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { OrderTotals } from '@/components/pos/OrderTotals';
import BaseModal from '@/components/shared/BaseModal';
import { PriceField, TextField } from '@/components/shared/FormFields';
import { PriceDisplay } from '@/components/ui';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useUI } from '@/contexts/UIContext';
import { useCreateOrder, usePaymentTypes } from '@/hooks/useOrder';
import { designSystem } from '@/theme/designSystem';
import type { CartItem, CheckoutFormData, PaymentType } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  discount: number;
  tip: number;
  total: number;
  currency: string;
  onSuccess: () => void;
}

const Section = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.md};
	padding-top: ${designSystem.spacing.lg};
	border-top: 1px solid ${designSystem.colors.gray[200]};
	margin-top: ${designSystem.spacing.lg};

	&:first-child {
		padding-top: 0;
		border-top: none;
		margin-top: 0;
	}
`;

const SectionTitle = styled.h3`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.sm} 0;
`;

const PaymentMethodGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
`;

const PaymentMethodCard = styled.button<{ $isSelected: boolean }>`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: ${designSystem.spacing.md};
	padding: ${(props) => (props.$isSelected ? 'calc(16px - 1px)' : '16px')};
	background: ${(props) => (props.$isSelected ? designSystem.colors.gray[100] : designSystem.colors.gray[50])};
	border: ${(props) => (props.$isSelected ? '3px' : '2px')} solid
		${(props) => (props.$isSelected ? designSystem.colors.primary : designSystem.colors.gray[200])};
	border-radius: ${designSystem.borderRadius.md};
	cursor: pointer;
	transition: all 0.2s ease;
	width: 100%;
	text-align: left;

	&:hover {
		border-color: ${designSystem.colors.primary};
		background: ${(props) => (props.$isSelected ? designSystem.colors.gray[100] : designSystem.colors.gray[100])};
	}

	&:active {
		transform: scale(0.98);
	}
`;

const PaymentMethodIcon = styled(IonIcon)<{ $isSelected: boolean }>`
	font-size: 24px;
	color: ${(props) => (props.$isSelected ? designSystem.colors.brand.primary : designSystem.colors.text.secondary)};
	flex-shrink: 0;
`;

const PaymentMethodContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.xs};
	flex: 1;
`;

const PaymentMethodName = styled.h4<{ $isSelected: boolean }>`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${(props) => (props.$isSelected ? designSystem.colors.brand.primary : designSystem.colors.text.primary)};
	margin: 0;
`;

const PaymentMethodDescription = styled.p<{ $isSelected: boolean }>`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${(props) => (props.$isSelected ? designSystem.colors.brand.secondary : designSystem.colors.text.secondary)};
	margin: ${designSystem.spacing.xs} 0 0 0;
`;

const ChangeDisplay = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${designSystem.spacing.md};
	background: ${designSystem.colors.gray[50]};
	border-radius: ${designSystem.borderRadius.md};
	margin-top: ${designSystem.spacing.sm};
`;

const ChangeLabel = styled.span`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
`;

const ChangeAmount = styled.span`
	font-size: ${designSystem.typography.fontSize.xl};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.success};
`;

const CartItemsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
	margin-bottom: ${designSystem.spacing.md};
`;

const CartItemRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: ${designSystem.spacing.sm};
	background: ${designSystem.colors.gray[50]};
	border-radius: ${designSystem.borderRadius.sm};
`;

const CartItemInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.xs};
	flex: 1;
`;

const CartItemName = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
`;

const CartItemDetails = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const CartItemPrice = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
	white-space: nowrap;
`;

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  tax,
  taxRate,
  discount,
  tip,
  total,
  currency,
  onSuccess,
}) => {
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  // Fetch payment types
  const { data: paymentTypes = [], isLoading: paymentTypesLoading } = usePaymentTypes();

  // Ensure Cash is always available
  const availablePaymentTypes = useMemo(() => {
    const hasCash = paymentTypes.some((pt) => pt.code?.toLowerCase() === 'cash');

    if (hasCash) {
      return paymentTypes;
    }

    // Add default Cash option if not in database
    const defaultCash: PaymentType = {
      id: 'CASH_DEFAULT',
      shop_id: currentShop?.id || '',
      code: 'Cash',
      description: 'Cash payment',
      is_active: true,
    };

    return [defaultCash, ...paymentTypes];
  }, [paymentTypes, currentShop?.id]);

  // Order creation mutation
  const createOrderMutation = useCreateOrder();

  // Form state
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<CheckoutFormData>({
    mode: 'onChange',
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      payment_type_id: '',
      cash_received: null,
    },
  });

  // Watch form values for reactive UI
  const paymentTypeId = watch('payment_type_id');
  const cashReceived = watch('cash_received');

  // Find selected payment type
  const selectedPaymentType = useMemo(
    () => availablePaymentTypes.find((pt) => pt.id === paymentTypeId),
    [availablePaymentTypes, paymentTypeId]
  );

  // Determine if cash payment
  const isCashPayment = useMemo(
    () => selectedPaymentType?.code?.toLowerCase() === 'cash',
    [selectedPaymentType]
  );

  // Calculate change
  const change = useMemo(() => {
    if (!isCashPayment || !cashReceived) return 0;
    return Math.max(0, cashReceived - total);
  }, [isCashPayment, cashReceived, total]);

  // Validation: cash received must be >= total
  const isCashSufficient = useMemo(() => {
    if (!isCashPayment) return true;
    return cashReceived !== null && cashReceived >= total;
  }, [isCashPayment, cashReceived, total]);

  // Complete button disabled state
  const isCompleteDisabled = useMemo(() => {
    return !isValid || !paymentTypeId || !isCashSufficient || createOrderMutation.isPending;
  }, [isValid, paymentTypeId, isCashSufficient, createOrderMutation.isPending]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Handle order creation
  const onSubmit = async (formData: CheckoutFormData) => {
    if (!currentShop || !user) {
      showError('Missing shop or user information');
      return;
    }

    try {
      // Handle default cash payment type (not in database)
      const paymentTypeId =
        formData.payment_type_id === 'CASH_DEFAULT' ? null : formData.payment_type_id;

      const orderData = {
        shop_id: currentShop.id,
        order_date: new Date().toISOString(),
        total_sale: total,
        served_by_id: user.id,
        customer_name: formData.customer_name || null,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        payment_type_id: paymentTypeId,
        payment_received: true,
        payment_amount_received: isCashPayment ? formData.cash_received : null,
        payment_change: isCashPayment ? change : null,
        items,
        tax,
        discount,
        tip,
      };

      await createOrderMutation.mutateAsync(orderData);

      showSuccess('Order created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      showError(errorMessage);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout"
      showFooterButton
      footerButtonLabel="Complete Order"
      onFooterButtonClick={handleSubmit(onSubmit)}
      footerButtonDisabled={isCompleteDisabled}
      footerButtonLoading={createOrderMutation.isPending}
      isLoading={paymentTypesLoading}
      loadingMessage="Loading payment methods..."
    >
      {/* Order Summary */}
      <Section>
        <SectionTitle>Order Summary</SectionTitle>

        {/* Cart Items */}
        <CartItemsList>
          {items.map((item) => (
            <CartItemRow key={item.cart_item_id}>
              <CartItemInfo>
                <CartItemName>
                  {item.quantity}x {item.product.name}
                </CartItemName>
                {(item.modifiers.length > 0 || item.addons.length > 0) && (
                  <CartItemDetails>
                    {item.modifiers.map((modifier) => (
                      <span key={`${item.cart_item_id}-${modifier.modifier_id}`}>
                        • {modifier.modifier_name}
                        {modifier.price_adjustment !== 0 && (
                          <>
                            {' '}
                            ({modifier.price_adjustment > 0 ? '+' : ''}
                            <PriceDisplay amount={modifier.price_adjustment} currency={currency} />)
                          </>
                        )}
                      </span>
                    ))}
                    {item.addons.map((addon) => (
                      <span key={`${item.cart_item_id}-${addon.addon_id}`}>
                        • {addon.quantity}x {addon.name} (+
                        <PriceDisplay amount={addon.price * addon.quantity} currency={currency} />)
                      </span>
                    ))}
                  </CartItemDetails>
                )}
              </CartItemInfo>
              <CartItemPrice>
                <PriceDisplay amount={item.amount} currency={currency} />
              </CartItemPrice>
            </CartItemRow>
          ))}
        </CartItemsList>

        <OrderTotals
          subtotal={subtotal}
          tax={tax}
          taxRate={taxRate}
          discount={discount}
          tip={tip}
          total={total}
          currency={currency}
        />
      </Section>

      {/* Payment Method */}
      <Section>
        <SectionTitle>Payment Method</SectionTitle>

        <PaymentMethodGroup>
          {availablePaymentTypes.map((paymentType) => {
            const isCash = paymentType.code?.toLowerCase() === 'cash';
            const isCard =
              paymentType.code?.toLowerCase().includes('card') ||
              paymentType.code?.toLowerCase().includes('credit') ||
              paymentType.code?.toLowerCase().includes('debit');
            const icon = isCash ? cash : isCard ? card : wallet;

            return (
              <PaymentMethodCard
                key={paymentType.id}
                type="button"
                $isSelected={paymentTypeId === paymentType.id}
                onClick={() => {
                  setValue('payment_type_id', paymentType.id, {
                    shouldValidate: true,
                  });
                }}
              >
                <PaymentMethodIcon icon={icon} $isSelected={paymentTypeId === paymentType.id} />
                <PaymentMethodContent>
                  <PaymentMethodName $isSelected={paymentTypeId === paymentType.id}>
                    {paymentType.code}
                  </PaymentMethodName>
                  {paymentType.description && (
                    <PaymentMethodDescription $isSelected={paymentTypeId === paymentType.id}>
                      {paymentType.description}
                    </PaymentMethodDescription>
                  )}
                </PaymentMethodContent>
              </PaymentMethodCard>
            );
          })}
        </PaymentMethodGroup>

        {errors.payment_type_id && (
          <IonText color="danger">
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              {errors.payment_type_id.message}
            </p>
          </IonText>
        )}
      </Section>

      {/* Payment Details */}
      {isCashPayment && (
        <Section>
          <SectionTitle>Payment Details</SectionTitle>
          <PriceField
            name="cash_received"
            control={control}
            label="Cash Received"
            placeholder="0.00"
            required
            currency={currency}
            error={errors.cash_received}
          />
          {!isCashSufficient && cashReceived !== null && (
            <IonText color="danger" style={{ fontSize: '0.875rem' }}>
              Cash received must be at least <PriceDisplay amount={total} currency={currency} />
            </IonText>
          )}
          <ChangeDisplay>
            <ChangeLabel>Change</ChangeLabel>
            <ChangeAmount>
              <PriceDisplay amount={change} currency={currency} />
            </ChangeAmount>
          </ChangeDisplay>
        </Section>
      )}

      {/* Customer Information */}
      <Section>
        <SectionTitle>Customer Information (Optional)</SectionTitle>
        <TextField
          name="customer_name"
          control={control}
          label="Name"
          placeholder="Enter customer name"
          error={errors.customer_name}
        />
        <TextField
          name="customer_email"
          control={control}
          label="Email"
          type="email"
          placeholder="customer@example.com"
          error={errors.customer_email}
        />
        <TextField
          name="customer_phone"
          control={control}
          label="Phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          error={errors.customer_phone}
        />
      </Section>
    </BaseModal>
  );
};

export default CheckoutModal;
