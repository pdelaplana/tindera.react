// DeleteButton Component - Reusable delete button with loading state

import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import type React from 'react';

interface DeleteButtonProps {
  /** Whether the button is currently deleting/loading */
  isDeleting: boolean;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Text to display when not deleting */
  label?: string;
  /** Text to display when deleting */
  deletingLabel?: string;
  /** Button expand mode */
  expand?: 'block' | 'full';
  /** Button size */
  size?: 'small' | 'default' | 'large';
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Click handler */
  onClick?: () => void;
  /** Custom icon (defaults to trash icon) */
  icon?: string;
  /** Whether to show only icon (no text) */
  iconOnly?: boolean;
  /** Button fill style */
  fill?: 'clear' | 'outline' | 'solid';
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  isDeleting,
  disabled = false,
  label = 'Delete',
  deletingLabel = 'Deleting...',
  expand,
  size = 'default',
  type = 'button',
  onClick,
  icon = trashOutline,
  iconOnly = false,
  fill = 'outline',
}) => {
  return (
    <IonButton
      expand={expand}
      type={type}
      disabled={disabled || isDeleting}
      size={size}
      onClick={onClick}
      color="danger"
      fill={fill}
    >
      {iconOnly ? (
        isDeleting ? (
          <IonSpinner name="crescent" />
        ) : (
          <IonIcon slot="icon-only" icon={icon} />
        )
      ) : (
        <>
          {isDeleting ? (
            <IonSpinner slot="start" name="crescent" style={{ fontSize: '1rem' }} />
          ) : (
            <IonIcon slot="start" icon={icon} />
          )}
          {isDeleting ? deletingLabel : label}
        </>
      )}
    </IonButton>
  );
};
