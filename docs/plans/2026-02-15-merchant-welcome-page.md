# Merchant Welcome & Signup Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a high-impact dual-section `/welcome` page that pairs an orange marketing pitch with a minimal Business Name + Email form, then redirects to `/signup` with those values pre-filled.

**Architecture:** New `MerchantWelcomePage.tsx` under `src/features/auth/`. Uses styled-components for the full split-screen layout inside an `<IonPage>` wrapper. On submit, stores values in sessionStorage and redirects to `/signup?email=...&name=...` for full account creation. Existing `/signup` is updated to read those query params and pre-fill its fields.

**Tech Stack:** React 18, Ionic 7 (`IonPage` only), styled-components 6, React Router (v5 via Ionic), TypeScript, Vitest + React Testing Library.

---

### Task 1: Write a failing test for MerchantWelcomePage render

**Files:**
- Create: `src/features/auth/__tests__/MerchantWelcomePage.test.tsx`

**Step 1: Create the test file**

```tsx
// src/features/auth/__tests__/MerchantWelcomePage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import MerchantWelcomePage from '../MerchantWelcomePage';

// Minimal Ionic mock — IonPage is just a div wrapper for routing
vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MerchantWelcomePage />
    </MemoryRouter>
  );
}

describe('MerchantWelcomePage', () => {
  it('renders the marketing headline', () => {
    renderPage();
    expect(screen.getByText(/Start Selling in/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Minutes/i)).toBeInTheDocument();
  });

  it('renders the three feature items', () => {
    renderPage();
    expect(screen.getByText('Fast Checkout')).toBeInTheDocument();
    expect(screen.getByText('Automatic Inventory')).toBeInTheDocument();
    expect(screen.getByText('Instant Reports')).toBeInTheDocument();
  });

  it('renders the signup form with Business Name and Email fields', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/Potato Corner/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
  });

  it('renders the Create Account heading and merchant count', () => {
    renderPage();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText(/5,000\+/i)).toBeInTheDocument();
  });

  it('Get Started button is disabled when fields are empty', () => {
    renderPage();
    const button = screen.getByRole('button', { name: /Get Started/i });
    expect(button).toBeDisabled();
  });
});
```

**Step 2: Run the test to verify it fails**

```bash
npx vitest run src/features/auth/__tests__/MerchantWelcomePage.test.tsx
```

Expected: FAIL — "Cannot find module '../MerchantWelcomePage'"

---

### Task 2: Create MerchantWelcomePage component

**Files:**
- Create: `src/features/auth/MerchantWelcomePage.tsx`

**Step 1: Write the full component**

```tsx
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

    if (!email.includes('@')) {
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
```

**Step 2: Run the tests**

```bash
npx vitest run src/features/auth/__tests__/MerchantWelcomePage.test.tsx
```

Expected: All 5 tests PASS.

**Step 3: Commit**

```bash
git add src/features/auth/MerchantWelcomePage.tsx src/features/auth/__tests__/MerchantWelcomePage.test.tsx
git commit -m "feat: add MerchantWelcomePage component with split-screen layout"
```

---

### Task 3: Update SignupPage to read prefill query params

**Files:**
- Modify: `src/features/auth/SignupPage.tsx` (lines 17–27)

**Step 1: Write a failing test for the prefill behaviour**

Add to `src/features/auth/__tests__/SignupPage.prefill.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonButton: ({ children, ...p }: React.ComponentPropsWithoutRef<'button'>) => <button {...p}>{children}</button>,
  IonInput: ({ label, value, onIonInput }: { label: string; value: string; onIonInput: (e: { detail: { value: string } }) => void }) => (
    <input aria-label={label} value={value} onChange={(e) => onIonInput({ detail: { value: e.target.value } })} readOnly={false} />
  ),
  IonSpinner: () => <span>loading</span>,
  IonText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  IonIcon: () => null,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

import SignupPage from '../SignupPage';

describe('SignupPage prefill from query params', () => {
  it('pre-fills Display Name from ?name= query param', () => {
    render(
      <MemoryRouter initialEntries={['/signup?name=My+Bakery&email=owner%40example.com']}>
        <Route path="/signup">
          <SignupPage />
        </Route>
      </MemoryRouter>
    );
    const nameInput = screen.getByDisplayValue('My Bakery');
    expect(nameInput).toBeInTheDocument();
  });

  it('pre-fills Email from ?email= query param', () => {
    render(
      <MemoryRouter initialEntries={['/signup?name=My+Bakery&email=owner%40example.com']}>
        <Route path="/signup">
          <SignupPage />
        </Route>
      </MemoryRouter>
    );
    const emailInput = screen.getByDisplayValue('owner@example.com');
    expect(emailInput).toBeInTheDocument();
  });
});
```

**Step 2: Run to verify it fails**

```bash
npx vitest run src/features/auth/__tests__/SignupPage.prefill.test.tsx
```

Expected: FAIL — inputs show empty values.

**Step 3: Add query param prefill to SignupPage.tsx**

Find the existing state initialization at the top of the `SignupPage` component and add `useLocation` + initialization:

```tsx
// Add this import at the top (alongside existing imports):
import { useHistory, useLocation } from 'react-router-dom';

// Replace the existing SignupPage function opening:
const SignupPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { signUp, signInWithGoogle, isAuthenticated, isLoading } = useAuth();

  // Read prefill values from query params (sent by MerchantWelcomePage)
  const searchParams = new URLSearchParams(location.search);
  const prefillName = searchParams.get('name') ?? '';
  const prefillEmail = searchParams.get('email') ?? '';

  const [displayName, setDisplayName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  // ... rest of useState lines unchanged
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/features/auth/__tests__/SignupPage.prefill.test.tsx
```

Expected: All 2 tests PASS.

**Step 5: Commit**

```bash
git add src/features/auth/SignupPage.tsx src/features/auth/__tests__/SignupPage.prefill.test.tsx
git commit -m "feat: prefill SignupPage fields from query params sent by welcome page"
```

---

### Task 4: Register /welcome route in App.tsx

**Files:**
- Modify: `src/App.tsx` (after the `/signup` route, around line 72)

**Step 1: Add the import**

Add to the imports block (after existing auth imports):

```tsx
import MerchantWelcomePage from '@/features/auth/MerchantWelcomePage';
```

**Step 2: Add the route**

Inside the `<Switch>`, after the `/signup` route:

```tsx
<Route exact path="/welcome">
  <MerchantWelcomePage />
</Route>
```

**Step 3: Run the full test suite to ensure nothing is broken**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: register /welcome route for MerchantWelcomePage"
```

---

### Task 5: Manual browser verification with Playwright

**Step 1: Start the dev server**

```bash
npm run dev
```

**Step 2: Open the welcome page**

Navigate to: `http://localhost:5173/welcome`

Verify visually:
- [ ] Orange left panel fills left half of screen
- [ ] "Start Selling in" on white, "2 Minutes" in dark orange with underline
- [ ] All 3 feature rows render with icon + title + description
- [ ] Placeholder photo block with testimonial text at bottom of left panel
- [ ] White card with "Create Account" and form on right panel
- [ ] "Get Started →" button is greyed out (disabled) when fields empty
- [ ] Typing in both fields enables the button

**Step 3: Test form submission flow**

- Fill "My Food Stall" in Business Name
- Fill "test@example.com" in Email
- Click "Get Started →"
- Verify redirect to `/signup?name=My+Food+Stall&email=test%40example.com`
- Verify Display Name and Email fields on SignupPage are pre-filled

**Step 4: Test invalid email**

- Fill business name, fill "notanemail"
- Click Get Started
- Verify inline error: "Please enter a valid email address."

**Step 5: Test Log in link**

- Click "Log in"
- Verify redirect to `/signin`

**Step 6: Test mobile layout (resize to 375px width)**

- Verify form card appears ABOVE the orange marketing panel
- Verify both sections stack in a single column
- Verify no horizontal overflow

---

### Task 6: Final checks and cleanup

**Step 1: TypeScript strict check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

**Step 2: Lint**

```bash
npx eslint src/features/auth/MerchantWelcomePage.tsx src/features/auth/SignupPage.tsx
```

Expected: 0 errors, 0 warnings.

**Step 3: Full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 4: Final commit if any cleanup fixes were made**

```bash
git add -p
git commit -m "chore: fix lint/ts issues in merchant welcome page"
```
