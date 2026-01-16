// GlobalModifierFormModal - Add/Edit Modal for Global Modifiers

import { zodResolver } from '@hookform/resolvers/zod';
import { IonButton, IonItem, IonLabel, IonToggle } from '@ionic/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import BaseModal from '@/components/shared/BaseModal';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, PriceField, SelectField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import {
	useAddModifier,
	useDeleteModifier,
	useUpdateGlobalModifier,
} from '@/hooks';
import { useInventoryItems } from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { Modifier } from '@/types';

const modifierSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
	default_price_adjustment: z.number(),
	inventory_item_id: z.string().optional().nullable(),
	quantity: z.number().min(0.001, 'Quantity must be greater than 0').optional().nullable(),
	is_default: z.boolean(),
	sequence: z.number().int().min(0, 'Sequence must be 0 or greater'),
});

type ModifierFormData = z.infer<typeof modifierSchema>;

interface GlobalModifierFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	modifierGroupId: string;
	initialData?: Modifier;
	onSuccess?: () => void;
	nextSequence?: number;
}

export const GlobalModifierFormModal: React.FC<GlobalModifierFormModalProps> = ({
	isOpen,
	onClose,
	modifierGroupId,
	initialData,
	onSuccess,
	nextSequence = 0,
}) => {
	const { currentShop } = useShop();
	const { showSuccess, showError } = useToastNotification();
	const [linkToInventory, setLinkToInventory] = useState(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const isEditMode = !!initialData;

	// Mutations
	const addModifier = useAddModifier();
	const updateModifier = useUpdateGlobalModifier();
	const deleteModifier = useDeleteModifier();

	const isSaving = addModifier.isPending || updateModifier.isPending || deleteModifier.isPending;

	// Fetch inventory items for dropdown
	const { data: inventoryItems = [] } = useInventoryItems();

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors, isDirty },
	} = useForm<ModifierFormData>({
		resolver: zodResolver(modifierSchema),
		mode: 'onSubmit',
		defaultValues: {
			name: '',
			default_price_adjustment: 0,
			inventory_item_id: null,
			quantity: null,
			is_default: false,
			sequence: 0,
		},
	});

	// Reset form when modal opens or initialData changes
	useEffect(() => {
		if (isOpen) {
			reset(
				initialData
					? {
							name: initialData.name,
							default_price_adjustment: initialData.default_price_adjustment,
							inventory_item_id: initialData.inventory_item_id,
							quantity: initialData.quantity,
							is_default: initialData.is_default,
							sequence: initialData.sequence,
						}
					: {
							name: '',
							default_price_adjustment: 0,
							inventory_item_id: null,
							quantity: null,
							is_default: false,
							sequence: nextSequence,
						}
			);
			setLinkToInventory(!!initialData?.inventory_item_id);
		}
	}, [isOpen, initialData, nextSequence, reset]);

	// Watch form values
	const watchedItemId = watch('inventory_item_id');

	// Get selected inventory item
	const selectedItem = useMemo(() => {
		if (!watchedItemId) return null;
		return inventoryItems.find((item) => item.id === watchedItemId);
	}, [watchedItemId, inventoryItems]);

	// Map inventory items to select options
	const inventoryOptions = useMemo(
		() =>
			inventoryItems.map((item) => ({
				value: item.id,
				label: `${item.name} (${item.base_uom})`,
			})),
		[inventoryItems]
	);

	const onSubmit = async (data: ModifierFormData) => {
		try {
			const finalData = {
				...data,
				modifier_group_id: modifierGroupId,
				inventory_item_id: linkToInventory ? (data.inventory_item_id ?? null) : null,
				quantity: linkToInventory && data.quantity ? data.quantity : 0,
			};

			if (isEditMode && initialData) {
				// Update existing modifier
				await updateModifier.mutateAsync({
					modifierId: initialData.id,
					updates: finalData,
				});
				showSuccess('Modifier updated successfully');
			} else {
				// Create new modifier
				await addModifier.mutateAsync(finalData);
				showSuccess('Modifier added successfully');
			}

			reset();
			setLinkToInventory(false);
			onSuccess?.();
			onClose();
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError(isEditMode ? 'Failed to update modifier' : 'Failed to add modifier');
		}
	};

	const handleDelete = async () => {
		if (!initialData) return;

		try {
			await deleteModifier.mutateAsync({
				modifierId: initialData.id,
				groupId: modifierGroupId,
			});
			showSuccess('Modifier deleted successfully');
			setShowDeleteAlert(false);
			onSuccess?.();
			onClose();
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError('Failed to delete modifier');
		}
	};

	const handleClose = () => {
		reset();
		setLinkToInventory(false);
		onClose();
	};

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={handleClose}
			title={isEditMode ? 'Edit Modifier' : 'Add Modifier'}
			initialBreakpoint={0.75}
			breakpoints={[0, 0.75, 1]}
		>
			<form onSubmit={handleSubmit(onSubmit)}>
				<TextField
					control={control}
					name="name"
					label="Modifier Name"
					placeholder="e.g., Small, Medium, Large"
					error={errors.name}
					required
				/>

				<PriceField
					control={control}
					name="default_price_adjustment"
					label="Default Price Adjustment"
					placeholder="Can be positive, negative, or zero"
					error={errors.default_price_adjustment}
					currency={currentShop?.currency_code || 'USD'}
					required
				/>

				{/* Default Modifier Toggle */}
				<IonItem>
					<IonLabel>Set as Default</IonLabel>
					<Controller
						control={control}
						name="is_default"
						render={({ field }) => (
							<IonToggle
								checked={field.value}
								onIonChange={(e) => field.onChange(e.detail.checked)}
								slot="end"
							/>
						)}
					/>
				</IonItem>

				{/* Inventory Linking Section */}
				<IonItem>
					<IonToggle
						checked={linkToInventory}
						onIonChange={(e) => setLinkToInventory(e.detail.checked)}
						slot="start"
						labelPlacement="end"
					>
						Link to Inventory
					</IonToggle>
				</IonItem>

				{linkToInventory && (
					<>
						<SelectField
							control={control}
							name="inventory_item_id"
							label="Inventory Item"
							placeholder="Select an item"
							options={inventoryOptions}
							error={errors.inventory_item_id}
						/>

						{selectedItem && (
							<NumberField
								control={control}
								name="quantity"
								label={`Quantity Used (${selectedItem.base_uom})`}
								placeholder={`Amount of ${selectedItem.name} used`}
								error={errors.quantity}
								step={0.001}
								min={0.001}
							/>
						)}
					</>
				)}

				<SaveButton
					expand="block"
					type="submit"
					disabled={(isEditMode && !isDirty) || isSaving}
					isSaving={isSaving}
					label={isEditMode ? 'Save Changes' : 'Add Modifier'}
					savingLabel={isEditMode ? 'Saving...' : 'Adding...'}
				/>

				{isEditMode && initialData && (
					<IonButton
						expand="block"
						fill="outline"
						color="danger"
						type="button"
						onClick={() => setShowDeleteAlert(true)}
						disabled={isSaving}
						style={{ marginTop: '16px' }}
					>
						Delete Modifier
					</IonButton>
				)}
			</form>

			{initialData && (
				<DeleteConfirmationAlert
					isOpen={showDeleteAlert}
					onDismiss={() => setShowDeleteAlert(false)}
					onConfirm={handleDelete}
					itemName={initialData.name}
					itemType="Modifier"
					requireConfirmation={false}
				/>
			)}
		</BaseModal>
	);
};
