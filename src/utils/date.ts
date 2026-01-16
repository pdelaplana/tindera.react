// Date utility functions

/**
 * Formats a date string to display as "Today", "Yesterday", or "Day, MMM DD"
 * @param dateString - ISO date string to format
 * @returns Formatted date label
 */
export function formatDateLabel(dateString: string): string {
	const date = new Date(dateString);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	// Reset time parts for comparison
	const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

	if (dateOnly.getTime() === todayOnly.getTime()) {
		return 'Today';
	}
	if (dateOnly.getTime() === yesterdayOnly.getTime()) {
		return 'Yesterday';
	}

	// Format as "Day, MMM DD"
	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const monthNames = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];

	return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Formats a date to a relative string (e.g., "2 hours ago", "3 days ago")
 * @param dateString - ISO date string to format
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) {
		return 'just now';
	}
	if (diffMins < 60) {
		return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
	}
	if (diffHours < 24) {
		return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
	}
	if (diffDays < 7) {
		return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
	}

	// For older dates, use the formatDateLabel function
	return formatDateLabel(dateString);
}
