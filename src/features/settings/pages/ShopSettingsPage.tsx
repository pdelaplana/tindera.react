// Shop Settings Page - Edit current shop details

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';
import { z } from 'zod';
import { BasePage } from '@/components/layouts';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { SelectField, TextAreaField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { ImageUpload } from '@/components/ui';
import { useDeleteShop, useShop, useUpdateShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { uploadShopLogo } from '@/services/storage';
import type { ShopUpdate } from '@/types';
import {
  ButtonContainer,
  FormContainer,
  FormSection,
  ImageUploadSection,
  SectionTitle,
} from '@/features/shop/pages/ShopFormPage.styles';

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
  shopId: string;
}

const ShopSettingsPage: React.FC = () => {
  const { shopId } = useParams<RouteParams>();
  const history = useHistory();
  const { shops, currentShop } = useShop();

  const updateShop = useUpdateShop();
  const deleteShopMutation = useDeleteShop();
  const { showSuccess, showError } = useToastNotification();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

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

  const currentImageUrl = watch('image_url');

  // Load shop data
  useEffect(() => {
    const shop = shops.find((s) => s.id === shopId) || currentShop;
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
  }, [shopId, shops, currentShop, reset]);

  const onSubmit = async (data: ShopFormData) => {
    try {
      setIsSaving(true);

      let imageUrl = data.image_url;

      if (selectedFile) {
        try {
          imageUrl = await uploadShopLogo(selectedFile, shopId);
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error ? uploadError.message : 'Failed to upload image'
          );
        }
      }

      const cleanData = {
        ...data,
        description: data.description || null,
        location: data.location || null,
        order_prefix: data.order_prefix || null,
        image_url: imageUrl || null,
      };

      await updateShop.mutateAsync({
        shopId,
        data: cleanData as ShopUpdate,
      });
      showSuccess('Shop updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update shop';
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <BasePage
      title="Edit Shop Details"
      backHref={`/shops/${shopId}/settings`}
      endButtons={
        <SaveButton
          isSaving={isSaving}
          disabled={!isDirty}
          onClick={handleSubmit(onSubmit)}
          iconOnly
        />
      }
    >
      <div className="ion-padding">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormContainer>
            <FormSection>
              <SectionTitle>Shop Information</SectionTitle>

              <TextField
                name="name"
                control={control}
                label="Shop Name"
                placeholder="Enter shop name"
                required
                error={errors.name}
                disabled={isSaving}
              />
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
              <TextAreaField
                name="description"
                control={control}
                label="Description"
                placeholder="Describe your shop"
                rows={3}
                error={errors.description}
                disabled={isSaving}
              />
              <TextField
                name="location"
                control={control}
                label="Location"
                placeholder="e.g., New York, NY"
                error={errors.location}
                disabled={isSaving}
              />
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
              <ImageUploadSection>
                <SectionTitle>Shop Logo</SectionTitle>
                <ImageUpload
                  value={currentImageUrl}
                  onFileSelect={(file) => {
                    setSelectedFile(file);
                    setValue('image_url', 'pending_upload', { shouldDirty: true });
                  }}
                  onRemove={() => {
                    setSelectedFile(null);
                    setValue('image_url', '', { shouldDirty: true });
                  }}
                  disabled={isSaving}
                />
              </ImageUploadSection>
            </FormSection>

            <ButtonContainer>
              <SaveButton
                isSaving={isSaving}
                disabled={!isDirty}
                label="Save Changes"
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
      </div>
    </BasePage>
  );
};

export default ShopSettingsPage;
