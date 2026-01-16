// Shop Selection Page - Choose or create a shop

import {
	IonButton,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import { add, storefront } from 'ionicons/icons';
import type React from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useShop } from '@/hooks/useShop';
import { designSystem } from '@/theme/designSystem';
import type { Shop } from '@/types';

// Styled Components
const PageContainer = styled.div`
	padding: ${designSystem.spacing.lg};
	max-width: 1200px;
	margin: 0 auto;
`;

const ShopGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: ${designSystem.spacing.lg};
	margin-top: ${designSystem.spacing.lg};

	@media (max-width: 768px) {
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: ${designSystem.spacing.md};
	}
`;

const ShopCard = styled.div`
	background: ${designSystem.colors.surface.elevated};
	border-radius: ${designSystem.borderRadius.lg};
	box-shadow: ${designSystem.shadows.md};
	overflow: hidden;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		box-shadow: ${designSystem.shadows.lg};
		transform: translateY(-2px);
	}

	&:active {
		transform: translateY(0);
	}
`;

const ShopImageContainer = styled.div`
	width: 100%;
	aspect-ratio: 16 / 9;
	background: ${designSystem.colors.gray[100]};
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
`;

const ShopImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
`;

const ShopImagePlaceholder = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, ${designSystem.colors.brand.primary} 0%, ${designSystem.colors.primary[600]} 100%);

	ion-icon {
		font-size: 48px;
		color: ${designSystem.colors.text.inverse};
		opacity: 0.9;
	}
`;

const ShopCardContent = styled.div`
	padding: ${designSystem.spacing.lg};
`;

const ShopName = styled.h3`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.sm} 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ShopLocation = styled.p`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin: 0;
	display: flex;
	align-items: center;
	gap: ${designSystem.spacing.xs};
`;

// Blank Slate
const BlankSlate = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${designSystem.spacing['3xl']};
	text-align: center;
	min-height: 400px;
`;

const BlankSlateIcon = styled.div`
	width: 120px;
	height: 120px;
	border-radius: ${designSystem.borderRadius.full};
	background: ${designSystem.colors.gray[100]};
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: ${designSystem.spacing.xl};

	ion-icon {
		font-size: 64px;
		color: ${designSystem.colors.gray[400]};
	}
`;

const BlankSlateTitle = styled.h2`
	font-size: ${designSystem.typography.fontSize['2xl']};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.md} 0;
`;

const BlankSlateDescription = styled.p`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
	margin: 0 0 ${designSystem.spacing.xl} 0;
	max-width: 400px;
	line-height: 1.6;
`;

const PageTitle = styled.h1`
	font-size: ${designSystem.typography.fontSize['2xl']};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0;
`;

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
`;

const ShopSelectionPage: React.FC = () => {
	const history = useHistory();
	const { shops, isLoading, selectShop } = useShop();

	const handleSelectShop = (shop: Shop) => {
		selectShop(shop.id);
		history.push(`/shops/${shop.id}/home`);
	};

	const handleCreateShop = () => {
		history.push('/shops/new');
	};

	if (isLoading) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Select Shop</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent>
					<LoadingContainer>
						<IonSpinner />
					</LoadingContainer>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Select Shop</IonTitle>
					<IonButton slot="end" fill="clear" onClick={handleCreateShop}>
						<IonIcon slot="icon-only" icon={add} />
					</IonButton>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<PageContainer>
					{shops.length === 0 ? (
						<BlankSlate>
							<BlankSlateIcon>
								<IonIcon icon={storefront} />
							</BlankSlateIcon>
							<BlankSlateTitle>No Shops Yet</BlankSlateTitle>
							<BlankSlateDescription>
								Get started by creating your first shop. You'll be able to manage products, inventory,
								sales, and more.
							</BlankSlateDescription>
							<IonButton size="large" onClick={handleCreateShop}>
								<IonIcon slot="start" icon={add} />
								Create Your First Shop
							</IonButton>
						</BlankSlate>
					) : (
						<>
							<PageTitle>Your Shops</PageTitle>
							<ShopGrid>
								{shops.map((shop) => (
									<ShopCard key={shop.id} onClick={() => handleSelectShop(shop)}>
										<ShopImageContainer>
											{shop.image_url ? (
												<ShopImage src={shop.image_url} alt={shop.name} />
											) : (
												<ShopImagePlaceholder>
													<IonIcon icon={storefront} />
												</ShopImagePlaceholder>
											)}
										</ShopImageContainer>
										<ShopCardContent>
											<ShopName>{shop.name}</ShopName>
											{shop.location && <ShopLocation>{shop.location}</ShopLocation>}
										</ShopCardContent>
									</ShopCard>
								))}
							</ShopGrid>
						</>
					)}
				</PageContainer>
			</IonContent>
		</IonPage>
	);
};

export default ShopSelectionPage;
