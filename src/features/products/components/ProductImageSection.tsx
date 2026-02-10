// ProductImageSection - Hero image display with "Update Photo" overlay button

import { IonIcon, IonSpinner } from '@ionic/react';
import { cameraOutline } from 'ionicons/icons';
import type React from 'react';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';
import { uploadProductImage } from '@/services/storage';
import { logger } from '@/services/sentry';

interface ProductImageSectionProps {
  imageUrl: string | null;
  productId: string;
  shopId: string;
  onImageUploaded: (url: string) => void;
  onUploadError?: (error: Error) => void;
  disabled?: boolean;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: ${designSystem.borderRadius.lg};
  overflow: hidden;
  background: ${designSystem.colors.gray[100]};
  margin-top: ${designSystem.spacing.lg};
  margin-bottom: ${designSystem.spacing.lg};
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${designSystem.colors.text.disabled};
  font-size: ${designSystem.typography.fontSize.lg};
`;

const UpdateButton = styled.button`
  position: absolute;
  bottom: ${designSystem.spacing.md};
  right: ${designSystem.spacing.md};
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
  background: ${designSystem.colors.surface.base};
  border: 1px solid ${designSystem.colors.gray[200]};
  border-radius: ${designSystem.borderRadius.md};
  cursor: pointer;
  font-size: ${designSystem.typography.fontSize.sm};
  font-weight: ${designSystem.typography.fontWeight.medium};
  color: ${designSystem.colors.text.primary};
  transition: all ${designSystem.transitions.base};
  box-shadow: ${designSystem.shadows.sm};

  &:hover {
    background: ${designSystem.colors.surface.variant};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const validateFile = (file: File): void => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }
};

const ProductImageSection: React.FC<ProductImageSectionProps> = ({
  imageUrl,
  productId,
  shopId,
  onImageUploaded,
  onUploadError,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(true);
    try {
      validateFile(file);
      const publicUrl = await uploadProductImage(file, shopId, productId);
      onImageUploaded(publicUrl);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(errorObj);
      onUploadError?.(errorObj);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (isUploading || disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <Container>
      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {imageUrl ? (
        <Image src={imageUrl} alt="Product" />
      ) : (
        <Placeholder>No product image</Placeholder>
      )}

      <UpdateButton
        onClick={handleClick}
        disabled={disabled || isUploading}
        aria-busy={isUploading}
        aria-label={isUploading ? 'Uploading product image' : 'Update product photo'}
      >
        {isUploading ? (
          <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />
        ) : (
          <IonIcon icon={cameraOutline} />
        )}
        {isUploading ? 'Uploading...' : 'Update Photo'}
      </UpdateButton>
    </Container>
  );
};

export default ProductImageSection;
