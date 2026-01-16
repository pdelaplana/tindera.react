// Receive Inventory Modal Component

import { zodResolver } from '@hookform/resolvers/zod';
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonModal,
	IonText,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import { close } from 'ionicons/icons';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	NumberField,
	PriceField,
	SelectField,
	TextAreaField,
	TextField,
} from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { useCreateReceipt, usePackageSizes } from '@/hooks/useInventory';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';

// Special ID for base UOM option
const BASE_UOM_OPTION_ID = 'base-uom';

const receiveSchema = z.object({
	package_size_id: z.string().min(1, 'Please select a package size'),
	package_quantity: z.number().positive('Quantity must be greater than 0'),
	package_cost_per_unit: z.number().min(0, 'Cost must be positive'),
	supplier: z.string().max(200, 'Supplier name too long').optional().nullable(),
	reference: z.string().max(100, 'Reference too long').optional().nullable(),
	notes: z.string().max(500, 'Notes too long').optional().nullable(),
});

type ReceiveFormData = z.infer<typeof receiveSchema>;

interface ReceiveInventoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	itemId: string;
	itemName: string;
	defaultUnitCost: number;
	baseUom: string;
}

const ReceiveInventoryModal: React.FC<ReceiveInventoryModalProps> = ({
	isOpen,
	onClose,
	itemId,
	itemName,
	defaultUnitCost,
	baseUom,
}) => {
	const { showSuccess, showError } = useToastNotification();
	const createReceipt = useCreateReceipt();

	// Fetch package sizes for this item
	const { data: packageSizes } = usePackageSizes(itemId);

	// Create package size options including base UOM
	const packageOptions = useMemo(() => {
		const options = [
			{
				value: BASE_UOM_OPTION_ID,
				label: `${baseUom} (Base Unit)`,
			},
		];

		if (packageSizes) {
			packageSizes.forEach((pkg) => {
				options.push({
					value: pkg.id,
					label: `${pkg.package_name} (${pkg.units_per_package} ${baseUom})`,
				});
			});
		}

		return options;
	}, [packageSizes, baseUom]);

	// Determine default selection (base UOM by default, or default package if set)
	const defaultSelection = useMemo(() => {
		const defaultPackage = packageSizes?.find((pkg) => pkg.is_default);
		return defaultPackage?.id || BASE_UOM_OPTION_ID;
	}, [packageSizes]);

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<ReceiveFormData>({
		resolver: zodResolver(receiveSchema),
		mode: 'onSubmit',
		defaultValues: {
			package_size_id: defaultSelection,
			package_quantity: 1,
			package_cost_per_unit: defaultUnitCost,
			supplier: '',
			reference: '',
			notes: '',
		},
	});

	// Watch form values for calculations
	const watchedPackageId = watch('package_size_id');
	const watchedPackageQuantity = watch('package_quantity') || 0;

	// Check if base UOM is selected
	const isBaseUomSelected = watchedPackageId === BASE_UOM_OPTION_ID;

	// Calculate total base units from package selection
	const calculatedBaseUnits = useMemo(() => {
		if (isBaseUomSelected) {
			// For base UOM, the quantity is already in base units
			return watchedPackageQuantity;
		}

		if (!watchedPackageId || !packageSizes) return 0;
		const selectedPackage = packageSizes.find((pkg) => pkg.id === watchedPackageId);
		if (!selectedPackage) return 0;
		return watchedPackageQuantity * selectedPackage.units_per_package;
	}, [isBaseUomSelected, watchedPackageId, watchedPackageQuantity, packageSizes]);

	const onSubmit = async (data: ReceiveFormData) => {
		try {
			if (data.package_size_id === BASE_UOM_OPTION_ID) {
				// Base UOM receipt - submit as direct receipt
				await createReceipt.mutateAsync({
					item_id: itemId,
					item_name: itemName,
					quantity_in: data.package_quantity,
					unit_cost: data.package_cost_per_unit,
					supplier: data.supplier,
					reference: data.reference,
					notes: data.notes,
					transaction_on: new Date().toISOString(),
				});
			} else {
				// Package-based receipt
				await createReceipt.mutateAsync({
					item_id: itemId,
					item_name: itemName,
					package_size_id: data.package_size_id,
					package_quantity: data.package_quantity,
					package_cost_per_unit: data.package_cost_per_unit,
					supplier: data.supplier,
					reference: data.reference,
					notes: data.notes,
					transaction_on: new Date().toISOString(),
				});
			}

			showSuccess('Receipt created successfully');
			onClose();
			reset();
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError('Failed to create receipt');
		}
	};

	const handleClose = () => {
		onClose();
		reset({
			package_size_id: defaultSelection,
			package_quantity: 1,
			package_cost_per_unit: defaultUnitCost,
			supplier: '',
			reference: '',
			notes: '',
		});
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
					<IonTitle>Receive Inventory</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleClose}>
							<IonIcon icon={close} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding" scrollY={true}>
				<form onSubmit={handleSubmit(onSubmit)}>
					{/* Package Size Selection (includes base UOM as an option) */}
					<SelectField
						name="package_size_id"
						control={control}
						label="Package Size"
						placeholder="Select package size"
						required
						error={errors.package_size_id}
						options={packageOptions}
						disabled={createReceipt.isPending}
					/>

					{/* Quantity Field - label changes based on selection */}
					<NumberField
						name="package_quantity"
						control={control}
						label={isBaseUomSelected ? `Quantity (${baseUom})` : 'Number of Packages'}
						placeholder="0"
						required
						error={errors.package_quantity}
						disabled={createReceipt.isPending}
						min={0.001}
						step="any"
					/>

					{/* Cost Field - label changes based on selection */}
					<PriceField
						name="package_cost_per_unit"
						control={control}
						label={isBaseUomSelected ? `Cost per ${baseUom}` : 'Cost per Package'}
						placeholder="0.00"
						required
						error={errors.package_cost_per_unit}
						disabled={createReceipt.isPending}
					/>

					{/* Show calculated total (only for packages, not base UOM) */}
					{!isBaseUomSelected && calculatedBaseUnits > 0 && (
						<div
							style={{
								marginBottom: '16px',
								padding: '12px',
								backgroundColor: 'var(--ion-color-light)',
								borderRadius: '8px',
							}}
						>
							<IonText color="medium" style={{ fontSize: '0.875rem' }}>
								Total:{' '}
								<strong>
									{calculatedBaseUnits.toFixed(3)} {baseUom}
								</strong>
							</IonText>
						</div>
					)}

					<TextField
						name="supplier"
						control={control}
						label="Supplier"
						placeholder="Enter supplier name"
						error={errors.supplier}
						disabled={createReceipt.isPending}
					/>

					<TextField
						name="reference"
						control={control}
						label="Reference"
						placeholder="PO number, invoice, etc."
						error={errors.reference}
						disabled={createReceipt.isPending}
					/>

					<TextAreaField
						name="notes"
						control={control}
						label="Notes"
						placeholder="Additional notes"
						rows={3}
						error={errors.notes}
						disabled={createReceipt.isPending}
					/>

					<SaveButton
						expand="block"
						type="submit"
						disabled={createReceipt.isPending}
						isSaving={createReceipt.isPending}
						label="Receive Inventory"
						savingLabel="Receiving..."
					/>
				</form>
			</IonContent>
		</IonModal>
	);
};

export default ReceiveInventoryModal;
