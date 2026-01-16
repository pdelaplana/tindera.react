// CategoryPillScroller - Horizontal category pills for mobile view

import { IonButton, IonIcon } from '@ionic/react';
import { chevronBack, chevronForward, settingsOutline } from 'ionicons/icons';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Chip } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';
import type { ProductCategory } from '@/types';

interface CategoryPillScrollerProps {
	categories: ProductCategory[];
	selectedId: string | null;
	onSelect: (categoryId: string | null) => void;
	showAll?: boolean;
	allLabel?: string;
	showManageButton?: boolean;
	onManageClick?: () => void;
	className?: string;
}

const Container = styled.div`
	position: relative;
	width: 100%;
	display: flex;
	align-items: center;
	gap: ${designSystem.spacing.sm};
	
`;

const ScrollerContainer = styled.div`
	display: flex;
	gap: ${designSystem.spacing.sm};
	overflow-x: auto;
	overflow-y: hidden;
	padding: ${designSystem.spacing.lg} 0;
	margin: 0 ${designSystem.spacing.md};
	-webkit-overflow-scrolling: touch;
	scrollbar-width: none;
	flex: 1;
	scroll-behavior: smooth;

	&::-webkit-scrollbar {
		display: none;
	}
`;

const ArrowButton = styled(IonButton)<{ $visible: boolean; $position: 'left' | 'right' }>`
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	${(props) => (props.$position === 'left' ? 'left: 0;' : 'right: 0;')}
	z-index: 10;
	opacity: ${(props) => (props.$visible ? 1 : 0)};
	pointer-events: ${(props) => (props.$visible ? 'auto' : 'none')};
	transition: opacity 0.2s;
	min-width: 32px;
	width: 32px;
	height: 32px;
	--padding-start: 0;
	--padding-end: 0;
	margin: 0 ${designSystem.spacing.sm};
	background: ${designSystem.colors.surface.elevated};
	box-shadow: ${designSystem.shadows.sm};
	border-radius: ${designSystem.borderRadius.full};
`;

export const CategoryPillScroller: React.FC<CategoryPillScrollerProps> = ({
	categories,
	selectedId,
	onSelect,
	showAll = true,
	allLabel = 'All',
	showManageButton = false,
	onManageClick,
	className = '',
}) => {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(false);

	const checkScroll = useCallback(() => {
		const scroller = scrollerRef.current;
		if (!scroller) return;

		const { scrollLeft, scrollWidth, clientWidth } = scroller;
		setShowLeftArrow(scrollLeft > 0);
		setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
	}, []);

	useEffect(() => {
		// Use setTimeout to ensure DOM has fully rendered
		const timeoutId = setTimeout(() => {
			checkScroll();
		}, 100);

		const scroller = scrollerRef.current;
		if (scroller) {
			scroller.addEventListener('scroll', checkScroll);
		}
		window.addEventListener('resize', checkScroll);

		return () => {
			clearTimeout(timeoutId);
			if (scroller) {
				scroller.removeEventListener('scroll', checkScroll);
			}
			window.removeEventListener('resize', checkScroll);
		};
	}, [checkScroll]);

	// Re-check scroll state when categories change
	useEffect(() => {
		// Delay to ensure content has rendered
		const timeoutId = setTimeout(() => {
			checkScroll();
		}, 50);
		return () => clearTimeout(timeoutId);
	}, [checkScroll]);

	const scrollLeft = () => {
		scrollerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
	};

	const scrollRight = () => {
		scrollerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
	};

	return (
		<Container className={className}>
			<ScrollerContainer ref={scrollerRef}>
				{showAll && (
					<Chip label={allLabel} active={selectedId === null} onClick={() => onSelect(null)} />
				)}

				{categories.map((category) => (
					<Chip
						key={category.id}
						label={category.description || category.name}
						active={selectedId === category.id}
						onClick={() => onSelect(category.id)}
					/>
				))}
			</ScrollerContainer>

			<ArrowButton
				fill="clear"
				size="small"
				onClick={scrollLeft}
				$visible={showLeftArrow}
				$position="left"
				aria-label="Scroll left"
			>
				<IonIcon icon={chevronBack} size="small" />
			</ArrowButton>

			<ArrowButton
				fill="clear"
				size="small"
				onClick={scrollRight}
				$visible={showRightArrow}
				$position="right"
				aria-label="Scroll right"
			>
				<IonIcon icon={chevronForward} />
			</ArrowButton>

			{showManageButton && onManageClick && (
				<IonButton fill="clear" size="small" onClick={onManageClick}>
					<IonIcon icon={settingsOutline} />
				</IonButton>
			)}
		</Container>
	);
};

export default CategoryPillScroller;
