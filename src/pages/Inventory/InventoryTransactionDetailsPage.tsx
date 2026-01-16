// Inventory Transaction Details Page - View full details of a transaction

import {
	IonBackButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonText,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import {
	arrowDownSharp,
	arrowUpSharp,
	calculatorSharp,
	cashSharp,
	construct,
	swapVerticalSharp,
} from 'ionicons/icons';
import type React from 'react';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CenteredLayout } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import { LoadingSpinner } from '@/components/ui';
import { useInventoryTransaction } from '@/hooks/useInventory';
import { useShop } from '@/hooks/useShop';
import { createCurrencyFormatter } from '@/utils/currency';
import { formatDateLabel } from '@/utils/date';

interface RouteParams {
	shopId: string;
	itemId: string;
	transactionId: string;
}

const InventoryTransactionDetailsPage: React.FC = () => {
	const { shopId, itemId, transactionId } = useParams<RouteParams>();
	const { currentShop } = useShop();
	const { data: transaction, isLoading } = useInventoryTransaction(transactionId);

	// Memoized formatters
	const formatCurrency = useMemo(
		() => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
		[currentShop?.currency_code]
	);

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

	// Format date and time
	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		return {
			date: formatDateLabel(dateString),
			time: date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			}),
		};
	};

	// Loading state
	if (isLoading) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonBackButton defaultHref={`/shops/${shopId}/inventory/${itemId}/manage`} />
						</IonButtons>
						<IonTitle>Loading...</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<LoadingSpinner />
				</IonContent>
			</IonPage>
		);
	}

	// Not found state
	if (!transaction) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonBackButton defaultHref={`/shops/${shopId}/inventory/${itemId}/manage`} />
						</IonButtons>
						<IonTitle>Transaction Not Found</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<Div className="ion-text-center" style={{ padding: '48px' }}>
						<p>Transaction not found</p>
					</Div>
				</IonContent>
			</IonPage>
		);
	}

	const { date, time } = formatDateTime(transaction.transaction_on);
	const quantityDisplay =
		transaction.quantity_in > 0 ? `+${transaction.quantity_in}` : `-${transaction.quantity_out}`;

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref={`/shops/${shopId}/inventory/${itemId}/manage`} />
					</IonButtons>
					<IonTitle>Transaction Details</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<CenteredLayout>
					<Div style={{ maxWidth: '800px', width: '100%', padding: '16px' }}>
						{/* Header Card with Transaction Type and Item */}
						<Div
							style={{
								padding: '24px',
								marginBottom: '16px',
								backgroundColor: 'var(--ion-color-light)',
								borderRadius: '8px',
								textAlign: 'center',
							}}
						>
							<Div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: '12px',
								}}
							>
								<IonIcon
									icon={getTransactionTypeIcon(transaction.transaction_type)}
									style={{ fontSize: '32px', marginRight: '12px' }}
								/>
								<Div>
									<h2 style={{ margin: 0, fontSize: '1.5rem' }}>
										{getTransactionTypeLabel(transaction.transaction_type)}
									</h2>
									<IonText color="medium">
										<p style={{ margin: '4px 0 0 0' }}>{transaction.item_name}</p>
									</IonText>
								</Div>
							</Div>
							<Div style={{ fontSize: '1.75rem', fontWeight: 'bold', textAlign: 'center' }}>
								{quantityDisplay}
							</Div>
						</Div>

						{/* Transaction Details List */}
						<IonList lines="full">
							{/* Date */}
							<IonItem>
								<IonLabel>
									<h3>Date</h3>
									<p>{date}</p>
								</IonLabel>
							</IonItem>

							{/* Time */}
							<IonItem>
								<IonLabel>
									<h3>Time</h3>
									<p>{time}</p>
								</IonLabel>
							</IonItem>

							{/* Reference (if exists) */}
							{transaction.reference && (
								<IonItem>
									<IonLabel>
										<h3>Reference</h3>
										<p>{transaction.reference}</p>
									</IonLabel>
								</IonItem>
							)}

							{/* Supplier (only for receipts) */}
							{transaction.transaction_type === 'receipt' && transaction.supplier && (
								<IonItem>
									<IonLabel>
										<h3>Supplier</h3>
										<p>{transaction.supplier}</p>
									</IonLabel>
								</IonItem>
							)}

							{/* Package Size (only for package-based receipts) */}
							{transaction.transaction_type === 'receipt' &&
								transaction.package_size_id &&
								transaction.package_size && (
									<>
										<IonItem>
											<IonLabel>
												<h3>Package Size</h3>
												<p>
													{transaction.package_size.package_name} ({transaction.package_size.units_per_package}{' '}
													{transaction.package_size.package_uom})
												</p>
											</IonLabel>
										</IonItem>

										{/* Number of Packages */}
										{transaction.package_quantity && (
											<IonItem>
												<IonLabel>
													<h3>Number of Packages</h3>
													<p>{transaction.package_quantity}</p>
												</IonLabel>
											</IonItem>
										)}

										{/* Cost per Package */}
										{transaction.package_cost_per_unit !== null &&
											transaction.package_cost_per_unit !== undefined && (
												<IonItem>
													<IonLabel>
														<h3>Cost per Package</h3>
														<p>{formatCurrency(transaction.package_cost_per_unit)}</p>
													</IonLabel>
												</IonItem>
											)}
									</>
								)}

							{/* Unit Cost (only for receipts) */}
							{transaction.transaction_type === 'receipt' && (
								<IonItem>
									<IonLabel>
										<h3>Unit Cost</h3>
										<p>{formatCurrency(transaction.unit_cost)}</p>
									</IonLabel>
								</IonItem>
							)}

							{/* Adjustment Reason Code (only for adjustments and count adjustments) */}
							{(transaction.transaction_type === 'adjustment' ||
								transaction.transaction_type === 'countAdjustment') &&
								transaction.adjustment_reason_code && (
									<IonItem>
										<IonLabel>
											<h3>Adjustment Reason</h3>
											<p>{transaction.adjustment_reason_code}</p>
										</IonLabel>
									</IonItem>
								)}

							{/* Adjustment Reason Other (only if exists) */}
							{transaction.adjustment_reason_other && (
								<IonItem>
									<IonLabel>
										<h3>Other Reason</h3>
										<p>{transaction.adjustment_reason_other}</p>
									</IonLabel>
								</IonItem>
							)}

							{/* Notes (if exists) */}
							{transaction.notes && (
								<IonItem>
									<IonLabel>
										<h3>Notes</h3>
										<p style={{ whiteSpace: 'pre-wrap' }}>{transaction.notes}</p>
									</IonLabel>
								</IonItem>
							)}

							{/* Created By/At */}
							<IonItem>
								<IonLabel>
									<h3>Created</h3>
									<p>
										{new Date(transaction.created_at).toLocaleString('en-US', {
											dateStyle: 'medium',
											timeStyle: 'short',
										})}
									</p>
								</IonLabel>
							</IonItem>

							{/* Created By */}
							{transaction.user_profile?.display_name && (
								<IonItem>
									<IonLabel>
										<h3>Created By</h3>
										<p>{transaction.user_profile.display_name}</p>
									</IonLabel>
								</IonItem>
							)}

							{/* Updated By/At (if different from created) */}
							{transaction.updated_at !== transaction.created_at && (
								<IonItem>
									<IonLabel>
										<h3>Last Updated</h3>
										<p>
											{new Date(transaction.updated_at).toLocaleString('en-US', {
												dateStyle: 'medium',
												timeStyle: 'short',
											})}
										</p>
									</IonLabel>
								</IonItem>
							)}
						</IonList>
					</Div>
				</CenteredLayout>
			</IonContent>
		</IonPage>
	);
};

export default InventoryTransactionDetailsPage;
