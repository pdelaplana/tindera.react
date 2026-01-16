// Inventory Item Detail Page - Create/Edit/Delete Inventory Items

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
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CenteredLayout } from '@/components/layouts';
import {
	NumberField,
	PriceField,
	SelectField,
	SelectFieldWithAdd,
	TextAreaField,
	TextField,
} from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import {
	useCreateInventoryCategory,
	useCreateInventoryItem,
	useInventoryCategories,
	useInventoryItem,
	useUpdateInventoryItem,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { InventoryItemInsert, InventoryItemUpdate } from '@/types';
import { UnitOfMeasure as UnitOfMeasureEnum } from '@/types/enums';

// Zod validation schema for inventory item
const inventoryItemSchema = z.object({
	name: z.string().min(1, 'Item name is required').max(100, 'Name too long'),
	description: z.string().max(500, 'Description too long').optional().nullable(),
	category_id: z.string().optional().nullable(),
	base_uom: z.string().min(1, 'Unit of measure is required'),
	unit_cost: z.number().min(0, 'Cost must be positive'),
	current_count: z.number().min(0, 'Count cannot be negative').optional(),
	qty_received_to_date: z.number().min(0, 'Quantity cannot be negative').optional(),
	reorder_level: z.number().min(0, 'Reorder level must be positive'),
	notes: z.string().max(1000, 'Notes too long').optional().nullable(),
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

// Zod validation schema for category modal
const categorySchema = z.object({
	name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
	description: z.string().max(500, 'Description too long').optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface InventoryItemFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	itemId?: string;
}

const InventoryItemFormModal: React.FC<InventoryItemFormModalProps> = ({
	isOpen,
	onClose,
	itemId,
}) => {
	const isNew = !itemId || itemId === 'new';

	// Hooks
	const { currentShop, hasPermission } = useShop();
	const { data: item, isLoading: itemLoading } = useInventoryItem(isNew ? undefined : itemId);
	const { data: categories } = useInventoryCategories();
	const createItem = useCreateInventoryItem();
	const updateItem = useUpdateInventoryItem();
	const createCategory = useCreateInventoryCategory();

	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const { showSuccess, showError } = useToastNotification();

	const canEdit = hasPermission('staff');
	const isSaving = createItem.isPending || updateItem.isPending;

	// Form setup - Main inventory item form
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isDirty },
	} = useForm<InventoryItemFormData>({
		resolver: zodResolver(inventoryItemSchema),
		defaultValues: {
			name: '',
			description: '',
			category_id: null,
			base_uom: UnitOfMeasureEnum.Piece,
			unit_cost: 0,
			current_count: 0,
			qty_received_to_date: 0,
			reorder_level: 0,
			notes: '',
		},
	});

	// Form setup - Category modal
	const {
		control: categoryControl,
		handleSubmit: handleCategorySubmit,
		reset: resetCategory,
		formState: { errors: categoryErrors },
	} = useForm<CategoryFormData>({
		resolver: zodResolver(categorySchema),
		defaultValues: {
			name: '',
			description: '',
		},
	});

	// Populate form when editing
	useEffect(() => {
		if (item && !isNew) {
			reset({
				name: item.name,
				description: item.description || '',
				category_id: item.category_id,
				base_uom: item.base_uom,
				unit_cost: item.unit_cost,
				current_count: item.current_count,
				reorder_level: item.reorder_level,
				notes: item.notes || '',
			});
		}
	}, [item, isNew, reset]);

	// Submit handler
	const onSubmit = async (data: InventoryItemFormData) => {
		try {
			const cleanData = {
				...data,
				description: data.description || null,
				category_id: data.category_id || null,
				notes: data.notes || null,
			};

			if (isNew) {
				// For new items, set current_count and qty_received_to_date from the initial balance
				const initialBalance = data.qty_received_to_date || 0;
				const createData = {
					...cleanData,
					current_count: initialBalance,
					qty_received_to_date: initialBalance,
					cost_of_qty_received_to_date: initialBalance * (data.unit_cost || 0),
				};
				await createItem.mutateAsync(createData as Omit<InventoryItemInsert, 'shop_id'>);
				showSuccess('Inventory item created successfully');
				onClose();
			} else {
				// For updates, exclude qty_received_to_date (system managed)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { qty_received_to_date: _qty_received_to_date, ...updateData } = cleanData;
				await updateItem.mutateAsync({
					itemId: itemId!,
					data: updateData as InventoryItemUpdate,
				});
				showSuccess('Inventory item updated successfully');
				onClose();
			}
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError(`Failed to ${isNew ? 'create' : 'update'} inventory item`);
		}
	};

	// Create category handler
	const onSubmitCategory = async (data: CategoryFormData) => {
		try {
			const maxSequence = categories?.reduce((max, cat) => Math.max(max, cat.sequence), 0) || 0;
			const newCategory = await createCategory.mutateAsync({
				name: data.name.trim(),
				description: data.description?.trim() || null,
				sequence: maxSequence + 1,
			});

			showSuccess('Category created successfully');
			setShowCategoryModal(false);
			resetCategory();

			// Set the newly created category as selected
			if (newCategory) {
				setValue('category_id', newCategory.id, { shouldDirty: true });
			}
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError('Failed to create category');
		}
	};

	// Loading state (show for edit mode only)
	if (itemLoading && !isNew) {
		return (
			<IonModal isOpen={isOpen} onDidDismiss={onClose}>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Loading...</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={onClose}>
								<IonIcon icon={close} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<div className="ion-text-center" style={{ padding: '48px' }}>
						<IonSpinner />
					</div>
				</IonContent>
			</IonModal>
		);
	}

	return (
		<IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={1} breakpoints={[0, 0.75, 1]}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>{isNew ? 'New Inventory Item' : item?.name || 'Inventory Item'}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onClose}>
							<IonIcon icon={close} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<CenteredLayout>
					<form onSubmit={handleSubmit(onSubmit)}>
						<div style={{ marginBottom: 'var(--space-lg)' }}>
							<h3
								style={{
									fontSize: 'var(--font-size-lg)',
									fontWeight: 'var(--font-weight-semibold)',
									marginBottom: 'var(--space-md)',
								}}
							>
								Item Information
							</h3>

							{/* Name - Required */}
							<TextField
								name="name"
								control={control}
								label="Name"
								placeholder="Enter item name"
								required
								error={errors.name}
								disabled={isSaving || !canEdit}
							/>

							{/* Description - Optional */}
							<TextAreaField
								name="description"
								control={control}
								label="Description"
								placeholder="Enter item description"
								rows={3}
								error={errors.description}
								disabled={isSaving || !canEdit}
							/>

							{/* Category - Optional with Add button */}
							<SelectFieldWithAdd
								name="category_id"
								control={control}
								label="Category"
								placeholder="Select category"
								options={[
									{ value: '', label: 'No Category' },
									...(categories?.map((cat) => ({
										value: cat.id,
										label: cat.description || cat.name,
									})) || []),
								]}
								disabled={isSaving || !canEdit}
								onAddClick={() => setShowCategoryModal(true)}
							/>

							{/* Unit of Measure - Required */}
							<SelectField
								name="base_uom"
								control={control}
								label="Unit of Measure"
								placeholder="Select unit"
								required
								error={errors.base_uom}
								options={[
									{ value: UnitOfMeasureEnum.Piece, label: 'Piece' },
									{ value: UnitOfMeasureEnum.Kilogram, label: 'Kilogram (KG)' },
									{ value: UnitOfMeasureEnum.Gram, label: 'Gram (G)' },
									{ value: UnitOfMeasureEnum.Liter, label: 'Liter (L)' },
									{ value: UnitOfMeasureEnum.Milliliter, label: 'Milliliter (ML)' },
									{ value: UnitOfMeasureEnum.Ounce, label: 'Ounce (OZ)' },
								]}
								disabled={isSaving || !canEdit}
							/>

							{/* Unit Cost - Required */}
							<PriceField
								name="unit_cost"
								control={control}
								label="Unit Cost"
								required
								error={errors.unit_cost}
								disabled={isSaving || !canEdit}
								currency={currentShop?.currency_code || 'USD'}
							/>

							{/* Initial Balance (for new items) or Balance On Hand (for existing items) */}
							{isNew && (
								<NumberField
									name="qty_received_to_date"
									control={control}
									label="Initial Balance"
									placeholder="0"
									required
									error={errors.qty_received_to_date}
									disabled={isSaving || !canEdit}
									min={0}
								/>
							)}

							{/* Reorder Level - Required */}
							<NumberField
								name="reorder_level"
								control={control}
								label="Reorder Level"
								placeholder="Minimum quantity before reorder"
								required
								error={errors.reorder_level}
								disabled={isSaving || !canEdit}
								min={0}
							/>

							{/* Notes - Optional */}
							<TextAreaField
								name="notes"
								control={control}
								label="Notes"
								placeholder="Additional notes"
								rows={3}
								error={errors.notes}
								disabled={isSaving || !canEdit}
							/>
						</div>

						{/* Action Buttons */}
						<div className="ion-margin-top">
							{canEdit && (
								<SaveButton
									expand="block"
									type="submit"
									disabled={!isDirty && !isNew}
									isSaving={isSaving}
									label={isNew ? 'Create Item' : 'Save Changes'}
									savingLabel="Saving..."
								/>
							)}
						</div>
					</form>

					{/* Add Category Modal */}
					<IonModal
						isOpen={showCategoryModal}
						onDidDismiss={() => {
							setShowCategoryModal(false);
							resetCategory();
						}}
						initialBreakpoint={0.75}
						breakpoints={[0, 0.75, 1]}
					>
						<IonHeader>
							<IonToolbar>
								<IonTitle>Add Category</IonTitle>
								<IonButtons slot="end">
									<IonButton
										onClick={() => {
											setShowCategoryModal(false);
											resetCategory();
										}}
									>
										<IonIcon icon={close} />
									</IonButton>
								</IonButtons>
							</IonToolbar>
						</IonHeader>
						<IonContent className="ion-padding">
							<form onSubmit={handleCategorySubmit(onSubmitCategory)}>
								<TextField
									name="name"
									control={categoryControl}
									label="Name"
									placeholder="Enter category name"
									required
									error={categoryErrors.name}
									disabled={createCategory.isPending}
								/>

								<TextField
									name="description"
									control={categoryControl}
									label="Description"
									placeholder="Enter category description"
									error={categoryErrors.description}
									disabled={createCategory.isPending}
								/>

								<IonButton
									expand="block"
									type="submit"
									disabled={createCategory.isPending}
									style={{ marginTop: '24px' }}
								>
									{createCategory.isPending ? 'Creating...' : 'Create Category'}
								</IonButton>
							</form>
						</IonContent>
					</IonModal>
				</CenteredLayout>
			</IonContent>
		</IonModal>
	);
};

export default InventoryItemFormModal;
