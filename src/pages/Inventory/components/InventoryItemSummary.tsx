// Inventory Item Summary Component - Display item details in a grid layout

import { IonCol, IonGrid, IonRow, IonText } from '@ionic/react';
import type React from 'react';

interface InventoryItemSummaryProps {
	/** Item name */
	name: string;
	/** Item description (optional) */
	description?: string | null;
	/** Unit cost of the item */
	unitCost: number;
	/** Current count/balance on hand */
	currentCount: number;
	/** Unit of measure */
	base_uom: string;
	/** Function to format currency values */
	formatCurrency: (amount: number) => string;
}

const InventoryItemSummary: React.FC<InventoryItemSummaryProps> = ({
	name,
	description,
	unitCost,
	currentCount,
	base_uom,
	formatCurrency,
}) => {
	return (
		<IonGrid className="ion-padding">
			<IonRow>
				<IonCol size="12">
					<IonText color="dark" style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>
						<h2>{name}</h2>
					</IonText>

					{description && (
						<p className="ion-no-margin ion-margin-bottom" color="medium">
							<IonText>{description}</IonText>
						</p>
					)}
				</IonCol>
			</IonRow>
			<IonRow>
				<IonCol size="6" sizeSm="6" sizeMd="6">
					<div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Unit Cost</div>
					<div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formatCurrency(unitCost)}</div>
				</IonCol>
				<IonCol size="6" sizeSm="6" sizeMd="6" className="ion-text-end ion-text-md-right">
					<div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Balance on Hand</div>
					<div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
						{currentCount} {base_uom}
					</div>
				</IonCol>
			</IonRow>
		</IonGrid>
	);
};

export default InventoryItemSummary;
