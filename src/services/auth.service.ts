// Auth Service - Supabase Authentication Operations

import type { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';
import { logger } from './sentry';
import { supabase } from './supabase';

export interface AuthResponse {
	user: SupabaseUser | null;
	session: Session | null;
	error: AuthError | null;
}

export interface SignUpData {
	email: string;
	password: string;
	displayName: string;
}

export interface SignInData {
	email: string;
	password: string;
}

export const authService = {
	/**
	 * Sign up with email and password
	 */
	async signUp({ email, password, displayName }: SignUpData): Promise<AuthResponse> {
		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						display_name: displayName,
					},
				},
			});

			if (error) {
				logger.error(error, { context: 'signUp', email });
				return { user: null, session: null, error };
			}

			// Create user profile after successful signup
			if (data.user) {
				await this.createUserProfile(data.user.id, displayName);
			}

			return { user: data.user, session: data.session, error: null };
		} catch (err) {
			const error = err as AuthError;
			logger.error(error, { context: 'signUp', email });
			return { user: null, session: null, error };
		}
	},

	/**
	 * Sign in with email and password
	 */
	async signIn({ email, password }: SignInData): Promise<AuthResponse> {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				logger.error(error, { context: 'signIn', email });
				return { user: null, session: null, error };
			}

			return { user: data.user, session: data.session, error: null };
		} catch (err) {
			const error = err as AuthError;
			logger.error(error, { context: 'signIn', email });
			return { user: null, session: null, error };
		}
	},

	/**
	 * Sign in with Google OAuth
	 */
	async signInWithGoogle(): Promise<{ error: AuthError | null }> {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) {
				logger.error(error, { context: 'signInWithGoogle' });
			}

			return { error };
		} catch (err) {
			const error = err as AuthError;
			logger.error(error, { context: 'signInWithGoogle' });
			return { error };
		}
	},

	/**
	 * Sign out current user
	 */
	async signOut(): Promise<{ error: AuthError | null }> {
		try {
			const { error } = await supabase.auth.signOut();

			if (error) {
				logger.error(error, { context: 'signOut' });
			}

			return { error };
		} catch (err) {
			const error = err as AuthError;
			logger.error(error, { context: 'signOut' });
			return { error };
		}
	},

	/**
	 * Send password reset email
	 */
	async resetPassword(email: string): Promise<{ error: AuthError | null }> {
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`,
			});

			if (error) {
				logger.error(error, { context: 'resetPassword', email });
			}

			return { error };
		} catch (err) {
			const error = err as AuthError;
			logger.error(error, { context: 'resetPassword', email });
			return { error };
		}
	},

	/**
	 * Update user password
	 */
	async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
		try {
			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) {
				logger.error(error, { context: 'updatePassword' });
			}

			return { error };
		} catch (err) {
			const error = err as AuthError;
			logger.error(error, { context: 'updatePassword' });
			return { error };
		}
	},

	/**
	 * Get current session
	 */
	async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
		try {
			const { data, error } = await supabase.auth.getSession();

			if (error) {
				logger.error(error, { context: 'getSession' });
				return { session: null, error };
			}

			return { session: data.session, error: null };
		} catch (err) {
			const error = err as AuthError;
			logger.error(error, { context: 'getSession' });
			return { session: null, error };
		}
	},

	/**
	 * Get current user
	 */
	async getUser(): Promise<{ user: SupabaseUser | null; error: AuthError | null }> {
		try {
			const { data, error } = await supabase.auth.getUser();

			if (error) {
				logger.error(error, { context: 'getUser' });
				return { user: null, error };
			}

			return { user: data.user, error: null };
		} catch (err) {
			const error = err as AuthError;
			logger.error(error, { context: 'getUser' });
			return { user: null, error };
		}
	},

	/**
	 * Create user profile in database
	 */
	async createUserProfile(userId: string, displayName: string): Promise<{ error: Error | null }> {
		try {
			const { error } = await supabase.from('user_profiles').insert({
				id: userId,
				display_name: displayName,
			});

			if (error) {
				logger.error(new Error(error.message), { context: 'createUserProfile', userId });
				return { error: new Error(error.message) };
			}

			return { error: null };
		} catch (err) {
			const error = err as Error;
			logger.error(error, { context: 'createUserProfile', userId });
			return { error };
		}
	},

	/**
	 * Get user profile from database
	 */
	async getUserProfile(
		userId: string
	): Promise<{ profile: UserProfile | null; error: Error | null }> {
		try {
			const { data, error } = await supabase
				.from('user_profiles')
				.select('*')
				.eq('id', userId)
				.single();

			if (error) {
				logger.error(new Error(error.message), { context: 'getUserProfile', userId });
				return { profile: null, error: new Error(error.message) };
			}

			return { profile: data as UserProfile, error: null };
		} catch (err) {
			const error = err as Error;
			logger.error(error, { context: 'getUserProfile', userId });
			return { profile: null, error };
		}
	},

	/**
	 * Update user profile in database
	 */
	async updateUserProfile(
		userId: string,
		updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url'>>
	): Promise<{ error: Error | null }> {
		try {
			const { error } = await supabase
				.from('user_profiles')
				.update({
					...updates,
					updated_at: new Date().toISOString(),
				})
				.eq('id', userId);

			if (error) {
				logger.error(new Error(error.message), { context: 'updateUserProfile', userId });
				return { error: new Error(error.message) };
			}

			return { error: null };
		} catch (err) {
			const error = err as Error;
			logger.error(error, { context: 'updateUserProfile', userId });
			return { error };
		}
	},

	/**
	 * Get shop IDs for user
	 */
	async getUserShopIds(userId: string): Promise<{ shopIds: string[]; error: Error | null }> {
		try {
			const { data, error } = await supabase
				.from('shop_users')
				.select('shop_id')
				.eq('user_id', userId);

			if (error) {
				logger.error(new Error(error.message), { context: 'getUserShopIds', userId });
				return { shopIds: [], error: new Error(error.message) };
			}

			const shopIds = data?.map((row) => row.shop_id) || [];
			return { shopIds, error: null };
		} catch (err) {
			const error = err as Error;
			logger.error(error, { context: 'getUserShopIds', userId });
			return { shopIds: [], error };
		}
	},

	/**
	 * Subscribe to auth state changes
	 */
	onAuthStateChange(callback: (user: SupabaseUser | null, session: Session | null) => void) {
		return supabase.auth.onAuthStateChange((_event, session) => {
			callback(session?.user || null, session);
		});
	},
};
