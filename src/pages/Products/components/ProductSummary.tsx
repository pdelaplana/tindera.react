// Product Summary Component - Display product details in a grid layout

import { IonChip, IonCol, IonGrid, IonRow, IonText } from '@ionic/react';
import { forwardRef } from 'react';
import type { ProductCategory } from '@/types';

interface ProductSummaryProps {
	/** Product name */
	name: string;
	/** Product description (optional) */
	description?: string | null;
	/** Product price */
	price: number;
	/** Product cost (optional) */
	cost?: number;
	/** Product category (optional) */
	category?: ProductCategory | null;
	/** Product image URL (optional) */
	imageUrl?: string | null;
	/** Number of items (ingredients/components) */
	itemsCount: number;
	/** Number of add-ons */
	addonsCount: number;
	/** Function to format currency values */
	formatCurrency: (amount: number) => string;
}

const ProductSummary = forwardRef<HTMLHeadingElement, ProductSummaryProps>(
	(
		{ name, description, price, cost, category, imageUrl, itemsCount, addonsCount, formatCurrency },
		ref
	) => {
		return (
			<IonGrid className="ion-padding">
				<IonRow>
					<IonCol size="12" className="ion-text-center">
						<IonText color="dark" style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>
							<h2 ref={ref}>{name}</h2>
						</IonText>

						{description && (
							<p className="ion-no-margin ion-margin-bottom" color="medium">
								<IonText>{description}</IonText>
							</p>
						)}

						{category && (
							<div style={{ marginBottom: '8px' }}>
								<IonChip color="primary" outline>
									{category.name}
								</IonChip>
							</div>
						)}

						{imageUrl && (
							<div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
								<img
									src={imageUrl}
									alt={name}
									style={{
										maxWidth: '100%',
										maxHeight: '200px',
										objectFit: 'contain',
										borderRadius: '8px',
									}}
								/>
							</div>
						)}
					</IonCol>
				</IonRow>
				<IonRow>
					<IonCol size="6" sizeSm="6" sizeMd="6">
						<div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Price</div>
						<div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formatCurrency(price)}</div>{' '}
						{cost !== undefined && (
							<>
								<div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', marginTop: '8px' }}>
									Cost
								</div>
								<div style={{ fontSize: '1rem', fontWeight: '500' }}>{formatCurrency(cost)}</div>
							</>
						)}{' '}
					</IonCol>
					<IonCol size="6" sizeSm="6" sizeMd="6" className="ion-text-end ion-text-md-right">
						<div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Components</div>
						<div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
							{itemsCount} {itemsCount === 1 ? 'item' : 'items'}, {addonsCount}{' '}
							{addonsCount === 1 ? 'addon' : 'addons'}
						</div>
					</IonCol>
				</IonRow>
			</IonGrid>
		);
	}
);

ProductSummary.displayName = 'ProductSummary';

export default ProductSummary;
