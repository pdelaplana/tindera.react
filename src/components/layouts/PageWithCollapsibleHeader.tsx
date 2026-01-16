// Page with Collapsible Header - Reusable component that shows header title when observed element scrolls out of view

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
import { type ReactNode, useEffect, useState } from 'react';
import { Div } from '@/components/shared/base/Div';
import { LoadingSpinner } from '@/components/ui';

interface PageWithCollapsibleHeaderProps {
	/** Title to display in header when element is out of view */
	title?: string;
	/** Back button default href */
	backHref?: string;
	/** Ref to the element to observe (when out of view, show title) */
	observedElementRef?: React.RefObject<HTMLElement>;
	/** Content to render in the page */
	children: ReactNode;
	/** Additional buttons to render in header end slot */
	endButtons?: ReactNode;
	/** Loading state */
	isLoading?: boolean;
	/** Not found state */
	notFound?: boolean;
	/** Custom not found message */
	notFoundMessage?: string;
}

const PageWithCollapsibleHeader: React.FC<PageWithCollapsibleHeaderProps> = ({
	title,
	backHref,
	observedElementRef,
	children,
	endButtons,
	isLoading = false,
	notFound = false,
	notFoundMessage,
}) => {
	const [showHeaderTitle, setShowHeaderTitle] = useState(false);

	// Observe element visibility
	useEffect(() => {
		// Skip observation if loading or not found, or if no ref provided
		if (isLoading || notFound || !observedElementRef) {
			return;
		}

		const currentElement = observedElementRef.current;
		const observer = new IntersectionObserver(
			([entry]) => {
				// Show header title when observed element is not visible
				setShowHeaderTitle(!entry.isIntersecting);
			},
			{ threshold: 0.1 }
		);

		if (currentElement) {
			observer.observe(currentElement);
		}

		return () => {
			if (currentElement) {
				observer.unobserve(currentElement);
			}
		};
	}, [observedElementRef, isLoading, notFound]);

	// Loading state
	if (isLoading) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						{backHref && (
							<IonButtons slot="start">
								<IonBackButton defaultHref={backHref} />
							</IonButtons>
						)}
						<IonTitle>Loading...</IonTitle>
						{endButtons && <IonButtons slot="end">{endButtons}</IonButtons>}
						{!endButtons && <IonButtons slot="end" />}
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<LoadingSpinner />
				</IonContent>
			</IonPage>
		);
	}

	// Not found state
	if (notFound) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						{backHref && (
							<IonButtons slot="start">
								<IonBackButton defaultHref={backHref} />
							</IonButtons>
						)}
						<IonTitle>Not Found</IonTitle>
						{!endButtons && <IonButtons slot="end" />}
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<Div className="ion-text-center" style={{ padding: '48px' }}>
						<p>{notFoundMessage || 'Item not found'}</p>
					</Div>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					{backHref && (
						<IonButtons slot="start">
							<IonBackButton defaultHref={backHref} />
						</IonButtons>
					)}
					{showHeaderTitle && <IonTitle>{title}</IonTitle>}
					{endButtons && <IonButtons slot="end">{endButtons}</IonButtons>}
					{!endButtons && <IonButtons slot="end" />}
				</IonToolbar>
			</IonHeader>

			<IonContent>{children}</IonContent>
		</IonPage>
	);
};

export default PageWithCollapsibleHeader;
