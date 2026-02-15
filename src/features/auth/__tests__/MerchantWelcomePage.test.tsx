// src/features/auth/__tests__/MerchantWelcomePage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import MerchantWelcomePage from '../MerchantWelcomePage';

// Ionic mock — include all components used by MerchantWelcomePage
vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonInput: ({
    placeholder,
    value,
    onIonInput,
    id,
  }: {
    placeholder?: string;
    value?: string;
    onIonInput?: (e: { detail: { value: string } }) => void;
    id?: string;
  }) => (
    <input
      id={id}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
    />
  ),
  IonButton: ({
    children,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    type?: 'submit' | 'button' | 'reset';
  }) => (
    <button type={type} disabled={disabled}>
      {children}
    </button>
  ),
  IonText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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
