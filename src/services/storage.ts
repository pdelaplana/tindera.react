import { supabase } from './supabase';

const BUCKET_NAME = 'shops';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload a shop logo to Supabase storage
 * @param file - The image file to upload
 * @param shopId - The shop ID (used for folder structure)
 * @returns Public URL of the uploaded image
 */
export async function uploadShopLogo(file: File, shopId: string): Promise<string> {
	// Check authentication status
	const {
		data: { session },
		error: authError,
	} = await supabase.auth.getSession();

	console.log('🔐 Auth check before upload:', {
		isAuthenticated: !!session,
		userId: session?.user?.id,
		hasAccessToken: !!session?.access_token,
		authError: authError?.message,
	});

	if (!session) {
		throw new Error('User must be authenticated to upload images');
	}

	// Debug: Check if user has access to this shop
	const { data: shopAccess, error: accessError } = await supabase
		.from('shop_users')
		.select('role')
		.eq('shop_id', shopId)
		.eq('user_id', session.user.id)
		.single();

	console.log('🏪 Shop access check:', {
		shopId,
		userId: session.user.id,
		hasAccess: !!shopAccess,
		role: shopAccess?.role,
		accessError: accessError?.message,
	});

	if (!shopAccess) {
		throw new Error(
			`User does not have access to shop ${shopId}. Access check failed: ${accessError?.message}`
		);
	}

	// Validate file size
	if (file.size > MAX_FILE_SIZE) {
		throw new Error('File size exceeds 5MB limit');
	}

	// Validate file type
	const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
	if (!allowedTypes.includes(file.type)) {
		throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
	}

	// Get file extension
	const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

	// Upload path: {shopId}/logo.{extension}
	const filePath = `${shopId}/logo.${extension}`;

	console.log('📂 Upload path details:', {
		bucketName: BUCKET_NAME,
		filePath,
		shopId,
		fullPath: `${BUCKET_NAME}/${filePath}`,
	});

	// Upload file (will overwrite if exists)
	const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
		cacheControl: '3600',
		upsert: true, // Overwrite existing file
	});

	if (uploadError) {
		console.error('Upload error:', uploadError);
		throw new Error(`Failed to upload image: ${uploadError.message}`);
	}

	// Get public URL - manually construct to ensure correct format
	// Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

	console.log('Upload successful:', { filePath, publicUrl });

	return publicUrl;
}

/**
 * Delete a shop logo from Supabase storage
 * @param shopId - The shop ID
 */
export async function deleteShopLogo(shopId: string): Promise<void> {
	// Try to delete all possible extensions
	const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
	const filePaths = extensions.map((ext) => `${shopId}/logo.${ext}`);

	// Delete all possible logo files (ignore errors if file doesn't exist)
	await supabase.storage.from(BUCKET_NAME).remove(filePaths);
}

/**
 * Get the public URL for a shop's logo
 * @param shopId - The shop ID
 * @param extension - The file extension (default: 'jpg')
 * @returns Public URL of the logo
 */
export function getShopLogoUrl(shopId: string, extension = 'jpg'): string {
	const filePath = `${shopId}/logo.${extension}`;
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

	return publicUrl;
}

/**
 * Upload a product image to Supabase storage
 * @param file - The image file to upload
 * @param shopId - The shop ID (used for folder structure)
 * @param productId - Optional product ID (if undefined, generates random filename)
 * @returns Public URL of the uploaded image
 */
export async function uploadProductImage(
	file: File,
	shopId: string,
	productId?: string
): Promise<string> {
	// Check authentication status
	const {
		data: { session },
		error: authError,
	} = await supabase.auth.getSession();

	if (!session) {
		throw new Error('User must be authenticated to upload images');
	}

	// Debug: Check if user has access to this shop
	const { data: shopAccess, error: accessError } = await supabase
		.from('shop_users')
		.select('role')
		.eq('shop_id', shopId)
		.eq('user_id', session.user.id)
		.single();

	if (!shopAccess) {
		throw new Error(
			`User does not have access to shop ${shopId}. Access check failed: ${accessError?.message}`
		);
	}

	// Validate file size
	if (file.size > MAX_FILE_SIZE) {
		throw new Error('File size exceeds 5MB limit');
	}

	// Validate file type
	const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
	if (!allowedTypes.includes(file.type)) {
		throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
	}

	// Get file extension
	const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

	// Upload path: {shopId}/products/{productId or timestamp}.{extension}
	const filename = productId || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	const filePath = `${shopId}/products/${filename}.${extension}`;

	console.log('📂 Upload product image:', {
		bucketName: BUCKET_NAME,
		filePath,
		shopId,
		productId,
	});

	// Upload file
	const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
		cacheControl: '3600',
		upsert: true, // Overwrite existing file
	});

	if (uploadError) {
		console.error('Upload error:', uploadError);
		throw new Error(`Failed to upload image: ${uploadError.message}`);
	}

	// Get public URL
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

	console.log('Product image upload successful:', { filePath, publicUrl });

	return publicUrl;
}
