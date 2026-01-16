// Delete Confirmation Alert - Reusable component for deletion with typed confirmation

import { IonAlert } from '@ionic/react';
import type React from 'react';
import { useState } from 'react';

interface DeleteConfirmationAlertProps {
  isOpen: boolean;
  onDismiss: () => void;
  onConfirm: () => void | Promise<void>;
  itemName: string;
  itemType?: string;
  header?: string;
  message?: string;
  requireConfirmation?: boolean;
}

const DeleteConfirmationAlert: React.FC<DeleteConfirmationAlertProps> = ({
  isOpen,
  onDismiss,
  onConfirm,
  itemName,
  itemType = 'item',
  header,
  message,
  requireConfirmation = true,
}) => {
  const [confirmationText, setConfirmationText] = useState('');

  const handleDismiss = () => {
    setConfirmationText('');
    onDismiss();
  };

  const handleConfirm = async (alertData: { confirmationInput?: string }) => {
    if (requireConfirmation) {
      const enteredName = alertData.confirmationInput?.trim() || '';

      if (enteredName === itemName) {
        await onConfirm();
        setConfirmationText('');
        return true;
      }

      // Return false to keep alert open when names don't match
      return false;
    }

    // If confirmation not required, just execute onConfirm
    await onConfirm();
    setConfirmationText('');
    return true;
  };

  const defaultHeader = header || `Delete ${itemType}`;
  const defaultMessage =
    message ||
    (requireConfirmation
      ? `This action cannot be undone. To confirm, please type the ${itemType.toLowerCase()} name: "${itemName}"`
      : `Are you sure you want to delete "${itemName}"? This action cannot be undone.`);

  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={handleDismiss}
      header={defaultHeader}
      message={defaultMessage}
      inputs={
        requireConfirmation
          ? [
              {
                name: 'confirmationInput',
                type: 'text',
                placeholder: `Enter ${itemType.toLowerCase()} name`,
                value: confirmationText,
                cssClass: 'alert-input-outline',
                attributes: {
                  style: {
                    border: '1px solid var(--ion-color-medium)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginTop: '8px',
                  },
                },
              },
            ]
          : []
      }
      buttons={[
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            setConfirmationText('');
          },
        },
        {
          text: 'Delete',
          cssClass: 'alert-button-danger',
          role: 'destructive',
          handler: handleConfirm,
        },
      ]}
    />
  );
};

export default DeleteConfirmationAlert;
