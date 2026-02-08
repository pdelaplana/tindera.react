// Modifiers List Page - Shop-level modifier group management

import {
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonToolbar,
  type RefresherEventDetail,
  useIonRouter,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { Div } from '@/components/shared/base/Div';
import { CardContainer } from '@/components/shared/CardContainer';
import { FilterPillScroller, IonText2, LoadingSpinner } from '@/components/ui';
import { useModifierGroups } from '@/hooks';
import { useShop } from '@/hooks/useShop';
import type { FilterOption, ModifierGroupWithModifiers } from '@/types';
import { GlobalModifierGroupFormModal } from './components/globalModifiers/GlobalModifierGroupFormModal';

// Filter options
const buildFilterOptions = (): FilterOption[] => {
  return [
    { id: 'all', label: 'All' },
    { id: 'required', label: 'Required' },
    { id: 'optional', label: 'Optional' },
  ];
};

const ModifiersListPage: React.FC = () => {
  const router = useIonRouter();
  const { currentShop, isLoading: shopLoading } = useShop();
  const [searchText, setSearchText] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroupWithModifiers | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Fetch modifier groups
  const { data: groups, isLoading: groupsLoading, refetch } = useModifierGroups();

  const isLoading = shopLoading || groupsLoading;

  // Build filter options
  const filterOptions = useMemo(() => buildFilterOptions(), []);

  // Apply filters to groups
  const filteredGroups = useMemo(() => {
    if (!groups) return [];

    let filtered = groups;

    // Apply required/optional filter
    if (selectedFilter === 'required') {
      filtered = filtered.filter((group) => group.is_required);
    } else if (selectedFilter === 'optional') {
      filtered = filtered.filter((group) => !group.is_required);
    }

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((group) => group.name.toLowerCase().includes(searchLower));
    }

    // Sort by sequence
    return filtered.sort((a, b) => a.sequence - b.sequence);
  }, [groups, selectedFilter, searchText]);

  // Handle pull-to-refresh
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  // Navigate to add group
  const handleAddGroup = () => {
    setSelectedGroup(null);
    setShowGroupModal(true);
  };

  // Navigate to manage group page
  const handleViewGroup = (group: ModifierGroupWithModifiers) => {
    router.push(`/shops/${currentShop?.id}/modifiers/${group.id}/manage`, 'forward');
  };

  // Close modal and refetch data
  const handleCloseModal = () => {
    setShowGroupModal(false);
    setSelectedGroup(null);
    refetch();
  };

  // Render individual modifier group
  const renderModifierGroup = (group: ModifierGroupWithModifiers, index: number) => {
    const modifierCount = group.modifiers?.length || 0;
    const selectionText = group.max_select
      ? `Select ${group.min_select}-${group.max_select}`
      : `Select ${group.min_select}+`;

    return (
      <IonItem
        key={group.id}
        lines={index === filteredGroups.length - 1 ? 'none' : 'full'}
        button
        onClick={() => handleViewGroup(group)}
        detail
      >
        <IonLabel>
          <h2>{group.name}</h2>
          <div className="flex items-center gap-2">
            <IonBadge color={group.is_required ? 'danger' : 'medium'}>
              {group.is_required ? 'Required' : 'Optional'}
            </IonBadge>
            <IonText2 color="medium" fontSize="0.85em">
              • {selectionText}
            </IonText2>
          </div>
          <IonText2 color="medium" fontSize="0.85em">
            {modifierCount} {modifierCount === 1 ? 'modifier' : 'modifiers'}
          </IonText2>
        </IonLabel>
      </IonItem>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
      <h2>No Modifier Groups Yet</h2>
      <p>Create global modifier groups to reuse across multiple products</p>
      <IonButton onClick={handleAddGroup} size="default">
        <IonIcon slot="start" icon={add} />
        Add Modifier Group
      </IonButton>
    </Div>
  );

  // No shop selected state
  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Modifiers" showMenu showProfile showLogout>
        <CenteredLayout>
          <div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage modifiers</p>
          </div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage title="Modifiers" showMenu>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <CenteredLayout>
        {/* Filter Scroller */}
        {filterOptions.length > 0 && (
          <IonToolbar>
            <FilterPillScroller
              filters={filterOptions}
              selectedId={selectedFilter}
              onSelect={setSelectedFilter}
            />
          </IonToolbar>
        )}

        <CardContainer
          title="Modifier Groups"
          onActionClick={handleAddGroup}
          noPadding
          showSearch={true}
          searchPlaceholder="Search modifier groups..."
          searchValue={searchText}
          onSearchChange={setSearchText}
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !groups || groups.length === 0 ? (
            renderEmptyState()
          ) : filteredGroups.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <IonText>
                <h3>No groups match your filters</h3>
              </IonText>
            </Div>
          ) : (
            <IonList>
              {filteredGroups.map((group, index) => renderModifierGroup(group, index))}
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>

      {/* Modifier Group Form Modal */}
      <GlobalModifierGroupFormModal
        isOpen={showGroupModal}
        group={selectedGroup}
        onClose={handleCloseModal}
      />
    </BasePage>
  );
};

export default ModifiersListPage;
