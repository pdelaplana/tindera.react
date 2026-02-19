// PaymentSuccessPage - Shown to the customer after a successful e-wallet payment redirect
import { IonContent, IonPage } from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';
import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: ${designSystem.spacing.xl};
  text-align: center;
  gap: ${designSystem.spacing.lg};
`;

const IconWrapper = styled.div`
  font-size: 96px;
  line-height: 1;
  color: ${designSystem.colors.success};

  svg, ion-icon {
    width: 96px;
    height: 96px;
  }
`;

const Heading = styled.h1`
  font-size: ${designSystem.typography.fontSize['2xl']};
  font-weight: ${designSystem.typography.fontWeight.bold};
  color: ${designSystem.colors.text.primary};
  margin: 0;
`;

const Body = styled.p`
  font-size: ${designSystem.typography.fontSize.base};
  color: ${designSystem.colors.text.secondary};
  margin: 0;
  max-width: 280px;
  line-height: 1.6;
`;

const CloseButton = styled.button`
  margin-top: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.md} ${designSystem.spacing.xl};
  background: ${designSystem.colors.success};
  color: #fff;
  border: none;
  border-radius: ${designSystem.borderRadius.lg};
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  cursor: pointer;
`;

const PaymentSuccessPage: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        <Container>
          <IconWrapper>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4.5-4.5 1.41-1.41L10 13.67l7.09-7.09 1.41 1.41L10 16.5z"/>
            </svg>
          </IconWrapper>

          <Heading>Payment Successful!</Heading>

          <Body>
            Your payment has been received. You may now close this page and return to the merchant.
          </Body>

          <CloseButton onClick={() => window.close()}>
            Close this page
          </CloseButton>
        </Container>
      </IonContent>
    </IonPage>
  );
};

export default PaymentSuccessPage;
