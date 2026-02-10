// Product Sales Page - Mobile view showing all sales for a specific product

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
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PageLoadingState from '@/components/shared/PageLoadingState';
import PageNotFoundState from '@/components/shared/PageNotFoundState';
import { useProduct } from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { createCurrencyFormatter } from '@/utils/currency';
import { ProductSalesPanel } from '../../components';

interface RouteParams {
  id: string;
}

const ProductSalesPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const { currentShop } = useShop();
  const { data: product, isLoading } = useProduct(id);

  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  if (isLoading) return <PageLoadingState />;
  if (!product) return <PageNotFoundState />;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/shops/${currentShop?.id}/products/${id}/manage`} />
          </IonButtons>
          <IonTitle>{product.name} — Sales</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <ProductSalesPanel
          productId={id}
          productName={product.name}
          formatCurrency={formatCurrency}
          onBack={() => window.history.back()}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProductSalesPage;
