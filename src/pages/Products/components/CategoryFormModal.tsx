// Category Form Modal Component - Add/Edit Product Category

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
import { close, trash } from 'ionicons/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { TextAreaField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import {
	useCreateProductCategory,
	useDeleteProductCategory,
	useProductCategories,
	useUpdateProductCategory,
} from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { ProductCategory } from '@/types';

// Validation schema
const categorySchema = z.object({
	name: z.string().min(1, 'Category name is required').max(50, 'Name too long').trim(),
	description: z.string().max(200, 'Description too long').optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	category: ProductCategory | null;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ isOpen, onClose, category }) => {
	const { showSuccess, showError } = useToastNotification();
	const { hasPermission } = useShop();
	const { data: categories } = useProductCategories();
	const createCategory = useCreateProductCategory();
	const updateCategory = useUpdateProductCategory();
	const deleteCategory = useDeleteProductCategory();

	const [showDeleteAlert, setShowDeleteAlert] = useState(false);

	const canEdit = hasPermission('staff');
	const canDelete = hasPermission('admin');
	const isNew = !category;

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<CategoryFormData>({
		resolver: zodResolver(categorySchema),
		defaultValues: {
			name: '',
			description: '',
		},
	});

	// Populate form when category changes
	useEffect(() => {
		if (category) {
			reset({
				name: category.name,
				description: category.description || '',
			});
		} else {
			reset({
				name: '',
				description: '',
			});
		}
	}, [category, reset]);

	// Handle form submission
	const onSubmit = async (data: CategoryFormData) => {
		try {
			if (isNew) {
				// New categories are added at the end
				const nextSequence = categories?.length || 0;
				await createCategory.mutateAsync({
					name: data.name,
					description: data.description || null,
					sequence: nextSequence,
				});
				showSuccess('Category created successfully');
			} else {
				// When editing, don't update sequence (use drag-and-drop to reorder)
				await updateCategory.mutateAsync({
					categoryId: category.id,
					updates: {
						name: data.name,
						description: data.description || null,
					},
				});
				showSuccess('Category updated successfully');
			}

			handleClose();
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError(isNew ? 'Failed to create category' : 'Failed to update category');
		}
	};

	// Handle delete
	const handleDelete = async () => {
		if (!category) return;

		try {
			await deleteCategory.mutateAsync(category.id);
			showSuccess('Category deleted successfully');
			setShowDeleteAlert(false);
			handleClose();
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError('Failed to delete category');
		}
	};

	const handleClose = () => {
		onClose();
		reset({
			name: '',
			description: '',
		});
	};

	return (
		<>
			<IonModal
				isOpen={isOpen}
				onDidDismiss={handleClose}
				initialBreakpoint={0.75}
				breakpoints={[0, 0.75, 1]}
			>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start" />
						<IonTitle>{isNew ? 'Add Category' : 'Edit Category'}</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={handleClose}>
								<IonIcon icon={close} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>

				<IonContent className="ion-padding" scrollY={true}>
					<form onSubmit={handleSubmit(onSubmit)}>
						{/* Name */}
						<TextField
							name="name"
							control={control}
							label="Name"
							placeholder="e.g., Appetizer, Main Course, Dessert"
							required
							error={errors.name}
							disabled={!canEdit}
						/>

						{/* Description */}
						<TextAreaField
							name="description"
							control={control}
							label="Description"
							placeholder="Brief description of this category"
							rows={3}
							error={errors.description}
							disabled={!canEdit}
						/>

						{/* Submit Button */}
						<SaveButton
							expand="block"
							type="submit"
							disabled={(!isDirty && !isNew) || createCategory.isPending || updateCategory.isPending}
							isSaving={createCategory.isPending || updateCategory.isPending}
							label={isNew ? 'Create Category' : 'Save Changes'}
							savingLabel={isNew ? 'Creating...' : 'Saving...'}
						/>

						{/* Delete Button */}
						{!isNew && canDelete && (
							<div style={{ marginTop: '16px' }}>
								<IonButton
									expand="block"
									color="danger"
									fill="outline"
									onClick={() => setShowDeleteAlert(true)}
									disabled={deleteCategory.isPending}
								>
									<IonIcon slot="start" icon={trash} />
									Delete Category
								</IonButton>
							</div>
						)}
					</form>
				</IonContent>
			</IonModal>

			{/* Delete Alert */}
			{category && (
				<DeleteConfirmationAlert
					isOpen={showDeleteAlert}
					onDismiss={() => setShowDeleteAlert(false)}
					onConfirm={handleDelete}
					itemName={category.name}
					itemType="Category"
				/>
			)}
		</>
	);
};

export default CategoryFormModal;
