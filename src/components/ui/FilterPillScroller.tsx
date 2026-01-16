// FilterPillScroller - Generic horizontal filter pills with scroll support

import { IonButton, IonIcon } from '@ionic/react';
import { chevronBack, chevronForward, settingsOutline } from 'ionicons/icons';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Chip } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';
import type { FilterOption } from '@/types';

interface FilterPillScrollerProps {
	filters: FilterOption[];
	selectedId: string;
	onSelect: (filterId: string) => void;
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
	padding: ${designSystem.spacing.md} 0;
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

const Separator = styled.div`
	width: 1px;
	height: 24px;
	background: ${designSystem.colors.gray[300]};
	margin: 0 ${designSystem.spacing.xs};
	flex-shrink: 0;
`;

export const FilterPillScroller: React.FC<FilterPillScrollerProps> = ({
	filters,
	selectedId,
	onSelect,
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

	// Re-check scroll state when filters change
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
				{filters.map((filter, index) => (
					<>
						<Chip
							key={filter.id}
							label={filter.label}
							active={selectedId === filter.id}
							onClick={() => onSelect(filter.id)}
						/>
						{filter.separator && index < filters.length - 1 && <Separator key={`sep-${filter.id}`} />}
					</>
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

export default FilterPillScroller;
