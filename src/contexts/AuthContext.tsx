// Auth Context - Authentication State Management

import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService, type SignInData, type SignUpData } from '@/services/auth.service';
import { logger } from '@/services/sentry';
import type { UserProfile } from '@/types';

interface AuthState {
	user: SupabaseUser | null;
	session: Session | null;
	profile: UserProfile | null;
	shopIds: string[];
	isLoading: boolean;
	isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
	signUp: (data: SignUpData) => Promise<{ success: boolean; error: string | null }>;
	signIn: (data: SignInData) => Promise<{ success: boolean; error: string | null }>;
	signInWithGoogle: () => Promise<{ success: boolean; error: string | null }>;
	signOut: () => Promise<{ success: boolean; error: string | null }>;
	resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
	updatePassword: (newPassword: string) => Promise<{ success: boolean; error: string | null }>;
	updateProfile: (
		updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url'>>
	) => Promise<{ success: boolean; error: string | null }>;
	refreshProfile: () => Promise<void>;
	refreshShopIds: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
	children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [state, setState] = useState<AuthState>({
		user: null,
		session: null,
		profile: null,
		shopIds: [],
		isLoading: true,
		isAuthenticated: false,
	});

	// Load user data (profile and shop IDs)
	const loadUserData = useCallback(async (userId: string) => {
		try {
			const [profileResult, shopIdsResult] = await Promise.all([
				authService.getUserProfile(userId),
				authService.getUserShopIds(userId),
			]);

			setState((prev) => ({
				...prev,
				profile: profileResult.profile,
				shopIds: shopIdsResult.shopIds,
			}));
		} catch (err) {
			logger.error(err as Error, { context: 'loadUserData', userId });
		}
	}, []);

	// Initialize auth state
	useEffect(() => {
		const initializeAuth = async () => {
			try {
				const { session } = await authService.getSession();

				if (session?.user) {
					setState((prev) => ({
						...prev,
						user: session.user,
						session,
						isAuthenticated: true,
						isLoading: false,
					}));
					await loadUserData(session.user.id);
				} else {
					setState((prev) => ({
						...prev,
						isLoading: false,
					}));
				}
			} catch (err) {
				logger.error(err as Error, { context: 'initializeAuth' });
				setState((prev) => ({
					...prev,
					isLoading: false,
				}));
			}
		};

		initializeAuth();

		// Subscribe to auth state changes
		const { data: subscription } = authService.onAuthStateChange(async (user, session) => {
			if (user && session) {
				setState((prev) => ({
					...prev,
					user,
					session,
					isAuthenticated: true,
					isLoading: false,
				}));
				await loadUserData(user.id);
			} else {
				setState({
					user: null,
					session: null,
					profile: null,
					shopIds: [],
					isLoading: false,
					isAuthenticated: false,
				});
			}
		});

		return () => {
			subscription?.subscription.unsubscribe();
		};
	}, [loadUserData]);

	const signUp = async (data: SignUpData): Promise<{ success: boolean; error: string | null }> => {
		setState((prev) => ({ ...prev, isLoading: true }));

		const result = await authService.signUp(data);

		if (result.error) {
			setState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, error: result.error.message };
		}

		// Note: User will be set via onAuthStateChange after email confirmation
		setState((prev) => ({ ...prev, isLoading: false }));
		return { success: true, error: null };
	};

	const signIn = async (data: SignInData): Promise<{ success: boolean; error: string | null }> => {
		setState((prev) => ({ ...prev, isLoading: true }));

		const result = await authService.signIn(data);

		if (result.error) {
			setState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, error: result.error.message };
		}

		// User will be set via onAuthStateChange
		return { success: true, error: null };
	};

	const signInWithGoogle = async (): Promise<{ success: boolean; error: string | null }> => {
		const result = await authService.signInWithGoogle();

		if (result.error) {
			return { success: false, error: result.error.message };
		}

		// User will be set via onAuthStateChange after OAuth redirect
		return { success: true, error: null };
	};

	const signOut = async (): Promise<{ success: boolean; error: string | null }> => {
		setState((prev) => ({ ...prev, isLoading: true }));

		const result = await authService.signOut();

		if (result.error) {
			setState((prev) => ({ ...prev, isLoading: false }));
			return { success: false, error: result.error.message };
		}

		// State will be cleared via onAuthStateChange
		return { success: true, error: null };
	};

	const resetPassword = async (
		email: string
	): Promise<{ success: boolean; error: string | null }> => {
		const result = await authService.resetPassword(email);

		if (result.error) {
			return { success: false, error: result.error.message };
		}

		return { success: true, error: null };
	};

	const updatePassword = async (
		newPassword: string
	): Promise<{ success: boolean; error: string | null }> => {
		const result = await authService.updatePassword(newPassword);

		if (result.error) {
			return { success: false, error: result.error.message };
		}

		return { success: true, error: null };
	};

	const updateProfile = async (
		updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url'>>
	): Promise<{ success: boolean; error: string | null }> => {
		if (!state.user) {
			return { success: false, error: 'Not authenticated' };
		}

		const result = await authService.updateUserProfile(state.user.id, updates);

		if (result.error) {
			return { success: false, error: result.error.message };
		}

		// Refresh profile
		await refreshProfile();
		return { success: true, error: null };
	};

	const refreshProfile = async (): Promise<void> => {
		if (!state.user) return;

		const { profile } = await authService.getUserProfile(state.user.id);
		setState((prev) => ({ ...prev, profile }));
	};

	const refreshShopIds = async (): Promise<void> => {
		if (!state.user) return;

		const { shopIds } = await authService.getUserShopIds(state.user.id);
		setState((prev) => ({ ...prev, shopIds }));
	};

	const value: AuthContextValue = {
		...state,
		signUp,
		signIn,
		signInWithGoogle,
		signOut,
		resetPassword,
		updatePassword,
		updateProfile,
		refreshProfile,
		refreshShopIds,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuthContext must be used within an AuthProvider');
	}
	return context;
}

export { AuthContext };
