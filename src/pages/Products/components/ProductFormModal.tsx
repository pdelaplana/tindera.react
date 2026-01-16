// Product Form Modal Component - Add/Edit Product

import { zodResolver } from '@hookform/resolvers/zod';
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonModal,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import { close } from 'ionicons/icons';
import type React from 'react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FieldLabel } from '@/components/shared/FieldLabel';
import { PriceField, SelectField, TextAreaField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { ImageUpload } from '@/components/ui';
import {
	useCreateProduct,
	useProduct,
	useProductCategories,
	useUpdateProduct,
} from '@/hooks/useProduct';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import { uploadProductImage } from '@/services/storage';
import type { ProductInsert, ProductUpdate } from '@/types';

// Validation schema
const productSchema = z.object({
	name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
	description: z.string().max(500, 'Description too long').optional().nullable(),
	price: z.number().min(0, 'Price must be positive'),
	category_id: z.string().optional().nullable(),
	remarks: z.string().max(1000, 'Remarks too long').optional().nullable(),
	tags: z.array(z.string()).optional().nullable(),
	image_url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	productId: string | null;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, productId }) => {
	const { showSuccess, showError } = useToastNotification();
	const { currentShop, hasPermission } = useShop();
	const isNew = !productId;

	const { data: product, isLoading: productLoading } = useProduct(isNew ? undefined : productId!);
	const { data: categories } = useProductCategories();
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();

	const canEdit = hasPermission('staff');
	const isSaving = createProduct.isPending || updateProduct.isPending;

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ProductFormData>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			name: '',
			description: '',
			price: 0,
			category_id: null,
			remarks: '',
			tags: [],
			image_url: '',
		},
	});

	// Populate form when product data loads or modal opens
	useEffect(() => {
		if (isOpen) {
			if (product && !isNew) {
				reset({
					name: product.name,
					description: product.description || '',
					price: product.price,
					category_id: product.category_id,
					remarks: product.remarks || '',
					tags: product.tags || [],
					image_url: product.image_url || '',
				});
			} else if (isNew) {
				reset({
					name: '',
					description: '',
					price: 0,
					category_id: null,
					remarks: '',
					tags: [],
					image_url: '',
				});
			}
		}
	}, [product, isNew, reset, isOpen]);

	const onSubmit = async (data: ProductFormData) => {
		try {
			// Clean up empty strings to null
			const cleanData = {
				...data,
				description: data.description || null,
				category_id: data.category_id || null,
				remarks: data.remarks || null,
				tags: data.tags && data.tags.length > 0 ? data.tags : null,
				image_url: data.image_url || null,
			};

			if (isNew) {
				await createProduct.mutateAsync(cleanData as Omit<ProductInsert, 'shop_id'>);
				showSuccess('Product created successfully');
			} else {
				await updateProduct.mutateAsync({
					productId: productId!,
					data: cleanData as ProductUpdate,
				});
				showSuccess('Product updated successfully');
			}

			handleClose();
		} catch (error) {
			logger.error(error instanceof Error ? error : new Error(String(error)));
			showError(`Failed to ${isNew ? 'create' : 'update'} product`);
		}
	};

	const handleClose = () => {
		onClose();
		reset({
			name: '',
			description: '',
			price: 0,
			category_id: null,
			remarks: '',
			tags: [],
			image_url: '',
		});
	};

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={handleClose}
			initialBreakpoint={1}
			breakpoints={[0, 0.75, 1]}
		>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start" />
					<IonTitle>{isNew ? 'New Product' : product?.name || 'Edit Product'}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleClose}>
							<IonIcon icon={close} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding" scrollY={true}>
				{productLoading && !isNew ? (
					<div className="ion-text-center" style={{ padding: '48px' }}>
						<IonSpinner />
					</div>
				) : (
					<form onSubmit={handleSubmit(onSubmit)}>
						{/* Name */}
						<TextField
							name="name"
							control={control}
							label="Name"
							placeholder="Enter product name"
							required
							error={errors.name}
							disabled={isSaving || !canEdit}
						/>

						{/* Description */}
						<TextAreaField
							name="description"
							control={control}
							label="Description"
							placeholder="Enter product description"
							rows={3}
							error={errors.description}
							disabled={isSaving || !canEdit}
						/>

						{/* Price */}
						<PriceField
							name="price"
							control={control}
							label="Price"
							required
							error={errors.price}
							disabled={isSaving || !canEdit}
							currency={currentShop?.currency_code || 'USD'}
						/>

						{/* Category */}
						<SelectField
							name="category_id"
							control={control}
							label="Category"
							placeholder="Select category"
							options={[
								{ value: '', label: 'No Category' },
								...(categories?.map((cat) => ({
									value: cat.id,
									label: `${cat.name}`,
								})) || []),
							]}
							disabled={isSaving || !canEdit}
						/>

						{/* Image */}
						<div style={{ marginBottom: '16px' }}>
							<FieldLabel>Product Image</FieldLabel>
							<Controller
								name="image_url"
								control={control}
								render={({ field: { onChange, value } }) => (
									<ImageUpload
										value={value || null}
										onFileSelect={async (file) => {
											if (!currentShop?.id) {
												showError('No shop selected');
												return;
											}

											try {
												const publicUrl = await uploadProductImage(
													file,
													currentShop.id,
													isNew ? undefined : productId!
												);
												onChange(publicUrl);
												showSuccess('Image uploaded successfully');
											} catch (error) {
												console.error('Upload error:', error);
												showError(error instanceof Error ? error.message : 'Failed to upload image');
											}
										}}
										onRemove={() => onChange('')}
										disabled={isSaving || !canEdit}
										height="250px"
									/>
								)}
							/>
							{errors.image_url && (
								<div style={{ color: 'var(--ion-color-danger)', fontSize: '12px', padding: '4px 0' }}>
									{errors.image_url.message}
								</div>
							)}
						</div>

						{/* Remarks */}
						<TextAreaField
							name="remarks"
							control={control}
							label="Remarks"
							placeholder="Internal notes about this product"
							rows={2}
							disabled={isSaving || !canEdit}
						/>

						{/* Submit Button */}
						<SaveButton
							expand="block"
							type="submit"
							disabled={!canEdit || isSaving}
							isSaving={isSaving}
							label={isNew ? 'Create Product' : 'Save Changes'}
							savingLabel={isNew ? 'Creating...' : 'Saving...'}
						/>
					</form>
				)}
			</IonContent>
		</IonModal>
	);
};

export default ProductFormModal;
