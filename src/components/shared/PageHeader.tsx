// PageHeader - Reusable Header Component for All Pages

import {
	IonButton,
	IonButtons,
	IonHeader,
	IonIcon,
	IonMenuButton,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import {
	ellipsisHorizontalCircleOutline,
	logOutOutline,
	personCircleOutline,
} from 'ionicons/icons';
import type React from 'react';
import { useHistory } from 'react-router-dom';

interface PageHeaderProps {
	title: string;
	showLogout?: boolean;
	showProfile?: boolean;
	showMenu?: boolean;
	endButtons?: React.ReactNode;
	collapse?: boolean;
	collapseTitle?: string;
	onMoreClick?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
	title,
	showLogout = false,
	showProfile = false,
	showMenu = true,
	endButtons,
	collapse = false,
	collapseTitle,
	onMoreClick,
}) => {
	const history = useHistory();

	return (
		<>
			<IonHeader>
				<IonToolbar>
					{showMenu && (
						<IonButtons slot="start">
							<IonMenuButton />
						</IonButtons>
					)}
					<IonTitle>{title}</IonTitle>
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
				</IonToolbar>
			</IonHeader>

			{collapse && (
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">{collapseTitle || title}</IonTitle>
					</IonToolbar>
				</IonHeader>
			)}
		</>
	);
};

export default PageHeader;
