// ItemImage - Reusable image component for Products and Inventory Items

import type React from 'react';
import styled from 'styled-components';

interface ItemImageProps {
  /** Image URL to display */
  src?: string | null;
  /** Alt text for the image */
  alt: string;
  /** Maximum width of the image */
  maxWidth?: string;
  /** Maximum height of the image */
  maxHeight?: string;
  /** Border radius of the image */
  borderRadius?: string;
  /** Bottom margin */
  marginBottom?: string;
  /** Custom style object */
  style?: React.CSSProperties;
  /** Callback when image fails to load */
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const ImageContainer = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: ${(props) => props.theme.spacing?.md || '16px'};
`;

const StyledImage = styled.img<{
  $maxWidth: string;
  $maxHeight: string;
  $borderRadius: string;
}>`
	max-width: ${(props) => props.$maxWidth};
	max-height: ${(props) => props.$maxHeight};
	object-fit: contain;
	border-radius: ${(props) => props.$borderRadius};
	width: 100%;
`;

/**
 * Reusable image component for displaying product and inventory item images
 * Provides consistent styling and error handling across the application
 */
export const ItemImage: React.FC<ItemImageProps> = ({
  src,
  alt,
  maxWidth = '100%',
  maxHeight = '200px',
  borderRadius = '8px',
  marginBottom,
  style,
  onError,
}) => {
  // Don't render anything if no image URL provided
  if (!src) return null;

  return (
    <ImageContainer style={{ marginBottom }}>
      <StyledImage
        src={src}
        alt={alt}
        $maxWidth={maxWidth}
        $maxHeight={maxHeight}
        $borderRadius={borderRadius}
        style={style}
        onError={onError}
      />
    </ImageContainer>
  );
};

export default ItemImage;
