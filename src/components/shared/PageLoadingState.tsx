// Page Loading State - Reusable loading state for pages

import {
	IonBackButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import type React from 'react';
import { LoadingSpinner } from '@/components/ui';

interface PageLoadingStateProps {
	/** Back button default href */
	backHref?: string;
	/** Title to display in header */
	title?: string;
}

/**
 * A reusable loading state component for pages.
 * Displays a page with a back button, title, and centered loading spinner.
 *
 * @example
 * <PageLoadingState backHref="/products" title="Loading..." />
 */
const PageLoadingState: React.FC<PageLoadingStateProps> = ({ backHref, title = 'Loading...' }) => {
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					{backHref && (
						<IonButtons slot="start">
							<IonBackButton defaultHref={backHref} />
						</IonButtons>
					)}
					<IonTitle>{title}</IonTitle>
					<IonButtons slot="end" />
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<LoadingSpinner />
			</IonContent>
		</IonPage>
	);
};

export default PageLoadingState;
