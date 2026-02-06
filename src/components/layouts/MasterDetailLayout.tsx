// MasterDetailLayout - Reusable responsive master-detail split pane layout
// Used for list pages with detail panels (Sales, Products, etc.)

import type React from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { useIsTabletOrLarger } from '@/hooks/useBreakpoint';

// Styled components for split-pane layout
const SplitPaneContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const LeftPanel = styled.div`
  flex: 0 0 400px;
  border-right: 1px solid var(--ion-color-light-shade);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0x;
  background: var(--ion-color-light);
`;

const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px;
  text-align: center;
  color: var(--ion-color-medium);
  gap: 8px;
`;

interface MasterDetailLayoutProps {
  /** Content for the left panel (search, filters, list) */
  leftPanel: ReactNode;
  /** Content for the right panel (detail view) - desktop only */
  rightPanel: ReactNode;
  /** Whether to show right panel padding (default: true) */
  rightPanelPadding?: boolean;
}

/**
 * Responsive master-detail layout component
 * - Desktop: Shows split pane with left list and right detail panel
 * - Mobile: Shows only left panel content (list view)
 */
export const MasterDetailLayout: React.FC<MasterDetailLayoutProps> = ({
  leftPanel,
  rightPanel,
}) => {
  const isDesktop = useIsTabletOrLarger();

  // Desktop layout with split pane
  if (isDesktop) {
    return (
      <SplitPaneContainer>
        <LeftPanel>{leftPanel}</LeftPanel>
        <RightPanel>{rightPanel}</RightPanel>
      </SplitPaneContainer>
    );
  }

  // Mobile layout with full-width list
  return <MobileContainer>{leftPanel}</MobileContainer>;
};
