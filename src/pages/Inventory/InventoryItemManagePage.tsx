// Inventory Item Manage Page - View item details, transactions, and perform inventory operations

import { zodResolver } from '@hookform/resolvers/zod';
import {
	IonActionSheet,
	IonButton,
	IonButtons,
	IonCheckbox,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonItemGroup,
	IonLabel,
	IonList,
	IonModal,
	IonNote,
	IonRefresher,
	IonRefresherContent,
	IonSegment,
	IonSegmentButton,
	IonText,
	IonTitle,
	IonToolbar,
	type RefresherEventDetail,
	useIonLoading,
} from '@ionic/react';
import {
	arrowDownSharp,
	arrowUpSharp,
	calculatorSharp,
	cashSharp,
	close,
	construct,
	cubeOutline,
	list,
	swapVerticalSharp,
	trashOutline,
} from 'ionicons/icons';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';
import { z } from 'zod';
import { CenteredLayout, PageWithCollapsibleHeader } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, PriceField, SelectField, TextField } from '@/components/shared/FormFields';
import PageLoadingState from '@/components/shared/PageLoadingState';
import PageNotFoundState from '@/components/shared/PageNotFoundState';
import {
	useCreatePackageSize,
	useDeleteInventoryItem,
	useDeletePackageSize,
	useInventoryItem,
	useInventoryTransactions,
	usePackageSizes,
	useUpdatePackageSize,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { PackageSize, PackageSizeInsert, PackageSizeUpdate } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import { formatDateLabel } from '@/utils/date';
import AdjustInventoryModal from './components/AdjustInventoryModal';
import InitiateCountModal from './components/InitiateCountModal';
import InventoryActionButtons from './components/InventoryActionButtons';
import InventoryItemSummary from './components/InventoryItemSummary';
import PackageSizesList from './components/PackageSizesList';
import ReceiveInventoryModal from './components/ReceiveInventoryModal';
import InventoryItemFormModal from './InventoryItemFormModal';

// Validation schema for package size form
const packageSizeSchema = z.object({
	package_name: z.string().min(1, 'Package name is required'),
	package_uom: z.string().min(1, 'Package UOM is required'),
	units_per_package: z.number().min(0.001, 'Must be greater than 0'),
	cost_per_package: z.number().min(0).nullable(),
	is_default: z.boolean(),
});

type PackageSizeFormData = z.infer<typeof packageSizeSchema>;

// Common package UOM options
const PACKAGE_UOM_OPTIONS = [
	{ value: 'bag', label: 'Bag' },
	{ value: 'box', label: 'Box' },
	{ value: 'case', label: 'Case' },
	{ value: 'carton', label: 'Carton' },
	{ value: 'container', label: 'Container' },
	{ value: 'crate', label: 'Crate' },
	{ value: 'pack', label: 'Pack' },
	{ value: 'pallet', label: 'Pallet' },
	{ value: 'roll', label: 'Roll' },
	{ value: 'sack', label: 'Sack' },
	{ value: 'tray', label: 'Tray' },
];

interface RouteParams {
	itemId: string;
}

const InventoryItemManagePage: React.FC = () => {
	const { itemId } = useParams<RouteParams>();
	const history = useHistory();

	// Hooks
	const { currentShop, hasPermission } = useShop();
	const { data: item, isLoading: itemLoading, refetch: refetchItem } = useInventoryItem(itemId);
	const deleteItem = useDeleteInventoryItem();
	const { showSuccess, showError } = useToastNotification();
	const [present, dismiss] = useIonLoading();

	// Package size mutations
	const createPackageSize = useCreatePackageSize();
	const updatePackageSize = useUpdatePackageSize();
	const deletePackageSize = useDeletePackageSize();

	// Modal states
	const [showReceiveModal, setShowReceiveModal] = useState(false);
	const [showAdjustModal, setShowAdjustModal] = useState(false);
	const [showCountModal, setShowCountModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showOptionsSheet, setShowOptionsSheet] = useState(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [showPackageSizeModal, setShowPackageSizeModal] = useState(false);
	const [editingPackage, setEditingPackage] = useState<PackageSize | null>(null);
	const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);
	const [selectedFilter] = useState<string | null>(null);
	const [selectedSegment, setSelectedSegment] = useState<'transactions' | 'settings'>(
		'transactions'
	);

	// Ref for collapsible header
	const itemNameRef = useRef<HTMLDivElement>(null);
	const observedElementRef = itemNameRef as React.RefObject<HTMLElement>;

	// Package size form setup
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<PackageSizeFormData>({
		resolver: zodResolver(packageSizeSchema),
		defaultValues: {
			package_name: '',
			package_uom: '',
			units_per_package: 1,
			cost_per_package: null,
			is_default: false,
		},
	});

	// Transactions
	const {
		data: transactions,
		isLoading: transactionsLoading,
		refetch: refetchTransactions,
	} = useInventoryTransactions(
		itemId,
		selectedFilter ? { transactionType: selectedFilter } : undefined
	);

	// Package sizes
	const { data: packageSizes } = usePackageSizes(itemId);

	// Adjustment reasons

	// Permissions
	const canEdit = hasPermission('staff');
	const canDelete = hasPermission('admin');

	// Delete handler
	const handleDelete = async () => {
		if (!item) return;

		try {
			await present({ message: 'Deleting...' });
			await deleteItem.mutateAsync(itemId);
			showSuccess('Inventory item deleted successfully');
			history.replace(`/shops/${currentShop?.id}/inventory`);
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError('Failed to delete inventory item');
		} finally {
			await dismiss();
		}
	};

	// Group transactions by date
	const groupedTransactions = useMemo(() => {
		if (!transactions) return {};

		return transactions.reduce(
			(groups, transaction) => {
				const dateLabel = formatDateLabel(transaction.transaction_on);
				if (!groups[dateLabel]) groups[dateLabel] = [];
				groups[dateLabel].push(transaction);
				return groups;
			},
			{} as Record<string, typeof transactions>
		);
	}, [transactions]);

	// Handlers
	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await Promise.all([refetchItem(), refetchTransactions()]);
		event.detail.complete();
	};

	const navigateToEdit = () => {
		setShowEditModal(true);
	};

	const handleCloseEditModal = () => {
		setShowEditModal(false);
		refetchItem();
	};

	const handleOptions = () => {
		setShowOptionsSheet(true);
	};

	const navigateToTransactionDetails = (transactionId: string) => {
		history.push(`/shops/${currentShop?.id}/inventory/${itemId}/transactions/${transactionId}`);
	};

	// Package size handlers
	const handleAddPackageSize = () => {
		reset({
			package_name: '',
			package_uom: '',
			units_per_package: 1,
			cost_per_package: null,
			is_default: false,
		});
		setEditingPackage(null);
		setShowPackageSizeModal(true);
	};

	const handleEditPackageSize = (pkg: PackageSize) => {
		reset({
			package_name: pkg.package_name,
			package_uom: pkg.package_uom,
			units_per_package: pkg.units_per_package,
			cost_per_package: pkg.cost_per_package,
			is_default: pkg.is_default,
		});
		setEditingPackage(pkg);
		setShowPackageSizeModal(true);
	};

	const handleDeletePackageSize = (packageId: string) => {
		setDeletingPackageId(packageId);
	};

	const confirmDeletePackageSize = async () => {
		if (!deletingPackageId) return;

		await deletePackageSize.mutateAsync({
			packageId: deletingPackageId,
			itemId: itemId,
		});
		setDeletingPackageId(null);
	};

	const handlePackageSizeSubmit = async (data: PackageSizeFormData) => {
		if (!currentShop || !item) return;

		if (editingPackage) {
			// Update existing package
			const updates: PackageSizeUpdate = {
				package_name: data.package_name,
				package_uom: data.package_uom,
				units_per_package: data.units_per_package,
				cost_per_package: data.cost_per_package,
				is_default: data.is_default,
			};

			await updatePackageSize.mutateAsync({
				packageId: editingPackage.id,
				itemId: itemId,
				updates,
			});
		} else {
			// Create new package
			const newPackage: PackageSizeInsert = {
				shop_id: currentShop.id,
				item_id: itemId,
				package_name: data.package_name,
				package_uom: data.package_uom,
				units_per_package: data.units_per_package,
				cost_per_package: data.cost_per_package,
				is_default: data.is_default,
				sequence: packageSizes?.length || 0,
			};

			await createPackageSize.mutateAsync(newPackage);
		}

		setShowPackageSizeModal(false);
		setEditingPackage(null);
	};

	const handleClosePackageSizeModal = () => {
		setShowPackageSizeModal(false);
		setEditingPackage(null);
		reset();
	};

	const getTransactionTypeLabel = (type: string) => {
		const labels: Record<string, string> = {
			receipt: 'Receipt',
			issue: 'Issue',
			sale: 'Sale',
			adjustment: 'Adjustment',
			countAdjustment: 'Count Adjustment',
		};
		return labels[type] || type;
	};

	const getTransactionTypeIcon = (type: string) => {
		const icons: Record<string, string> = {
			receipt: arrowDownSharp,
			issue: arrowUpSharp,
			sale: cashSharp,
			adjustment: swapVerticalSharp,
			countAdjustment: calculatorSharp,
		};
		return icons[type] || construct;
	};

	// Create currency formatter with shop's currency
	const formatCurrency = useMemo(
		() => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
		[currentShop?.currency_code]
	);

	// Loading state
	if (itemLoading) {
		return <PageLoadingState backHref={`/shops/${currentShop?.id}/inventory`} />;
	}

	if (!item) {
		return (
			<PageNotFoundState
				backHref={`/shops/${currentShop?.id}/inventory`}
				title="Item Not Found"
				message="Item not found"
			/>
		);
	}

	return (
		<PageWithCollapsibleHeader
			title={item.name}
			backHref={`/shops/${currentShop?.id}/inventory`}
			observedElementRef={observedElementRef}
			isLoading={itemLoading}
			notFound={!itemLoading && !item}
		>
			{/* Pull to refresh */}
			<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
				<IonRefresherContent />
			</IonRefresher>

			{/* Top Section - Item Summary and Action Buttons */}
			<Div
				style={{
					paddingBottom: '24px',
					marginBottom: '24px',
					borderBottom: '1px solid var(--ion-color-light-shade)',
				}}
			>
				<CenteredLayout>
					<Div style={{ maxWidth: '800px', width: '100%', padding: '16px' }}>
						{/* Item Summary Section */}
						<div ref={itemNameRef}>
							<InventoryItemSummary
								name={item.name}
								description={item.description}
								unitCost={item.unit_cost}
								currentCount={item.current_count}
								base_uom={item.base_uom}
								formatCurrency={formatCurrency}
							/>
						</div>

						{/* Action Buttons */}
						<InventoryActionButtons
							onEdit={navigateToEdit}
							onReceive={() => setShowReceiveModal(true)}
							onAdjust={() => setShowAdjustModal(true)}
							onOptions={handleOptions}
							disabled={!canEdit}
						/>
					</Div>
				</CenteredLayout>
			</Div>

			{/* Segment Control */}
			<CenteredLayout>
				<Div style={{ maxWidth: '800px', width: '100%' }}>
					<IonSegment
						color="dark"
						value={selectedSegment}
						onIonChange={(e) => setSelectedSegment(e.detail.value as 'transactions' | 'settings')}
					>
						<IonSegmentButton value="transactions" color="dark">
							<IonLabel color="dark" className="ion-text-capitalize">
								Transactions
							</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="settings" color="dark">
							<IonLabel color="dark" className="ion-text-capitalize">
								Settings
							</IonLabel>
						</IonSegmentButton>
					</IonSegment>
				</Div>
			</CenteredLayout>

			{/* Content Section - Conditional based on segment */}
			<CenteredLayout>
				{selectedSegment === 'transactions' ? (
					transactionsLoading ? (
						<Div className="ion-text-center" style={{ padding: '48px' }}>
							<IonText color="medium">Loading transactions...</IonText>
						</Div>
					) : transactions && transactions.length === 0 ? (
						<Div className="ion-text-center" style={{ padding: '48px 16px' }}>
							<h3>No Transactions Yet</h3>
							<p>
								<IonText color="medium">
									There are no inventory transactions for this item. Start by receiving inventory.
								</IonText>
							</p>
							<IonButton onClick={() => setShowReceiveModal(true)} disabled={!canEdit}>
								Receive Inventory
							</IonButton>
						</Div>
					) : (
						<IonList lines="full">
							{Object.entries(groupedTransactions).map(([date, txns]) => (
								<IonItemGroup key={date}>
									<IonItemDivider>
										<IonLabel color="dark">
											<h2>{date}</h2>
										</IonLabel>
									</IonItemDivider>
									{txns.map((txn) => (
										<IonItem
											key={txn.id}
											button
											detail={true}
											onClick={() => navigateToTransactionDetails(txn.id)}
										>
											<IonIcon
												icon={getTransactionTypeIcon(txn.transaction_type)}
												slot="start"
												style={{ fontSize: '24px' }}
											/>
											<IonLabel>
												<h3>{getTransactionTypeLabel(txn.transaction_type)}</h3>
												<p color="medium">{new Date(txn.transaction_on).toLocaleTimeString()}</p>
											</IonLabel>
											<IonLabel slot="end" className="ion-text-right ion-padding-end" color="dark">
												{txn.quantity_in > 0 ? `+${txn.quantity_in}` : `-${txn.quantity_out}`}
												<br />
												<IonNote>{item.base_uom}</IonNote>
											</IonLabel>
										</IonItem>
									))}
								</IonItemGroup>
							))}
						</IonList>
					)
				) : (
					<>
						{/* Settings Section - Package Sizes */}
						<PackageSizesList
							packageSizes={packageSizes || []}
							baseUom={item.base_uom}
							formatCurrency={formatCurrency}
							onAdd={handleAddPackageSize}
							onEdit={handleEditPackageSize}
							onDelete={handleDeletePackageSize}
							canEdit={canEdit}
						/>
					</>
				)}
			</CenteredLayout>

			{/* Modals */}
			<ReceiveInventoryModal
				isOpen={showReceiveModal}
				onClose={() => setShowReceiveModal(false)}
				itemId={item.id}
				itemName={item.name}
				defaultUnitCost={item.unit_cost}
				baseUom={item.base_uom}
			/>

			<AdjustInventoryModal
				isOpen={showAdjustModal}
				onClose={() => setShowAdjustModal(false)}
				itemId={item.id}
				itemName={item.name}
			/>

			<InitiateCountModal isOpen={showCountModal} onClose={() => setShowCountModal(false)} />

			{/* Options Action Sheet */}
			<IonActionSheet
				isOpen={showOptionsSheet}
				onDidDismiss={() => setShowOptionsSheet(false)}
				header="Options"
				buttons={[
					{
						text: 'View Package Sizes',
						icon: cubeOutline,
						handler: () => {
							history.push(`/shops/${currentShop?.id}/inventory/${item?.id}/packages`);
						},
					},
					{
						text: 'Initiate Count',
						icon: list,
						handler: () => {
							setShowCountModal(true);
						},
					},
					...(canDelete
						? [
								{
									text: 'Delete Item',
									icon: trashOutline,
									role: 'destructive' as const,
									handler: () => {
										setShowDeleteAlert(true);
									},
								},
							]
						: []),
					{
						text: 'Cancel',
						role: 'cancel',
						icon: close,
					},
				]}
			/>

			{/* Delete Confirmation */}
			{item && (
				<DeleteConfirmationAlert
					isOpen={showDeleteAlert}
					onDismiss={() => setShowDeleteAlert(false)}
					onConfirm={handleDelete}
					itemName={item.name}
					itemType="Inventory Item"
				/>
			)}

			{/* Edit Item Modal */}
			<InventoryItemFormModal isOpen={showEditModal} onClose={handleCloseEditModal} itemId={itemId} />

			{/* Package Size Modal */}
			<IonModal
				isOpen={showPackageSizeModal}
				onDidDismiss={handleClosePackageSizeModal}
				initialBreakpoint={0.5}
				breakpoints={[0, 0.5, 0.75, 1]}
			>
				<IonHeader>
					<IonToolbar>
						<IonTitle>{editingPackage ? 'Edit' : 'Add'} Package Size</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={handleClosePackageSizeModal}>
								<IonIcon icon={close} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<form onSubmit={handleSubmit(handlePackageSizeSubmit)}>
						<TextField
							name="package_name"
							control={control}
							label="Package Name"
							placeholder="e.g., 3kg Bag, Case of 24"
							required
							error={errors.package_name}
							disabled={createPackageSize.isPending || updatePackageSize.isPending}
						/>

						<SelectField
							name="package_uom"
							control={control}
							label="Package UOM"
							options={PACKAGE_UOM_OPTIONS}
							required
							error={errors.package_uom}
							disabled={createPackageSize.isPending || updatePackageSize.isPending}
						/>

						<NumberField
							name="units_per_package"
							control={control}
							label={`Units per Package (${item.base_uom})`}
							placeholder="0"
							required
							error={errors.units_per_package}
							disabled={createPackageSize.isPending || updatePackageSize.isPending}
						/>

						<PriceField
							name="cost_per_package"
							control={control}
							label="Typical Cost per Package (Optional)"
							placeholder="0.00"
							error={errors.cost_per_package}
							disabled={createPackageSize.isPending || updatePackageSize.isPending}
							currency={currentShop?.currency_code || 'USD'}
						/>

						<IonItem lines="none">
							<IonCheckbox
								slot="start"
								labelPlacement="end"
								checked={control._formValues.is_default}
								onIonChange={(e) => {
									reset({ ...control._formValues, is_default: e.detail.checked });
								}}
								disabled={createPackageSize.isPending || updatePackageSize.isPending}
							>
								Set as default package size
							</IonCheckbox>
						</IonItem>

						<IonButton
							expand="block"
							type="submit"
							disabled={createPackageSize.isPending || updatePackageSize.isPending}
							style={{ marginTop: '24px' }}
						>
							{createPackageSize.isPending || updatePackageSize.isPending
								? 'Saving...'
								: editingPackage
									? 'Update Package Size'
									: 'Add Package Size'}
						</IonButton>
					</form>
				</IonContent>
			</IonModal>

			{/* Delete Package Size Confirmation */}
			<DeleteConfirmationAlert
				isOpen={deletingPackageId !== null}
				onConfirm={confirmDeletePackageSize}
				onDismiss={() => setDeletingPackageId(null)}
				itemName="package size"
			/>
		</PageWithCollapsibleHeader>
	);
};

export default InventoryItemManagePage;
