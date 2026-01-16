// Settings Page - Application and Shop Settings

import {
	IonButton,
	IonCard,
	IonCardContent,
	IonContent,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonTitle,
} from '@ionic/react';
import { chevronForwardOutline, storefrontOutline, trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CenteredLayout } from '@/components/layouts';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import PageHeader from '@/components/shared/PageHeader';
import { useDeleteShop, useShop } from '@/hooks/useShop';

const SettingsPage: React.FC = () => {
	const history = useHistory();
	const { currentShop } = useShop();
	const deleteShopMutation = useDeleteShop();
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);

	const handleEditShop = () => {
		if (currentShop) {
			history.push(`/shops/${currentShop.id}/settings/shop`);
		}
	};

	const handleDeleteShop = () => {
		setShowDeleteAlert(true);
	};

	const handleConfirmDelete = async () => {
		if (!currentShop) return;

		try {
			await deleteShopMutation.mutateAsync(currentShop.id);
			setShowDeleteAlert(false);
			// After successful deletion, redirect to home
			history.push('/');
		} catch (error) {
			console.error('Failed to delete shop:', error);
			// Keep the alert open on error
		}
	};

	return (
		<IonPage>
			<PageHeader title="Settings" showLogout collapse collapseTitle="Settings" />

			<IonContent fullscreen className="ion-padding-top">
				<CenteredLayout className="ion-margin-top">
					{/* Shop Settings */}
					{currentShop && (
						<>
							<IonTitle>Shop Settings</IonTitle>
							<IonCard className="flat-card">
								<IonCardContent>
									<IonList lines="none" className="ion-no-padding">
										<IonItem button onClick={handleEditShop} detail={false}>
											<IonIcon slot="start" icon={storefrontOutline} />
											<IonLabel>
												<h2>Edit Shop Details</h2>
												<p>Update shop name, location, and other information</p>
											</IonLabel>
											<IonIcon slot="end" icon={chevronForwardOutline} />
										</IonItem>
									</IonList>
								</IonCardContent>
							</IonCard>

							<IonTitle>Danger Zone</IonTitle>
							<IonCard
								className="flat-card"
								style={{ marginTop: '16px', border: '1px solid var(--ion-color-danger)' }}
							>
								<IonCardContent>
									<IonList lines="none">
										<IonItem>
											<IonLabel>
												<h2>Delete Shop</h2>
											</IonLabel>
											<IonButton color="danger" fill="solid" size="default" onClick={handleDeleteShop}>
												<IonIcon slot="start" icon={trashOutline} />
												Delete
											</IonButton>
										</IonItem>
									</IonList>
								</IonCardContent>
							</IonCard>

							<DeleteConfirmationAlert
								isOpen={showDeleteAlert}
								onDismiss={() => setShowDeleteAlert(false)}
								onConfirm={handleConfirmDelete}
								itemName={currentShop.name}
								itemType="Shop"
							/>
						</>
					)}
				</CenteredLayout>
			</IonContent>
		</IonPage>
	);
};

export default SettingsPage;
