// ChargeButton - Primary CTA for completing orders

import type React from 'react';
import styled from 'styled-components';
import { Button } from '@/components/shared/base/Button';
import { PriceDisplay } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';

interface ChargeButtonProps {
	amount: number;
	currency?: string;
	disabled?: boolean;
	loading?: boolean;
	onClick?: () => void;
	className?: string;
}

// Styled ChargeButton extends the base Button component
const StyledChargeButton = styled(Button)`
	width: 100%;
	min-height: 56px;
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	margin: 0;

	// Override Ionic button styles for POS-specific sizing
	--padding-top: 16px;
	--padding-bottom: 16px;
`;

export const ChargeButton: React.FC<ChargeButtonProps> = ({
	amount,
	currency = 'USD',
	disabled = false,
	loading = false,
	onClick,
	className = '',
}) => {
	return (
		<StyledChargeButton
			variant="primary"
			size="lg"
			fullWidth={true}
			disabled={disabled || amount <= 0}
			loading={loading}
			onClick={onClick}
			className={className}
		>
			Charge <PriceDisplay amount={amount} currency={currency} />
		</StyledChargeButton>
	);
};

export default ChargeButton;
