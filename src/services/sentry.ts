import * as Sentry from '@sentry/react';

export function initSentry() {
	const dsn = import.meta.env.VITE_SENTRY_DSN;

	if (!dsn) {
		console.warn('Sentry DSN not configured. Error tracking disabled.');
		return;
	}

	Sentry.init({
		dsn,
		environment: import.meta.env.MODE,
		integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
		tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
	});
}

export const logger = {
	error: (error: Error, context?: Record<string, unknown>) => {
		console.error(error);
		if (import.meta.env.VITE_SENTRY_DSN) {
			Sentry.captureException(error, { extra: context });
		}
	},

	warn: (message: string, context?: Record<string, unknown>) => {
		console.warn(message);
		if (import.meta.env.VITE_SENTRY_DSN) {
			Sentry.captureMessage(message, { level: 'warning', extra: context });
		}
	},

	info: (message: string, context?: Record<string, unknown>) => {
		console.info(message);
		// Only log info to Sentry in production
		if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
			Sentry.captureMessage(message, { level: 'info', extra: context });
		}
	},
};

export { Sentry };
