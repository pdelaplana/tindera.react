// OrderDetailPage - Mobile full-page view for order details

import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import type React from 'react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useShopContext } from '@/contexts/ShopContext';
import { useOrderDetail } from '@/hooks';
import { designSystem } from '@/theme/designSystem';
import { OrderDetail } from './OrderDetail';

// Styled components
const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	gap: ${designSystem.spacing.md};
`;

const LoadingText = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
`;

const ErrorContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: ${designSystem.spacing.xl};
	text-align: center;
`;

const ErrorTitle = styled.h2`
	font-size: ${designSystem.typography.fontSize.xl};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.danger};
	margin: 0 0 ${designSystem.spacing.sm} 0;
`;

const ErrorMessage = styled.p`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
	margin: 0;
`;

const NotFoundContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: ${designSystem.spacing.xl};
	text-align: center;
`;

const NotFoundTitle = styled.h2`
	font-size: ${designSystem.typography.fontSize.xl};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.sm} 0;
`;

const NotFoundMessage = styled.p`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
	margin: 0;
`;

const NoShopContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: ${designSystem.spacing.xl};
	text-align: center;
`;

const NoShopTitle = styled.h2`
	font-size: ${designSystem.typography.fontSize.xl};
	font-weight: ${designSystem.typography.fontWeight.bold};
	color: ${designSystem.colors.text.primary};
	margin: 0 0 ${designSystem.spacing.sm} 0;
`;

const NoShopMessage = styled.p`
	font-size: ${designSystem.typography.fontSize.base};
	color: ${designSystem.colors.text.secondary};
	margin: 0;
`;

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentShop } = useShopContext();
  const { data: order, isLoading, error } = useOrderDetail(orderId!);
  // Modal state - will be used when VoidModal and RefundModal are implemented in Tasks 27-28
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showVoidModal, setShowVoidModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showRefundModal, setShowRefundModal] = useState(false);

  // No shop state
  if (!currentShop) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton
                defaultHref={currentShop ? `/shops/${currentShop.id}/sales` : '/sales'}
              />
            </IonButtons>
            <IonTitle>Order Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <NoShopContainer>
            <NoShopTitle>No Shop Selected</NoShopTitle>
            <NoShopMessage>Please select a shop to view order details.</NoShopMessage>
          </NoShopContainer>
        </IonContent>
      </IonPage>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton
                defaultHref={currentShop ? `/shops/${currentShop.id}/sales` : '/sales'}
              />
            </IonButtons>
            <IonTitle>Order Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <LoadingContainer>
            <IonSpinner />
            <LoadingText>Loading order...</LoadingText>
          </LoadingContainer>
        </IonContent>
      </IonPage>
    );
  }

  // Error state
  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton
                defaultHref={currentShop ? `/shops/${currentShop.id}/sales` : '/sales'}
              />
            </IonButtons>
            <IonTitle>Order Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <ErrorContainer>
            <ErrorTitle>Error Loading Order</ErrorTitle>
            <ErrorMessage>
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </ErrorMessage>
          </ErrorContainer>
        </IonContent>
      </IonPage>
    );
  }

  // Not found state
  if (!order) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton
                defaultHref={currentShop ? `/shops/${currentShop.id}/sales` : '/sales'}
              />
            </IonButtons>
            <IonTitle>Order Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <NotFoundContainer>
            <NotFoundTitle>Order Not Found</NotFoundTitle>
            <NotFoundMessage>The order you're looking for could not be found.</NotFoundMessage>
          </NotFoundContainer>
        </IonContent>
      </IonPage>
    );
  }

  // Success state - render order details
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref={currentShop ? `/shops/${currentShop.id}/sales` : '/sales'}
            />
          </IonButtons>
          <IonTitle>Order Details</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <OrderDetail
          order={order}
          shop={currentShop}
          onVoid={() => setShowVoidModal(true)}
          onRefund={() => setShowRefundModal(true)}
        />
        {/* VoidModal and RefundModal will be added in Tasks 27-28 */}
      </IonContent>
    </IonPage>
  );
};

export default OrderDetailPage;
