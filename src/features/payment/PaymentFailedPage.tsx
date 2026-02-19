// PaymentFailedPage - Shown to the customer after a failed or cancelled e-wallet payment redirect
import { IonContent, IonPage } from '@ionic/react';
import { useLocation } from 'react-router-dom';
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
  color: ${designSystem.colors.danger};

  svg {
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
  background: ${designSystem.colors.danger};
  color: #fff;
  border: none;
  border-radius: ${designSystem.borderRadius.lg};
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  cursor: pointer;
`;

const PaymentFailedPage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isCancelled = params.get('status')?.toLowerCase() === 'cancelled'
    || params.get('reason')?.toLowerCase() === 'cancel';

  const heading = isCancelled ? 'Payment Cancelled' : 'Payment Failed';
  const body = isCancelled
    ? 'Your payment was cancelled. Please return to the merchant to try again.'
    : 'Your payment could not be processed. Please return to the merchant and try a different method.';

  return (
    <IonPage>
      <IonContent fullscreen>
        <Container>
          <IconWrapper>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            </svg>
          </IconWrapper>

          <Heading>{heading}</Heading>

          <Body>{body}</Body>

          <CloseButton onClick={() => window.close()}>
            Close this page
          </CloseButton>
        </Container>
      </IonContent>
    </IonPage>
  );
};

export default PaymentFailedPage;
