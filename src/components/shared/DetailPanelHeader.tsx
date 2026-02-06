// Detail Panel Header - Reusable header for right panel in master-detail layouts

import { IonButton, IonIcon } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import type React from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { designSystem } from '@/theme/designSystem';

interface DetailPanelHeaderProps {
  /** Header title text */
  title: string;
  /** Optional back button handler - if provided, back button will be shown */
  onBack?: () => void;
  /** Optional back button label for accessibility */
  backLabel?: string;
  /** Optional action buttons to show on the right side */
  actions?: ReactNode;
}

// Styled components
const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  padding: 8px 8px;
  border-bottom: 1px solid var(--ion-color-light-shade);
  background: white;
  flex-shrink: 0;
`;

const HeaderTitle = styled.h2`
  flex: 1;
  margin: 0;
  font-size: ${designSystem.typography.fontSize.lg};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  color: ${designSystem.colors.text.primary};
`;

const BackButton = styled(IonButton)`
  --padding-start: 16px;
  --padding-end: 8px;
  margin: 0;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
`;

/**
 * Reusable header component for detail panels in master-detail layouts.
 * Provides consistent styling and behavior for back navigation and actions.
 *
 * @example
 * // With back button
 * <DetailPanelHeader
 *   title="Transaction Details"
 *   onBack={() => console.log('back')}
 *   backLabel="Back to list"
 * />
 *
 * @example
 * // With actions
 * <DetailPanelHeader
 *   title="Item Details"
 *   actions={
 *     <IonButton size="small">Edit</IonButton>
 *   }
 * />
 */
export const DetailPanelHeader: React.FC<DetailPanelHeaderProps> = ({
  title,
  onBack,
  backLabel = 'Back',
  actions,
}) => {
  return (
    <Header>
      {onBack && (
        <BackButton fill="clear" onClick={onBack} aria-label={backLabel}>
          <IonIcon slot="icon-only" icon={arrowBack} />
        </BackButton>
      )}
      <HeaderTitle>{title}</HeaderTitle>
      {actions && <ActionsContainer>{actions}</ActionsContainer>}
    </Header>
  );
};
