// TaxSettings - Manage shop taxes

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
  useCreateShopTax,
  useDeleteShopTax,
  useShopTaxes,
  useUpdateShopTax,
} from '@/hooks/useShopTaxes';
import type { ShopTax } from '@/types';

const TaxSettings: React.FC = () => {
  const { data: taxes = [], isLoading } = useShopTaxes(true); // Include inactive
  const createTax = useCreateShopTax();
  const updateTax = useUpdateShopTax();
  const deleteTax = useDeleteShopTax();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ShopTax | null>(null);

  const handleAddTax = async () => {
    if (!newTaxName.trim() || !newTaxRate.trim()) return;

    const rate = parseFloat(newTaxRate) / 100; // Convert percentage to decimal
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      alert('Please enter a valid tax rate between 0 and 100');
      return;
    }

    await createTax.mutateAsync({ name: newTaxName.trim(), rate });
    setNewTaxName('');
    setNewTaxRate('');
    setShowAddForm(false);
  };

  const handleToggleActive = async (tax: ShopTax) => {
    await updateTax.mutateAsync({
      taxId: tax.id,
      updates: { is_active: !tax.is_active },
    });
  };

  const handleStartEdit = (tax: ShopTax) => {
    setEditingId(tax.id);
    setEditName(tax.name);
    setEditRate((tax.rate * 100).toFixed(2)); // Convert to percentage
  };

  const handleSaveEdit = async (taxId: string) => {
    if (!editName.trim() || !editRate.trim()) return;

    const rate = parseFloat(editRate) / 100;
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      alert('Please enter a valid tax rate between 0 and 100');
      return;
    }

    await updateTax.mutateAsync({
      taxId,
      updates: { name: editName.trim(), rate },
    });
    setEditingId(null);
    setEditName('');
    setEditRate('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRate('');
  };

  const handleDeleteTax = async () => {
    if (!deleteTarget) return;
    await deleteTax.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <IonCard className="flat-card">
        <IonCardContent>
          <p>Loading taxes...</p>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <>
      <IonCard className="flat-card">
        <IonCardContent>
          <IonList lines="none">
            {taxes.map((tax) => (
              <IonItem key={tax.id}>
                {editingId === tax.id ? (
                  <>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <IonInput
                        value={editName}
                        placeholder="Tax name"
                        onIonInput={(e) => setEditName(e.detail.value || '')}
                      />
                      <IonInput
                        type="number"
                        value={editRate}
                        placeholder="Rate (%)"
                        onIonInput={(e) => setEditRate(e.detail.value || '')}
                      />
                    </div>
                    <IonButton fill="clear" color="success" onClick={() => handleSaveEdit(tax.id)}>
                      <IonIcon icon={checkmarkOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton fill="clear" color="medium" onClick={handleCancelEdit}>
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                  </>
                ) : (
                  <>
                    <IonLabel>
                      <h2>{tax.name}</h2>
                      <p>{(tax.rate * 100).toFixed(2)}%</p>
                    </IonLabel>
                    {!tax.is_active && (
                      <IonBadge color="medium" style={{ marginRight: '8px' }}>
                        Inactive
                      </IonBadge>
                    )}
                    <IonToggle
                      checked={tax.is_active}
                      onIonChange={() => handleToggleActive(tax)}
                      style={{ marginRight: '8px' }}
                    />
                    <IonButton fill="clear" onClick={() => handleStartEdit(tax)}>
                      <IonIcon icon={createOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton fill="clear" color="danger" onClick={() => setDeleteTarget(tax)}>
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
                value={newTaxName}
                placeholder="Tax name (e.g., Sales Tax)"
                onIonInput={(e) => setNewTaxName(e.detail.value || '')}
              />
              <IonInput
                type="number"
                value={newTaxRate}
                placeholder="Rate (e.g., 6 for 6%)"
                onIonInput={(e) => setNewTaxRate(e.detail.value || '')}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <IonButton expand="block" onClick={handleAddTax}>
                  <IonIcon icon={checkmarkOutline} slot="start" />
                  Save
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTaxName('');
                    setNewTaxRate('');
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
              Add Tax
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>

      <DeleteConfirmationAlert
        isOpen={!!deleteTarget}
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTax}
        itemName={deleteTarget?.name || ''}
        itemType="Tax"
      />
    </>
  );
};

export default TaxSettings;
