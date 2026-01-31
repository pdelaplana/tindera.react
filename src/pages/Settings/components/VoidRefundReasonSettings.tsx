// VoidRefundReasonSettings - Manage void/refund reasons

import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonToggle,
} from '@ionic/react';
import {
  addOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import {
  useCreateVoidRefundReason,
  useDeleteVoidRefundReason,
  useUpdateVoidRefundReason,
  useVoidRefundReasons,
} from '@/hooks/useVoidRefundReasons';
import type { VoidRefundReason } from '@/types';

const VoidRefundReasonSettings: React.FC = () => {
  const { data: reasons = [], isLoading } = useVoidRefundReasons(true); // Include inactive
  const createReason = useCreateVoidRefundReason();
  const updateReason = useUpdateVoidRefundReason();
  const deleteReason = useDeleteVoidRefundReason();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newReasonName, setNewReasonName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<VoidRefundReason | null>(null);

  const handleAddReason = async () => {
    if (!newReasonName.trim()) return;

    await createReason.mutateAsync({ name: newReasonName.trim() });
    setNewReasonName('');
    setShowAddForm(false);
  };

  const handleToggleActive = async (reason: VoidRefundReason) => {
    await updateReason.mutateAsync({
      reasonId: reason.id,
      updates: { is_active: !reason.is_active },
    });
  };

  const handleStartEdit = (reason: VoidRefundReason) => {
    setEditingId(reason.id);
    setEditName(reason.name);
  };

  const handleSaveEdit = async (reasonId: string) => {
    if (!editName.trim()) return;

    await updateReason.mutateAsync({
      reasonId,
      updates: { name: editName.trim() },
    });
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDeleteReason = async () => {
    if (!deleteTarget) return;
    await deleteReason.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <IonCard className="flat-card">
        <IonCardContent>
          <p>Loading void/refund reasons...</p>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <>
      <IonCard className="flat-card">
        <IonCardContent>
          <IonList lines="none">
            {reasons.map((reason) => (
              <IonItem key={reason.id}>
                {editingId === reason.id ? (
                  <>
                    <IonInput
                      value={editName}
                      placeholder="Reason name"
                      onIonInput={(e) => setEditName(e.detail.value || '')}
                      style={{ flex: 1 }}
                    />
                    <IonButton
                      fill="clear"
                      color="success"
                      onClick={() => handleSaveEdit(reason.id)}
                    >
                      <IonIcon icon={checkmarkOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton fill="clear" color="medium" onClick={handleCancelEdit}>
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                  </>
                ) : (
                  <>
                    <IonLabel>
                      <h2>{reason.name}</h2>
                    </IonLabel>
                    {reason.is_system && (
                      <IonBadge color="primary" style={{ marginRight: '8px' }}>
                        System
                      </IonBadge>
                    )}
                    {!reason.is_active && (
                      <IonBadge color="medium" style={{ marginRight: '8px' }}>
                        Inactive
                      </IonBadge>
                    )}
                    <IonToggle
                      checked={reason.is_active}
                      onIonChange={() => handleToggleActive(reason)}
                      style={{ marginRight: '8px' }}
                    />
                    <IonButton fill="clear" onClick={() => handleStartEdit(reason)}>
                      <IonIcon icon={createOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => setDeleteTarget(reason)}
                      disabled={reason.is_system}
                    >
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  </>
                )}
              </IonItem>
            ))}
          </IonList>

          {showAddForm ? (
            <div
              style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <IonInput
                value={newReasonName}
                placeholder="Reason name (e.g., Wrong Order)"
                onIonInput={(e) => setNewReasonName(e.detail.value || '')}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <IonButton expand="block" onClick={handleAddReason}>
                  <IonIcon icon={checkmarkOutline} slot="start" />
                  Save
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewReasonName('');
                  }}
                >
                  <IonIcon icon={closeOutline} slot="start" />
                  Cancel
                </IonButton>
              </div>
            </div>
          ) : (
            <IonButton
              expand="block"
              fill="outline"
              style={{ marginTop: '16px' }}
              onClick={() => setShowAddForm(true)}
            >
              <IonIcon icon={addOutline} slot="start" />
              Add Void/Refund Reason
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>

      <DeleteConfirmationAlert
        isOpen={!!deleteTarget}
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={handleDeleteReason}
        itemName={deleteTarget?.name || ''}
        itemType="Void/Refund Reason"
      />
    </>
  );
};

export default VoidRefundReasonSettings;
