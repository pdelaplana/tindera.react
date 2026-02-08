// Modifier Group Action Buttons Component - Circular action buttons for modifier group management

import { IonButton, IonIcon } from '@ionic/react';
import { addCircleOutline, createOutline, ellipsisHorizontal } from 'ionicons/icons';
import type React from 'react';
import { Div } from '@/components/shared/base/Div';

interface ModifierGroupActionButtonsProps {
  /** Handler for edit group button click */
  onEditGroup: () => void;
  /** Handler for add modifier button click */
  onAddModifier: () => void;
  /** Handler for options button click */
  onOptions: () => void;
  /** Whether buttons should be disabled */
  disabled?: boolean;
}

const ModifierGroupActionButtons: React.FC<ModifierGroupActionButtonsProps> = ({
  onEditGroup,
  onAddModifier,
  onOptions,
  disabled = false,
}) => {
  return (
    <Div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <Div className="ion-text-center">
        <IonButton
          shape="round"
          color="dark"
          onClick={onEditGroup}
          disabled={disabled}
          title="Edit Group Details"
          aria-label="Edit modifier group details"
          style={{
            '--border-radius': '50%',
            width: '56px',
            height: '56px',
          }}
        >
          <IonIcon slot="icon-only" icon={createOutline} />
        </IonButton>
        <Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
          Edit
        </Div>
      </Div>
      <Div className="ion-text-center">
        <IonButton
          shape="round"
          color="dark"
          onClick={onAddModifier}
          disabled={disabled}
          title="Add Modifier"
          aria-label="Add modifier to group"
          style={{
            '--border-radius': '50%',
            width: '56px',
            height: '56px',
          }}
        >
          <IonIcon slot="icon-only" icon={addCircleOutline} />
        </IonButton>
        <Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
          Add Modifier
        </Div>
      </Div>
      <Div className="ion-text-center">
        <IonButton
          shape="round"
          color="dark"
          onClick={onOptions}
          title="More Options"
          aria-label="More options"
          style={{
            '--border-radius': '50%',
            width: '56px',
            height: '56px',
          }}
        >
          <IonIcon slot="icon-only" icon={ellipsisHorizontal} />
        </IonButton>
        <Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
          Options
        </Div>
      </Div>
    </Div>
  );
};

export default ModifierGroupActionButtons;
