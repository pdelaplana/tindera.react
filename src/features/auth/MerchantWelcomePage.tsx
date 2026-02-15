// src/features/auth/MerchantWelcomePage.tsx
import AppLogo from '@/components/shared/AppLogo';
import { FieldLabel } from '@/components/shared/FieldLabel';
import { IonButton, IonIcon, IonInput, IonPage, IonText } from '@ionic/react';
import { archive, barChart, flash } from 'ionicons/icons';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

// ─── Layout ─────────────────────────────────────────────────────────────────

const PageGrid = styled.div`
  display: grid;
  grid-template-columns: 3fr 2fr;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
`;

// ─── Left Panel ─────────────────────────────────────────────────────────────

const LeftPanel = styled.div`
  background-color: #e8713c;
  padding: 64px 108px ;
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow: hidden;
  position: relative;

  @media (max-width: 767px) {
    order: 2;
    padding: 40px 24px;
    gap: 24px;
  }
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding: 5px;
  background: white;
`;

const LogoText = styled.span`
  font-size: 32px;
  font-weight: 800;
  color: white;
  letter-spacing: -1.5px;
`;

const HeadlineBlock = styled.div``;

const HeadlineLine1 = styled.div`
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 800;
  color: white;
  line-height: 1.05;
  letter-spacing: -1.5px;
`;


const Subheadline = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0;
  max-width: 400px;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FeatureRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const FeatureIconBox = styled.div`
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FeatureTextBlock = styled.div``;

const FeatureTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: white;
  margin-bottom: 2px;
`;

const FeatureDesc = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
`;

const PhotoBlock = styled.div`
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #c25e28 0%, #a84d1e 50%, #7c3510 100%);
  min-height: 180px;
  display: flex;
  align-items: flex-end;
`;

const PhotoOverlay = styled.div`
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 60%);
  width: 100%;
  padding: 20px 20px 16px;
`;

const TestimonialText = styled.p`
  font-size: 13px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.5;
`;

// ─── Right Panel ─────────────────────────────────────────────────────────────

const RightPanel = styled.div`
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;

  @media (max-width: 767px) {
    order: 1;
    padding: 40px 24px 32px;
  }
`;

const SignupCard = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px 36px 32px;
  width: 100%;
  max-width: 400px;

  @media (max-width: 480px) {
    padding: 32px 24px 24px;
    border-radius: 16px;
  }
`;

const CardHeading = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #18181b;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
`;

const CardSubtext = styled.p`
  font-size: 14px;
  color: #71717a;
  margin: 0 0 28px;
`;


const AlreadyHaveAccount = styled.p`
  text-align: center;
  font-size: 14px;
  color: #71717a;
  margin: 0 0 24px;
`;

const LoginLink = styled.a`
  color: #e8713c;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const TrustBadge = styled.div`
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #a1a1aa;
  text-transform: uppercase;
  padding-top: 16px;
  border-top: 1px solid #f4f4f5;
`;

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: flash,
    title: 'Fast Checkout',
    desc: 'Serve customers in seconds with our optimized interface.',
  },
  {
    icon: archive,
    title: 'Automatic Inventory',
    desc: 'Never run out of stock. Real-time tracking as you sell.',
  },
  {
    icon: barChart,
    title: 'Instant Reports',
    desc: 'Track your daily sales anywhere. No more manual logs.',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

const MerchantWelcomePage: React.FC = () => {
  const history = useHistory();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isValid = businessName.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    // Pre-fill the full signup page with collected values
    const params = new URLSearchParams({
      email: email.trim(),
      name: businessName.trim(),
    });
    history.push(`/signup?${params.toString()}`);
  };

  return (
    <IonPage>
      <PageGrid>
        {/* ── Left: Marketing Pitch ── */}
        <LeftPanel>
          <LogoRow>
            <LogoIcon><AppLogo /></LogoIcon>
            <LogoText>Tindera POS</LogoText>
          </LogoRow>

          <HeadlineBlock>
            <HeadlineLine1>Start Selling in 2 Minutes</HeadlineLine1>
            
          </HeadlineBlock>

          <Subheadline>
            The simplest POS designed specifically for food stalls, micro-merchants, and side
            hustlers.
          </Subheadline>

          <FeatureList>
            {FEATURES.map((f) => (
              <FeatureRow key={f.title}>
                <FeatureIconBox>
                  <IonIcon icon={f.icon} style={{ fontSize: '22px', color: 'white' }} />
                </FeatureIconBox>
                <FeatureTextBlock>
                  <FeatureTitle>{f.title}</FeatureTitle>
                  <FeatureDesc>{f.desc}</FeatureDesc>
                </FeatureTextBlock>
              </FeatureRow>
            ))}
          </FeatureList>

          <PhotoBlock>
            <PhotoOverlay>
              <TestimonialText>
                "I saved 3 hours a day on inventory with Tindera." — Maria, Food Stall Owner
              </TestimonialText>
            </PhotoOverlay>
          </PhotoBlock>
        </LeftPanel>

        {/* ── Right: Signup Card ── */}
        <RightPanel>
          <SignupCard>
            <CardHeading>Create Account</CardHeading>
            <CardSubtext>Join 5,000+ happy merchants today.</CardSubtext>

            <form onSubmit={handleSubmit} noValidate>
              <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
              <IonInput
                id="businessName"
                fill="outline"
                type="text"
                placeholder="e.g. Potato Corner SM North"
                value={businessName}
                onIonInput={(e) => setBusinessName(e.detail.value || '')}
                autocomplete="organization"
                style={{ marginBottom: 'var(--space-md)' }}
              />

              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <IonInput
                id="email"
                fill="outline"
                type="email"
                placeholder="you@example.com"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value || '')}
                autocomplete="email"
                style={{ marginBottom: 'var(--space-md)' }}
              />

              {error && (
                <IonText color="danger">
                  <p style={{ fontSize: '13px', margin: '0 0 12px' }}>{error}</p>
                </IonText>
              )}

              <IonButton
                type="submit"
                expand="block"
                disabled={!isValid}
                style={{ marginBottom: 'var(--space-md)', '--border-radius': '10px' }}
              >
                Get Started →
              </IonButton>
            </form>

            <AlreadyHaveAccount>
              Already have an account?{' '}
              <LoginLink
                onClick={(e) => {
                  e.preventDefault();
                  history.push('/signin');
                }}
                href="/signin"
              >
                Sign in
              </LoginLink>
            </AlreadyHaveAccount>

            <TrustBadge>🔒 Secure Cloud POS</TrustBadge>
          </SignupCard>
        </RightPanel>
      </PageGrid>
    </IonPage>
  );
};

export default MerchantWelcomePage;
