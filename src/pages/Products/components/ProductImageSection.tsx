// ProductImageSection - Hero image display with "Update Photo" overlay button

import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { camera } from 'ionicons/icons';
import type React from 'react';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { uploadProductImage } from '@/services/storage';
import { designSystem } from '@/theme/designSystem';

interface ProductImageSectionProps {
  imageUrl?: string | null;
  productId?: string;
  onImageUploaded: (publicUrl: string) => void;
  disabled?: boolean;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  background: ${designSystem.colors.gray[100]};
  border-radius: ${designSystem.borderRadius.lg};
  overflow: hidden;
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlaceholderContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${designSystem.colors.text.disabled};
  gap: ${designSystem.spacing.sm};
`;

const PlaceholderIcon = styled(IonIcon)`
  font-size: 64px;
`;

const PlaceholderText = styled.div`
  font-size: ${designSystem.typography.fontSize.sm};
`;

const UpdateButton = styled(IonButton)`
  position: absolute;
  bottom: ${designSystem.spacing.md};
  right: ${designSystem.spacing.md};
  z-index: 1;
`;

const HiddenInput = styled.input`
  display: none;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${designSystem.spacing.sm};
  color: ${designSystem.colors.text.inverse};
  z-index: 2;
`;

const LoadingText = styled.div`
  font-size: ${designSystem.typography.fontSize.base};
  font-weight: ${designSystem.typography.fontWeight.medium};
`;

const ProductImageSection: React.FC<ProductImageSectionProps> = ({
  imageUrl,
  productId,
  onImageUploaded,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentShop } = useShop();
  const { showSuccess, showError } = useToastNotification();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentShop?.id) {
      if (!currentShop?.id) {
        showError('No shop selected');
      }
      return;
    }

    setIsUploading(true);

    try {
      const publicUrl = await uploadProductImage(file, currentShop.id, productId);
      onImageUploaded(publicUrl);
      showSuccess('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      showError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <Container>
      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {imageUrl ? (
        <HeroImage src={imageUrl} alt="Product" />
      ) : (
        <PlaceholderContainer>
          <PlaceholderIcon icon={camera} />
          <PlaceholderText>No image</PlaceholderText>
        </PlaceholderContainer>
      )}

      <UpdateButton
        fill="solid"
        color="primary"
        size="small"
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
      >
        <IonIcon slot="start" icon={camera} />
        Update Photo
      </UpdateButton>

      {isUploading && (
        <LoadingOverlay>
          <IonSpinner name="crescent" color="light" />
          <LoadingText>Uploading...</LoadingText>
        </LoadingOverlay>
      )}
    </Container>
  );
};

export default ProductImageSection;
