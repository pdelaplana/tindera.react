import 'styled-components';
import { DesignSystem } from './designSystem';

/**
 * Extend styled-components DefaultTheme interface to include our design system
 * This provides TypeScript autocomplete and type checking for theme props
 */
declare module 'styled-components' {
	export interface DefaultTheme extends DesignSystem {}
}
