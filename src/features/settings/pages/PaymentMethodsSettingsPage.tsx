// Payment Methods Settings Page - Manage enabled payment methods for the shop

import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonToggle,
  type RefresherEventDetail,
} from '@ionic/react';
import { cardOutline, cashOutline, walletOutline } from 'ionicons/icons';
import type React from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import { CardContainer } from '@/components/shared/CardContainer';
import { LoadingSpinner } from '@/components/ui';
import { useUI } from '@/contexts/UIContext';
import { useAllPaymentTypes, useUpsertPaymentType } from '@/hooks/useOrder';
import { useShop } from '@/hooks/useShop';
import type { PaymentType } from '@/types';

const PAYMENT_METHODS = [
  {
    code: 'CASH',
    label: 'Cash',
    description: 'Accept cash payments at the counter',
    icon: cashOutline,
    defaultActive: true,
  },
  {
    code: 'GCASH',
    label: 'GCash',
    description: 'Accept GCash e-wallet payments via QR code',
    icon: walletOutline,
    defaultActive: false,
  },
  {
    code: 'MAYA',
    label: 'Maya',
    description: 'Accept Maya e-wallet payments via QR code',
    icon: cardOutline,
    defaultActive: false,
  },
] as const;

function getIsActive(paymentTypes: PaymentType[], code: string, defaultActive: boolean): boolean {
  const record = paymentTypes.find((p) => p.code === code);
  if (!record) return defaultActive;
  return record.is_active ?? defaultActive;
}

const PaymentMethodsSettingsPage: React.FC = () => {
  const { currentShop } = useShop();
  const { data: paymentTypes, isLoading, refetch } = useAllPaymentTypes();
  const upsert = useUpsertPaymentType();
  const { showError } = useUI();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  const handleToggle = async (code: string, label: string, isActive: boolean) => {
    try {
      await upsert.mutateAsync({ code, isActive, description: label });
    } catch {
      showError(`Failed to update ${label} payment method. Please try again.`);
    }
  };

  if (!currentShop) {
    return (
      <BasePage title="Payment Methods" backHref="/shops">
        <CenteredLayout>
          <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage payment methods</p>
          </Div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage
      title="Payment Methods"
      backHref={`/shops/${currentShop.id}/settings`}
      onRefresh={handleRefresh}
    >
      <CenteredLayout>
        <CardContainer noPadding>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <IonList>
              {PAYMENT_METHODS.map((method, index) => {
                const isActive = getIsActive(paymentTypes ?? [], method.code, method.defaultActive);
                const isLast = index === PAYMENT_METHODS.length - 1;

                return (
                  <IonItem key={method.code} lines={isLast ? 'none' : 'full'}>
                    <IonIcon slot="start" icon={method.icon} />
                    <IonLabel>
                      <h2>{method.label}</h2>
                      <IonNote>{method.description}</IonNote>
                    </IonLabel>
                    <IonToggle
                      slot="end"
                      checked={isActive}
                      disabled={upsert.isPending}
                      onIonChange={(e) => handleToggle(method.code, method.label, e.detail.checked)}
                    >
                      {method.label}
                    </IonToggle>
                  </IonItem>
                );
              })}
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};

export default PaymentMethodsSettingsPage;
