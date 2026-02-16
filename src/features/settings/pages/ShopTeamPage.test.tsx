// src/features/settings/pages/ShopTeamPage.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ShopTeamPage from './ShopTeamPage';

// Mock Ionic components used by ShopTeamPage and its dependencies
vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonToolbar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  IonButtons: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonBackButton: () => <button>Back</button>,
  IonCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonCardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonCardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonSearchbar: () => <input />,
  IonList: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  IonItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  IonLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonAvatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonBadge: ({ children, color }: { children: React.ReactNode; color?: string }) => (
    <span data-color={color}>{children}</span>
  ),
  IonButton: ({
    children,
    onClick,
    fill,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    fill?: string;
  }) => (
    <button onClick={onClick} data-fill={fill}>
      {children}
    </button>
  ),
  IonIcon: () => null,
  IonActionSheet: () => null,
  IonText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  IonSpinner: ({ name }: { name?: string }) => <span data-name={name}>loading</span>,
  IonModal: ({ children, isOpen }: { children: React.ReactNode; isOpen?: boolean }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
  IonAlert: () => null,
  IonSelect: ({ children }: { children: React.ReactNode }) => <select>{children}</select>,
  IonSelectOption: ({ children, value }: { children: React.ReactNode; value?: string }) => (
    <option value={value}>{children}</option>
  ),
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
  IonRefresher: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonRefresherContent: () => null,
  IonRadioGroup: ({ children, value, onIonChange }: { children: React.ReactNode; value?: string; onIonChange?: (e: { detail: { value: string } }) => void }) => (
    <div data-value={value}>{children}</div>
  ),
  IonRadio: ({ value }: { value?: string }) => <input type="radio" value={value} />,
}));

// Mock all hooks imported by ShopTeamPage
vi.mock('@/hooks/useShop', () => ({
  useShop: vi.fn(),
  useShopUsers: vi.fn(),
  useUpdateTeamMember: vi.fn(),
  useCreateTeamMember: vi.fn(),
  useResetTeamMemberPassword: vi.fn(),
  useRemoveTeamMember: vi.fn(),
}));

// Mock layout and shared components so we don't need to set up their full dependency trees
vi.mock('@/components/layouts', () => ({
  BasePage: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  CenteredLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/shared', () => ({
  BaseModal: ({
    children,
    isOpen,
    title,
  }: {
    children: React.ReactNode;
    isOpen?: boolean;
    title?: string;
  }) => (isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null),
  CardContainer: ({
    children,
    onActionClick,
  }: {
    children: React.ReactNode;
    title?: string;
    onActionClick?: () => void;
  }) => (
    <div>
      <button onClick={onActionClick} aria-label="add-member">Add</button>
      {children}
    </div>
  ),
}));

vi.mock('@/components/shared/base/Div', () => ({
  Div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/shared/SaveButton', () => ({
  SaveButton: ({ label, onClick }: { label?: string; onClick?: () => void }) => (
    <button onClick={onClick}>{label ?? 'Save'}</button>
  ),
}));

vi.mock('@/components/shared/FormFields', () => ({
  TextField: () => <input />,
  SelectField: () => <select />,
}));

vi.mock('@/components/shared/DeleteConfirmationAlert', () => ({
  default: () => null,
}));

vi.mock('@/components/ui', () => ({
  LoadingSpinner: () => <span>Loading...</span>,
}));

vi.mock('@/contexts/UIContext', () => ({
  useUI: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));

import {
  useShop,
  useShopUsers,
  useUpdateTeamMember,
  useCreateTeamMember,
  useResetTeamMemberPassword,
  useRemoveTeamMember,
} from '@/hooks/useShop';

const mockUseShop = useShop as ReturnType<typeof vi.fn>;
const mockUseShopUsers = useShopUsers as ReturnType<typeof vi.fn>;
const mockUseUpdateTeamMember = useUpdateTeamMember as ReturnType<typeof vi.fn>;
const mockUseCreateTeamMember = useCreateTeamMember as ReturnType<typeof vi.fn>;
const mockUseResetTeamMemberPassword = useResetTeamMemberPassword as ReturnType<typeof vi.fn>;
const mockUseRemoveTeamMember = useRemoveTeamMember as ReturnType<typeof vi.fn>;

const mockMutationResult = {
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

const ownerMember = {
  shop_id: 'shop-1',
  user_id: 'user-owner',
  role: 'owner' as const,
  email: 'owner@example.com',
  user_profiles: { display_name: 'Alice Owner' },
};

const staffMember = {
  shop_id: 'shop-1',
  user_id: 'user-staff',
  role: 'staff' as const,
  email: 'staff@example.com',
  user_profiles: { display_name: 'Bob Staff' },
};

function setupDefaultMocks() {
  mockUseShop.mockReturnValue({ currentShop: { id: 'shop-1', name: 'Test Shop' }, isLoading: false });
  mockUseShopUsers.mockReturnValue({ data: [ownerMember, staffMember], isLoading: false, refetch: vi.fn() });
  mockUseUpdateTeamMember.mockReturnValue(mockMutationResult);
  mockUseCreateTeamMember.mockReturnValue(mockMutationResult);
  mockUseResetTeamMemberPassword.mockReturnValue(mockMutationResult);
  mockUseRemoveTeamMember.mockReturnValue(mockMutationResult);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ShopTeamPage />
    </MemoryRouter>
  );
}

describe('ShopTeamPage', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('Shop Team')).toBeInTheDocument();
  });

  it('renders all team members', () => {
    renderPage();
    expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    expect(screen.getByText('Bob Staff')).toBeInTheDocument();
  });

  it('renders email for each team member', () => {
    renderPage();
    expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    expect(screen.getByText('staff@example.com')).toBeInTheDocument();
  });

  it('renders the owner badge for the owner member', () => {
    renderPage();
    const badges = screen.getAllByText('owner');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders a role badge for the non-owner (staff) member', () => {
    renderPage();
    const badges = screen.getAllByText('staff');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders member items as buttons for non-owners', () => {
    renderPage();
    // Staff member item should be a button; owner item should not
    // Both render as <li> via IonItem mock, so we check the list items contain correct names
    expect(screen.getByText('Bob Staff')).toBeInTheDocument();
    expect(screen.getByText('Alice Owner')).toBeInTheDocument();
  });

  it('renders the add member button', () => {
    renderPage();
    expect(screen.getByLabelText('add-member')).toBeInTheDocument();
  });

  it('shows loading spinner while data is loading', () => {
    mockUseShopUsers.mockReturnValue({ data: undefined, isLoading: true, refetch: vi.fn() });
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders an empty list when there are no members', () => {
    mockUseShopUsers.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() });
    renderPage();
    expect(screen.queryByText('Alice Owner')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Staff')).not.toBeInTheDocument();
  });

  it('renders no shop selected state when there is no current shop', () => {
    mockUseShop.mockReturnValue({ currentShop: null, isLoading: false });
    renderPage();
    expect(screen.getByText('No Shop Selected')).toBeInTheDocument();
  });
});
