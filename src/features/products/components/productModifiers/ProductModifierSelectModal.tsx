// Product Modifier Select Modal - Select global modifier groups to link to product

import {
  IonCheckbox,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonText,
  useIonToast,
} from '@ionic/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import BaseModal from '@/components/shared/BaseModal';
import { SaveButton } from '@/components/shared/SaveButton';
import { IonText2 } from '@/components/ui';
import { useLinkModifierGroup, useModifierGroups } from '@/hooks';
import type { ModifierGroupWithModifiers } from '@/types';

interface ProductModifierSelectModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Callback when modal is dismissed */
  onClose: () => void;
  /** Product ID to link modifiers to */
  productId: string;
  /** Already linked group IDs */
  linkedGroupIds: string[];
}

const ProductModifierSelectModal: React.FC<ProductModifierSelectModalProps> = ({
  isOpen,
  onClose,
  productId,
  linkedGroupIds,
}) => {
  const [presentToast] = useIonToast();
  const [searchText, setSearchText] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  // Fetch all modifier groups
  const { data: allGroups, isLoading } = useModifierGroups();

  // Link modifier group mutation
  const linkMutation = useLinkModifierGroup();

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!allGroups) return [];

    let filtered = allGroups;

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((group) => group.name.toLowerCase().includes(searchLower));
    }

    // Sort by sequence
    return filtered.sort((a, b) => a.sequence - b.sequence);
  }, [allGroups, searchText]);

  // Toggle group selection
  const handleToggleGroup = (groupId: string) => {
    // Don't allow toggling already linked groups
    if (linkedGroupIds.includes(groupId)) return;

    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Handle save - link all selected groups
  const handleSave = async () => {
    if (selectedGroupIds.size === 0) {
      onClose();
      return;
    }

    try {
      // Link each selected group
      const promises = Array.from(selectedGroupIds).map((groupId, index) =>
        linkMutation.mutateAsync({
          productId,
          groupId,
          sequence: linkedGroupIds.length + index,
        })
      );

      await Promise.all(promises);

      presentToast({
        message: `${selectedGroupIds.size} modifier ${selectedGroupIds.size === 1 ? 'group' : 'groups'} linked successfully`,
        duration: 2000,
        color: 'success',
      });

      // Reset and close
      setSelectedGroupIds(new Set());
      setSearchText('');
      onClose();
    } catch (error) {
      console.error('Error linking modifier groups:', error);
      presentToast({
        message: 'Failed to link modifier groups',
        duration: 2000,
        color: 'danger',
      });
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedGroupIds(new Set());
    setSearchText('');
    onClose();
  };

  // Render group item
  const renderGroupItem = (group: ModifierGroupWithModifiers) => {
    const isLinked = linkedGroupIds.includes(group.id);
    const isSelected = selectedGroupIds.has(group.id);
    const isChecked = isLinked || isSelected;
    const modifierCount = group.modifiers?.length || 0;

    return (
      <IonItem
        key={group.id}
        button
        onClick={() => handleToggleGroup(group.id)}
        disabled={isLinked}
      >
        <IonCheckbox
          slot="start"
          checked={isChecked}
          disabled={isLinked}
          onIonChange={() => handleToggleGroup(group.id)}
          className="ion-margin-top"
        />
        <IonLabel>
          <h3>{group.name}</h3>
          <p>
            <IonText2 color="medium" fontSize="0.85em">
              {group.is_required ? 'Required' : 'Optional'} • {modifierCount}{' '}
              {modifierCount === 1 ? 'modifier' : 'modifiers'}
            </IonText2>
          </p>
          {isLinked && (
            <p>
              <IonText color="primary" style={{ fontSize: '0.85em', fontWeight: 500 }}>
                ✓ Already linked
              </IonText>
            </p>
          )}
        </IonLabel>
      </IonItem>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Modifiers"
      showActionButton
      actionButtonLabel="Add"
      onActionClick={handleSave}
      actionButtonDisabled={selectedGroupIds.size === 0}
      actionButtonLoading={linkMutation.isPending}
      isLoading={isLoading}
      loadingMessage="Loading modifier groups..."
      initialBreakpoint={0.99}
      breakpoints={[0, 0.5, 0.75, 0.99]}
    >
      <div>
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value || '')}
          placeholder="Search modifier groups..."
          className="searchBar"
        />

        {filteredGroups.length === 0 ? (
          <div className="ion-text-center" style={{ padding: '48px 16px' }}>
            <IonText color="medium">
              <p>No modifier groups found</p>
              {searchText && <p style={{ fontSize: '0.875rem' }}>Try a different search</p>}
            </IonText>
          </div>
        ) : (
          <IonList lines="full">{filteredGroups.map(renderGroupItem)}</IonList>
        )}
        <SaveButton
          expand="block"
          onClick={handleSave}
          disabled={selectedGroupIds.size === 0 || linkMutation.isPending}
          isSaving={linkMutation.isPending}
          label={`Add ${selectedGroupIds.size} ${selectedGroupIds.size === 1 ? 'Group' : 'Groups'}`}
        />
      </div>
    </BaseModal>
  );
};

export default ProductModifierSelectModal;
