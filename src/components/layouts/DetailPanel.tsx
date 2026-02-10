// DetailPanel - Base layout component for the detail (right) panel in MasterDetailLayout

import type React from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { DetailPanelHeader } from '@/components/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { designSystem } from '@/theme/designSystem';

export interface DetailPanelProps {
  // Header props
  title: string;
  icon?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  onBack?: () => void;
  actions?: ReactNode;

  // Content slots
  children: ReactNode;
  /** Rendered inside scroll area when isLoading=true. Defaults to LoadingSpinner. */
  loadingSlot?: ReactNode;
  /** Rendered inside EmptyState when isEmpty=true. */
  emptySlot?: ReactNode;

  // State flags
  isLoading?: boolean;
  isEmpty?: boolean;

  // Layout options
  /** Wraps children in a scrollable container. Default: true. Set to false when content manages its own scroll. */
  scrollable?: boolean;
  className?: string;
}

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  width: 100%;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${designSystem.spacing.xl};
  text-align: center;
`;

export const DetailPanel: React.FC<DetailPanelProps> = ({
  title,
  icon,
  breadcrumbs,
  onBack,
  actions,
  children,
  loadingSlot,
  emptySlot,
  isLoading = false,
  isEmpty = false,
  scrollable = true,
  className,
}) => {
  const renderContent = () => {
    if (isLoading) return loadingSlot ?? <LoadingSpinner />;
    if (isEmpty) return <EmptyState>{emptySlot}</EmptyState>;
    return children;
  };

  return (
    <Container className={className}>
      <DetailPanelHeader
        title={title}
        icon={icon}
        breadcrumbs={breadcrumbs}
        onBack={onBack}
        actions={actions}
      />
      {scrollable ? <ScrollContent>{renderContent()}</ScrollContent> : renderContent()}
    </Container>
  );
};
