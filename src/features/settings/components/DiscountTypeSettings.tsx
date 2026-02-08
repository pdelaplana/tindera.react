// DiscountTypeSettings - Manage discount types

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
  useCreateDiscountType,
  useDeleteDiscountType,
  useDiscountTypes,
  useUpdateDiscountType,
} from '@/hooks/useDiscountTypes';
import type { DiscountType } from '@/types';

const DiscountTypeSettings: React.FC = () => {
  const { data: discountTypes = [], isLoading } = useDiscountTypes(true); // Include inactive
  const createDiscountType = useCreateDiscountType();
  const updateDiscountType = useUpdateDiscountType();
  const deleteDiscountType = useDeleteDiscountType();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DiscountType | null>(null);

  const handleAddDiscountType = async () => {
    if (!newTypeName.trim()) return;

    await createDiscountType.mutateAsync({ name: newTypeName.trim() });
    setNewTypeName('');
    setShowAddForm(false);
  };

  const handleToggleActive = async (discountType: DiscountType) => {
    await updateDiscountType.mutateAsync({
      discountTypeId: discountType.id,
      updates: { is_active: !discountType.is_active },
    });
  };

  const handleStartEdit = (discountType: DiscountType) => {
    setEditingId(discountType.id);
    setEditName(discountType.name);
  };

  const handleSaveEdit = async (discountTypeId: string) => {
    if (!editName.trim()) return;

    await updateDiscountType.mutateAsync({
      discountTypeId,
      updates: { name: editName.trim() },
    });
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDeleteDiscountType = async () => {
    if (!deleteTarget) return;
    await deleteDiscountType.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <IonCard className="flat-card">
        <IonCardContent>
          <p>Loading discount types...</p>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <>
      <IonCard className="flat-card">
        <IonCardContent>
          <IonList lines="none">
            {discountTypes.map((discountType) => (
              <IonItem key={discountType.id}>
                {editingId === discountType.id ? (
                  <>
                    <IonInput
                      value={editName}
                      placeholder="Discount type name"
                      onIonInput={(e) => setEditName(e.detail.value || '')}
                      style={{ flex: 1 }}
                    />
                    <IonButton
                      fill="clear"
                      color="success"
                      onClick={() => handleSaveEdit(discountType.id)}
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
                      <h2>{discountType.name}</h2>
                    </IonLabel>
                    {discountType.is_system && (
                      <IonBadge color="primary" style={{ marginRight: '8px' }}>
                        System
                      </IonBadge>
                    )}
                    {!discountType.is_active && (
                      <IonBadge color="medium" style={{ marginRight: '8px' }}>
                        Inactive
                      </IonBadge>
                    )}
                    <IonToggle
                      checked={discountType.is_active}
                      onIonChange={() => handleToggleActive(discountType)}
                      style={{ marginRight: '8px' }}
                    />
                    <IonButton fill="clear" onClick={() => handleStartEdit(discountType)}>
                      <IonIcon icon={createOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => setDeleteTarget(discountType)}
                      disabled={discountType.is_system}
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
                value={newTypeName}
                placeholder="Discount type name (e.g., Member Discount)"
                onIonInput={(e) => setNewTypeName(e.detail.value || '')}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <IonButton expand="block" onClick={handleAddDiscountType}>
                  <IonIcon icon={checkmarkOutline} slot="start" />
                  Save
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTypeName('');
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
              Add Discount Type
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>

      <DeleteConfirmationAlert
        isOpen={!!deleteTarget}
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDiscountType}
        itemName={deleteTarget?.name || ''}
        itemType="Discount Type"
      />
    </>
  );
};

export default DiscountTypeSettings;
