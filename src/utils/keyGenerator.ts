/**
 * Generates a unique key index based on the first six letters of a string
 * @param str - The string to generate a key from
 * @param index - Optional index to append for additional uniqueness
 * @returns A unique key string
 */
export const generateKeyFromString = (str: string, index?: number): string => {
	const prefix = str.slice(0, 6).toLowerCase().replace(/\s+/g, '');
	const timestamp = Date.now().toString(36);
	const indexSuffix = index !== undefined ? `-${index}` : '';

	return `${prefix}-${timestamp}${indexSuffix}`;
};

/**
 * Generates a simple key based on the first six letters of a string
 * @param str - The string to generate a key from
 * @param index - Optional index to append
 * @returns A key string
 */
export const generateSimpleKey = (str: string, index?: number): string => {
	const prefix = str.slice(0, 6).toLowerCase().replace(/\s+/g, '');
	const indexSuffix = index !== undefined ? `-${index}` : '';

	return `${prefix}${indexSuffix}`;
};
