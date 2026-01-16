// Inventory List Page

import {
	IonActionSheet,
	IonButton,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonItemGroup,
	IonLabel,
	IonList,
	IonRefresher,
	IonRefresherContent,
	IonText,
	IonToolbar,
	type RefresherEventDetail,
} from '@ionic/react';
import { add, listOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import { CardContainer } from '@/components/shared/CardContainer';
import { FilterPillScroller, IonText2, LoadingSpinner } from '@/components/ui';
import { useInventoryCategories, useInventoryItems } from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import type { FilterOption, InventoryCategory, InventoryItemWithCategory } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import InventoryItemFormModal from './InventoryItemFormModal';

// Helper function to parse compound filter IDs
const parseFilterId = (filterId: string): { type: string; value: string } => {
	if (filterId === 'all') {
		return { type: 'all', value: '' };
	}

	const [type, ...rest] = filterId.split(':');
	return { type, value: rest.join(':') };
};

// Helper function to build unified filter options
const buildFilterOptions = (categories: InventoryCategory[] | undefined): FilterOption[] => {
	const options: FilterOption[] = [
		{ id: 'all', label: 'All' },
		{ id: 'stock:low', label: 'Low Stock' },
		{ id: 'stock:out', label: 'Out of Stock' },
		{ id: 'stock:in', label: 'In Stock', separator: true },
	];

	if (categories && categories.length > 0) {
		const sortedCategories = [...categories].sort((a, b) => a.sequence - b.sequence);

		options.push(
			...sortedCategories.map((cat) => ({
				id: `category:${cat.id}`,
				label: cat.description || cat.name,
			}))
		);
	}

	options.push({ id: 'category:uncategorized', label: 'Uncategorized' });

	return options;
};

const InventoryListPage: React.FC = () => {
	const history = useHistory();
	const { currentShop, isLoading: shopLoading } = useShop();
	const [searchText, setSearchText] = useState('');
	const [showItemModal, setShowItemModal] = useState(false);
	const [showActionSheet, setShowActionSheet] = useState(false);
	const [selectedFilter, setSelectedFilter] = useState<string>('all');

	// Fetch inventory items and categories
	const {
		data: items,
		isLoading: itemsLoading,
		refetch,
	} = useInventoryItems({
		search: searchText || undefined,
	});

	const { data: categories } = useInventoryCategories();
	const isLoading = shopLoading || itemsLoading;

	// Build filter options
	const filterOptions = useMemo(() => buildFilterOptions(categories), [categories]);

	// Apply filters and group items by category
	const filteredAndGroupedItems = useMemo(() => {
		if (!items || !categories) {
			return { categorized: {}, uncategorized: [] };
		}

		const { type, value } = parseFilterId(selectedFilter);

		// Step 1: Apply stock-level filter
		let filteredItems = items;

		if (type === 'stock') {
			switch (value) {
				case 'low':
					// Low stock: current_count <= reorder_level
					filteredItems = items.filter((item) => item.current_count <= item.reorder_level);
					break;
				case 'out':
					// Out of stock: current_count === 0
					filteredItems = items.filter((item) => item.current_count === 0);
					break;
				case 'in':
					// In stock: current_count > 0
					filteredItems = items.filter((item) => item.current_count > 0);
					break;
			}
		}

		// Step 2: Apply category filter
		if (type === 'category') {
			if (value === 'uncategorized') {
				// Only uncategorized items
				filteredItems = filteredItems.filter((item) => !item.category_id);
			} else {
				// Specific category
				filteredItems = filteredItems.filter((item) => item.category_id === value);
			}
		}

		// Step 3: Group items by category for display
		const categorized: Record<string, InventoryItemWithCategory[]> = {};
		const uncategorized: InventoryItemWithCategory[] = [];

		// Initialize category groups
		for (const cat of categories) {
			categorized[cat.id] = [];
		}

		// Group items
		for (const item of filteredItems) {
			if (item.category_id && categorized[item.category_id]) {
				categorized[item.category_id].push(item);
			} else {
				uncategorized.push(item);
			}
		}

		return { categorized, uncategorized };
	}, [items, categories, selectedFilter]);

	// Memoized currency formatter
	const formatCurrency = useMemo(
		() => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
		[currentShop?.currency_code]
	);

	// Handle pull-to-refresh
	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await refetch();
		event.detail.complete();
	};

	// Navigate to item manage page
	const handleItemClick = (itemId: string) => {
		history.push(`/shops/${currentShop?.id}/inventory/${itemId}/manage`);
	};

	// Navigate to add item
	const handleAddItem = () => {
		setShowItemModal(true);
	};

	// Handle more button click
	const handleMoreClick = () => {
		setShowActionSheet(true);
	};

	// Handle navigate to categories
	const handleNavigateToCategories = () => {
		history.push(`/shops/${currentShop?.id}/inventory/categories`);
	};

	// Close modal and refetch data
	const handleCloseModal = () => {
		setShowItemModal(false);
		refetch();
	};

	// Render individual inventory item
	const renderInventoryItem = (
		item: InventoryItemWithCategory,
		index: number,
		itemCount: number
	) => (
		<IonItem
			key={item.id}
			lines={index === itemCount - 1 ? 'none' : 'full'}
			button
			onClick={() => handleItemClick(item.id)}
			detail
		>
			<IonLabel>
				<h2 color="dark">{item.name}</h2>
				<div className="flex items-center">
					<IonText2 fontSize="0.85em">{formatCurrency(item.unit_cost)}</IonText2>

					<IonText2 color="medium" fontSize="0.75em">
						&nbsp; per {item.base_uom}
					</IonText2>
				</div>
			</IonLabel>
			<IonLabel slot="end" className="ion-text-right ion-margin-end">
				<IonText2 color="dark" fontWeight={'700'}>
					{item.current_count}
				</IonText2>
				<br />
				<IonText2 color="medium" fontSize="0.75em">
					{item.base_uom}
				</IonText2>
			</IonLabel>
		</IonItem>
	);

	// Render category group
	const renderCategoryGroup = (categoryId: string, categoryItems: InventoryItemWithCategory[]) => {
		const category = categories?.find((c) => c.id === categoryId);
		if (!category || categoryItems.length === 0) return null;

		return (
			<IonItemGroup key={categoryId}>
				<IonItemDivider color="light">
					<IonLabel>
						<h2>{category.description || category.name}</h2>
					</IonLabel>
					<IonText slot="end" color="medium">
						{categoryItems.length} items
					</IonText>
				</IonItemDivider>
				{categoryItems.map((item, index) => renderInventoryItem(item, index, categoryItems.length))}
			</IonItemGroup>
		);
	};

	// Empty state
	const renderEmptyState = () => (
		<Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
			<h2>No Inventory Items Yet</h2>
			<p>Get started by adding your first inventory item</p>
			<IonButton onClick={handleAddItem} size="default">
				<IonIcon slot="start" icon={add} />
				Add Item
			</IonButton>
		</Div>
	);

	// No shop selected state
	if (!currentShop && !shopLoading) {
		return (
			<BasePage title="Inventory" showMenu showProfile showLogout>
				<CenteredLayout>
					<div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
						<h2>No Shop Selected</h2>
						<p>Please select a shop to view inventory</p>
					</div>
				</CenteredLayout>
			</BasePage>
		);
	}

	return (
		<BasePage title="Inventory" showMenu onMoreClick={handleMoreClick}>
			<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
				<IonRefresherContent />
			</IonRefresher>

			<CenteredLayout>
				{' '}
				{/* Unified Filter Scroller */}
				{filterOptions.length > 0 && (
					<IonToolbar>
						<FilterPillScroller
							filters={filterOptions}
							selectedId={selectedFilter}
							onSelect={setSelectedFilter}
							showManageButton={true}
							onManageClick={handleNavigateToCategories}
						/>
					</IonToolbar>
				)}
				<CardContainer
					title="Inventory Items"
					onActionClick={handleAddItem}
					noPadding
					showSearch={true}
					searchPlaceholder="Search inventory..."
					searchValue={searchText}
					onSearchChange={setSearchText}
				>
					{isLoading ? (
						<LoadingSpinner />
					) : !items || items.length === 0 ? (
						renderEmptyState()
					) : (
						<IonList>
							{/* Render categorized items */}
							{categories
								?.sort((a, b) => a.sequence - b.sequence)
								.map((cat) =>
									renderCategoryGroup(cat.id, filteredAndGroupedItems.categorized[cat.id] || [])
								)}

							{/* Render uncategorized items */}
							{filteredAndGroupedItems.uncategorized.length > 0 && (
								<IonItemGroup>
									<IonItemDivider>
										<IonLabel>
											<h2>Uncategorized</h2>
										</IonLabel>
										<IonText slot="end" color="medium">
											{filteredAndGroupedItems.uncategorized.length} items
										</IonText>
									</IonItemDivider>
									{filteredAndGroupedItems.uncategorized.map((item, index) =>
										renderInventoryItem(item, index, filteredAndGroupedItems.uncategorized.length)
									)}
								</IonItemGroup>
							)}
						</IonList>
					)}
				</CardContainer>
			</CenteredLayout>

			{/* Inventory Item Detail Modal - Only for adding new items */}
			<InventoryItemFormModal isOpen={showItemModal} onClose={handleCloseModal} />

			{/* Action Sheet for More Options */}
			<IonActionSheet
				isOpen={showActionSheet}
				onDidDismiss={() => setShowActionSheet(false)}
				header="Inventory Options"
				buttons={[
					{
						text: 'Manage Categories',
						icon: listOutline,
						handler: handleNavigateToCategories,
					},
					{
						text: 'Cancel',
						role: 'cancel',
					},
				]}
			/>
		</BasePage>
	);
};

export default InventoryListPage;
