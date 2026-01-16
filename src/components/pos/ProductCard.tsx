// ProductCard - Tappable product card for POS grid

import { IonImg } from '@ionic/react';
import React from 'react';
import styled from 'styled-components';
import { PriceDisplay } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';
import type { Product } from '@/types';

interface ProductCardProps {
	product: Product;
	currency?: string;
	onTap?: () => void;
	onLongPress?: () => void;
	className?: string;
}

// Styled ProductCard extends the base Card styling
const StyledProductCard = styled.div`
	background: ${designSystem.colors.surface.elevated};
	border-radius: ${designSystem.borderRadius.lg};
	box-shadow: ${designSystem.shadows.md};
	padding: ${designSystem.spacing.md};
	margin: 0;
	cursor: pointer;
	transition: all 0.2s ease;
	user-select: none;
	-webkit-tap-highlight-color: transparent;

	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};

	&:hover {
		box-shadow: ${designSystem.shadows.lg};
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
		box-shadow: ${designSystem.shadows.md};
	}
`;

const ProductImage = styled.div`
	width: 100%;
	aspect-ratio: 1;
	border-radius: ${designSystem.borderRadius.md};
	overflow: hidden;
	background: ${designSystem.colors.gray[100]};
	display: flex;
	align-items: center;
	justify-content: center;

	ion-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
`;

const ProductName = styled.div`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
	line-height: 1.3;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
`;

const ProductPrice = styled.div`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.brand.primary};
	margin-top: auto;
`;

export const ProductCard: React.FC<ProductCardProps> = ({
	product,
	currency = 'USD',
	onTap,
	onLongPress,
	className = '',
}) => {
	const longPressRef = React.useRef<NodeJS.Timeout | null>(null);
	const isLongPress = React.useRef(false);

	const handleTouchStart = () => {
		isLongPress.current = false;
		longPressRef.current = setTimeout(() => {
			isLongPress.current = true;
			onLongPress?.();
		}, 500);
	};

	const handleTouchEnd = () => {
		if (longPressRef.current) {
			clearTimeout(longPressRef.current);
		}
		if (!isLongPress.current) {
			onTap?.();
		}
	};

	const handleTouchMove = () => {
		if (longPressRef.current) {
			clearTimeout(longPressRef.current);
		}
	};

	return (
		<StyledProductCard
			className={className}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			onTouchMove={handleTouchMove}
			onMouseDown={handleTouchStart}
			onMouseUp={handleTouchEnd}
			onMouseLeave={handleTouchMove}
			role="button"
			tabIndex={0}
			onKeyPress={(e) => e.key === 'Enter' && onTap?.()}
		>
			<ProductImage>
				{product.image_url ? <IonImg src={product.image_url} alt={product.name} /> : null}
			</ProductImage>

			<ProductName>{product.name}</ProductName>

			<ProductPrice>
				<PriceDisplay amount={product.price} currency={currency} />
			</ProductPrice>
		</StyledProductCard>
	);
};

export default ProductCard;
