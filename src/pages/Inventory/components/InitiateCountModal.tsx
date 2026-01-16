// Initiate Count Modal Component

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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SelectField, TextAreaField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { useCreateInventoryCount } from '@/hooks/useInventory';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import { InventoryCountType } from '@/types/enums';

const countSchema = z.object({
	count_type: z.nativeEnum(InventoryCountType),
	notes: z.string().max(500, 'Notes too long').optional().nullable(),
});

type CountFormData = z.infer<typeof countSchema>;

interface InitiateCountModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const InitiateCountModal: React.FC<InitiateCountModalProps> = ({ isOpen, onClose }) => {
	const { showSuccess, showError } = useToastNotification();
	const createCount = useCreateInventoryCount();

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CountFormData>({
		resolver: zodResolver(countSchema),
		defaultValues: {
			count_type: InventoryCountType.Adhoc,
			notes: '',
		},
	});

	const onSubmit = async (data: CountFormData) => {
		try {
			await createCount.mutateAsync({
				count_date: new Date().toISOString(),
				count_type: data.count_type,
				notes: data.notes,
			});

			showSuccess('Count initiated successfully');
			onClose();
			reset();
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError('Failed to initiate count');
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
					<IonTitle>Initiate Count</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleClose}>
							<IonIcon icon={close} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<form onSubmit={handleSubmit(onSubmit)}>
					<SelectField
						name="count_type"
						control={control}
						label="Count Type"
						required
						error={errors.count_type}
						options={Object.values(InventoryCountType).map((type) => ({
							value: type,
							label: type,
						}))}
						disabled={createCount.isPending}
					/>

					<TextAreaField
						name="notes"
						control={control}
						label="Notes"
						placeholder="Additional notes"
						rows={3}
						error={errors.notes}
						disabled={createCount.isPending}
					/>

					<SaveButton
						expand="block"
						type="submit"
						disabled={createCount.isPending}
						isSaving={createCount.isPending}
						label="Initiate Count"
						savingLabel="Creating..."
					/>
				</form>
			</IonContent>
		</IonModal>
	);
};

export default InitiateCountModal;
