// BasePage - Unified page component combining PageHeader and PageWithCollapsibleHeader functionality

import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonMenuButton,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonTitle,
	IonToolbar,
	type RefresherEventDetail,
} from '@ionic/react';
import {
	ellipsisHorizontalCircleOutline,
	logOutOutline,
	personCircleOutline,
} from 'ionicons/icons';
import type React from 'react';
import { type ReactNode, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Div } from '@/components/shared/base/Div';
import { LoadingSpinner } from '@/components/ui';

interface BasePageProps {
	/** Page title */
	title: string;
	/** Content to render in the page */
	children: ReactNode;
	/** Show menu button (default: true) */
	showMenu?: boolean;
	/** Show back button with default href */
	backHref?: string;
	/** Show logout button (default: false) */
	showLogout?: boolean;
	/** Show profile button (default: false) */
	showProfile?: boolean;
	/** Show more icon button with callback */
	onMoreClick?: () => void;
	/** Additional buttons to render in header end slot */
	endButtons?: ReactNode;
	/** Pull-to-refresh callback function */
	onRefresh?: (event: CustomEvent<RefresherEventDetail>) => void | Promise<void>;
	/** Enable collapsible header with observed element (when element scrolls out of view, show title) */
	collapsible?: boolean;
	/** Ref to the element to observe for collapsible header */
	observedElementRef?: React.RefObject<HTMLElement>;
	/** Enable Ionic's native collapse header */
	collapse?: boolean;
	/** Title for collapse header (defaults to title if not provided) */
	collapseTitle?: string;
	/** Loading state - shows loading spinner */
	isLoading?: boolean;
	/** Not found state - shows not found message */
	notFound?: boolean;
	/** Custom not found message */
	notFoundMessage?: string;
}

/**
 * BasePage - A unified page component that combines the functionality of PageHeader and PageWithCollapsibleHeader.
 *
 * Features:
 * - Menu button, back button, logout, profile buttons
 * - More icon button with callback
 * - Custom end buttons
 * - Collapsible header (title appears on scroll)
 * - Ionic's native collapse header
 * - Loading and not found states
 *
 * @example
 * // Simple page with menu
 * <BasePage title="Products" showMenu>
 *   {content}
 * </BasePage>
 *
 * @example
 * // Page with back button and collapsible header
 * <BasePage
 *   title="Product Details"
 *   backHref="/products"
 *   collapsible
 *   observedElementRef={elementRef}
 * >
 *   {content}
 * </BasePage>
 *
 * @example
 * // Page with loading state
 * <BasePage title="Loading..." isLoading>
 *   {content}
 * </BasePage>
 */
const BasePage: React.FC<BasePageProps> = ({
	title,
	children,
	showMenu = true,
	backHref,
	showLogout = false,
	showProfile = false,
	onMoreClick,
	endButtons,
	onRefresh,
	collapsible = false,
	observedElementRef,
	collapse = false,
	collapseTitle,
	isLoading = false,
	notFound = false,
	notFoundMessage,
}) => {
	const history = useHistory();
	const [showHeaderTitle, setShowHeaderTitle] = useState(!collapsible);

	// Observe element visibility for collapsible header
	useEffect(() => {
		// Skip observation if not collapsible, loading, not found, or no ref provided
		if (!collapsible || isLoading || notFound || !observedElementRef) {
			setShowHeaderTitle(!collapsible);
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
	}, [collapsible, observedElementRef, isLoading, notFound]);

	// Render end buttons
	const renderEndButtons = () => (
		<IonButtons slot="end">
			{endButtons}
			{onMoreClick && (
				<IonButton onClick={onMoreClick}>
					<IonIcon slot="icon-only" icon={ellipsisHorizontalCircleOutline} />
				</IonButton>
			)}
			{showProfile && (
				<IonButton onClick={() => history.push('/profile')}>
					<IonIcon slot="icon-only" icon={personCircleOutline} />
				</IonButton>
			)}
			{showLogout && (
				<IonButton onClick={() => history.push('/logout')}>
					<IonIcon slot="icon-only" icon={logOutOutline} />
				</IonButton>
			)}
		</IonButtons>
	);

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
						{showMenu && !backHref && (
							<IonButtons slot="start">
								<IonMenuButton />
							</IonButtons>
						)}
						<IonTitle>Loading...</IonTitle>
						{renderEndButtons()}
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
						{showMenu && !backHref && (
							<IonButtons slot="start">
								<IonMenuButton />
							</IonButtons>
						)}
						<IonTitle>Not Found</IonTitle>
						{renderEndButtons()}
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
					{showMenu && !backHref && (
						<IonButtons slot="start">
							<IonMenuButton />
						</IonButtons>
					)}
					{showHeaderTitle && <IonTitle>{title}</IonTitle>}
					{renderEndButtons()}
				</IonToolbar>
			</IonHeader>

			{collapse && (
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">{collapseTitle || title}</IonTitle>
					</IonToolbar>
				</IonHeader>
			)}

			<IonContent fullscreen>
				{onRefresh && (
					<IonRefresher slot="fixed" onIonRefresh={onRefresh}>
						<IonRefresherContent />
					</IonRefresher>
				)}
				{children}
			</IonContent>
		</IonPage>
	);
};

export default BasePage;
