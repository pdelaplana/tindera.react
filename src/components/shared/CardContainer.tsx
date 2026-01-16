// CardContainer Component - Reusable wrapper for IonCard with standardized patterns

import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonSearchbar,
  IonText,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import type React from 'react';

/**
 * Props for the CardContainer component
 *
 * @example
 * // List container with action button
 * <CardContainer title="Items" onActionClick={handleAdd} noPadding>
 *   <IonList>{items}</IonList>
 * </CardContainer>
 *
 * @example
 * // Info card with subtitle
 * <CardContainer title="Product" subtitle="SKU: 12345">
 *   {content}
 * </CardContainer>
 *
 * @example
 * // Flat card variant
 * <CardContainer variant="flat" title="Settings">
 *   {settings}
 * </CardContainer>
 */
export interface CardContainerProps {
  /**
   * Card title displayed in the header
   */
  title?: string;

  /**
   * Subtitle or description text below the title.
   * Can be a string (automatically wrapped in IonText with medium color)
   * or a custom React node for more complex layouts.
   */
  subtitle?: string | React.ReactNode;

  /**
   * Custom action button element to display in the header.
   * Takes precedence over onActionClick if both are provided.
   */
  actionButton?: React.ReactNode;

  /**
   * Quick action handler that renders a default icon button.
   * Use this for simple add/create actions.
   * Use actionButton prop for more complex custom buttons.
   */
  onActionClick?: () => void;

  /**
   * Icon to display in the quick action button.
   * Only used when onActionClick is provided.
   * @default add (plus icon)
   */
  actionIcon?: string;

  /**
   * Accessibility label for the quick action button.
   * Only used when onActionClick is provided.
   * @default "Add"
   */
  actionLabel?: string;

  /**
   * Enable search functionality in the header.
   * @default false
   */
  showSearch?: boolean;

  /**
   * Search value (controlled).
   */
  searchValue?: string;

  /**
   * Handler for search input changes.
   */
  onSearchChange?: (value: string) => void;

  /**
   * Placeholder text for the search input.
   * @default "Search..."
   */
  searchPlaceholder?: string;

  /**
   * Visual variant of the card.
   * - standard: Default card with shadow
   * - flat: No shadow, subtle border
   * @default "standard"
   */
  variant?: 'standard' | 'flat';

  /**
   * Removes padding from IonCardContent.
   * Useful for lists and other content that manages its own spacing.
   * @default false
   */
  noPadding?: boolean;

  /**
   * Additional CSS classes to apply to the IonCard element.
   */
  className?: string;

  /**
   * Inline styles to apply to the IonCard element.
   */
  style?: React.CSSProperties;

  /**
   * Card content to display.
   */
  children: React.ReactNode;
}

/**
 * CardContainer - A reusable wrapper component for IonCard that standardizes
 * common usage patterns across the application.
 *
 * Features:
 * - Optional title and subtitle in header
 * - Quick action button or custom action element
 * - Flat card variant styling
 * - No-padding option for list content
 * - Fully typed with TypeScript
 * - Accessibility support with ARIA labels
 *
 * @param props - CardContainerProps
 * @returns Rendered card component
 */
export const CardContainer: React.FC<CardContainerProps> = ({
  title,
  subtitle,
  actionButton,
  onActionClick,
  actionIcon = add,
  actionLabel = 'Add',
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  variant = 'standard',
  noPadding = false,
  className = '',
  style,
  children,
}) => {
  // Build card className with variant and custom classes
  const cardClassName = `${variant === 'flat' ? 'flat-card' : ''} ${className}`.trim();

  // Apply no-padding class if requested
  const contentClassName = noPadding ? 'ion-no-padding' : '';

  /**
   * Renders the action button in the header.
   * Priority: custom actionButton > quick action via onActionClick > none
   */
  const renderActionButton = () => {
    // Custom action button takes precedence
    if (actionButton) return actionButton;

    // Quick action with default icon button
    if (onActionClick) {
      return (
        <IonButtons>
          <IonButton
            onClick={onActionClick}
            size="default"
            fill="clear"
            color="dark"
            aria-label={actionLabel}
          >
            <IonIcon slot="icon-only" icon={actionIcon} />
          </IonButton>
        </IonButtons>
      );
    }

    return null;
  };

  // Determine if header should be rendered
  const hasHeader = title || subtitle || actionButton || onActionClick || showSearch;
  const action = renderActionButton();

  return (
    <IonCard className={cardClassName} style={style}>
      {hasHeader && (
        <IonCardHeader
          className={
            (title || showSearch) && action
              ? 'ion-align-items-start ion-justify-content-between ion-flex-row ion-display-flex'
              : ''
          }
        >
          {showSearch ? (
            <IonSearchbar
              value={searchValue}
              onIonInput={(e) => onSearchChange?.(e.detail.value ?? '')}
              placeholder={searchPlaceholder}
              debounce={300}
              className="searchBar"
            />
          ) : (
            <div>
              {title && <IonCardTitle>{title}</IonCardTitle>}
              {subtitle &&
                (typeof subtitle === 'string' ? (
                  <IonText color="medium">
                    <p>{subtitle}</p>
                  </IonText>
                ) : (
                  subtitle
                ))}
            </div>
          )}
          {action}
        </IonCardHeader>
      )}
      <IonCardContent className={contentClassName}>{children}</IonCardContent>
    </IonCard>
  );
};
