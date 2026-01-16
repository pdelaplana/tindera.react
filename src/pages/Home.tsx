// Home Page - Dashboard with Bento Grid Layout

import {
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonList,
	IonModal,
	IonPage,
	IonSpinner,
	IonTitle,
	IonToast,
	IonToolbar,
} from '@ionic/react';
import {
	cartOutline,
	cashOutline,
	closeOutline,
	cubeOutline,
	pricetagsOutline,
	settingsOutline,
	statsChartOutline,
	storefrontOutline,
	timeOutline,
} from 'ionicons/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { BentoGrid, BentoTile } from '@/components/layouts';
import PageHeader from '@/components/shared/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';

const Home: React.FC = () => {
	const history = useHistory();
	const { shopId } = useParams<{ shopId: string }>();
	const { user, profile, shopIds } = useAuth();
	const { createShop, isLoading, selectShop, currentShop } = useShop();
	const { t } = useTranslation();

	useEffect(() => {
		if (shopId && (!currentShop || currentShop.id !== shopId)) {
			selectShop(shopId);
		}
	}, [shopId, currentShop?.id, currentShop, selectShop]);

	const [showModal, setShowModal] = useState(false);
	const [shopName, setShopName] = useState('');
	const [shopDescription, setShopDescription] = useState('');
	const [shopLocation, setShopLocation] = useState('');
	const [toastMessage, setToastMessage] = useState('');
	const [showToast, setShowToast] = useState(false);

	const displayName = profile?.display_name || user?.email || 'User';

	const handleCreateShop = async () => {
		if (!shopName.trim()) {
			setToastMessage(t('home.createShopModal.validation.nameRequired'));
			setShowToast(true);
			return;
		}

		const result = await createShop({
			name: shopName.trim(),
			description: shopDescription.trim() || null,
			location: shopLocation.trim() || null,
			currency_code: 'USD', // Default currency, can be changed in settings later
			image_url: null,
		});

		if (result.success) {
			setShowModal(false);
			setShopName('');
			setShopDescription('');
			setShopLocation('');
			setToastMessage(t('home.createShopModal.success'));
			setShowToast(true);
		} else {
			setToastMessage(result.error || t('home.createShopModal.error'));
			setShowToast(true);
		}
	};

	return (
		<IonPage>
			<PageHeader title="Dashboard" showProfile showLogout />

			<IonContent fullscreen className="ion-padding">
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Dashboard</IonTitle>
					</IonToolbar>
				</IonHeader>

				<div className="page-container">
					<div className="mb-4">
						<h2 className="text-subheading">{t('home.welcome', { name: displayName })}</h2>
						<p className="text-caption">
							{shopIds.length > 0 ? t('home.shopCount', { count: shopIds.length }) : t('home.getStarted')}
						</p>
					</div>

					{shopIds.length === 0 ? (
						<IonCard>
							<IonCardHeader>
								<IonCardTitle>
									<IonIcon icon={storefrontOutline} style={{ marginRight: '8px' }} />
									{t('home.setupShop.title')}
								</IonCardTitle>
							</IonCardHeader>
							<IonCardContent>
								<p className="text-body mb-4">{t('home.setupShop.description')}</p>
								<IonButton expand="block" onClick={() => setShowModal(true)}>
									{t('home.setupShop.createButton')}
								</IonButton>
							</IonCardContent>
						</IonCard>
					) : (
						<BentoGrid>
							{/* Primary Actions - Large Tiles */}
							<BentoTile
								title={t('home.tiles.newOrder')}
								icon={cartOutline}
								size="large"
								variant="primary"
								onClick={() => history.push('/pos')}
							/>
							<BentoTile
								title={t('home.tiles.inProgress')}
								icon={timeOutline}
								size="large"
								badge={0}
								onClick={() => history.push('/orders?status=pending')}
							/>

							{/* Secondary Actions */}
							<BentoTile
								title={t('home.tiles.products')}
								icon={pricetagsOutline}
								onClick={() => history.push(`/shops/${currentShop?.id}/products`)}
							/>
							<BentoTile
								title={t('home.tiles.inventory')}
								icon={cubeOutline}
								onClick={() => history.push('/inventory')}
							/>
							<BentoTile
								title={t('home.tiles.todaysSales')}
								icon={cashOutline}
								value="$0.00"
								onClick={() => history.push('/reports/daily')}
							/>
							<BentoTile
								title={t('home.tiles.reports')}
								icon={statsChartOutline}
								onClick={() => history.push('/reports')}
							/>
							<BentoTile
								title={t('home.tiles.settings')}
								icon={settingsOutline}
								onClick={() => currentShop && history.push(`/shops/${currentShop.id}/settings`)}
							/>
						</BentoGrid>
					)}
				</div>

				{/* Create Shop Modal */}
				<IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
					<IonHeader>
						<IonToolbar>
							<IonTitle>{t('home.createShopModal.title')}</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={() => setShowModal(false)}>
									<IonIcon slot="icon-only" icon={closeOutline} />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">
						<IonList>
							<IonItem>
								<IonInput
									label={t('home.createShopModal.shopName')}
									labelPlacement="stacked"
									placeholder={t('home.createShopModal.shopNamePlaceholder')}
									value={shopName}
									onIonInput={(e) => setShopName(e.detail.value || '')}
								/>
							</IonItem>
							<IonItem>
								<IonInput
									label={t('home.createShopModal.description')}
									labelPlacement="stacked"
									placeholder={t('home.createShopModal.descriptionPlaceholder')}
									value={shopDescription}
									onIonInput={(e) => setShopDescription(e.detail.value || '')}
								/>
							</IonItem>
							<IonItem>
								<IonInput
									label={t('home.createShopModal.location')}
									labelPlacement="stacked"
									placeholder={t('home.createShopModal.locationPlaceholder')}
									value={shopLocation}
									onIonInput={(e) => setShopLocation(e.detail.value || '')}
								/>
							</IonItem>
						</IonList>
						<div className="ion-padding">
							<IonButton expand="block" onClick={handleCreateShop} disabled={isLoading}>
								{isLoading ? <IonSpinner name="crescent" /> : t('home.createShopModal.createButton')}
							</IonButton>
						</div>
					</IonContent>
				</IonModal>

				<IonToast
					isOpen={showToast}
					onDidDismiss={() => setShowToast(false)}
					message={toastMessage}
					duration={3000}
				/>
			</IonContent>
		</IonPage>
	);
};

export default Home;
