// StatusBadge - Colored badge for status indicators

import type React from 'react';

export type StatusType = 'paid' | 'unpaid' | 'pending' | 'in-stock' | 'low-stock' | 'out-of-stock';

interface StatusBadgeProps {
	status: StatusType;
	children?: React.ReactNode;
	className?: string;
}

const statusLabels: Record<StatusType, string> = {
	paid: 'Paid',
	unpaid: 'Unpaid',
	pending: 'Pending',
	'in-stock': 'In Stock',
	'low-stock': 'Low Stock',
	'out-of-stock': 'Out of Stock',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className = '' }) => {
	const statusClass = `status-${status}`;

	return (
		<span className={`status-badge ${statusClass} ${className}`.trim()}>
			{children || statusLabels[status]}
		</span>
	);
};

export default StatusBadge;
