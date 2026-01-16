// Package Sizes List Component - Display and manage inventory item package sizes

import {
	IonButton,
	IonButtons,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonText,
} from '@ionic/react';
import { add, checkmark, createOutline, trashOutline } from 'ionicons/icons';
import type React from 'react';
import type { PackageSize } from '@/types';

interface PackageSizesListProps {
	/** Array of package sizes */
	packageSizes: PackageSize[];
	/** Base unit of measure for the item */
	baseUom: string;
	/** Function to format currency values */
	formatCurrency: (amount: number) => string;
	/** Handler for adding a new package size */
	onAdd: () => void;
	/** Handler for editing a package size */
	onEdit: (packageSize: PackageSize) => void;
	/** Handler for deleting a package size */
	onDelete: (packageSizeId: string) => void;
	/** Whether user can edit package sizes */
	canEdit: boolean;
}

const PackageSizesList: React.FC<PackageSizesListProps> = ({
	packageSizes,
	baseUom,
	formatCurrency,
	onAdd,
	onEdit,
	onDelete,
	canEdit,
}) => {
	return (
		<IonList lines="full" style={{ marginTop: '16px' }}>
			<IonListHeader className="ion-justify-content-between ion-align-items-content-around">
				<IonLabel>
					<h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
						Package Sizes ({packageSizes.length})
					</h2>
					{packageSizes.length > 0 && (
						<p style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', marginTop: '4px' }}>
							Base Unit: {baseUom}
						</p>
					)}
				</IonLabel>
				<IonButton
					fill="clear"
					color="primary"
					onClick={onAdd}
					aria-label="Add package size"
					disabled={!canEdit}
				>
					<IonIcon slot="icon-only" icon={add} />
				</IonButton>
			</IonListHeader>

			{packageSizes.length === 0 ? (
				<IonItem>
					<IonLabel color="medium" className="ion-text-center" style={{ padding: '24px 0' }}>
						<p>No package sizes defined yet</p>
						<IonText color="medium" style={{ fontSize: '0.875rem' }}>
							<p>Click "Add Package Size" to define how this item is purchased or received</p>
						</IonText>
					</IonLabel>
				</IonItem>
			) : (
				packageSizes.map((pkg) => (
					<IonItem key={pkg.id} button={canEdit} detail={false} onClick={() => canEdit && onEdit(pkg)}>
						<IonLabel>
							<h3>
								{pkg.package_name}
								{pkg.is_default && (
									<IonIcon icon={checkmark} color="success" style={{ marginLeft: '8px' }} />
								)}
							</h3>
							<p>
								1 {pkg.package_uom} = {pkg.units_per_package} {baseUom}
							</p>
							{pkg.cost_per_package && <p>Typical cost: {formatCurrency(pkg.cost_per_package)}</p>}
						</IonLabel>
						{canEdit && (
							<IonButtons slot="end">
								<IonButton
									fill="clear"
									color="dark"
									onClick={(e) => {
										e.stopPropagation();
										onEdit(pkg);
									}}
									aria-label="Edit package size"
								>
									<IonIcon slot="icon-only" icon={createOutline} />
								</IonButton>
								<IonButton
									fill="clear"
									color="danger"
									onClick={(e) => {
										e.stopPropagation();
										onDelete(pkg.id);
									}}
									aria-label="Delete package size"
								>
									<IonIcon slot="icon-only" icon={trashOutline} />
								</IonButton>
							</IonButtons>
						)}
					</IonItem>
				))
			)}
		</IonList>
	);
};

export default PackageSizesList;
