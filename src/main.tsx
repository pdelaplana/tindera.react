import './i18n';
import * as Sentry from '@sentry/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry } from '@/services/sentry';
import { ThemeProvider } from '@/theme/ThemeProvider';
import App from './App';

// Import global styles (includes Ionic CSS and design tokens)
import '@/theme/global.scss';

// Initialize Sentry for error tracking
initSentry();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
	<React.StrictMode>
		<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
			<ThemeProvider>
				<App />
			</ThemeProvider>
		</Sentry.ErrorBoundary>
	</React.StrictMode>
);

// Error fallback component
function ErrorFallback() {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100vh',
				padding: '20px',
				textAlign: 'center',
			}}
		>
			<h1>Something went wrong</h1>
			<p>An unexpected error occurred. Please refresh the page and try again.</p>
			<button
				onClick={() => window.location.reload()}
				style={{
					marginTop: '16px',
					padding: '12px 24px',
					backgroundColor: '#3880ff',
					color: 'white',
					border: 'none',
					borderRadius: '8px',
					cursor: 'pointer',
					fontSize: '16px',
				}}
			>
				Refresh Page
			</button>
		</div>
	);
}
