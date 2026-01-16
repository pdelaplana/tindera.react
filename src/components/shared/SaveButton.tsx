// SaveButton Component - Reusable button with loading state

import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { save } from 'ionicons/icons';
import type React from 'react';

interface SaveButtonProps {
	/** Whether the button is currently saving/loading */
	isSaving: boolean;
	/** Whether the button should be disabled */
	disabled?: boolean;
	/** Text to display when not saving */
	label?: string;
	/** Text to display when saving */
	savingLabel?: string;
	/** Button expand mode */
	expand?: 'block' | 'full';
	/** Button size */
	size?: 'small' | 'default' | 'large';
	/** Button type */
	type?: 'button' | 'submit' | 'reset';
	/** Click handler */
	onClick?: () => void;
	/** Custom icon (defaults to save icon) */
	icon?: string;
	/** Whether to show only icon (no text) */
	iconOnly?: boolean;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
	isSaving,
	disabled = false,
	label = 'Save',
	savingLabel = 'Saving...',
	expand,
	size = 'default',
	type = 'button',
	onClick,
	icon = save,
	iconOnly = false,
}) => {
	return (
		<IonButton
			expand={expand}
			type={type}
			disabled={disabled || isSaving}
			size={size}
			onClick={onClick}
		>
			{iconOnly ? (
				isSaving ? (
					<IonSpinner name="crescent" />
				) : (
					<IonIcon slot="icon-only" icon={icon} />
				)
			) : (
				<>
					{isSaving ? (
						<IonSpinner slot="start" name="crescent" style={{ fontSize: '1rem' }} />
					) : (
						<IonIcon slot="start" icon={icon} />
					)}
					{isSaving ? savingLabel : label}
				</>
			)}
		</IonButton>
	);
};
