// Inventory Transaction Details Page - View full details of a transaction

import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import type React from 'react';
import { useParams } from 'react-router-dom';
import { CenteredLayout } from '@/components/layouts';
import InventoryTransactionDetailsContent from '../../components/transactions/sections/InventoryTransactionDetailsContent';

interface RouteParams {
  shopId: string;
  itemId: string;
  transactionId: string;
}

const InventoryTransactionDetailsPage: React.FC = () => {
  const { shopId, itemId, transactionId } = useParams<RouteParams>();

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
          <InventoryTransactionDetailsContent transactionId={transactionId} />
        </CenteredLayout>
      </IonContent>
    </IonPage>
  );
};

export default InventoryTransactionDetailsPage;
