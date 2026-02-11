// src/features/settings/pages/DiscountTypeSettingsPage.tsx
import type React from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared/CardContainer';
import { useShop } from '@/hooks/useShop';
import { DiscountTypeSettings } from '../components';

const DiscountTypeSettingsPage: React.FC = () => {
  const { currentShop } = useShop();

  return (
    <BasePage title="Discount Types" backHref={`/shops/${currentShop?.id}/settings`}>
      <CenteredLayout>
        <CardContainer title="Discount Types" noPadding>
          <DiscountTypeSettings />
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};

export default DiscountTypeSettingsPage;
