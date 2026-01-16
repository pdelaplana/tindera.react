// Chip - Category filter chips/pills

import type React from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

interface ChipProps {
	label: string;
	active?: boolean;
	onClick?: () => void;
	className?: string;
}

const StyledChip = styled.button<{ $active: boolean }>`
	padding: ${designSystem.spacing.sm} ${designSystem.spacing.lg};
	border-radius: ${designSystem.borderRadius.full};
	font-size: ${designSystem.typography.fontSize.sm};
	font-weight: ${designSystem.typography.fontWeight.medium};
	border: 1px solid ${designSystem.colors.gray[200]};
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;
	user-select: none;

	${(props) =>
		props.$active
			? `
		background: ${designSystem.colors.brand.primary};
		color: ${designSystem.colors.text.inverse};
		border-color: ${designSystem.colors.brand.primary};
	`
			: `
		background: ${designSystem.colors.surface.elevated};
		color: ${designSystem.colors.text.primary};
		border-color: ${designSystem.colors.gray[200]};

		&:hover {
			background: ${designSystem.colors.gray[50]};
			border-color: ${designSystem.colors.gray[300]};
		}
	`}

	&:active {
		transform: scale(0.98);
	}
`;

export const Chip: React.FC<ChipProps> = ({ label, active = false, onClick, className = '' }) => {
	return (
		<StyledChip type="button" $active={active} onClick={onClick} className={className}>
			{label}
		</StyledChip>
	);
};

export default Chip;
