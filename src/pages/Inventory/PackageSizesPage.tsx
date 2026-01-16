// Package Sizes Page - Full page for managing inventory item package sizes

import { zodResolver } from '@hookform/resolvers/zod';
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonCheckbox,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonModal,
	IonPage,
	IonText,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import { add, checkmark, close, createOutline, trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { CenteredLayout } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { NumberField, PriceField, SelectField, TextField } from '@/components/shared/FormFields';
import { LoadingSpinner } from '@/components/ui';
import {
	useCreatePackageSize,
	useDeletePackageSize,
	useInventoryItem,
	usePackageSizes,
	useUpdatePackageSize,
} from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import type { PackageSize, PackageSizeInsert, PackageSizeUpdate } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';

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

const PackageSizesPage: React.FC = () => {
	const { shopId, itemId } = useParams<{ shopId: string; itemId: string }>();
	const { currentShop } = useShop();
	const { data: item, isLoading: itemLoading } = useInventoryItem(itemId);
	const { data: packageSizes, isLoading: packagesLoading } = usePackageSizes(itemId);

	const [showAddModal, setShowAddModal] = useState(false);
	const [editingPackage, setEditingPackage] = useState<PackageSize | null>(null);
	const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);

	const createPackageSize = useCreatePackageSize();
	const updatePackageSize = useUpdatePackageSize();
	const deletePackageSize = useDeletePackageSize();

	const formatCurrency = createCurrencyFormatter(currentShop?.currency_code || 'USD');

	// Form setup
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

	// Handlers
	const handleAdd = () => {
		reset({
			package_name: '',
			package_uom: '',
			units_per_package: 1,
			cost_per_package: null,
			is_default: false,
		});
		setEditingPackage(null);
		setShowAddModal(true);
	};

	const handleEdit = (pkg: PackageSize) => {
		reset({
			package_name: pkg.package_name,
			package_uom: pkg.package_uom,
			units_per_package: pkg.units_per_package,
			cost_per_package: pkg.cost_per_package,
			is_default: pkg.is_default,
		});
		setEditingPackage(pkg);
		setShowAddModal(true);
	};

	const handleDelete = (packageId: string) => {
		setDeletingPackageId(packageId);
	};

	const confirmDelete = async () => {
		if (!deletingPackageId) return;

		await deletePackageSize.mutateAsync({
			packageId: deletingPackageId,
			itemId: itemId,
		});
		setDeletingPackageId(null);
	};

	const onSubmit = async (data: PackageSizeFormData) => {
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

		setShowAddModal(false);
		setEditingPackage(null);
	};

	const handleCloseModal = () => {
		setShowAddModal(false);
		setEditingPackage(null);
		reset();
	};

	// Loading state
	if (itemLoading || packagesLoading) {
		return (
			<IonPage>
				<IonContent>
					<LoadingSpinner />
				</IonContent>
			</IonPage>
		);
	}

	// Not found state
	if (!item) {
		return (
			<IonPage>
				<IonContent>
					<CenteredLayout>
						<p>Item not found</p>
					</CenteredLayout>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref={`/shops/${shopId}/inventory/${itemId}/manage`} />
					</IonButtons>
					<IonTitle>{item.name} - Package Sizes</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<CenteredLayout>
					{/* Item context card */}
					<IonCard>
						<IonCardHeader>
							<IonCardTitle>{item.name}</IonCardTitle>
							<IonText color="medium">
								<p>Base Unit: {item.base_uom}</p>
							</IonText>
						</IonCardHeader>
					</IonCard>

					{/* Package sizes list */}
					<IonCard>
						<IonCardHeader className="ion-align-items-center ion-justify-content-between ion-flex-row ion-display-flex">
							<IonCardTitle>Package Sizes</IonCardTitle>
							<Div>
								<IonButton onClick={handleAdd} shape="round" fill="clear">
									<IonIcon slot="icon-only" icon={add} />
								</IonButton>
							</Div>
						</IonCardHeader>
						<IonCardContent className="ion-no-padding">
							{!packageSizes || packageSizes.length === 0 ? (
								<IonText color="medium">
									<p>No package sizes defined yet</p>
								</IonText>
							) : (
								<IonList>
									{packageSizes.map((pkg, index) => (
										<IonItem key={pkg.id} lines={packageSizes.length - 1 === index ? 'none' : 'full'}>
											<IonLabel>
												<h3>
													{pkg.package_name}
													{pkg.is_default && (
														<IonIcon icon={checkmark} color="success" style={{ marginLeft: '8px' }} />
													)}
												</h3>
												<p>
													1 {pkg.package_uom} = {pkg.units_per_package} {item.base_uom}
												</p>
												{pkg.cost_per_package && <p>Typical cost: {formatCurrency(pkg.cost_per_package)}</p>}
											</IonLabel>
											<IonButtons slot="end" style={{ marginTop: '10px' }}>
												<IonButton onClick={() => handleEdit(pkg)} size="small" fill="clear">
													<IonIcon icon={createOutline} slot="icon-only" />
												</IonButton>
												<IonButton
													color="danger"
													onClick={() => handleDelete(pkg.id)}
													size="small"
													fill="clear"
													shape="round"
												>
													<IonIcon icon={trashOutline} slot="icon-only" />
												</IonButton>
											</IonButtons>
										</IonItem>
									))}
								</IonList>
							)}
						</IonCardContent>
					</IonCard>
				</CenteredLayout>

				{/* Add/Edit Package Size Modal */}
				<IonModal
					isOpen={showAddModal}
					onDidDismiss={handleCloseModal}
					initialBreakpoint={0.5}
					breakpoints={[0, 0.5, 0.75, 1]}
				>
					<IonHeader>
						<IonToolbar>
							<IonTitle>{editingPackage ? 'Edit' : 'Add'} Package Size</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={handleCloseModal}>
									<IonIcon icon={close} />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">
						<form onSubmit={handleSubmit(onSubmit)}>
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

				{/* Delete confirmation alert */}
				<DeleteConfirmationAlert
					isOpen={deletingPackageId !== null}
					onConfirm={confirmDelete}
					onDismiss={() => setDeletingPackageId(null)}
					itemName="package size"
				/>
			</IonContent>
		</IonPage>
	);
};

export default PackageSizesPage;
