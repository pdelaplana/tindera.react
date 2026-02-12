// Settings Page - Navigation menu for all shop settings

import {
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
import {
  arrowUndoOutline,
  cashOutline,
  chevronForwardOutline,
  cubeOutline,
  optionsOutline,
  pricetagOutline,
  pricetagsOutline,
  storefrontOutline,
} from 'ionicons/icons';
import type React from 'react';
import { useHistory } from 'react-router-dom';
import { CenteredLayout } from '@/components/layouts';
import PageHeader from '@/components/shared/PageHeader';
import { useShop } from '@/hooks/useShop';

const SettingsPage: React.FC = () => {
  const history = useHistory();
  const { currentShop } = useShop();

  const shopId = currentShop?.id;

  const navigate = (path: string) => {
    history.push(path);
  };

  return (
    <IonPage>
      <PageHeader title="Settings" showLogout collapse collapseTitle="Settings" />

      <IonContent fullscreen className="ion-padding-top">
        <CenteredLayout className="ion-margin-top">
          {currentShop && (
            <>
              {/* Shop */}
             
              <IonTitle>Shop</IonTitle>
              <IonCard className="flat-card">
                <IonCardContent>
                  <IonList lines="none" className="ion-no-padding">
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/shop`)}
                      detail={false}
                    >
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

              {/* Products */}
              <IonTitle>Products</IonTitle>
              <IonCard className="flat-card">
                <IonCardContent>
                  <IonList lines="none" className="ion-no-padding">
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/products/categories`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={pricetagOutline} />
                      <IonLabel>
                        <h2>Product Categories</h2>
                        <p>Organize products into categories</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/products/modifiers`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={optionsOutline} />
                      <IonLabel>
                        <h2>Global Modifiers</h2>
                        <p>Manage reusable modifier groups for products</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              {/* Inventory */}
              <IonTitle>Inventory</IonTitle>
              <IonCard className="flat-card">
                <IonCardContent>
                  <IonList lines="none" className="ion-no-padding">
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/inventory/categories`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={cubeOutline} />
                      <IonLabel>
                        <h2>Inventory Categories</h2>
                        <p>Organize inventory items into categories</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              {/* POS Configuration */}
              <IonTitle>POS Configuration</IonTitle>
              <IonCard className="flat-card">
                <IonCardContent>
                  <IonList lines="none" className="ion-no-padding">
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/pos/taxes`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={cashOutline} />
                      <IonLabel>
                        <h2>Taxes</h2>
                        <p>Configure tax rates applied at checkout</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/pos/discounts`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={pricetagsOutline} />
                      <IonLabel>
                        <h2>Discount Types</h2>
                        <p>Manage discount types available at checkout</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                    <IonItem
                      button
                      onClick={() => navigate(`/shops/${shopId}/settings/pos/void-refund`)}
                      detail={false}
                    >
                      <IonIcon slot="start" icon={arrowUndoOutline} />
                      <IonLabel>
                        <h2>Void & Refund Reasons</h2>
                        <p>Define reasons for voiding or refunding orders</p>
                      </IonLabel>
                      <IonIcon slot="end" icon={chevronForwardOutline} />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            </>
          )}
        </CenteredLayout>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
