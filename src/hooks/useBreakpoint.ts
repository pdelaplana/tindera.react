// useBreakpoint - Responsive breakpoint detection hook

import { useEffect, useState } from 'react';

export const BREAKPOINTS = {
	mobile: 0,
	tablet: 768,
	desktop: 1024,
	large: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export function useBreakpoint(): Breakpoint {
	const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint());

	useEffect(() => {
		const handleResize = () => {
			setBreakpoint(getBreakpoint());
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return breakpoint;
}

function getBreakpoint(): Breakpoint {
	const width = window.innerWidth;

	if (width >= BREAKPOINTS.large) return 'large';
	if (width >= BREAKPOINTS.desktop) return 'desktop';
	if (width >= BREAKPOINTS.tablet) return 'tablet';
	return 'mobile';
}

export function useIsMobile(): boolean {
	const breakpoint = useBreakpoint();
	return breakpoint === 'mobile';
}

export function useIsTabletOrLarger(): boolean {
	const breakpoint = useBreakpoint();
	return breakpoint !== 'mobile';
}

export default useBreakpoint;
