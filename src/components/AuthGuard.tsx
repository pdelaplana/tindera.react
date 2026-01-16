// AuthGuard - Protect routes that require authentication

import { IonLoading } from '@ionic/react';
import type React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
	children: React.ReactNode;
}

/**
 * Wraps protected routes and redirects to login if not authenticated.
 *
 * @example
 * ```tsx
 * <Route path="/dashboard">
 *   <AuthGuard>
 *     <DashboardPage />
 *   </AuthGuard>
 * </Route>
 * ```
 */
function AuthGuard({ children }: AuthGuardProps) {
	const { isAuthenticated, isLoading } = useAuth();

	// Show loading while checking auth state
	if (isLoading) {
		return <IonLoading isOpen={true} message="Loading..." />;
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Redirect to="/signin" />;
	}

	// Render children if authenticated
	return <>{children}</>;
}

export default AuthGuard;
