// Detail Panel Header - Reusable header for right panel in master-detail layouts

import { IonButton, IonIcon } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import React, { type ReactNode } from 'react';
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
  /** Optional icon to show before the title */
  icon?: string;
  /** Optional breadcrumb items to show above the title */
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
}

// Styled components
const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.sm};
  padding: ${designSystem.spacing.md} ${designSystem.spacing.md};
  border-bottom: 1px solid var(--ion-color-light-shade);
  background: white;
  flex-shrink: 0;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${designSystem.borderRadius.md};
  background: ${designSystem.colors.brand.primary};
  color: white;
  flex-shrink: 0;

  ion-icon {
    font-size: 18px;
  }
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
  font-size: ${designSystem.typography.fontSize.base};
  color: ${designSystem.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  flex: 1;
`;

const BreadcrumbItem = styled.button<{ isClickable: boolean; isLast: boolean }>`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-size: inherit;
  font-weight: ${(props) =>
    props.isLast
      ? designSystem.typography.fontWeight.semibold
      : designSystem.typography.fontWeight.normal};
  color: ${(props) =>
    props.isClickable
      ? designSystem.colors.brand.primary
      : props.isLast
        ? designSystem.colors.text.primary
        : designSystem.colors.text.secondary};
  cursor: ${(props) => (props.isClickable ? 'pointer' : 'default')};
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    text-decoration: ${(props) => (props.isClickable ? 'underline' : 'none')};
  }
`;

const BreadcrumbSeparator = styled.span`
  color: ${designSystem.colors.text.secondary};
  flex-shrink: 0;
  margin: 0 ${designSystem.spacing.xs};
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
 * Provides consistent styling and behavior for back navigation, breadcrumbs, icons, and actions.
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
 * // With icon and breadcrumbs
 * <DetailPanelHeader
 *   title="Item Details"
 *   icon={cubeOutline}
 *   breadcrumbs={[
 *     { label: 'Inventory', onClick: () => console.log('go to inventory') },
 *     { label: 'Item Name' }
 *   ]}
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
  icon,
  breadcrumbs,
}) => {
  return (
    <Header>
      {onBack && (
        <BackButton fill="clear" onClick={onBack} aria-label={backLabel}>
          <IonIcon slot="icon-only" icon={arrowBack} />
        </BackButton>
      )}

      {icon && (
        <IconWrapper>
          <IonIcon icon={icon} />
        </IconWrapper>
      )}

      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <BreadcrumbSeparator>›</BreadcrumbSeparator>}
              <BreadcrumbItem
                isClickable={!!crumb.onClick}
                isLast={index === breadcrumbs.length - 1}
                onClick={crumb.onClick}
                disabled={!crumb.onClick}
              >
                {crumb.label}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </Breadcrumbs>
      ) : (
        <Breadcrumbs>
          <BreadcrumbItem isClickable={false} isLast={true} disabled>
            {title}
          </BreadcrumbItem>
        </Breadcrumbs>
      )}

      {actions && <ActionsContainer>{actions}</ActionsContainer>}
    </Header>
  );
};
