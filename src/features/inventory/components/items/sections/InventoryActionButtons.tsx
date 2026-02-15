// Inventory Action Buttons Component - Circular action buttons for inventory management

import { IonButton, IonIcon } from '@ionic/react';
import { arrowDownSharp, list, swapVerticalSharp } from 'ionicons/icons';
import type React from 'react';
import { Div } from '@/components/shared/base/Div';

interface InventoryActionButtonsProps {
  /** Handler for receive button click */
  onReceive: () => void;
  /** Handler for adjust button click */
  onAdjust: () => void;
  /** Handler for initiate count button click */
  onInitiateCount: () => void;
  /** Whether buttons should be disabled */
  disabled?: boolean;
}

const InventoryActionButtons: React.FC<InventoryActionButtonsProps> = ({
  onReceive,
  onAdjust,
  onInitiateCount,
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
          onClick={onReceive}
          disabled={disabled}
          title="Receive Inventory"
          style={{
            '--border-radius': '50%',
            width: '56px',
            height: '56px',
          }}
        >
          <IonIcon slot="icon-only" icon={arrowDownSharp} />
        </IonButton>
        <Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
          Receive
        </Div>
      </Div>
      <Div className="ion-text-center">
        <IonButton
          shape="round"
          color="dark"
          onClick={onAdjust}
          disabled={disabled}
          title="Adjust Inventory"
          style={{
            '--border-radius': '50%',
            width: '56px',
            height: '56px',
          }}
        >
          <IonIcon slot="icon-only" icon={swapVerticalSharp} />
        </IonButton>
        <Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
          Adjust
        </Div>
      </Div>
      <Div className="ion-text-center">
        <IonButton
          shape="round"
          color="dark"
          onClick={onInitiateCount}
          disabled={disabled}
          title="Initiate Count"
          style={{
            '--border-radius': '50%',
            width: '56px',
            height: '56px',
          }}
        >
          <IonIcon slot="icon-only" icon={list} />
        </IonButton>
        <Div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--ion-color-medium)' }}>
          Count
        </Div>
      </Div>
    </Div>
  );
};

export default InventoryActionButtons;
