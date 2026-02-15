// src/features/auth/MerchantWelcomePage.tsx
import { IonPage } from '@ionic/react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

// ─── Layout ─────────────────────────────────────────────────────────────────

const PageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  padding: 48px 48px 40px;
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
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const LogoText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.3px;
`;

const HeadlineBlock = styled.div``;

const HeadlineLine1 = styled.div`
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 800;
  color: white;
  line-height: 1.05;
  letter-spacing: -1.5px;
`;

const HeadlineLine2 = styled.div`
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 800;
  color: #d96d0a;
  line-height: 1.05;
  letter-spacing: -1.5px;
  text-decoration: underline;
  text-decoration-thickness: 4px;
  text-underline-offset: 6px;
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
  font-size: 20px;
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

const FieldLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #3f3f46;
  margin-bottom: 6px;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid #e4e4e7;
  border-radius: 10px;
  padding: 12px 14px;
  background: #fafafa;
  transition: border-color 150ms;
  margin-bottom: 20px;

  &:focus-within {
    border-color: #e8713c;
    background: white;
  }
`;

const InputIcon = styled.span`
  font-size: 16px;
  flex-shrink: 0;
  color: #a1a1aa;
`;

const StyledInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #18181b;
  width: 100%;
  font-family: inherit;

  &::placeholder {
    color: #a1a1aa;
  }
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: #ef4444;
  margin: -12px 0 16px;
`;

const CTAButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 16px;
  background: ${({ disabled }) => (disabled ? '#fed7aa' : '#e8713c')};
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background 150ms, transform 100ms;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 0.2px;
  margin-bottom: 24px;

  &:hover:not(:disabled) {
    background: #d96d0a;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
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
    icon: '⚡',
    title: 'Fast Checkout',
    desc: 'Serve customers in seconds with our optimized interface.',
  },
  {
    icon: '📦',
    title: 'Automatic Inventory',
    desc: 'Never run out of stock. Real-time tracking as you sell.',
  },
  {
    icon: '📊',
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
            <LogoIcon>🏪</LogoIcon>
            <LogoText>Tindera</LogoText>
          </LogoRow>

          <HeadlineBlock>
            <HeadlineLine1>Start Selling in</HeadlineLine1>
            <HeadlineLine2>2 Minutes</HeadlineLine2>
          </HeadlineBlock>

          <Subheadline>
            The simplest POS designed specifically for food stalls, micro-merchants, and side
            hustlers.
          </Subheadline>

          <FeatureList>
            {FEATURES.map((f) => (
              <FeatureRow key={f.title}>
                <FeatureIconBox>{f.icon}</FeatureIconBox>
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
              <InputWrapper>
                <InputIcon>🏬</InputIcon>
                <StyledInput
                  id="businessName"
                  type="text"
                  placeholder="e.g. Potato Corner SM North"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  autoComplete="organization"
                />
              </InputWrapper>

              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <InputWrapper>
                <InputIcon>✉️</InputIcon>
                <StyledInput
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </InputWrapper>

              {error && <ErrorText>{error}</ErrorText>}

              <CTAButton type="submit" disabled={!isValid}>
                Get Started →
              </CTAButton>
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
                Log in
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
