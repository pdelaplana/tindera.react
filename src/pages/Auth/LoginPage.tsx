// Login Page

import {
	IonButton,
	IonContent,
	IonIcon,
	IonInput,
	IonPage,
	IonSpinner,
	IonText,
} from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const LoginPage: React.FC = () => {
	const history = useHistory();
	const { signIn, signInWithGoogle, isAuthenticated, isLoading } = useAuth();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Redirect if already authenticated
	React.useEffect(() => {
		if (isAuthenticated && !isLoading) {
			history.replace('/shops');
		}
	}, [isAuthenticated, isLoading, history]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const result = await signIn({ email, password });

		if (!result.success) {
			setError(result.error || 'Failed to sign in');
		}

		setIsSubmitting(false);
	};

	const handleGoogleSignIn = async () => {
		setError(null);
		const result = await signInWithGoogle();

		if (!result.success) {
			setError(result.error || 'Failed to sign in with Google');
		}
	};

	if (isLoading) {
		return (
			<IonPage>
				<IonContent className="ion-padding">
					<div className="loading-container">
						<IonSpinner />
					</div>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage>
			<IonContent className="ion-padding">
				<div className="page-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
					<div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
						<h1 className="text-heading">Welcome Back</h1>
						<p className="text-caption">Sign in to continue to Tindera</p>
					</div>

					<form onSubmit={handleSubmit}>
						<IonInput
							fill="outline"
							type="email"
							label="Email"
							labelPlacement="floating"
							value={email}
							onIonInput={(e) => setEmail(e.detail.value || '')}
							required
							autocomplete="email"
						/>

						<IonInput
							fill="outline"
							type="password"
							label="Password"
							labelPlacement="floating"
							value={password}
							onIonInput={(e) => setPassword(e.detail.value || '')}
							required
							autocomplete="current-password"
							style={{ marginTop: 'var(--space-md)' }}
						/>

						{error && (
							<IonText color="danger" className="mt-4" style={{ display: 'block' }}>
								<p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>{error}</p>
							</IonText>
						)}

						<IonButton
							type="submit"
							expand="block"
							className="mt-4"
							disabled={isSubmitting || !email || !password}
						>
							{isSubmitting ? <IonSpinner name="crescent" /> : 'Sign In'}
						</IonButton>
					</form>

					<div className="mt-4" style={{ textAlign: 'center' }}>
						<IonText color="medium">
							<p style={{ margin: 'var(--space-4) 0' }}>or</p>
						</IonText>
					</div>

					<IonButton expand="block" fill="outline" onClick={handleGoogleSignIn}>
						<IonIcon icon={logoGoogle} slot="start" />
						Continue with Google
					</IonButton>

					<div className="mt-4" style={{ textAlign: 'center' }}>
						<IonText color="medium">
							<p>
								Don't have an account?{' '}
								<a
									href="/signup"
									onClick={(e) => {
										e.preventDefault();
										history.push('/signup');
									}}
									style={{ color: 'var(--color-brand-primary)' }}
								>
									Sign Up
								</a>
							</p>
						</IonText>
					</div>

					<div style={{ textAlign: 'center' }}>
						<IonText color="medium">
							<a
								href="/forgot-password"
								onClick={(e) => {
									e.preventDefault();
									// TODO: Navigate to forgot password page
								}}
								style={{ color: 'var(--color-brand-primary)', fontSize: 'var(--font-size-sm)' }}
							>
								Forgot Password?
							</a>
						</IonText>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default LoginPage;
