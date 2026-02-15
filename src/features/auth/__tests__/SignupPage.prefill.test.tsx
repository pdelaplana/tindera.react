import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonButton: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  IonInput: ({ label, value, onIonInput }: { label: string; value: string; onIonInput: (e: { detail: { value: string } }) => void }) => (
    <input aria-label={label} value={value} onChange={(e) => onIonInput({ detail: { value: e.target.value } })} />
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
    expect(screen.getByDisplayValue('My Bakery')).toBeInTheDocument();
  });

  it('pre-fills Email from ?email= query param', () => {
    render(
      <MemoryRouter initialEntries={['/signup?name=My+Bakery&email=owner%40example.com']}>
        <Route path="/signup">
          <SignupPage />
        </Route>
      </MemoryRouter>
    );
    expect(screen.getByDisplayValue('owner@example.com')).toBeInTheDocument();
  });
});
