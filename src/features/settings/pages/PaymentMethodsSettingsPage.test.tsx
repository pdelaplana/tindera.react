// src/features/settings/pages/PaymentMethodsSettingsPage.test.tsx

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaymentType } from '@/types';
import PaymentMethodsSettingsPage from './PaymentMethodsSettingsPage';

vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonList: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  IonItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  IonLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonToggle: ({
    children,
    checked,
    onIonChange,
    disabled,
  }: {
    children?: React.ReactNode;
    checked?: boolean;
    onIonChange?: (e: { detail: { checked: boolean } }) => void;
    disabled?: boolean;
  }) => (
    <input
      type="checkbox"
      checked={checked ?? false}
      disabled={disabled}
      onChange={(e) => onIonChange?.({ detail: { checked: e.target.checked } })}
      aria-label={String(children)}
    />
  ),
  IonIcon: () => null,
  IonNote: ({ children }: { children: React.ReactNode }) => <small>{children}</small>,
  IonRefresher: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonRefresherContent: () => null,
}));

vi.mock('@/components/layouts', () => ({
  BasePage: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  CenteredLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/shared/CardContainer', () => ({
  CardContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui', () => ({
  LoadingSpinner: () => <span>Loading...</span>,
}));

vi.mock('@/components/shared/base/Div', () => ({
  Div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
}));

vi.mock('@/contexts/UIContext', () => ({
  useUI: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));

vi.mock('@/hooks/useShop', () => ({
  useShop: vi.fn(),
}));

vi.mock('@/hooks/useOrder', () => ({
  useAllPaymentTypes: vi.fn(),
  useUpsertPaymentType: vi.fn(),
}));

import { useAllPaymentTypes, useUpsertPaymentType } from '@/hooks/useOrder';
import { useShop } from '@/hooks/useShop';

const mockUseShop = useShop as ReturnType<typeof vi.fn>;
const mockUseAllPaymentTypes = useAllPaymentTypes as ReturnType<typeof vi.fn>;
const mockUseUpsertPaymentType = useUpsertPaymentType as ReturnType<typeof vi.fn>;

const mockShop = { id: 'shop-1', name: 'Test Shop' };

const mockMutation = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};

function setupDefaultMocks(paymentTypes: PaymentType[] = []) {
  mockUseShop.mockReturnValue({ currentShop: mockShop });
  mockUseAllPaymentTypes.mockReturnValue({
    data: paymentTypes,
    isLoading: false,
    refetch: vi.fn(),
  });
  mockUseUpsertPaymentType.mockReturnValue(mockMutation);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PaymentMethodsSettingsPage />
    </MemoryRouter>
  );
}

describe('PaymentMethodsSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', () => {
    setupDefaultMocks();
    renderPage();
    expect(screen.getByText('Payment Methods')).toBeInTheDocument();
  });

  it('shows loading spinner while data is loading', () => {
    mockUseShop.mockReturnValue({ currentShop: mockShop });
    mockUseAllPaymentTypes.mockReturnValue({ data: undefined, isLoading: true, refetch: vi.fn() });
    mockUseUpsertPaymentType.mockReturnValue(mockMutation);
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders Cash, GCash, and Maya toggle items', () => {
    setupDefaultMocks([
      { id: '1', code: 'CASH', description: 'Cash', is_active: true, shop_id: 'shop-1' },
      { id: '2', code: 'GCASH', description: 'GCash', is_active: false, shop_id: 'shop-1' },
      { id: '3', code: 'MAYA', description: 'Maya', is_active: false, shop_id: 'shop-1' },
    ]);
    renderPage();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('GCash')).toBeInTheDocument();
    expect(screen.getByText('Maya')).toBeInTheDocument();
  });

  it('shows Cash as enabled by default when no records exist', () => {
    setupDefaultMocks([]);
    renderPage();
    const cashToggle = screen.getByRole('checkbox', { name: 'Cash' });
    expect(cashToggle).toBeChecked();
  });

  it('shows GCash and Maya as disabled by default when no records exist', () => {
    setupDefaultMocks([]);
    renderPage();
    const gcashToggle = screen.getByRole('checkbox', { name: 'GCash' });
    const mayaToggle = screen.getByRole('checkbox', { name: 'Maya' });
    expect(gcashToggle).not.toBeChecked();
    expect(mayaToggle).not.toBeChecked();
  });

  it('reflects is_active from database records', () => {
    setupDefaultMocks([
      { id: '1', code: 'CASH', description: 'Cash', is_active: false, shop_id: 'shop-1' },
      { id: '2', code: 'GCASH', description: 'GCash', is_active: true, shop_id: 'shop-1' },
    ]);
    renderPage();
    const cashToggle = screen.getByRole('checkbox', { name: 'Cash' });
    const gcashToggle = screen.getByRole('checkbox', { name: 'GCash' });
    expect(cashToggle).not.toBeChecked();
    expect(gcashToggle).toBeChecked();
  });

  it('calls upsertPaymentType when a toggle is changed', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseShop.mockReturnValue({ currentShop: mockShop });
    mockUseAllPaymentTypes.mockReturnValue({
      data: [{ id: '2', code: 'GCASH', description: 'GCash', is_active: false, shop_id: 'shop-1' }],
      isLoading: false,
      refetch: vi.fn(),
    });
    mockUseUpsertPaymentType.mockReturnValue({ mutateAsync, isPending: false });

    renderPage();
    const gcashToggle = screen.getByRole('checkbox', { name: /GCash/i });
    fireEvent.click(gcashToggle);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        code: 'GCASH',
        isActive: true,
        description: 'GCash',
      });
    });
  });

  it('renders empty state when no shop is selected', () => {
    mockUseShop.mockReturnValue({ currentShop: null });
    mockUseAllPaymentTypes.mockReturnValue({ data: undefined, isLoading: false, refetch: vi.fn() });
    mockUseUpsertPaymentType.mockReturnValue(mockMutation);
    renderPage();
    expect(screen.getByText('No Shop Selected')).toBeInTheDocument();
  });
});
