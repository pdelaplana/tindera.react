// VoidModal - Confirmation modal for voiding orders

import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';
import BaseModal from '@/components/shared/BaseModal';
import { SelectField } from '@/components/shared/FormFields';
import { useAuthContext } from '@/contexts/AuthContext';
import { useShopContext } from '@/contexts/ShopContext';
import { useVoidOrder } from '@/hooks/useOrder';
import { useVoidRefundReasons } from '@/hooks/useVoidRefundReasons';
import { designSystem } from '@/theme/designSystem';
import type { OrderWithDetails } from '@/types';

interface VoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithDetails;
  onSuccess: () => void;
}

// Validation schema
const voidSchema = z.object({
  reason_id: z.string().min(1, 'Reason is required'),
});

type VoidFormData = z.infer<typeof voidSchema>;

// Styled components
const ConfirmationMessage = styled.p`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.md} 0;
	text-align: center;
`;

const WarningNote = styled.div`
	background: ${designSystem.colors.warning}15;
	border-left: 4px solid ${designSystem.colors.warning};
	border-radius: ${designSystem.borderRadius.md};
	padding: ${designSystem.spacing.md};
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.primary};
	line-height: 1.5;
	margin-bottom: ${designSystem.spacing.lg};
`;

// Helper function to format order number
const formatOrderNumber = (order: OrderWithDetails, shopPrefix: string | null): string => {
  if (!order.order_number) return 'N/A';
  const paddedNumber = order.order_number.toString().padStart(4, '0');
  return shopPrefix ? `${shopPrefix}-${paddedNumber}` : paddedNumber;
};

export const VoidModal: React.FC<VoidModalProps> = ({ isOpen, onClose, order, onSuccess }) => {
  const { currentShop } = useShopContext();
  const { data: reasons } = useVoidRefundReasons();
  const voidOrderMutation = useVoidOrder();
  const { user } = useAuthContext();

  const orderNumber = formatOrderNumber(order, currentShop?.order_prefix || null);
  const isSaving = voidOrderMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<VoidFormData>({
    resolver: zodResolver(voidSchema),
    mode: 'onChange',
    defaultValues: {
      reason_id: '',
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        reason_id: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: VoidFormData) => {
    if (!user) return;

    try {
      await voidOrderMutation.mutateAsync({
        orderId: order.id,
        reasonId: data.reason_id,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      // Error is handled by the mutation's onError callback (shows toast)
      console.error('Failed to void order:', error);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      reset({
        reason_id: '',
      });
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Void Order"
      initialBreakpoint={0.6}
      breakpoints={[0, 0.6, 0.9]}
      showFooterButton
      footerButtonLabel={isSaving ? 'Voiding...' : 'Void Order'}
      footerButtonColor="danger"
      onFooterButtonClick={handleSubmit(onSubmit)}
      footerButtonDisabled={!isValid || isSaving}
      footerButtonLoading={isSaving}
    >
      <ConfirmationMessage>Are you sure you want to void order #{orderNumber}?</ConfirmationMessage>

      <WarningNote>
        This action cannot be undone. The order will be marked as cancelled.
      </WarningNote>

      {/* Reason */}
      <SelectField
        name="reason_id"
        control={control}
        label="Reason for Void"
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
    </BaseModal>
  );
};

export default VoidModal;
