// BaseModal - Unified modal component with consistent structure

import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { checkmark, close } from 'ionicons/icons';
import type React from 'react';
import type { ReactNode } from 'react';
import { CenteredLayout } from '../layouts';

interface BaseModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Callback when modal is dismissed */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Content to render in the modal */
  children: ReactNode;
  /** Show action button (e.g., save, submit) */
  showActionButton?: boolean;
  /** Action button label (default: "Save") */
  actionButtonLabel?: string;
  /** Action button icon */
  actionButtonIcon?: string;
  /** Action button click handler */
  onActionClick?: () => void;
  /** Disable action button */
  actionButtonDisabled?: boolean;
  /** Show loading spinner on action button */
  actionButtonLoading?: boolean;
  /** Additional buttons in the start slot */
  startButtons?: ReactNode;
  /** Additional buttons in the end slot (before close button) */
  endButtons?: ReactNode;
  /** Initial breakpoint for sheet-style modal (0.25, 0.5, 0.75, 1) */
  initialBreakpoint?: number;
  /** Breakpoints array for sheet-style modal */
  breakpoints?: number[];
  /** Enable scroll in content area (default: true) */
  scrollY?: boolean;
  /** Add padding to content area (default: true) */
  contentPadding?: boolean;
  /** Loading state - shows spinner in content */
  isLoading?: boolean;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom className for content */
  contentClassName?: string;
  /** Show footer with button */
  showFooterButton?: boolean;
  /** Footer button label */
  footerButtonLabel?: string;
  /** Footer button click handler */
  onFooterButtonClick?: () => void;
  /** Footer button color (default: "primary") */
  footerButtonColor?: string;
  /** Footer button fill style (default: "solid") */
  footerButtonFill?: 'clear' | 'outline' | 'solid' | 'default';
  /** Disable footer button */
  footerButtonDisabled?: boolean;
  /** Show loading spinner on footer button */
  footerButtonLoading?: boolean;
}

/**
 * BaseModal - A unified modal component with consistent structure and behavior.
 *
 * Features:
 * - Consistent header with close button
 * - Optional action button (save, submit, etc.)
 * - Configurable breakpoints for sheet-style modals
 * - Loading state support
 * - Custom buttons in header slots
 * - Scroll control
 *
 * @example
 * // Simple modal with close button
 * <BaseModal isOpen={isOpen} onClose={handleClose} title="Details">
 *   {content}
 * </BaseModal>
 *
 * @example
 * // Modal with action button and form
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Edit Item"
 *   showActionButton
 *   actionButtonLabel="Save"
 *   onActionClick={handleSubmit(onSubmit)}
 *   actionButtonDisabled={!isDirty}
 *   actionButtonLoading={isSaving}
 * >
 *   <form>{fields}</form>
 * </BaseModal>
 *
 * @example
 * // Sheet-style modal
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Options"
 *   initialBreakpoint={0.75}
 *   breakpoints={[0, 0.75, 1]}
 * >
 *   {content}
 * </BaseModal>
 */
const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showActionButton = false,
  actionButtonIcon = checkmark,
  onActionClick,
  actionButtonDisabled = false,
  actionButtonLoading = false,
  startButtons,
  endButtons,
  initialBreakpoint,
  breakpoints,
  scrollY = true,
  contentPadding = true,
  isLoading = false,
  loadingMessage = 'Loading...',
  contentClassName = '',
  showFooterButton = false,
  footerButtonLabel = 'Confirm',
  onFooterButtonClick,
  footerButtonColor = 'primary',
  footerButtonFill = 'solid',
  footerButtonDisabled = false,
  footerButtonLoading = false,
}) => {
  const modalProps: {
    isOpen: boolean;
    onDidDismiss: () => void;
    initialBreakpoint?: number;
    breakpoints?: number[];
    handle?: boolean;
  } = {
    isOpen,
    onDidDismiss: onClose,
  };

  // Only add breakpoint props if provided
  if (initialBreakpoint !== undefined) {
    modalProps.initialBreakpoint = initialBreakpoint;
  }
  if (breakpoints !== undefined) {
    modalProps.breakpoints = breakpoints;
  }

  return (
    <IonModal {...modalProps}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">{startButtons}</IonButtons>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            {endButtons}
            {showActionButton && onActionClick && (
              <IonButton
                onClick={onActionClick}
                disabled={actionButtonDisabled || actionButtonLoading}
              >
                {actionButtonLoading ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <IonIcon slot="icon-only" icon={actionButtonIcon} />
                )}
              </IonButton>
            )}
            <IonButton onClick={onClose}>
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className={contentPadding ? `ion-padding ${contentClassName}` : contentClassName}
        scrollY={scrollY}
      >
        {isLoading ? (
          <div className="ion-text-center" style={{ padding: '48px' }}>
            <IonSpinner />
            {loadingMessage && (
              <p style={{ marginTop: '16px', color: 'var(--ion-color-medium)' }}>
                {loadingMessage}
              </p>
            )}
          </div>
        ) : (
          children
        )}
      </IonContent>

      {showFooterButton && onFooterButtonClick && (
        <IonFooter>
          <IonToolbar>
            <CenteredLayout>
              <IonButton
                expand="block"
                color={footerButtonColor}
                fill={footerButtonFill}
                onClick={onFooterButtonClick}
                disabled={footerButtonDisabled || footerButtonLoading}
                style={{ margin: '8px 16px' }}
                size="large"
              >
                {footerButtonLoading && <IonSpinner name="crescent" slot="start" />}
                {footerButtonLabel}
              </IonButton>
            </CenteredLayout>
          </IonToolbar>
        </IonFooter>
      )}
    </IonModal>
  );
};

export default BaseModal;
