/**
 * Design System - Minimalist Dark Purple Theme
 * Ported from spendless.ionic.pwa with POS-specific additions
 */

export const designSystem = {
	colors: {
		// Brand Colors (Spendless dark purple)
		brand: {
			primary: '#3D1B5B', // Dark deep purple
			secondary: '#5D338C', // Mid purple
			accentLight: '#DDD0E6', // Light muted purple
		},

		// Full purple scale
		primary: {
			50: '#faf5ff',
			100: '#f3e8ff',
			200: '#e9d5ff',
			300: '#DDD0E6',
			400: '#B788DC',
			500: '#5D338C',
			600: '#3D1B5B', // Primary brand
			700: '#2d1443',
			800: '#1d0d2b',
			900: '#0d0513',
		},

		// Gray scale (from spendless)
		gray: {
			50: '#fafafa',
			100: '#f4f4f5',
			200: '#e4e4e7',
			300: '#d4d4d8',
			400: '#a1a1aa',
			500: '#71717a',
			600: '#52525b',
			700: '#3f3f46',
			800: '#27272a',
			900: '#18181b',
		},

		// Semantic colors
		success: '#10b981',
		warning: '#f59e0b',
		danger: '#ef4444',
		info: '#3b82f6',

		// Surface colors (minimalist white backgrounds)
		surface: {
			background: '#fafafa',
			base: '#ffffff',
			elevated: '#ffffff',
			variant: '#f4f4f5',
			sunken: '#f4f4f5',
		},

		// Text colors
		text: {
			primary: '#18181b',
			secondary: '#71717a',
			disabled: '#a1a1aa',
			inverse: '#ffffff',
			hint: '#d4d4d8',
		},

		// POS-specific status colors
		status: {
			paid: '#10b981',
			unpaid: '#ef4444',
			pending: '#f59e0b',
			inStock: '#22c55e',
			lowStock: '#f97316',
			outOfStock: '#dc2626',
		},
	},

	spacing: {
		xs: '4px',
		sm: '8px',
		md: '16px',
		lg: '24px',
		xl: '32px',
		'2xl': '48px',
		'3xl': '64px',

		// POS-specific
		tapTarget: '48px',
		cardGap: '12px',
		sectionGap: '24px',
	},

	borderRadius: {
		sm: '4px',
		md: '8px',
		lg: '12px',
		xl: '16px',
		'2xl': '20px',
		full: '9999px',
	},

	shadows: {
		// Minimalist shadows (subtle, clean)
		none: 'none',
		sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
		md: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
		lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
		xl: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
		'2xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',

		// Inner shadow for sunken elements
		inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
	},

	typography: {
		fontFamily: {
			base: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
			mono: '"SF Mono", Monaco, "Consolas", "Liberation Mono", monospace',
		},

		fontSize: {
			xs: '12px',
			sm: '14px',
			base: '16px',
			lg: '18px',
			xl: '20px',
			'2xl': '24px',
			'3xl': '30px',
			'4xl': '36px',

			// POS-specific
			price: '28px',
			total: '36px',
		},

		fontWeight: {
			normal: 400,
			medium: 500,
			semibold: 600,
			bold: 700,
			black: 900,
		},

		lineHeight: {
			tight: 1.1,
			snug: 1.2,
			normal: 1.5,
			relaxed: 1.6,
			loose: 1.8,
		},
	},

	// Transitions
	transitions: {
		fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
		base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
		slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
	},

	// Z-index scale
	zIndex: {
		base: 0,
		dropdown: 1000,
		sticky: 1020,
		fixed: 1030,
		modalBackdrop: 1040,
		modal: 1050,
		popover: 1060,
		tooltip: 1070,
	},
} as const;

// TypeScript type for the design system
export type DesignSystem = typeof designSystem;

// Theme type for styled-components
export interface DefaultTheme extends DesignSystem {}

// Helper functions for accessing nested values
export const getColor = (path: string): string => {
	const keys = path.split('.');
	let value: any = designSystem.colors;

	for (const key of keys) {
		value = value[key];
		if (value === undefined) {
			console.warn(`Color path "${path}" not found in design system`);
			return '#000000';
		}
	}

	return value as string;
};

export const getSpacing = (key: keyof typeof designSystem.spacing): string => {
	return designSystem.spacing[key];
};

export const getShadow = (key: keyof typeof designSystem.shadows): string => {
	return designSystem.shadows[key];
};

export const getFontSize = (key: keyof typeof designSystem.typography.fontSize): string => {
	return designSystem.typography.fontSize[key];
};

export const getBorderRadius = (key: keyof typeof designSystem.borderRadius): string => {
	return designSystem.borderRadius[key];
};

// Default export
export default designSystem;
