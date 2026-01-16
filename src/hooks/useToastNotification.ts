// useToastNotification Hook - Manage toast notifications using Ionic's useIonToast

import { useIonToast } from '@ionic/react';

export interface UseToastNotificationReturn {
	/** Show a success toast */
	showSuccess: (message: string) => void;
	/** Show an error toast */
	showError: (message: string) => void;
	/** Show a warning toast */
	showWarning: (message: string) => void;
	/** Show a custom toast with specific color */
	showToast: (
		message: string,
		color: 'success' | 'danger' | 'warning' | 'primary' | 'secondary'
	) => void;
}

export const useToastNotification = (): UseToastNotificationReturn => {
	const [present] = useIonToast();

	const showSuccess = (message: string) => {
		present({
			message,
			color: 'success',
			duration: 3000,
			position: 'top',
		});
	};

	const showError = (message: string) => {
		present({
			message,
			color: 'danger',
			duration: 3000,
			position: 'top',
		});
	};

	const showWarning = (message: string) => {
		present({
			message,
			color: 'warning',
			duration: 3000,
			position: 'top',
		});
	};

	const showToast = (
		message: string,
		color: 'success' | 'danger' | 'warning' | 'primary' | 'secondary'
	) => {
		present({
			message,
			color,
			duration: 3000,
			position: 'top',
		});
	};

	return {
		showSuccess,
		showError,
		showWarning,
		showToast,
	};
};
