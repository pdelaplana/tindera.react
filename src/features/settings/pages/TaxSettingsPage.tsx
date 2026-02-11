// src/features/settings/pages/TaxSettingsPage.tsx
import type React from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared/CardContainer';
import { useShop } from '@/hooks/useShop';
import { TaxSettings } from '../components';

const TaxSettingsPage: React.FC = () => {
  const { currentShop } = useShop();

  return (
    <BasePage title="Taxes" backHref={`/shops/${currentShop?.id}/settings`}>
      <CenteredLayout>
        <CardContainer title="Tax Configuration" noPadding>
          <TaxSettings />
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};

export default TaxSettingsPage;
