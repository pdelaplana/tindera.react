// useAuth Hook - Convenience hook for authentication

import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook to access authentication state and actions.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, signOut } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <Redirect to="/signin" />;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user?.email}</p>
 *       <button onClick={() => signOut()}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
	return useAuthContext();
}

export default useAuth;
