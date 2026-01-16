// Inventory Categories List Page - Manage inventory categories

import { zodResolver } from '@hookform/resolvers/zod';
import {
	IonButton,
	IonButtons,
	IonContent,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonText,
	type RefresherEventDetail,
} from '@ionic/react';
import { add, createOutline, trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { BaseModal } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { CardContainer } from '@/components/shared/CardContainer';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, TextField } from '@/components/shared/FormFields';
import PageHeader from '@/components/shared/PageHeader';
import { SaveButton } from '@/components/shared/SaveButton';
import { LoadingSpinner } from '@/components/ui';
import {
	useCreateInventoryCategory,
	useDeleteInventoryCategory,
	useInventoryCategories,
	useUpdateInventoryCategory,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import type { InventoryCategory } from '@/types';

// Validation schema for category form
const categorySchema = z.object({
	name: z.string().min(1, 'Category name is required'),
	description: z.string().nullable(),
	sequence: z.number().min(0, 'Sequence must be a positive number'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const InventoryCategoriesListPage: React.FC = () => {
	const { currentShop, isLoading: shopLoading } = useShop();
	const { data: categories, isLoading: categoriesLoading, refetch } = useInventoryCategories();

	const [showAddModal, setShowAddModal] = useState(false);
	const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
	const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

	const createCategory = useCreateInventoryCategory();
	const updateCategory = useUpdateInventoryCategory();
	const deleteCategory = useDeleteInventoryCategory();

	const isLoading = shopLoading || categoriesLoading;

	// Form setup
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CategoryFormData>({
		resolver: zodResolver(categorySchema),
		defaultValues: {
			name: '',
			description: null,
			sequence: 0,
		},
	});

	// Handle pull-to-refresh
	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await refetch();
		event.detail.complete();
	};

	// Open add modal
	const handleAddCategory = () => {
		setEditingCategory(null);
		reset({
			name: '',
			description: null,
			sequence: categories ? categories.length : 0,
		});
		setShowAddModal(true);
	};

	// Open edit modal
	const handleEditCategory = (category: InventoryCategory) => {
		setEditingCategory(category);
		reset({
			name: category.name,
			description: category.description,
			sequence: category.sequence,
		});
		setShowAddModal(true);
	};

	// Submit form (create or update)
	const onSubmit = async (data: CategoryFormData) => {
		try {
			if (editingCategory) {
				// Update existing category
				await updateCategory.mutateAsync({
					categoryId: editingCategory.id,
					updates: data,
				});
			} else {
				// Create new category
				await createCategory.mutateAsync(data);
			}
			setShowAddModal(false);
			reset();
		} catch (error) {
			console.error('Error saving category:', error);
		}
	};

	// Confirm delete
	const handleDeleteCategory = async () => {
		if (!deletingCategoryId) return;

		try {
			await deleteCategory.mutateAsync(deletingCategoryId);
			setDeletingCategoryId(null);
		} catch (error) {
			console.error('Error deleting category:', error);
		}
	};

	// Close modal
	const handleCloseModal = () => {
		setShowAddModal(false);
		setEditingCategory(null);
		reset();
	};

	// Empty state
	const renderEmptyState = () => (
		<Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
			<h2>No Categories Yet</h2>
			<p>Get started by adding your first inventory category</p>
			<IonButton onClick={handleAddCategory} size="default">
				<IonIcon slot="start" icon={add} />
				Add Category
			</IonButton>
		</Div>
	);

	// No shop selected state
	if (!currentShop && !shopLoading) {
		return (
			<IonPage>
				<PageHeader title="Inventory Categories" showMenu />

				<IonContent className="ion-padding">
					<CenteredLayout>
						<div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
							<h2>No Shop Selected</h2>
							<p>Please select a shop to manage categories</p>
						</div>
					</CenteredLayout>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<BasePage
			title="Inventory Categories"
			backHref={`/shops/${currentShop?.id}/inventory`}
			onRefresh={handleRefresh}
		>
			<CenteredLayout>
				<CardContainer title="" onActionClick={handleAddCategory} noPadding>
					{isLoading ? (
						<LoadingSpinner />
					) : !categories || categories.length === 0 ? (
						renderEmptyState()
					) : (
						<IonList>
							{categories
								.sort((a, b) => a.sequence - b.sequence)
								.map((category, index) => (
									<IonItem key={category.id} lines={index === categories.length - 1 ? 'none' : 'full'}>
										<IonLabel>
											<h2>{category.name}</h2>
											{category.description && (
												<IonText color="medium">
													<p>{category.description}</p>
												</IonText>
											)}
										</IonLabel>

										<IonButtons slot="end">
											<IonButton onClick={() => handleEditCategory(category)}>
												<IonIcon slot="icon-only" icon={createOutline} />
											</IonButton>
											<IonButton color="danger" onClick={() => setDeletingCategoryId(category.id)}>
												<IonIcon slot="icon-only" icon={trashOutline} />
											</IonButton>
										</IonButtons>
									</IonItem>
								))}
						</IonList>
					)}
				</CardContainer>
			</CenteredLayout>

			{/* Add/Edit Category Modal */}
			<BaseModal
				isOpen={showAddModal}
				onClose={handleCloseModal}
				title={editingCategory ? 'Edit Category' : 'Add Category'}
				onActionClick={handleSubmit(onSubmit)}
				actionButtonDisabled={createCategory.isPending || updateCategory.isPending}
				actionButtonLoading={createCategory.isPending || updateCategory.isPending}
				initialBreakpoint={0.75}
				breakpoints={[0, 0.75, 1]}
			>
				<form onSubmit={handleSubmit(onSubmit)}>
					<TextField
						control={control}
						name="name"
						label="Category Name"
						placeholder="e.g., Beverages, Produce"
						error={errors.name}
						required
					/>

					<TextField
						control={control}
						name="description"
						label="Description"
						placeholder="Optional description"
						error={errors.description}
					/>

					<NumberField
						control={control}
						name="sequence"
						label="Sequence"
						placeholder="Display order"
						error={errors.sequence}
						required
					/>
					<SaveButton
						type="submit"
						expand="block"
						disabled={createCategory.isPending || updateCategory.isPending}
						isSaving={createCategory.isPending || updateCategory.isPending}
						label="Save Category"
					/>
				</form>
			</BaseModal>

			{/* Delete Confirmation Alert */}
			<DeleteConfirmationAlert
				isOpen={!!deletingCategoryId}
				onDismiss={() => setDeletingCategoryId(null)}
				onConfirm={handleDeleteCategory}
				itemName="category"
			/>
		</BasePage>
	);
};

export default InventoryCategoriesListPage;
