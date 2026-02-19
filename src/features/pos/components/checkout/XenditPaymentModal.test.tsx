// XenditPaymentModal tests
import { act, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import XenditPaymentModal from './XenditPaymentModal';

// Mock supabase realtime — use vi.hoisted so variables are available in the hoisted vi.mock factory
const { mockChannel, mockRemoveChannel, mockOn, mockSubscribe } = vi.hoisted(() => {
  const mockSubscribe = vi.fn().mockReturnValue({});
  const mockOn = vi.fn().mockImplementation(() => ({ subscribe: mockSubscribe }));
  const mockChannel = vi.fn().mockReturnValue({ on: mockOn });
  const mockRemoveChannel = vi.fn();
  return { mockChannel, mockRemoveChannel, mockOn, mockSubscribe };
});

vi.mock('@/services/supabase', () => ({
  supabase: {
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

vi.mock('@ionic/react', () => ({
  IonButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  IonIcon: () => null,
  IonText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qr-code" data-value={value} />,
}));

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  paymentMethod: 'GCASH' as const,
  orderId: 'order-123',
  amount: 150.0,
  currency: 'PHP',
  qrString: 'GCASH_QR_STRING_DATA',
  checkoutUrl: null,
  expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
};

describe('XenditPaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders when isOpen is true', () => {
    render(<XenditPaymentModal {...baseProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<XenditPaymentModal {...baseProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays the payment method name in title', () => {
    render(<XenditPaymentModal {...baseProps} paymentMethod="GCASH" />);
    expect(screen.getByRole('dialog', { name: /GCash/i })).toBeInTheDocument();
  });

  it('displays order ID', () => {
    render(<XenditPaymentModal {...baseProps} />);
    expect(screen.getByText(/order-123/i)).toBeInTheDocument();
  });

  it('displays formatted amount', () => {
    render(<XenditPaymentModal {...baseProps} amount={150} currency="PHP" />);
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('renders QR code when qrString is provided', () => {
    render(<XenditPaymentModal {...baseProps} qrString="GCASH_QR_STRING" />);
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code')).toHaveAttribute('data-value', 'GCASH_QR_STRING');
  });

  it('renders QR code from checkoutUrl when qrString is null', () => {
    render(
      <XenditPaymentModal
        {...baseProps}
        qrString={null}
        checkoutUrl="https://checkout.xendit.co/pay/123"
      />
    );
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code')).toHaveAttribute(
      'data-value',
      'https://checkout.xendit.co/pay/123'
    );
  });

  it('prefers qrString over checkoutUrl for QR code value', () => {
    render(
      <XenditPaymentModal
        {...baseProps}
        qrString="NATIVE_QR_STRING"
        checkoutUrl="https://checkout.xendit.co/pay/123"
      />
    );
    expect(screen.getByTestId('qr-code')).toHaveAttribute('data-value', 'NATIVE_QR_STRING');
  });

  it('shows scan instruction when QR code is displayed', () => {
    render(<XenditPaymentModal {...baseProps} qrString={null} checkoutUrl="https://xendit.co" />);
    expect(screen.getByText(/scan this qr code/i)).toBeInTheDocument();
  });

  it('shows a countdown timer', () => {
    render(<XenditPaymentModal {...baseProps} />);
    // Should show minutes:seconds format
    expect(screen.getByText(/\d+:\d{2}/)).toBeInTheDocument();
  });

  it('countdown decreases over time', () => {
    render(<XenditPaymentModal {...baseProps} />);
    const initial = screen.getByText(/\d+:\d{2}/).textContent;
    act(() => {
      vi.advanceTimersByTime(60000); // advance 1 minute
    });
    const after = screen.getByText(/\d+:\d{2}/).textContent;
    expect(after).not.toBe(initial);
  });

  it('shows cancel button', () => {
    render(<XenditPaymentModal {...baseProps} />);
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<XenditPaymentModal {...baseProps} onClose={onClose} />);
    screen.getByText(/cancel/i).click();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows Maya label for MAYA payment method', () => {
    render(<XenditPaymentModal {...baseProps} paymentMethod="MAYA" />);
    expect(screen.getByRole('dialog', { name: /Maya/i })).toBeInTheDocument();
  });
});

describe('XenditPaymentModal - test mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('does not show copy button when testMode is false', () => {
    render(
      <XenditPaymentModal
        {...baseProps}
        testMode={false}
        checkoutUrl="https://checkout.xendit.co/pay/123"
      />
    );
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });

  it('does not show copy button when testMode is true but checkoutUrl is null', () => {
    render(
      <XenditPaymentModal {...baseProps} testMode={true} checkoutUrl={null} qrString={null} />
    );
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });

  it('shows copy button when testMode is true and checkoutUrl is present', () => {
    render(
      <XenditPaymentModal
        {...baseProps}
        testMode={true}
        checkoutUrl="https://checkout.xendit.co/pay/123"
      />
    );
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('copies checkoutUrl to clipboard when copy button is clicked', async () => {
    const url = 'https://checkout.xendit.co/pay/123';
    render(<XenditPaymentModal {...baseProps} testMode={true} checkoutUrl={url} />);
    screen.getByRole('button', { name: /copy/i }).click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url);
  });
});

describe('XenditPaymentModal - Realtime subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to order updates when modal is open', () => {
    render(<XenditPaymentModal {...baseProps} />);
    expect(mockChannel).toHaveBeenCalledWith(`order-payment-${baseProps.orderId}`);
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${baseProps.orderId}`,
      }),
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('does not subscribe when modal is closed', () => {
    render(<XenditPaymentModal {...baseProps} isOpen={false} />);
    expect(mockChannel).not.toHaveBeenCalled();
  });

  it('calls onSuccess when payment_received becomes true via realtime', () => {
    const onSuccess = vi.fn();
    render(<XenditPaymentModal {...baseProps} onSuccess={onSuccess} />);

    // Get the postgres_changes callback registered via .on()
    const realtimeCallback = mockOn.mock.calls[0][2] as (payload: {
      new: Record<string, unknown>;
    }) => void;

    act(() => {
      realtimeCallback({ new: { payment_received: true } });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('does not call onSuccess when payment_received is false', () => {
    const onSuccess = vi.fn();
    render(<XenditPaymentModal {...baseProps} onSuccess={onSuccess} />);

    const realtimeCallback = mockOn.mock.calls[0][2] as (payload: {
      new: Record<string, unknown>;
    }) => void;

    act(() => {
      realtimeCallback({ new: { payment_received: false } });
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('removes the channel when modal unmounts', () => {
    const { unmount } = render(<XenditPaymentModal {...baseProps} />);
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
