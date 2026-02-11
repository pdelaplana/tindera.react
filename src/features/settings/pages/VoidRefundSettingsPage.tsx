// src/features/settings/pages/VoidRefundSettingsPage.tsx
import type React from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared/CardContainer';
import { useShop } from '@/hooks/useShop';
import { VoidRefundReasonSettings } from '../components';

const VoidRefundSettingsPage: React.FC = () => {
  const { currentShop } = useShop();

  return (
    <BasePage title="Void & Refund Reasons" backHref={`/shops/${currentShop?.id}/settings`}>
      <CenteredLayout>
        <CardContainer title="Void & Refund Reasons" noPadding>
          <VoidRefundReasonSettings />
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};

export default VoidRefundSettingsPage;
