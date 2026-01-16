// BottomSheet - Mobile bottom sheet/drawer

import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonModal,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import type React from 'react';

interface BottomSheetProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	initialBreakpoint?: number;
	breakpoints?: number[];
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
	isOpen,
	onClose,
	title,
	children,
	initialBreakpoint = 0.5,
	breakpoints = [0, 0.5, 0.75, 1],
}) => {
	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			initialBreakpoint={initialBreakpoint}
			breakpoints={breakpoints}
			handle={true}
		>
			{title && (
				<IonHeader>
					<IonToolbar>
						<IonTitle>{title}</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={onClose}>
								<IonIcon slot="icon-only" icon={closeOutline} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
			)}
			<IonContent className="ion-padding">{children}</IonContent>
		</IonModal>
	);
};

export default BottomSheet;
