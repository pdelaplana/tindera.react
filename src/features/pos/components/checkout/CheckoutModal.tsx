// CheckoutModal - Complete order checkout with payment

import { IonIcon, IonText } from '@ionic/react';
import { card, cash, wallet } from 'ionicons/icons';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { OrderTotals } from '../cart/OrderTotals';
import BaseModal from '@/components/shared/BaseModal';
import { NumberField, PriceField, SelectField, TextField } from '@/components/shared/FormFields';
import { PriceDisplay } from '@/components/ui';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useUI } from '@/contexts/UIContext';
import { useDiscountTypes } from '@/hooks/useDiscountTypes';
import { useCreateOrder, usePaymentTypes } from '@/hooks/useOrder';
import { useShopUsers } from '@/hooks/useShop';
import { designSystem } from '@/theme/designSystem';
import type { CartItem, CheckoutFormData, PaymentType } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  taxBreakdown: Array<{
    shop_tax_id: string;
    tax_name: string;
    tax_rate: number;
    tax_amount: number;
  }>;
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

const RadioGroup = styled.div`
	display: flex;
	gap: ${designSystem.spacing.md};
	margin-bottom: ${designSystem.spacing.md};
`;

const RadioButton = styled.button<{ $isSelected: boolean }>`
	flex: 1;
	padding: ${designSystem.spacing.md};
	background: ${(props) => (props.$isSelected ? designSystem.colors.primary : designSystem.colors.gray[50])};
	color: ${(props) => (props.$isSelected ? '#fff' : designSystem.colors.text.primary)};
	border: 2px solid ${(props) => (props.$isSelected ? designSystem.colors.primary : designSystem.colors.gray[200])};
	border-radius: ${designSystem.borderRadius.md};
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${designSystem.colors.primary};
		background: ${(props) => (props.$isSelected ? designSystem.colors.primary : designSystem.colors.gray[100])};
	}

	&:active {
		transform: scale(0.98);
	}
`;

const DiscountAmountDisplay = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${designSystem.spacing.sm};
	background: ${designSystem.colors.gray[50]};
	border-radius: ${designSystem.borderRadius.sm};
	margin-top: ${designSystem.spacing.sm};
`;

const DiscountLabel = styled.span`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
`;

const DiscountValue = styled.span`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.success};
`;

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  taxBreakdown,
  currency,
  onSuccess,
}) => {
  const { currentShop } = useShopContext();
  const { user } = useAuthContext();
  const { showSuccess, showError } = useUI();

  // Fetch payment types, discount types, and shop users
  const { data: paymentTypes = [], isLoading: paymentTypesLoading } = usePaymentTypes();
  const { data: discountTypes = [], isLoading: discountTypesLoading } = useDiscountTypes();
  const { data: shopUsers = [], isLoading: shopUsersLoading } = useShopUsers(currentShop?.id);

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
      discount_type_id: '',
      discount_method: 'percentage',
      discount_value: null,
      tip_amount: null,
      tip_recipient_id: '',
    },
  });

  // Watch form values for reactive UI
  const paymentTypeId = watch('payment_type_id');
  const cashReceived = watch('cash_received');
  const discountTypeId = watch('discount_type_id');
  const discountMethod = watch('discount_method');
  const discountValue = watch('discount_value');
  const tipAmount = watch('tip_amount');

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

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;

    if (discountMethod === 'percentage') {
      return subtotal * (discountValue / 100);
    } else {
      return Math.min(discountValue, subtotal);
    }
  }, [discountValue, discountMethod, subtotal]);

  // Calculate total tax
  const totalTax = useMemo(() => {
    return taxBreakdown.reduce((sum, tax) => sum + tax.tax_amount, 0);
  }, [taxBreakdown]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    const tip = tipAmount ?? 0;
    return subtotal - discountAmount + totalTax + tip;
  }, [subtotal, discountAmount, totalTax, tipAmount]);

  // Calculate change
  const change = useMemo(() => {
    if (!isCashPayment || !cashReceived) return 0;
    return Math.max(0, cashReceived - grandTotal);
  }, [isCashPayment, cashReceived, grandTotal]);

  // Validation: cash received must be >= total
  const isCashSufficient = useMemo(() => {
    if (!isCashPayment) return true;
    return cashReceived !== null && cashReceived >= grandTotal;
  }, [isCashPayment, cashReceived, grandTotal]);

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
        total_sale: grandTotal,
        served_by_id: user.id,
        customer_name: formData.customer_name || null,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        payment_type_id: paymentTypeId,
        payment_received: true,
        payment_amount_received: isCashPayment ? formData.cash_received : null,
        payment_change: isCashPayment ? change : null,
        items,
        taxes: taxBreakdown,
        discount_type_id: formData.discount_type_id || null,
        discount_method: formData.discount_type_id ? formData.discount_method : null,
        discount_value:
          formData.discount_type_id && formData.discount_value ? formData.discount_value : null,
        discount_amount: formData.discount_type_id ? discountAmount : null,
        tip_amount: formData.tip_amount || null,
        tip_recipient_id: formData.tip_recipient_id || null,
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
      isLoading={paymentTypesLoading || discountTypesLoading || shopUsersLoading}
      loadingMessage="Loading checkout options..."
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
          taxBreakdown={taxBreakdown}
          discount={discountAmount}
          tip={tipAmount ?? 0}
          total={grandTotal}
          currency={currency}
        />
      </Section>

      {/* Discount */}
      <Section>
        <SectionTitle>Discount (Optional)</SectionTitle>

        <SelectField
          name="discount_type_id"
          control={control}
          label="Discount Type"
          placeholder="Select discount type"
          options={discountTypes.map((dt) => ({ value: dt.id, label: dt.name }))}
          error={errors.discount_type_id}
        />

        {discountTypeId && (
          <>
            <RadioGroup>
              <RadioButton
                type="button"
                $isSelected={discountMethod === 'percentage'}
                onClick={() => setValue('discount_method', 'percentage', { shouldValidate: true })}
              >
                Percentage
              </RadioButton>
              <RadioButton
                type="button"
                $isSelected={discountMethod === 'fixed'}
                onClick={() => setValue('discount_method', 'fixed', { shouldValidate: true })}
              >
                Fixed Amount
              </RadioButton>
            </RadioGroup>

            {discountMethod === 'percentage' ? (
              <NumberField
                name="discount_value"
                control={control}
                label="Discount Percentage"
                placeholder="0"
                min={0}
                max={100}
                rules={{ min: 0, max: 100 }}
                error={errors.discount_value}
              />
            ) : (
              <PriceField
                name="discount_value"
                control={control}
                label="Discount Amount"
                placeholder="0.00"
                currency={currency}
                error={errors.discount_value}
              />
            )}

            {discountAmount > 0 && (
              <DiscountAmountDisplay>
                <DiscountLabel>Calculated Discount</DiscountLabel>
                <DiscountValue>
                  -<PriceDisplay amount={discountAmount} currency={currency} />
                </DiscountValue>
              </DiscountAmountDisplay>
            )}
          </>
        )}
      </Section>

      {/* Tip */}
      <Section>
        <SectionTitle>Tip (Optional)</SectionTitle>

        <PriceField
          name="tip_amount"
          control={control}
          label="Tip Amount"
          placeholder="0.00"
          currency={currency}
          error={errors.tip_amount}
        />

        {tipAmount && tipAmount > 0 && (
          <SelectField
            name="tip_recipient_id"
            control={control}
            label="Tip Recipient"
            placeholder="Select staff member"
            options={shopUsers.map((su) => ({
              value: su.user_id,
              label: su.user_profiles?.display_name || su.user_id,
            }))}
            error={errors.tip_recipient_id}
          />
        )}
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
              Cash received must be at least{' '}
              <PriceDisplay amount={grandTotal} currency={currency} />
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
