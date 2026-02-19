// XenditPaymentModal - QR code payment modal for GCash/Maya e-wallet payments

import { IonButton, IonIcon, IonText } from '@ionic/react';
import { timeOutline } from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { BaseModal } from '@/components/shared';
import { supabase } from '@/services/supabase';
import { designSystem } from '@/theme/designSystem';

interface XenditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentMethod: 'GCASH' | 'MAYA';
  orderId: string;
  amount: number;
  currency: string;
  qrString: string | null;
  checkoutUrl: string | null;
  expirationTime: string; // ISO string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  GCASH: 'GCash',
  MAYA: 'Maya',
};

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.md};
  text-align: center;
`;

const QRContainer = styled.div`
  padding: ${designSystem.spacing.md};
  background: white;
  border-radius: ${designSystem.borderRadius.md};
  border: 2px solid ${designSystem.colors.gray[200]};
`;

const OrderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.xs};
  width: 100%;
  background: ${designSystem.colors.gray[50]};
  border-radius: ${designSystem.borderRadius.md};
  padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Countdown = styled.div<{ $isExpiring: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ $isExpiring }) => ($isExpiring ? designSystem.colors.danger : designSystem.colors.primary[600])};
`;

const InstructionText = styled.p`
  font-size: 0.875rem;
  color: ${designSystem.colors.gray[600]};
  margin: 0;
`;

const XenditPaymentModal: React.FC<XenditPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  paymentMethod,
  orderId,
  amount,
  currency,
  qrString,
  checkoutUrl,
  expirationTime,
}) => {
  const label = PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod;

  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = Math.floor((new Date(expirationTime).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  // Keep a stable ref to onSuccess so the realtime handler never captures a stale closure
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset countdown when modal opens with new expiration
  useEffect(() => {
    const diff = Math.floor((new Date(expirationTime).getTime() - Date.now()) / 1000);
    setSecondsLeft(Math.max(0, diff));
  }, [expirationTime]);

  // Subscribe to Realtime updates on this order.
  // When the webhook sets payment_received = true, call onSuccess() automatically.
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const channel = supabase
      .channel(`order-payment-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if ((payload.new as { payment_received?: boolean }).payment_received) {
            onSuccessRef.current();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, orderId]);

  const isExpiring = secondsLeft > 0 && secondsLeft <= 60;
  const isExpired = secondsLeft === 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pay with ${label}`}
      initialBreakpoint={0.95}
      breakpoints={[0, 0.95, 1]}
    >
      <Container>
        {/* Show QR code — either a native QR string or the checkout URL encoded as QR */}
        {(qrString ?? checkoutUrl) ? (
          <>
            <InstructionText>
              Ask the customer to scan this QR code with their {label} app to pay.
            </InstructionText>
            <QRContainer>
              <QRCodeSVG value={(qrString ?? checkoutUrl)!} size={220} level="M" />
            </QRContainer>
          </>
        ) : (
          <InstructionText>Preparing payment link…</InstructionText>
        )}

        {/* Order details */}
        <OrderInfo>
          <InfoRow>
            <IonText color="medium">
              <small>Order ID</small>
            </IonText>
            <IonText>
              <small>{orderId}</small>
            </IonText>
          </InfoRow>
          <InfoRow>
            <IonText color="medium">
              <small>Amount</small>
            </IonText>
            <strong>
              {currency} {amount.toFixed(2)}
            </strong>
          </InfoRow>
        </OrderInfo>

        {/* Countdown timer */}
        <Countdown $isExpiring={isExpiring || isExpired}>
          <IonIcon icon={timeOutline} />
          {isExpired ? 'Expired' : formatCountdown(secondsLeft)}
        </Countdown>

        {isExpired && (
          <IonText color="danger">
            <p>This QR code has expired. Please restart the checkout process.</p>
          </IonText>
        )}

        {/* Cancel */}
        <IonButton expand="block" fill="outline" color="medium" onClick={onClose}>
          Cancel
        </IonButton>
      </Container>
    </BaseModal>
  );
};

export default XenditPaymentModal;
