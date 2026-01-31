// RefundModal - Modal for issuing full or partial refunds

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { close } from 'ionicons/icons';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';
import { PriceField, SelectField } from '@/components/shared/FormFields';
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

// Validation schema
const refundSchema = z.object({
  refund_amount: z
    .number()
    .min(0.01, 'Refund amount must be greater than 0')
    .refine((val) => val > 0, 'Refund amount must be greater than 0'),
  reason_id: z.string().min(1, 'Reason is required'),
});

type RefundFormData = z.infer<typeof refundSchema>;

// Styled components
const OrderTotalDisplay = styled.div`
	background: ${designSystem.colors.gray[50]};
	border-radius: ${designSystem.borderRadius.md};
	padding: ${designSystem.spacing.md};
	text-align: center;
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
	margin-bottom: ${designSystem.spacing.lg};

	.amount {
		font-size: ${designSystem.typography.fontSize.xl};
		font-weight: ${designSystem.typography.fontWeight.bold};
		color: ${designSystem.colors.text.primary};
		margin-left: ${designSystem.spacing.sm};
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: ${designSystem.spacing.sm};
	margin-top: ${designSystem.spacing.md};
`;

export const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, order, onSuccess }) => {
  const { currentShop } = useShopContext();
  const { data: reasons } = useVoidRefundReasons();
  const refundOrderMutation = useRefundOrder();
  const { user } = useAuthContext();

  const isSaving = refundOrderMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      refund_amount: order.total_sale,
      reason_id: '',
    },
  });

  // Reset form when modal opens or order changes
  useEffect(() => {
    if (isOpen) {
      reset({
        refund_amount: order.total_sale,
        reason_id: '',
      });
    }
  }, [isOpen, order.total_sale, reset]);

  const onSubmit = async (data: RefundFormData) => {
    if (!user) return;

    // Additional validation: check if refund amount exceeds order total
    if (data.refund_amount > order.total_sale) {
      setError('refund_amount', {
        type: 'manual',
        message: 'Refund amount cannot exceed order total',
      });
      return;
    }

    try {
      await refundOrderMutation.mutateAsync({
        orderId: order.id,
        amount: data.refund_amount,
        reasonId: data.reason_id,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      // Error is handled by the mutation's onError callback (shows toast)
      console.error('Failed to refund order:', error);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      reset({
        refund_amount: order.total_sale,
        reason_id: '',
      });
      onClose();
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      initialBreakpoint={0.7}
      breakpoints={[0, 0.7, 0.9]}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start" />
          <IonTitle>Issue Refund</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={isSaving}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" scrollY={true}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <OrderTotalDisplay>
            Order Total:{' '}
            <span className="amount">
              <PriceDisplay
                amount={order.total_sale}
                currency={currentShop?.currency_code || 'USD'}
              />
            </span>
          </OrderTotalDisplay>

          {/* Refund Amount */}
          <PriceField
            name="refund_amount"
            control={control}
            label="Refund Amount"
            placeholder="0.00"
            required
            error={errors.refund_amount}
            disabled={isSaving}
            currency={currentShop?.currency_code || 'USD'}
          />

          {/* Reason */}
          <SelectField
            name="reason_id"
            control={control}
            label="Reason for Refund"
            placeholder="Select a reason..."
            required
            error={errors.reason_id}
            options={[
              { value: '', label: 'Select a reason...' },
              ...(reasons?.map((reason) => ({
                value: reason.id,
                label: reason.name,
              })) || []),
            ]}
            disabled={isSaving}
          />

          {/* Action Buttons */}
          <ButtonGroup>
            <IonButton fill="outline" expand="block" onClick={handleClose} disabled={isSaving}>
              Cancel
            </IonButton>
            <IonButton expand="block" type="submit" color="warning" disabled={isSaving}>
              {isSaving && <IonSpinner slot="start" name="crescent" />}
              {isSaving ? 'Processing...' : 'Issue Refund'}
            </IonButton>
          </ButtonGroup>
        </form>
      </IonContent>
    </IonModal>
  );
};

export default RefundModal;
