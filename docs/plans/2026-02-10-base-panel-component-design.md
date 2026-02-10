# DetailPanel Component Design

**Date:** 2026-02-10

## Goal

Create a `DetailPanel` layout component that eliminates boilerplate duplicated across all detail panel components, enforces structural consistency, and simplifies creating new panels.

---

## Component Location

`src/components/layouts/DetailPanel.tsx`

Alongside `MasterDetailLayout` and `CenteredLayout` — it's a layout-level concern.

---

## API

```typescript
interface DetailPanelProps {
  // Header props (passed through to DetailPanelHeader)
  title: string;
  icon?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  onBack?: () => void;
  actions?: ReactNode;

  // Content slots
  children: ReactNode;
  loadingSlot?: ReactNode;   // shown when isLoading=true (default: LoadingSpinner)
  emptySlot?: ReactNode;     // shown when isEmpty=true, wrapped in EmptyState

  // State flags
  isLoading?: boolean;       // default: false
  isEmpty?: boolean;         // default: false

  // Layout options
  scrollable?: boolean;      // default: true — wraps children in ScrollContent
  className?: string;
}
```

---

## Internal Structure

```typescript
const DetailPanel: React.FC<DetailPanelProps> = ({
  title, icon, breadcrumbs, onBack, actions,
  children, loadingSlot, emptySlot,
  isLoading = false, isEmpty = false,
  scrollable = true, className,
}) => {
  const renderContent = () => {
    if (isLoading) return loadingSlot ?? <LoadingSpinner />;
    if (isEmpty) return <EmptyState>{emptySlot}</EmptyState>;
    return children;
  };

  return (
    <Container className={className}>
      <DetailPanelHeader
        title={title}
        icon={icon}
        breadcrumbs={breadcrumbs}
        onBack={onBack}
        actions={actions}
      />
      {scrollable ? (
        <ScrollContent>{renderContent()}</ScrollContent>
      ) : (
        renderContent()
      )}
    </Container>
  );
};
```

### Styled components (defined once, removed from all panels)

- `Container` — `height: 100%; display: flex; flex-direction: column`
- `ScrollContent` — `flex: 1; overflow-y: auto; width: 100%`
- `EmptyState` — `display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: spacing.xl; text-align: center`

---

## Migration Plan

### Panels to migrate (6 total)

| Panel | Change |
|---|---|
| `InventoryTransactionsListPanel` | Remove `Container`, use `<DetailPanel>` |
| `InventoryItemTransactionsPanel` | Remove `Container`, `ScrollContent`, use `<DetailPanel>` |
| `InventoryTransactionDetailsPanel` | Remove `Container`, use `<DetailPanel>` |
| `InventoryItemDetailPanel` | Remove `Container`, `ScrollContent`, `EmptyState`, `EmptyText`; use `<DetailPanel scrollable={false}>` |
| `ProductDetailPanel` | Remove `Container`, `ScrollContent`, `EmptyState`; use `<DetailPanel>` |
| `ProductSalesPanel` | Remove `Container`, use `<DetailPanel>` |

### Panels NOT migrated

- `CartPanel` — unique layout with footer/charge button, not a standard detail panel

---

## Export

Add `DetailPanel` to `src/components/layouts/index.ts` alongside existing layout exports.
