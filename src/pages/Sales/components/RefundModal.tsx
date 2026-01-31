// RefundModal - Modal for issuing full or partial refunds

import { IonButton, IonInput, IonSpinner } from '@ionic/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import BaseModal from '@/components/shared/BaseModal';
import { PriceDisplay } from '@/components/ui';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useRefundOrder } from '@/hooks/useOrder';
import { useVoidRefundReasons } from '@/hooks/useVoidRefundReasons';
import { designSystem } from '@/theme/designSystem';
import type { OrderWithDetails } from '@/types';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithDetails;
  onSuccess: () => void;
}

// Styled components
const ModalContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.lg};
`;

const OrderTotalDisplay = styled.div`
	background: ${designSystem.colors.gray[50]};
	border-radius: ${designSystem.borderRadius.md};
	padding: ${designSystem.spacing.md};
	text-align: center;
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};

	.amount {
		font-size: ${designSystem.typography.fontSize.xl};
		font-weight: ${designSystem.typography.fontWeight.bold};
		color: ${designSystem.colors.text.primary};
		margin-left: ${designSystem.spacing.sm};
	}
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.xs};
`;

const Label = styled.label`
	font-size: ${designSystem.typography.fontSize.sm};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
`;

const RequiredIndicator = styled.span`
	color: ${designSystem.colors.danger};
	margin-left: ${designSystem.spacing.xs};
`;

const HelperText = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin-top: ${designSystem.spacing.xs};
`;

const ErrorText = styled.div`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.danger};
	margin-top: ${designSystem.spacing.xs};
`;

const Select = styled.select`
	width: 100%;
	padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.primary};
	background: ${designSystem.colors.surface.base};
	border: 1px solid ${designSystem.colors.gray[300]};
	border-radius: ${designSystem.borderRadius.md};
	outline: none;
	transition: border-color ${designSystem.transitions.base};

	&:focus {
		border-color: ${designSystem.colors.brand.primary};
	}

	&:disabled {
		background: ${designSystem.colors.gray[100]};
		cursor: not-allowed;
	}
`;

const PriceInputWrapper = styled.div<{ hasError: boolean }>`
	position: relative;

	ion-input {
		--border-color: ${(props) => (props.hasError ? designSystem.colors.danger : designSystem.colors.gray[300])};
		--highlight-color: ${designSystem.colors.brand.primary};
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: ${designSystem.spacing.sm};
	margin-top: ${designSystem.spacing.md};
`;

const CancelButton = styled(IonButton)`
	flex: 1;
`;

const RefundButton = styled(IonButton)`
	flex: 1;
`;

export const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, order, onSuccess }) => {
  const { currentShop } = useShopContext();
  const { data: reasons, isLoading: loadingReasons } = useVoidRefundReasons();
  const refundOrderMutation = useRefundOrder();
  const { user } = useAuthContext();

  const [refundAmount, setRefundAmount] = useState(order.total_sale);
  const [refundAmountInput, setRefundAmountInput] = useState(order.total_sale.toFixed(2));
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Reset form when modal opens or order changes
  useEffect(() => {
    if (isOpen) {
      setRefundAmount(order.total_sale);
      setRefundAmountInput(order.total_sale.toFixed(2));
      setSelectedReason('');
    }
  }, [isOpen, order.total_sale]);

  // Validation
  const isValidAmount = refundAmount > 0 && refundAmount <= order.total_sale;
  const hasError = refundAmount > 0 && !isValidAmount;
  const canSubmit = isValidAmount && selectedReason && !refundOrderMutation.isPending;

  const isLoading = refundOrderMutation.isPending;

  const handleAmountChange = (value: string | null | undefined) => {
    if (value === null || value === undefined) {
      setRefundAmountInput('');
      setRefundAmount(0);
      return;
    }

    // Allow only numbers and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts[1]}` : cleaned;

    setRefundAmountInput(formatted);
    const parsed = parseFloat(formatted);
    setRefundAmount(Number.isNaN(parsed) ? 0 : parsed);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency_code || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleRefund = async () => {
    if (!canSubmit || !user) return;

    try {
      await refundOrderMutation.mutateAsync({
        orderId: order.id,
        amount: refundAmount,
        reasonId: selectedReason,
      });

      // Success is handled by the mutation's onSuccess callback (shows toast)
      onSuccess();
      onClose();
    } catch (error) {
      // Error is handled by the mutation's onError callback (shows toast)
      console.error('Failed to refund order:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setRefundAmount(order.total_sale);
      setRefundAmountInput(order.total_sale.toFixed(2));
      setSelectedReason('');
      onClose();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the input value on blur
    if (refundAmount > 0) {
      setRefundAmountInput(refundAmount.toFixed(2));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Issue Refund">
      <ModalContent>
        <OrderTotalDisplay>
          Order Total:{' '}
          <span className="amount">
            <PriceDisplay
              amount={order.total_sale}
              currency={currentShop?.currency_code || 'USD'}
            />
          </span>
        </OrderTotalDisplay>

        <FormField>
          <Label>
            Refund Amount
            <RequiredIndicator>*</RequiredIndicator>
          </Label>
          <PriceInputWrapper hasError={hasError}>
            <IonInput
              fill="outline"
              type="text"
              inputMode="decimal"
              value={isFocused ? refundAmountInput : formatCurrency(refundAmount)}
              onIonInput={(e) => {
                if (isFocused) {
                  handleAmountChange(e.detail.value);
                }
              }}
              onIonFocus={() => setIsFocused(true)}
              onIonBlur={handleBlur}
              disabled={isLoading}
              placeholder="0.00"
            />
          </PriceInputWrapper>
          {!hasError && <HelperText>Enter full or partial refund amount</HelperText>}
          {hasError && refundAmount > order.total_sale && (
            <ErrorText>Refund amount cannot exceed order total</ErrorText>
          )}
          {hasError && refundAmount <= 0 && (
            <ErrorText>Refund amount must be greater than 0</ErrorText>
          )}
        </FormField>

        <FormField>
          <Label>
            Reason for Refund
            <RequiredIndicator>*</RequiredIndicator>
          </Label>
          <Select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={isLoading || loadingReasons}
            required
          >
            <option value="">Select a reason...</option>
            {reasons?.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.name}
              </option>
            ))}
          </Select>
        </FormField>

        <ButtonGroup>
          <CancelButton fill="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </CancelButton>
          <RefundButton color="warning" onClick={handleRefund} disabled={!canSubmit}>
            {isLoading && <IonSpinner name="crescent" slot="start" />}
            Issue Refund
          </RefundButton>
        </ButtonGroup>
      </ModalContent>
    </BaseModal>
  );
};

export default RefundModal;
