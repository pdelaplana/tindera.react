// ModifierGroupControl - Renders a single modifier group with selection controls

import { IonCheckbox, IonLabel, IonRadio, IonRadioGroup } from '@ionic/react';
import type React from 'react';
import { useMemo } from 'react';
import styled from 'styled-components';
import { PriceDisplay } from '@/components/ui';
import { designSystem } from '@/theme/designSystem';
import type { ModifierGroupWithResolvedPrices, ProductModifierGroupWithModifiers } from '@/types';

interface ModifierGroupControlProps {
  group: ProductModifierGroupWithModifiers | ModifierGroupWithResolvedPrices;
  selectedModifierIds: string[];
  onSelectionChange: (groupId: string, modifierIds: string[]) => void;
  currency?: string;
}

const GroupContainer = styled.div`
	margin-bottom: ${designSystem.spacing.lg};
`;

const GroupHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: ${designSystem.spacing.sm};
`;

const GroupTitle = styled.h3`
	font-size: ${designSystem.typography.fontSize.lg};
	font-weight: ${designSystem.typography.fontWeight.semibold};
	color: ${designSystem.colors.text.primary};
	margin: 0;
	display: flex;
	align-items: center;
	gap: ${designSystem.spacing.sm};
`;

const RequiredBadge = styled.span`
	font-size: ${designSystem.typography.fontSize.xs};
	font-weight: ${designSystem.typography.fontWeight.medium};
	padding: 2px 8px;
	border-radius: ${designSystem.borderRadius.full};
	background: ${designSystem.colors.danger};
	color: white;
`;

const OptionalBadge = styled.span`
	font-size: ${designSystem.typography.fontSize.xs};
	font-weight: ${designSystem.typography.fontWeight.medium};
	padding: 2px 8px;
	border-radius: ${designSystem.borderRadius.full};
	background: ${designSystem.colors.gray[300]};
	color: ${designSystem.colors.text.secondary};
`;

const SelectionHint = styled.p`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.text.secondary};
	margin: ${designSystem.spacing.xs} 0;
`;

const ValidationError = styled.p`
	font-size: ${designSystem.typography.fontSize.sm};
	color: ${designSystem.colors.danger};
	margin: ${designSystem.spacing.xs} 0;
`;

const ModifierList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${designSystem.spacing.sm};
`;

const ModifierItem = styled.div<{ $disabled?: boolean }>`
	display: flex;
	align-items: center;
	padding: ${designSystem.spacing.sm};
	border-radius: ${designSystem.borderRadius.md};
	background: ${designSystem.colors.gray[50]};
	opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
	cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};

	&:hover {
		background: ${(props) => (props.$disabled ? designSystem.colors.gray[50] : designSystem.colors.gray[100])};
	}
`;

const ModifierInfo = styled.div`
	flex: 1;
	margin-left: ${designSystem.spacing.sm};
`;

const ModifierName = styled.span`
	font-size: ${designSystem.typography.fontSize.base};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${designSystem.colors.text.primary};
`;

const ModifierPrice = styled.span<{ $isPositive?: boolean; $isZero?: boolean }>`
	font-size: ${designSystem.typography.fontSize.sm};
	font-weight: ${designSystem.typography.fontWeight.medium};
	color: ${(props) =>
    props.$isZero
      ? designSystem.colors.text.secondary
      : props.$isPositive
        ? designSystem.colors.danger
        : designSystem.colors.success};
	margin-left: ${designSystem.spacing.sm};
`;

const DefaultLabel = styled.span`
	font-size: ${designSystem.typography.fontSize.xs};
	color: ${designSystem.colors.primary};
	margin-left: ${designSystem.spacing.xs};
`;

export const ModifierGroupControl: React.FC<ModifierGroupControlProps> = ({
  group,
  selectedModifierIds,
  onSelectionChange,
  currency = 'USD',
}) => {
  // Determine input type based on selection rules
  const inputType = useMemo(() => {
    if (group.min_select === 1 && group.max_select === 1) {
      return 'radio';
    }
    return 'checkbox';
  }, [group.min_select, group.max_select]);

  // Get selection hint text
  const selectionHint = useMemo(() => {
    if (group.is_required) {
      if (group.max_select === null) {
        return `Select at least ${group.min_select}`;
      }
      if (group.min_select === group.max_select) {
        return `Select exactly ${group.min_select}`;
      }
      return `Select ${group.min_select}-${group.max_select}`;
    }
    if (group.max_select === 1) {
      return 'Select up to 1 (optional)';
    }
    if (group.max_select === null) {
      return 'Select any (optional)';
    }
    return `Select up to ${group.max_select} (optional)`;
  }, [group.is_required, group.min_select, group.max_select]);

  // Validation
  const isValid = useMemo(() => {
    if (!group.is_required) return true;
    if (selectedModifierIds.length < group.min_select) return false;
    if (group.max_select && selectedModifierIds.length > group.max_select) return false;
    return true;
  }, [group.is_required, group.min_select, group.max_select, selectedModifierIds]);

  const validationMessage = useMemo(() => {
    if (isValid) return null;
    if (selectedModifierIds.length < group.min_select) {
      return `Please select at least ${group.min_select} option${group.min_select > 1 ? 's' : ''}`;
    }
    if (group.max_select && selectedModifierIds.length > group.max_select) {
      return `Please select no more than ${group.max_select} option${group.max_select > 1 ? 's' : ''}`;
    }
    return null;
  }, [isValid, selectedModifierIds.length, group.min_select, group.max_select]);

  // Check if selection is at max
  const isAtMax = useMemo(() => {
    return group.max_select !== null && selectedModifierIds.length >= group.max_select;
  }, [group.max_select, selectedModifierIds]);

  // Handle radio button change
  const handleRadioChange = (modifierId: string) => {
    onSelectionChange(group.id, [modifierId]);
  };

  // Handle checkbox change
  const handleCheckboxChange = (modifierId: string, checked: boolean) => {
    if (checked) {
      // Don't allow more than max
      if (isAtMax) return;
      onSelectionChange(group.id, [...selectedModifierIds, modifierId]);
    } else {
      onSelectionChange(
        group.id,
        selectedModifierIds.filter((id) => id !== modifierId)
      );
    }
  };

  // Format price adjustment
  const formatPriceAdjustment = (amount: number) => {
    if (amount === 0) return 'Included';
    const prefix = amount > 0 ? '+' : '';
    return (
      <>
        {prefix}
        <PriceDisplay amount={amount} currency={currency} />
      </>
    );
  };

  // Render radio group
  if (inputType === 'radio') {
    return (
      <GroupContainer>
        <GroupHeader>
          <GroupTitle>
            {group.name}
            {group.is_required ? (
              <RequiredBadge>Required</RequiredBadge>
            ) : (
              <OptionalBadge>Optional</OptionalBadge>
            )}
          </GroupTitle>
        </GroupHeader>

        {group.description && <SelectionHint>{group.description}</SelectionHint>}
        <SelectionHint>{selectionHint}</SelectionHint>
        {!isValid && validationMessage && <ValidationError>{validationMessage}</ValidationError>}

        <IonRadioGroup
          value={selectedModifierIds[0] || ''}
          onIonChange={(e) => handleRadioChange(e.detail.value)}
        >
          <ModifierList>
            {group.modifiers.map((modifier) => (
              <ModifierItem key={modifier.id} onClick={() => handleRadioChange(modifier.id)}>
                <IonRadio value={modifier.id} />
                <ModifierInfo>
                  <ModifierName>
                    {modifier.name}
                    {modifier.is_default && <DefaultLabel>(default)</DefaultLabel>}
                  </ModifierName>
                  <ModifierPrice
                    $isPositive={modifier.price_adjustment > 0}
                    $isZero={modifier.price_adjustment === 0}
                  >
                    {formatPriceAdjustment(modifier.price_adjustment)}
                  </ModifierPrice>
                </ModifierInfo>
              </ModifierItem>
            ))}
          </ModifierList>
        </IonRadioGroup>
      </GroupContainer>
    );
  }

  // Render checkbox group
  return (
    <GroupContainer>
      <GroupHeader>
        <GroupTitle>
          {group.name}
          {group.is_required ? (
            <RequiredBadge>Required</RequiredBadge>
          ) : (
            <OptionalBadge>Optional</OptionalBadge>
          )}
        </GroupTitle>
      </GroupHeader>

      {group.description && <SelectionHint>{group.description}</SelectionHint>}
      <SelectionHint>{selectionHint}</SelectionHint>
      {!isValid && validationMessage && <ValidationError>{validationMessage}</ValidationError>}

      <ModifierList>
        {group.modifiers.map((modifier) => {
          const isSelected = selectedModifierIds.includes(modifier.id);
          const isDisabled = !isSelected && isAtMax;

          return (
            <ModifierItem
              key={modifier.id}
              $disabled={isDisabled}
              onClick={() => !isDisabled && handleCheckboxChange(modifier.id, !isSelected)}
            >
              <IonCheckbox
                checked={isSelected}
                disabled={isDisabled}
                onIonChange={(e) => handleCheckboxChange(modifier.id, e.detail.checked)}
              />
              <ModifierInfo>
                <IonLabel>
                  <ModifierName>
                    {modifier.name}
                    {modifier.is_default && <DefaultLabel>(default)</DefaultLabel>}
                  </ModifierName>
                  <ModifierPrice
                    $isPositive={modifier.price_adjustment > 0}
                    $isZero={modifier.price_adjustment === 0}
                  >
                    {formatPriceAdjustment(modifier.price_adjustment)}
                  </ModifierPrice>
                </IonLabel>
              </ModifierInfo>
            </ModifierItem>
          );
        })}
      </ModifierList>
    </GroupContainer>
  );
};

export default ModifierGroupControl;
