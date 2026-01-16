// Logout Page

import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import type React from 'react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const LogoutPage: React.FC = () => {
	const history = useHistory();
	const { signOut, isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		const performLogout = async () => {
			if (!isAuthenticated && !isLoading) {
				// Already logged out, redirect to login
				history.replace('/signin');
				return;
			}

			if (!isLoading) {
				await signOut();
				history.replace('/signin');
			}
		};

		performLogout();
	}, [isAuthenticated, isLoading, signOut, history]);

	return (
		<IonPage>
			<IonContent className="ion-padding">
				<div className="loading-container">
					<div style={{ textAlign: 'center' }}>
						<IonSpinner />
						<p className="text-caption mt-4">Signing out...</p>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default LogoutPage;
