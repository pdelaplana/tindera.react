// VoidModal - Confirmation modal for voiding orders

import { IonButton, IonSpinner } from '@ionic/react';
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import BaseModal from '@/components/shared/BaseModal';
import { useAuthContext } from '@/contexts/AuthContext';
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

// Styled components
const ModalContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.lg};
`;

const ConfirmationMessage = styled.p`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.primary};
	margin: 0;
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

const ButtonGroup = styled.div`
	display: flex;
	gap: ${designSystem.spacing.sm};
	margin-top: ${designSystem.spacing.md};
`;

const CancelButton = styled(IonButton)`
	flex: 1;
`;

const VoidButton = styled(IonButton)`
	flex: 1;
`;

// Helper function to format order number
const formatOrderNumber = (order: OrderWithDetails, shopPrefix: string | null): string => {
	if (!order.order_number) return 'N/A';
	const paddedNumber = order.order_number.toString().padStart(4, '0');
	return shopPrefix ? `${shopPrefix}-${paddedNumber}` : paddedNumber;
};

export const VoidModal: React.FC<VoidModalProps> = ({ isOpen, onClose, order, onSuccess }) => {
	const [selectedReason, setSelectedReason] = useState<string>('');
	const { data: reasons, isLoading: loadingReasons } = useVoidRefundReasons();
	const voidOrderMutation = useVoidOrder();
	const { user } = useAuthContext();

	// Get shop prefix from order context (assuming it's available)
	// For now, we'll use null, but this should be passed as a prop if available
	const shopPrefix = null; // TODO: Pass shop prefix as prop if needed
	const orderNumber = formatOrderNumber(order, shopPrefix);

	const isLoading = voidOrderMutation.isPending;
	const canSubmit = selectedReason && !isLoading;

	const handleVoid = async () => {
		if (!selectedReason || !user) return;

		try {
			await voidOrderMutation.mutateAsync({
				orderId: order.id,
				reasonId: selectedReason,
			});

			// Success is handled by the mutation's onSuccess callback (shows toast)
			onSuccess();
			onClose();
			setSelectedReason(''); // Reset form
		} catch (error) {
			// Error is handled by the mutation's onError callback (shows toast)
			console.error('Failed to void order:', error);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			setSelectedReason(''); // Reset form
			onClose();
		}
	};

	return (
		<BaseModal isOpen={isOpen} onClose={handleClose} title="Void Order">
			<ModalContent>
				<ConfirmationMessage>
					Are you sure you want to void order #{orderNumber}?
				</ConfirmationMessage>

				<WarningNote>
					This action cannot be undone. The order will be marked as cancelled.
				</WarningNote>

				<FormField>
					<Label>
						Reason for Void
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
					<VoidButton
						color="danger"
						onClick={handleVoid}
						disabled={!canSubmit}
					>
						{isLoading && <IonSpinner name="crescent" slot="start" />}
						Void Order
					</VoidButton>
				</ButtonGroup>
			</ModalContent>
		</BaseModal>
	);
};

export default VoidModal;
