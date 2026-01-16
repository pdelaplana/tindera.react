// Page Not Found State - Reusable not found state for pages

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

interface PageNotFoundStateProps {
	/** Back button default href */
	backHref?: string;
	/** Title to display in header */
	title?: string;
	/** Optional message to display in content */
	message?: string;
}

/**
 * A reusable not found state component for pages.
 * Displays a page with a back button, title, and optional message.
 *
 * @example
 * <PageNotFoundState backHref="/products" title="Product Not Found" />
 * <PageNotFoundState backHref="/products" title="Product Not Found" message="The product you're looking for doesn't exist." />
 */
const PageNotFoundState: React.FC<PageNotFoundStateProps> = ({
	backHref,
	title = 'Not Found',
	message,
}) => {
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
				{message && (
					<div className="ion-text-center" style={{ padding: '48px' }}>
						<p>{message}</p>
					</div>
				)}
			</IonContent>
		</IonPage>
	);
};

export default PageNotFoundState;
