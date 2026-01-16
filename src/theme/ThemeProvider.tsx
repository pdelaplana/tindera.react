import type React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { designSystem } from './designSystem';

interface ThemeProviderProps {
	children: React.ReactNode;
}

/**
 * ThemeProvider Component
 *
 * Wraps the application with styled-components ThemeProvider to provide
 * access to the design system tokens throughout the component tree.
 *
 * Usage:
 * ```tsx
 * import { ThemeProvider } from '@/theme/ThemeProvider';
 *
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 *
 * Access theme in styled-components:
 * ```tsx
 * const Button = styled.button`
 *   background: ${props => props.theme.colors.brand.primary};
 *   padding: ${props => props.theme.spacing.md};
 * `;
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	return <StyledThemeProvider theme={designSystem}>{children}</StyledThemeProvider>;
};

export default ThemeProvider;
