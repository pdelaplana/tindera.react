// Signup Page

import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonInput,
	IonPage,
	IonSpinner,
	IonText,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const SignupPage: React.FC = () => {
	const history = useHistory();
	const { signUp, isAuthenticated, isLoading } = useAuth();

	const [displayName, setDisplayName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Redirect if already authenticated
	React.useEffect(() => {
		if (isAuthenticated && !isLoading) {
			history.replace('/shops');
		}
	}, [isAuthenticated, isLoading, history]);

	const validateForm = (): boolean => {
		if (!displayName.trim()) {
			setError('Display name is required');
			return false;
		}

		if (!email.trim()) {
			setError('Email is required');
			return false;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters');
			return false;
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		const result = await signUp({
			email,
			password,
			displayName: displayName.trim(),
		});

		if (!result.success) {
			setError(result.error || 'Failed to create account');
		} else {
			setSuccess(true);
		}

		setIsSubmitting(false);
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

	if (success) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Sign Up</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonContent className="ion-padding">
					<div className="page-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
						<div style={{ textAlign: 'center', marginTop: 'var(--space-12)' }}>
							<h1 className="text-heading">Check Your Email</h1>
							<p className="text-body mt-4">
								We've sent a confirmation email to <strong>{email}</strong>.
							</p>
							<p className="text-caption mt-2">Click the link in the email to verify your account.</p>

							<IonButton expand="block" className="mt-4" onClick={() => history.push('/signin')}>
								Back to Sign In
							</IonButton>
						</div>
					</div>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/signin" />
					</IonButtons>
					<IonTitle>Sign Up</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="page-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
					<div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
						<h1 className="text-heading">Create Account</h1>
						<p className="text-caption">Join Tindera to manage your business</p>
					</div>

					<form onSubmit={handleSubmit}>
						<IonInput
							fill="outline"
							type="text"
							label="Display Name"
							labelPlacement="floating"
							value={displayName}
							onIonInput={(e) => setDisplayName(e.detail.value || '')}
							required
							autocomplete="name"
						/>

						<IonInput
							fill="outline"
							type="email"
							label="Email"
							labelPlacement="floating"
							value={email}
							onIonInput={(e) => setEmail(e.detail.value || '')}
							required
							autocomplete="email"
							style={{ marginTop: 'var(--space-md)' }}
						/>

						<IonInput
							fill="outline"
							type="password"
							label="Password"
							labelPlacement="floating"
							value={password}
							onIonInput={(e) => setPassword(e.detail.value || '')}
							required
							autocomplete="new-password"
							style={{ marginTop: 'var(--space-md)' }}
						/>

						<IonInput
							fill="outline"
							type="password"
							label="Confirm Password"
							labelPlacement="floating"
							value={confirmPassword}
							onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
							required
							autocomplete="new-password"
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
							disabled={isSubmitting || !email || !password || !displayName}
						>
							{isSubmitting ? <IonSpinner name="crescent" /> : 'Create Account'}
						</IonButton>
					</form>

					<div className="mt-4" style={{ textAlign: 'center' }}>
						<IonText color="medium">
							<p>
								Already have an account?{' '}
								<a
									href="/signin"
									onClick={(e) => {
										e.preventDefault();
										history.push('/signin');
									}}
									style={{ color: 'var(--color-brand-primary)' }}
								>
									Sign In
								</a>
							</p>
						</IonText>
					</div>

					<div style={{ textAlign: 'center' }}>
						<IonText color="medium">
							<p style={{ fontSize: 'var(--font-size-xs)', lineHeight: '1.5' }}>
								By creating an account, you agree to our{' '}
								<a href="#" style={{ color: 'var(--color-brand-primary)' }}>
									Terms of Service
								</a>{' '}
								and{' '}
								<a href="#" style={{ color: 'var(--color-brand-primary)' }}>
									Privacy Policy
								</a>
							</p>
						</IonText>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default SignupPage;
