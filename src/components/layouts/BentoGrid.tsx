// BentoGrid - Dashboard tile grid layout

import type React from 'react';

interface BentoGridProps {
	children: React.ReactNode;
	className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
	return <div className={`bento-grid ${className}`.trim()}>{children}</div>;
};

export default BentoGrid;
