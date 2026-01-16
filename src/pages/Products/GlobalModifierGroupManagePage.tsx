// Modifier Group Manage Page - Manage modifiers within a group

import {
  IonActionSheet,
  IonRefresher,
  IonRefresherContent,
  type RefresherEventDetail,
  useIonLoading,
} from '@ionic/react';
import { close, trashOutline } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CenteredLayout, PageWithCollapsibleHeader } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import PageLoadingState from '@/components/shared/PageLoadingState';
import PageNotFoundState from '@/components/shared/PageNotFoundState';
import { IonText2 } from '@/components/ui';
import { useDeleteModifierGroup, useModifierGroup } from '@/hooks/useModifier';
import { useShop } from '@/hooks/useShop';
import { useToastNotification } from '@/hooks/useToastNotification';
import { logger } from '@/services/sentry';
import type { Modifier } from '@/types';
import { createCurrencyFormatter } from '@/utils/currency';
import { GlobalModifierFormModal } from './components/globalModifiers/GlobalModifierFormModal';
import { GlobalModifierGroupFormModal } from './components/globalModifiers/GlobalModifierGroupFormModal';
import ModifiersList from './components/globalModifiers/ModifiersList';
import ModifierGroupActionButtons from './components/ModifierGroupActionButtons';

interface RouteParams {
  shopId: string;
  id: string;
}

const ModifierGroupManagePage: React.FC = () => {
  const { shopId, id } = useParams<RouteParams>();
  const history = useHistory();

  // Hooks
  const { currentShop, hasPermission } = useShop();
  const { data: group, isLoading: groupLoading, refetch: refetchGroup } = useModifierGroup(id);
  const deleteGroup = useDeleteModifierGroup();
  const { showSuccess, showError } = useToastNotification();
  const [present, dismiss] = useIonLoading();

  // Modal states
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showGroupFormModal, setShowGroupFormModal] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showDeleteGroupAlert, setShowDeleteGroupAlert] = useState(false);

  // Selected modifier state
  const [selectedModifier, setSelectedModifier] = useState<Modifier | null>(null);

  // Ref for collapsible header
  const groupNameRef = useRef<HTMLHeadingElement>(null);
  const observedElementRef = groupNameRef as React.RefObject<HTMLElement>;

  // Permissions
  const canEdit = hasPermission('staff');
  const canDelete = hasPermission('admin');

  // Currency formatter
  const formatCurrency = useMemo(
    () => createCurrencyFormatter(currentShop?.currency_code || 'USD'),
    [currentShop?.currency_code]
  );

  // Handlers
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetchGroup();
    event.detail.complete();
  };

  const handleEditGroup = () => {
    setShowGroupFormModal(true);
  };

  const handleOptions = () => {
    setShowOptionsSheet(true);
  };

  const handleDeleteGroup = async () => {
    if (!group) return;

    try {
      await present({ message: 'Deleting...' });
      await deleteGroup.mutateAsync(id);
      showSuccess('Modifier group deleted successfully');
      history.replace(`/shops/${shopId}/modifiers`);
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

  // Loading state
  if (groupLoading) {
    return <PageLoadingState backHref={`/shops/${shopId}/modifiers`} />;
  }

  if (!group) {
    return (
      <PageNotFoundState backHref={`/shops/${shopId}/modifiers`} title="Modifier Group Not Found" />
    );
  }

  const modifiers = group.modifiers || [];
  const hasModifiers = modifiers.length > 0;
  const selectionText = group.max_select
    ? `${group.min_select}-${group.max_select}`
    : `${group.min_select}+`;

  return (
    <PageWithCollapsibleHeader
      title={group.name}
      backHref={`/shops/${shopId}/modifiers`}
      observedElementRef={observedElementRef}
      isLoading={groupLoading}
      notFound={!groupLoading && !group}
    >
      {/* Pull to refresh */}
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      {/* Top Section - Group Summary and Action Buttons */}
      <Div
        style={{
          paddingBottom: '24px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--ion-color-light-shade)',
        }}
      >
        <CenteredLayout>
          <Div style={{ maxWidth: '800px', width: '100%', padding: '16px' }}>
            <h2 ref={groupNameRef} style={{ marginTop: 0, fontSize: '1.5rem' }}>
              {group.name}
            </h2>
            {group.description && (
              <IonText2 color="medium" style={{ display: 'block', marginBottom: '12px' }}>
                {group.description}
              </IonText2>
            )}

            <Div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <Div
                style={{
                  padding: '8px 12px',
                  background: group.is_required
                    ? 'var(--ion-color-danger-tint)'
                    : 'var(--ion-color-medium-tint)',
                  borderRadius: '8px',
                }}
              >
                <IonText2 fontSize="0.875rem" fontWeight="500">
                  {group.is_required ? 'Required' : 'Optional'}
                </IonText2>
              </Div>
              <Div
                style={{
                  padding: '8px 12px',
                  background: 'var(--ion-color-light)',
                  borderRadius: '8px',
                }}
              >
                <IonText2 fontSize="0.875rem" fontWeight="500">
                  Select {selectionText}
                </IonText2>
              </Div>
              <Div
                style={{
                  padding: '8px 12px',
                  background: 'var(--ion-color-light)',
                  borderRadius: '8px',
                }}
              >
                <IonText2 fontSize="0.875rem" fontWeight="500">
                  {modifiers.length} {modifiers.length === 1 ? 'modifier' : 'modifiers'}
                </IonText2>
              </Div>
            </Div>

            <ModifierGroupActionButtons
              onEditGroup={handleEditGroup}
              onAddModifier={handleAddModifier}
              onOptions={handleOptions}
              disabled={!canEdit}
            />
          </Div>
        </CenteredLayout>
      </Div>

      {/* Content Section */}
      <CenteredLayout>
        <Div style={{ maxWidth: '800px', width: '100%' }}>
          <ModifiersList
            modifiers={modifiers}
            formatCurrency={formatCurrency}
            onAdd={handleAddModifier}
            onEdit={handleEditModifier}
            canEdit={canEdit}
          />
        </Div>
      </CenteredLayout>

      {/* Modals */}
      <GlobalModifierFormModal
        isOpen={showModifierModal}
        onClose={handleCloseModifierModal}
        initialData={selectedModifier || undefined}
        modifierGroupId={id}
        onSuccess={refetchGroup}
        nextSequence={group?.modifiers?.length || 0}
      />

      <GlobalModifierGroupFormModal
        isOpen={showGroupFormModal}
        onClose={() => {
          setShowGroupFormModal(false);
          refetchGroup();
        }}
        group={group}
      />

      {/* Options Action Sheet */}
      <IonActionSheet
        isOpen={showOptionsSheet}
        onDidDismiss={() => setShowOptionsSheet(false)}
        header="Options"
        buttons={[
          ...(canDelete
            ? [
                {
                  text: 'Delete Group',
                  icon: trashOutline,
                  role: 'destructive' as const,
                  handler: () => {
                    if (hasModifiers) {
                      showError('Cannot delete group with modifiers. Remove all modifiers first.');
                    } else {
                      setShowDeleteGroupAlert(true);
                    }
                  },
                },
              ]
            : []),
          {
            text: 'Cancel',
            role: 'cancel',
            icon: close,
          },
        ]}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmationAlert
        isOpen={showDeleteGroupAlert}
        onDismiss={() => setShowDeleteGroupAlert(false)}
        onConfirm={handleDeleteGroup}
        itemName={group.name}
        itemType="Modifier Group"
      />
    </PageWithCollapsibleHeader>
  );
};

export default ModifierGroupManagePage;
