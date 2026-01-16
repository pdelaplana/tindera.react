// LoadingSpinner - Centered loading spinner component

import { IonSpinner } from '@ionic/react';
import type React from 'react';
import { Div } from '@/components/shared/base/Div';

interface LoadingSpinnerProps {
	/** Additional className to apply */
	className?: string;
	/** Custom padding (defaults to '48px') */
	padding?: string;
}

/**
 * A centered loading spinner with consistent styling.
 *
 * @example
 * <LoadingSpinner />
 * <LoadingSpinner padding="24px" />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, padding = '48px' }) => {
	return (
		<Div className={`ion-text-center ${className || ''}`} style={{ padding }}>
			<IonSpinner />
		</Div>
	);
};

export default LoadingSpinner;
