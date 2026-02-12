// Modifier Group Manage Page - Manage modifiers within a group

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  type RefresherEventDetail,
  useIonLoading,
} from '@ionic/react';
import { addOutline, trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { BasePage, CenteredLayout } from '@/components/layouts';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import PageLoadingState from '@/components/shared/PageLoadingState';
import PageNotFoundState from '@/components/shared/PageNotFoundState';
import { useDeleteModifierGroup, useModifierGroup } from '@/hooks/useModifier';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { Modifier } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import { GlobalModifierFormModal } from '@/features/products/components/globalModifiers/GlobalModifierFormModal';
import ModifiersList from '@/features/products/components/globalModifiers/ModifiersList';
import ModifierGroupSettingsCard from '../components/ModifierGroupSettingsCard';

interface RouteParams {
  shopId: string;
  id: string;
}

const ModifierGroupManagePage: React.FC = () => {
  const { shopId, id } = useParams<RouteParams>();
  const history = useHistory();

  const { currentShop, hasPermission } = useShop();
  const { data: group, isLoading: groupLoading, refetch: refetchGroup } = useModifierGroup(id);
  const deleteGroup = useDeleteModifierGroup();
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showDeleteGroupAlert, setShowDeleteGroupAlert] = useState(false);
  const [selectedModifier, setSelectedModifier] = useState<Modifier | null>(null);

  const canEdit = hasPermission('staff');
  const canDelete = hasPermission('admin');

  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetchGroup();
    event.detail.complete();
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    try {
      await present({ message: 'Deleting...' });
      await deleteGroup.mutateAsync(id);
      showSuccess('Modifier group deleted successfully');
      history.replace(`/shops/${shopId}/settings/products/modifiers`);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)));
      showError('Failed to delete modifier group');
    } finally {
      await dismiss();
    }
  };

  const handleAddModifier = () => {
    setSelectedModifier(null);
    setShowModifierModal(true);
  };

  const handleEditModifier = (modifier: Modifier) => {
    setSelectedModifier(modifier);
    setShowModifierModal(true);
  };

  const handleCloseModifierModal = () => {
    setShowModifierModal(false);
    setSelectedModifier(null);
    refetchGroup();
  };

  if (groupLoading) {
    return <PageLoadingState backHref={`/shops/${shopId}/settings/products/modifiers`} />;
  }

  if (!group) {
    return (
      <PageNotFoundState
        backHref={`/shops/${shopId}/settings/products/modifiers`}
        title="Modifier Group Not Found"
      />
    );
  }

  const modifiers = group.modifiers || [];
  const hasModifiers = modifiers.length > 0;

  const addButton = (
    <IonButton fill="clear" onClick={handleAddModifier} disabled={!canEdit} aria-label="Add modifier">
      <IonIcon slot="icon-only" icon={addOutline} />
    </IonButton>
  );

  return (
    <BasePage
      title={group.name}
      backHref={`/shops/${shopId}/settings/products/modifiers`}
      endButtons={addButton}
      isLoading={groupLoading}
      notFound={!groupLoading && !group}
    >
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <CenteredLayout>
        <ModifierGroupSettingsCard group={group} onSaved={refetchGroup} />

        <ModifiersList
          modifiers={modifiers}
          formatCurrency={formatCurrency}
          onAdd={handleAddModifier}
          onEdit={handleEditModifier}
          canEdit={canEdit}
        />

        {/* Danger Zone */}
        {canDelete && (
          <IonCard
            className="flat-card"
            style={{ marginTop: '16px', border: '1px solid var(--ion-color-danger)' }}
          >
            <IonCardContent>
              <IonList lines="none">
                <IonItem>
                  <IonLabel>
                    <h2>Delete Modifier Group</h2>
                    <p>
                      {hasModifiers
                        ? 'Remove all modifiers before deleting this group'
                        : 'Permanently delete this modifier group'}
                    </p>
                  </IonLabel>
                  <IonButton
                    color="danger"
                    fill="solid"
                    size="default"
                    disabled={hasModifiers}
                    onClick={() => setShowDeleteGroupAlert(true)}
                  >
                    <IonIcon slot="start" icon={trashOutline} />
                    Delete
                  </IonButton>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        )}
      </CenteredLayout>

      <GlobalModifierFormModal
        isOpen={showModifierModal}
        onClose={handleCloseModifierModal}
        initialData={selectedModifier || undefined}
        modifierGroupId={id}
        onSuccess={refetchGroup}
        nextSequence={modifiers.length}
      />

      <DeleteConfirmationAlert
        isOpen={showDeleteGroupAlert}
        onDismiss={() => setShowDeleteGroupAlert(false)}
        onConfirm={handleDeleteGroup}
        itemName={group.name}
        itemType="Modifier Group"
      />
    </BasePage>
  );
};

export default ModifierGroupManagePage;
