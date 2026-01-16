// Adjust Inventory Modal Component

import { zodResolver } from '@hookform/resolvers/zod';
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonModal,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import { close } from 'ionicons/icons';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { NumberField, SelectField, TextAreaField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { useCreateAdjustment } from '@/hooks/useInventory';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';

// Default adjustment reasons
const ADJUSTMENT_REASONS = [
	{ value: 'damage', label: 'Damage' },
	{ value: 'theft', label: 'Theft' },
	{ value: 'count_adjustment', label: 'Count Adjustment' },
	{ value: 'expired', label: 'Expired' },
	{ value: 'loss', label: 'Loss' },
	{ value: 'other', label: 'Other' },
];

const adjustmentSchema = z
	.object({
		adjustment_type: z.enum(['increase', 'decrease']),
		quantity: z.number().positive('Quantity must be greater than 0'),
		reason: z.string().min(1, 'Reason is required'),
		custom_reason: z.string().max(200, 'Reason too long').optional(),
		notes: z.string().max(500, 'Notes too long').optional().nullable(),
	})
	.refine(
		(data) => {
			// If reason is 'other', custom_reason must be provided
			if (data.reason === 'other') {
				return data.custom_reason && data.custom_reason.trim().length > 0;
			}
			return true;
		},
		{
			message: 'Please specify the reason',
			path: ['custom_reason'],
		}
	);

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface AdjustInventoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	itemId: string;
	itemName: string;
}

const AdjustInventoryModal: React.FC<AdjustInventoryModalProps> = ({
	isOpen,
	onClose,
	itemId,
	itemName,
}) => {
	const { showSuccess, showError } = useToastNotification();
	const createAdjustment = useCreateAdjustment();

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<AdjustmentFormData>({
		resolver: zodResolver(adjustmentSchema),
		mode: 'onSubmit',
		defaultValues: {
			adjustment_type: 'increase',
			quantity: 1,
			reason: '',
			custom_reason: '',
			notes: '',
		},
	});

	// Watch the reason field to show/hide custom reason input
	const selectedReason = useWatch({ control, name: 'reason' });

	const onSubmit = async (data: AdjustmentFormData) => {
		try {
			await createAdjustment.mutateAsync({
				item_id: itemId,
				item_name: itemName,
				adjustment_type: data.adjustment_type,
				quantity: data.quantity,
				adjustment_reason_code: data.reason,
				adjustment_reason_other: data.reason === 'other' ? data.custom_reason : null,
				notes: data.notes || null,
				transaction_on: new Date().toISOString(),
			});

			showSuccess('Adjustment created successfully');
			onClose();
			reset();
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError('Failed to create adjustment');
		}
	};

	const handleClose = () => {
		onClose();
		reset();
	};

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={handleClose}
			initialBreakpoint={0.75}
			breakpoints={[0, 0.75, 1]}
		>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start" />
					<IonTitle>Adjust Inventory</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleClose}>
							<IonIcon icon={close} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding" scrollY={true}>
				<form onSubmit={handleSubmit(onSubmit)}>
					<SelectField
						name="adjustment_type"
						control={control}
						label="Adjustment Type"
						required
						error={errors.adjustment_type}
						options={[
							{ value: 'increase', label: 'Increase' },
							{ value: 'decrease', label: 'Decrease' },
						]}
						disabled={createAdjustment.isPending}
					/>

					<NumberField
						name="quantity"
						control={control}
						label="Quantity"
						placeholder="0"
						required
						error={errors.quantity}
						disabled={createAdjustment.isPending}
						step="any"
					/>

					<SelectField
						name="reason"
						control={control}
						label="Reason"
						required
						error={errors.reason}
						options={ADJUSTMENT_REASONS}
						disabled={createAdjustment.isPending}
					/>

					{selectedReason === 'other' && (
						<TextField
							name="custom_reason"
							control={control}
							label="Specify Reason"
							placeholder="Enter custom reason"
							required
							error={errors.custom_reason}
							disabled={createAdjustment.isPending}
						/>
					)}

					<TextAreaField
						name="notes"
						control={control}
						label="Notes"
						placeholder="Additional notes"
						rows={3}
						error={errors.notes}
						disabled={createAdjustment.isPending}
					/>

					<SaveButton
						expand="block"
						type="submit"
						disabled={createAdjustment.isPending}
						isSaving={createAdjustment.isPending}
						label="Create Adjustment"
						savingLabel="Creating..."
					/>
				</form>
			</IonContent>
		</IonModal>
	);
};

export default AdjustInventoryModal;
