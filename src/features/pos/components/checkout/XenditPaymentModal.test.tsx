// XenditPaymentModal tests
import { act, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import XenditPaymentModal from './XenditPaymentModal';

// Mock supabase polling — use vi.hoisted so variables are available in the hoisted vi.mock factory
const { mockSingle, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({ data: { payment_received: false } });
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return { mockSingle, mockFrom };
});

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: mockFrom,
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

describe('XenditPaymentModal - Polling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSingle.mockResolvedValue({ data: { payment_received: false } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls the order when modal is open', async () => {
    render(<XenditPaymentModal {...baseProps} />);
    await vi.advanceTimersByTimeAsync(3000);
    expect(mockFrom).toHaveBeenCalledWith('orders');
  });

  it('does not poll when modal is closed', async () => {
    render(<XenditPaymentModal {...baseProps} isOpen={false} />);
    await vi.advanceTimersByTimeAsync(3000);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('calls onSuccess when payment_received becomes true', async () => {
    const onSuccess = vi.fn();
    mockSingle.mockResolvedValueOnce({ data: { payment_received: true } });
    render(<XenditPaymentModal {...baseProps} onSuccess={onSuccess} />);
    await vi.advanceTimersByTimeAsync(3000);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('does not call onSuccess when payment_received is false', async () => {
    const onSuccess = vi.fn();
    render(<XenditPaymentModal {...baseProps} onSuccess={onSuccess} />);
    await vi.advanceTimersByTimeAsync(3000);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('stops polling when modal unmounts', async () => {
    const { unmount } = render(<XenditPaymentModal {...baseProps} />);
    unmount();
    vi.clearAllMocks();
    await vi.advanceTimersByTimeAsync(3000);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
