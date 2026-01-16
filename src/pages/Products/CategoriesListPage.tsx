import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonReorder,
	IonReorderGroup,
	IonText,
	IonTitle,
	IonToolbar,
	type ItemReorderEventDetail,
} from '@ionic/react';
import { createOutline, trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import { CardContainer } from '@/components/shared';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { LoadingSpinner } from '@/components/ui';
import type { ProductCategory } from '@/types';
import { CenteredLayout } from '../../components/layouts';
import { useProductCategories, useUpdateProductCategory } from '../../hooks/useProduct';
import { useShop } from '../../hooks/useShop';
import { CategoryFormModal } from './components';

export const CategoriesListPage: React.FC = () => {
	const { currentShop } = useShop();

	const { data: categories, isLoading } = useProductCategories();
	const updateCategory = useUpdateProductCategory();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);

	const handleAddCategory = () => {
		setSelectedCategory(null);
		setIsModalOpen(true);
	};

	const handleEditCategory = (category: ProductCategory) => {
		setSelectedCategory(category);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedCategory(null);
	};

	const handleDeleteClick = (category: ProductCategory, event: React.MouseEvent) => {
		event.stopPropagation();
		setCategoryToDelete(category);
		setShowDeleteAlert(true);
	};

	const handleDeleteConfirm = async () => {
		// Delete will be handled by the CategoryFormModal
		// Just close the alert and open the modal in delete mode
		if (categoryToDelete) {
			setShowDeleteAlert(false);
			setSelectedCategory(categoryToDelete);
			setIsModalOpen(true);
			setCategoryToDelete(null);
		}
	};

	const handleReorder = async (event: CustomEvent<ItemReorderEventDetail>) => {
		if (!categories) return;

		// Create a mutable copy of the categories array
		const reorderedCategories = [...categories];

		// Move the item from the old index to the new index
		const itemToMove = reorderedCategories.splice(event.detail.from, 1)[0];
		reorderedCategories.splice(event.detail.to, 0, itemToMove);

		// Update sequence numbers for all affected categories
		const updatePromises = reorderedCategories.map((category, index) =>
			updateCategory.mutateAsync({
				categoryId: category.id,
				updates: { sequence: index },
			})
		);

		try {
			await Promise.all(updatePromises);
		} catch (error) {
			console.error('Failed to update category order:', error);
		}

		// Complete the reorder animation
		event.detail.complete();
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref={`/shops/${currentShop?.id}/products`} />
					</IonButtons>
					<IonTitle>Categories</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<CenteredLayout>
					<CardContainer onActionClick={handleAddCategory} noPadding>
						{isLoading ? (
							<LoadingSpinner />
						) : categories && categories.length > 0 ? (
							<IonList className="ion-no-margin ion-no-padding" lines="full">
								<IonReorderGroup disabled={false} onIonReorderEnd={handleReorder}>
									{categories.map((category) => (
										<IonItem key={category.id}>
											<IonReorder slot="start" className="ion-margin-top" />
											<IonLabel>
												<h2>{category.name}</h2>
												{category.description && <p>{category.description}</p>}
											</IonLabel>
											<IonButtons slot="end" className="ion-margin-top">
												<IonButton
													fill="clear"
													color="dark"
													onClick={(e) => {
														e.stopPropagation();
														handleEditCategory(category);
													}}
													aria-label="Edit category"
												>
													<IonIcon slot="icon-only" icon={createOutline} />
												</IonButton>
												<IonButton
													fill="clear"
													color="danger"
													onClick={(e) => handleDeleteClick(category, e)}
													aria-label="Delete category"
												>
													<IonIcon slot="icon-only" icon={trashOutline} />
												</IonButton>
											</IonButtons>
										</IonItem>
									))}
								</IonReorderGroup>
							</IonList>
						) : (
							<div style={{ textAlign: 'center', padding: '2rem' }}>
								<IonText color="medium">
									<p>No categories found. Create your first category to get started.</p>
								</IonText>
							</div>
						)}
					</CardContainer>

					<CategoryFormModal
						isOpen={isModalOpen}
						onClose={handleCloseModal}
						category={selectedCategory}
					/>

					{categoryToDelete && (
						<DeleteConfirmationAlert
							isOpen={showDeleteAlert}
							onDismiss={() => {
								setShowDeleteAlert(false);
								setCategoryToDelete(null);
							}}
							onConfirm={handleDeleteConfirm}
							itemName={categoryToDelete.name}
							itemType="Category"
						/>
					)}
				</CenteredLayout>
			</IonContent>
		</IonPage>
	);
};
