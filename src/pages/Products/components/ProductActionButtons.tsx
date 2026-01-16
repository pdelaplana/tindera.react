// Product Action Buttons Component - Circular action buttons for product management

import { IonButton, IonIcon } from '@ionic/react';
import {
	addCircleOutline,
	createOutline,
	ellipsisHorizontal,
	pricetagOutline,
} from 'ionicons/icons';
import type React from 'react';
import { Div } from '@/components/shared/base/Div';

interface ProductActionButtonsProps {
	/** Handler for edit button click */
	onEdit: () => void;
	/** Handler for add item button click */
	onAddItem: () => void;
	/** Handler for add addon button click */
	onAddAddon: () => void;
	/** Handler for options button click */
	onOptions: () => void;
	/** Whether buttons should be disabled */
	disabled?: boolean;
}

const ProductActionButtons: React.FC<ProductActionButtonsProps> = ({
	onEdit,
	onAddItem,
	onAddAddon,
	onOptions,
	disabled = false,
}) => {
	return (
		<Div
			style={{
				display: 'flex',
				justifyContent: 'center',
				gap: '24px',
			}}
		>
			<Div className="ion-text-center">
				<IonButton
					shape="round"
					color="dark"
					onClick={onEdit}
					disabled={disabled}
					title="Edit Product Details"
					aria-label="Edit product details"
					style={{
						'--border-radius': '50%',
						width: '56px',
						height: '56px',
					}}
				>
					<IonIcon slot="icon-only" icon={createOutline} />
				</IonButton>
				<Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>Edit</Div>
			</Div>
			<Div className="ion-text-center">
				<IonButton
					shape="round"
					color="dark"
					onClick={onAddItem}
					disabled={disabled}
					title="Add Ingredient/Component"
					aria-label="Add ingredient or component"
					style={{
						'--border-radius': '50%',
						width: '56px',
						height: '56px',
					}}
				>
					<IonIcon slot="icon-only" icon={addCircleOutline} />
				</IonButton>
				<Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
					Add Item
				</Div>
			</Div>
			<Div className="ion-text-center">
				<IonButton
					shape="round"
					color="dark"
					onClick={onAddAddon}
					disabled={disabled}
					title="Add Add-on"
					aria-label="Add product add-on"
					style={{
						'--border-radius': '50%',
						width: '56px',
						height: '56px',
					}}
				>
					<IonIcon slot="icon-only" icon={pricetagOutline} />
				</IonButton>
				<Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
					Add Addon
				</Div>
			</Div>
			<Div className="ion-text-center">
				<IonButton
					shape="round"
					color="dark"
					onClick={onOptions}
					disabled={disabled}
					title="More Options"
					aria-label="More options"
					style={{
						'--border-radius': '50%',
						width: '56px',
						height: '56px',
					}}
				>
					<IonIcon slot="icon-only" icon={ellipsisHorizontal} />
				</IonButton>
				<Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
					Options
				</Div>
			</Div>
		</Div>
	);
};

export default ProductActionButtons;
