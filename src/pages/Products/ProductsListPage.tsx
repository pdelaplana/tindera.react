// Products List Page

import {
	IonAvatar,
	IonButton,
	IonChip,
	IonContent,
	IonIcon,
	IonImg,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonText,
	IonToolbar,
	type RefresherEventDetail,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CenteredLayout } from '@/components/layouts';
import { CategoryPillScroller } from '@/components/pos';
import { CardContainer } from '@/components/shared';
import PageHeader from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/ui';
import { useProductCategories, useProducts } from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import type { ProductWithCategory } from '@/types';
import { ProductFormModal } from './components';

const ProductsListPage: React.FC = () => {
	const history = useHistory();
	const { currentShop, isLoading: shopLoading } = useShop();
	const [searchText, setSearchText] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

	// Fetch products with search filter
	const {
		data: products,
		isLoading: productsLoading,
		refetch,
	} = useProducts({
		search: searchText || undefined,
		categoryId: selectedCategory || undefined,
	});

	// Fetch categories for filter
	const { data: categories } = useProductCategories();

	const isLoading = shopLoading || productsLoading;

	// Handle pull-to-refresh
	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await refetch();
		event.detail.complete();
	};

	// Open product form modal for editing
	const handleProductClick = (productId: string) => {
		// For now, still navigate to manage page for full product management
		history.push(`/shops/${currentShop?.id}/products/${productId}/manage`);
	};

	// Open product form modal for creating
	const handleAddProduct = () => {
		setSelectedProductId(null);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedProductId(null);
	};

	// Format price for display
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currentShop?.currency_code || 'USD',
		}).format(price);
	};

	// Render product list item
	const renderProductItem = (
		product: ProductWithCategory,
		index: number,
		productsLength: number
	) => (
		<IonItem
			lines={index === productsLength - 1 ? 'none' : 'full'}
			key={product.id}
			button
			onClick={() => handleProductClick(product.id)}
			detail
		>
			<IonAvatar slot="start">
				<IonImg
					src={product.image_url || 'https://placehold.co/100x100/e0e0e0/666666?text=No+Image'}
					alt={product.name}
					onIonError={(e) => {
						const target = e.target as unknown as HTMLImageElement;
						target.src = 'https://placehold.co/100x100/e0e0e0/666666?text=No+Image';
					}}
				/>
			</IonAvatar>
			<IonLabel>
				<h2>{product.name}</h2>
				{product.description && <p className="ion-text-wrap">{product.description}</p>}
				{product.category && (
					<IonChip color="primary" outline aria-setsize={1}>
						{product.category.description || product.category.name}
					</IonChip>
				)}
			</IonLabel>
			<IonLabel slot="end" color="dark" className="ion-text-center ion-margin-end	">
				<IonText className="text-primary">{formatPrice(product.price)}</IonText>
			</IonLabel>
		</IonItem>
	);

	// Render product grid item
	// Empty state
	const renderEmptyState = () => (
		<div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
			<h2>No Products Yet</h2>
			<p>Get started by adding your first product</p>
			<IonButton onClick={handleAddProduct} size="default">
				<IonIcon slot="start" icon={add} />
				Add Product
			</IonButton>
		</div>
	);

	// No shop selected state
	if (!currentShop && !shopLoading) {
		return (
			<IonPage>
				<PageHeader title="Products" showProfile showLogout />

				<IonContent className="ion-padding">
					<CenteredLayout>
						<div className="empty-state" style={{ textAlign: 'center', padding: '48px 16px' }}>
							<h2>No Shop Selected</h2>
							<p>Please select a shop to view products</p>
						</div>
					</CenteredLayout>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage>
			<PageHeader title="Products" showProfile showLogout />

			<IonContent>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent />
				</IonRefresher>

				<CenteredLayout>
					{categories && categories.length > 0 && (
						<IonToolbar>
							<CategoryPillScroller
								categories={categories}
								selectedId={selectedCategory}
								onSelect={setSelectedCategory}
								showManageButton={true}
								onManageClick={() => history.push(`/shops/${currentShop?.id}/products/categories`)}
							/>
						</IonToolbar>
					)}
					<CardContainer
						title="Products"
						noPadding
						onActionClick={handleAddProduct}
						showSearch
						searchValue={searchText}
						onSearchChange={setSearchText}
						searchPlaceholder="Search products..."
					>
						{isLoading ? (
							<LoadingSpinner />
						) : !products || products.length === 0 ? (
							renderEmptyState()
						) : (
							<IonList>
								{products.map((product, index) => renderProductItem(product, index, products.length))}
							</IonList>
						)}
					</CardContainer>

					<ProductFormModal
						isOpen={isModalOpen}
						onClose={handleCloseModal}
						productId={selectedProductId}
					/>
				</CenteredLayout>
			</IonContent>
		</IonPage>
	);
};

export default ProductsListPage;
