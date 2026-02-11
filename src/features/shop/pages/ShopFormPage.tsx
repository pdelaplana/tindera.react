// Shop Form Page - Create or edit a shop

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';
import { z } from 'zod';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { SelectField, TextAreaField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { ImageUpload } from '@/components/ui';
import { useCreateShop, useDeleteShop, useShop, useUpdateShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { uploadShopLogo } from '@/services/storage';
import type { ShopInsert, ShopUpdate } from '@/types';
import {
  ButtonContainer,
  FormContainer,
  FormSection,
  ImageUploadSection,
  SectionTitle,
} from './ShopFormPage.styles';

// Common currency codes
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'PHP', label: 'PHP - Philippine Peso' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
  { value: 'THB', label: 'THB - Thai Baht' },
  { value: 'VND', label: 'VND - Vietnamese Dong' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
];

// Validation schema
const shopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  location: z.string().max(200, 'Location too long').optional().nullable(),
  currency_code: z.string().min(3, 'Currency is required').max(3),
  order_prefix: z.string().max(10, 'Prefix too long').optional().nullable(),
  image_url: z.string().optional().nullable(),
});

type ShopFormData = z.infer<typeof shopSchema>;

interface RouteParams {
  id: string;
}

const ShopFormPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const { shops, currentShop } = useShop();

  // Determine the shop ID: use route param if available, otherwise use currentShop
  const shopId = id === 'new' ? 'new' : id || currentShop?.id;
  const isNew = shopId === 'new';

  const deleteShopMutation = useDeleteShop();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleConfirmDelete = async () => {
    if (!currentShop) return;
    try {
      await deleteShopMutation.mutateAsync(currentShop.id);
      setShowDeleteAlert(false);
      history.push('/');
    } catch (error) {
      console.error('Failed to delete shop:', error);
    }
  };

  const createShop = useCreateShop();
  const updateShop = useUpdateShop();
  const { showSuccess, showError } = useToastNotification();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      currency_code: 'USD',
      order_prefix: '',
      image_url: '',
    },
  });

  // Watch the image_url field to pass to ImageUpload
  const currentImageUrl = watch('image_url');

  // Load shop data when editing
  useEffect(() => {
    if (!isNew && shopId) {
      const shop = shops.find((s) => s.id === shopId);
      if (shop) {
        reset({
          name: shop.name,
          description: shop.description || '',
          location: shop.location || '',
          currency_code: shop.currency_code,
          order_prefix: shop.order_prefix || '',
          image_url: shop.image_url || '',
        });
      }
    }
  }, [isNew, shopId, shops, reset]);

  const onSubmit = async (data: ShopFormData) => {
    try {
      setIsSaving(true);

      console.log('📝 Form submission started:', { isNew, hasSelectedFile: !!selectedFile, data });

      let imageUrl = data.image_url;

      if (isNew) {
        // For new shops: create shop first, then upload logo
        const newShopId = crypto.randomUUID();

        console.log('🆕 Creating new shop with ID:', newShopId);

        // Clean up empty strings to null
        const cleanData = {
          ...data,
          description: data.description || null,
          location: data.location || null,
          order_prefix: data.order_prefix || null,
          image_url: null, // Set after upload
        };

        // Create shop first
        await createShop.mutateAsync({ ...cleanData, id: newShopId } as ShopInsert);
        console.log('✅ Shop created successfully');

        // Wait a moment to ensure shop_users entry is committed
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Then upload logo if provided
        if (selectedFile) {
          try {
            console.log('📤 Uploading logo:', {
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              fileType: selectedFile.type,
              shopId: newShopId,
            });
            imageUrl = await uploadShopLogo(selectedFile, newShopId);
            console.log('✅ Logo uploaded successfully:', imageUrl);

            // Update shop with image URL
            await updateShop.mutateAsync({
              shopId: newShopId,
              data: { image_url: imageUrl } as ShopUpdate,
            });
            console.log('✅ Shop updated with image URL');
          } catch (uploadError) {
            console.error('❌ Image upload failed:', uploadError);
            // Shop was created but image upload failed - continue anyway
          }
        } else {
          console.log('ℹ️ No file selected for upload');
        }

        showSuccess('Shop created successfully');
        history.replace('/shops');
      } else {
        console.log('✏️ Updating existing shop:', id);

        // For existing shops: upload logo first if needed
        if (selectedFile) {
          try {
            console.log('📤 Uploading logo for existing shop:', {
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              fileType: selectedFile.type,
              shopId: shopId,
            });
            imageUrl = await uploadShopLogo(selectedFile, shopId as string);
            console.log('✅ Logo uploaded successfully:', imageUrl);
          } catch (uploadError) {
            throw new Error(
              uploadError instanceof Error ? uploadError.message : 'Failed to upload image'
            );
          }
        } else {
          console.log('ℹ️ No file selected for upload');
        }

        // Clean up empty strings to null
        const cleanData = {
          ...data,
          description: data.description || null,
          location: data.location || null,
          order_prefix: data.order_prefix || null,
          image_url: imageUrl || null,
        };

        await updateShop.mutateAsync({
          shopId: shopId as string,
          data: cleanData as ShopUpdate,
        });
        showSuccess('Shop updated successfully');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to ${isNew ? 'create' : 'update'} shop`;
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/shops" />
          </IonButtons>
          <IonTitle>{isNew ? 'Create Shop' : 'Edit Shop'}</IonTitle>
          <IonButtons slot="end">
            <SaveButton
              isSaving={isSaving}
              disabled={!isDirty && !isNew}
              onClick={handleSubmit(onSubmit)}
              iconOnly
            />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormContainer>
            <FormSection>
              <SectionTitle>Shop Information</SectionTitle>

              {/* Name */}
              <TextField
                name="name"
                control={control}
                label="Shop Name"
                placeholder="Enter shop name"
                required
                error={errors.name}
                disabled={isSaving}
              />
              {/* Order Prefix */}
              <TextField
                name="order_prefix"
                control={control}
                label="Order Number Prefix"
                placeholder="e.g., PC, CAFE (optional)"
                maxLength={10}
                error={errors.order_prefix}
                disabled={isSaving}
                helperText="Used for order numbers like #PC-0001"
              />
              {/* Description */}
              <TextAreaField
                name="description"
                control={control}
                label="Description"
                placeholder="Describe your shop"
                rows={3}
                error={errors.description}
                disabled={isSaving}
              />
              {/* Location */}
              <TextField
                name="location"
                control={control}
                label="Location"
                placeholder="e.g., New York, NY"
                error={errors.location}
                disabled={isSaving}
              />
              {/* Currency */}
              <SelectField
                name="currency_code"
                control={control}
                label="Currency"
                placeholder="Select currency"
                required
                options={CURRENCY_OPTIONS}
                error={errors.currency_code}
                disabled={isSaving}
              />
              {/* Logo/Image Upload */}
              <ImageUploadSection>
                <SectionTitle>Shop Logo</SectionTitle>
                <ImageUpload
                  value={currentImageUrl}
                  onFileSelect={(file) => {
                    console.log('📁 File selected in ImageUpload:', {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                    });
                    setSelectedFile(file);
                    setValue('image_url', 'pending_upload', { shouldDirty: true });
                  }}
                  onRemove={() => {
                    console.log('🗑️ Image removed');
                    setSelectedFile(null);
                    setValue('image_url', '', { shouldDirty: true });
                  }}
                  disabled={isSaving}
                />
              </ImageUploadSection>
            </FormSection>

            {/* Submit Button */}
            <ButtonContainer>
              <SaveButton
                isSaving={isSaving}
                disabled={!isDirty && !isNew}
                label={isNew ? 'Create Shop' : 'Save Changes'}
                expand="block"
                type="submit"
              />
            </ButtonContainer>
          </FormContainer>
        </form>

        {/* Danger Zone */}
        {currentShop && (
          <>
            <IonCard
              className="flat-card"
              style={{ marginTop: '16px', border: '1px solid var(--ion-color-danger)' }}
            >
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonLabel>
                      <h2>Delete Shop</h2>
                      <p>Permanently delete this shop and all its data</p>
                    </IonLabel>
                    <IonButton
                      color="danger"
                      fill="solid"
                      size="default"
                      onClick={() => setShowDeleteAlert(true)}
                    >
                      <IonIcon slot="start" icon={trashOutline} />
                      Delete
                    </IonButton>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            <DeleteConfirmationAlert
              isOpen={showDeleteAlert}
              onDismiss={() => setShowDeleteAlert(false)}
              onConfirm={handleConfirmDelete}
              itemName={currentShop.name}
              itemType="Shop"
            />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ShopFormPage;
