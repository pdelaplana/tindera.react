# Tindera Component Style Guide

> A comprehensive guide for using standardized components in the Tindera application

## Table of Contents

1. [Page Components](#page-components)
   - [BasePage](#basepage)
   - [CenteredLayout](#centeredlayout)
2. [Modal Components](#modal-components)
   - [BaseModal](#basemodal)
3. [Form Components](#form-components)
   - [TextField](#textfield)
   - [TextAreaField](#textareafield)
   - [SelectField](#selectfield)
   - [SelectFieldWithAdd](#selectfieldwithadd)
   - [PriceField](#pricefield)
   - [NumberField](#numberfield)
4. [UI Components](#ui-components)
   - [CardContainer](#cardcontainer)
   - [SaveButton](#savebutton)
   - [DeleteConfirmationAlert](#deleteconfirmationalert)
5. [Best Practices](#best-practices)

---

## Page Components

### BasePage

**Location:** `@/components/layouts/BasePage`

A unified page component that combines page layout, header management, and loading/error states.

#### Features
- ✅ Menu button / Back button
- ✅ Logout & Profile buttons
- ✅ More icon button with callback
- ✅ Custom end buttons
- ✅ Collapsible header (title appears on scroll)
- ✅ Ionic's native collapse header
- ✅ Loading & Not found states
- ✅ Wraps everything in `IonPage` + `IonContent`

#### Props

```typescript
interface BasePageProps {
  title: string;                              // Required: Page title
  children: ReactNode;                        // Required: Page content
  showMenu?: boolean;                         // Default: true
  backHref?: string;                          // Show back button
  showLogout?: boolean;                       // Default: false
  showProfile?: boolean;                      // Default: false
  onMoreClick?: () => void;                   // More icon callback
  endButtons?: ReactNode;                     // Custom header buttons
  collapsible?: boolean;                      // Enable collapsible header
  observedElementRef?: React.RefObject;       // Element to observe for collapse
  collapse?: boolean;                         // Ionic collapse header
  collapseTitle?: string;                     // Title for collapse header
  isLoading?: boolean;                        // Show loading state
  notFound?: boolean;                         // Show not found state
  notFoundMessage?: string;                   // Custom not found message
}
```

#### Usage Examples

**Simple list page with menu:**
```tsx
import { BasePage, CenteredLayout } from '@/components/layouts';

const MyListPage: React.FC = () => {
  return (
    <BasePage title="Products" showMenu>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>
      
      <CenteredLayout>
        <CardContainer title="Products" onActionClick={handleAdd}>
          {content}
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};
```

**Detail page with back button and collapsible header:**
```tsx
import { BasePage, CenteredLayout } from '@/components/layouts';

const MyDetailPage: React.FC = () => {
  const titleRef = useRef<HTMLDivElement>(null);
  
  return (
    <BasePage 
      title={item.name}
      backHref="/products"
      collapsible
      observedElementRef={titleRef}
      isLoading={isLoading}
      notFound={!item}
      notFoundMessage="Product not found"
    >
      <CenteredLayout>
        <div ref={titleRef}>
          <h1>{item.name}</h1>
        </div>
        {content}
      </CenteredLayout>
    </BasePage>
  );
};
```

**Page with more actions menu:**
```tsx
const MyPage: React.FC = () => {
  const [showActionSheet, setShowActionSheet] = useState(false);
  
  return (
    <>
      <BasePage 
        title="Inventory"
        showMenu
        onMoreClick={() => setShowActionSheet(true)}
      >
        {content}
      </BasePage>
      
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          { text: 'Manage Categories', handler: handleCategories },
          { text: 'Export Data', handler: handleExport },
          { text: 'Cancel', role: 'cancel' }
        ]}
      />
    </>
  );
};
```

**Page with Ionic's collapse header:**
```tsx
<BasePage 
  title="Products"
  collapse
  collapseTitle="All Products"
>
  {content}
</BasePage>
```

---

### CenteredLayout

**Location:** `@/components/layouts/CenteredLayout`

A simple wrapper that centers content with a max-width of 700px.

#### Usage

```tsx
import { CenteredLayout } from '@/components/layouts';

<BasePage title="My Page">
  <CenteredLayout>
    {/* Content automatically centered and constrained */}
  </CenteredLayout>
</BasePage>
```

**✅ DO:** Use for list pages, form pages, and detail pages  
**❌ DON'T:** Use for full-width layouts like POS or dashboards

---

## Modal Components

### BaseModal

**Location:** `@/components/shared/BaseModal`

A unified modal component with consistent header structure, action buttons, and loading states.

#### Features
- ✅ Consistent header with close button
- ✅ Optional action button (save, submit, etc.)
- ✅ Custom buttons in header slots
- ✅ Sheet-style with breakpoints
- ✅ Loading state with spinner
- ✅ Scroll and padding control

#### Props

```typescript
interface BaseModalProps {
  isOpen: boolean;                            // Required: Open state
  onClose: () => void;                        // Required: Close handler
  title: string;                              // Required: Modal title
  children: ReactNode;                        // Required: Modal content
  showActionButton?: boolean;                 // Show save/submit button
  actionButtonLabel?: string;                 // Default: "Save"
  actionButtonIcon?: string;                  // Default: checkmark
  onActionClick?: () => void;                 // Action button handler
  actionButtonDisabled?: boolean;             // Disable action button
  actionButtonLoading?: boolean;              // Show loading on action button
  startButtons?: ReactNode;                   // Custom start buttons
  endButtons?: ReactNode;                     // Custom end buttons
  initialBreakpoint?: number;                 // Sheet breakpoint (0.25-1)
  breakpoints?: number[];                     // Breakpoint array
  scrollY?: boolean;                          // Default: true
  contentPadding?: boolean;                   // Default: true
  isLoading?: boolean;                        // Show loading state
  loadingMessage?: string;                    // Loading message
}
```

#### Usage Examples

**Simple modal with close button:**
```tsx
import { BaseModal } from '@/components/shared';

const MyModal: React.FC = ({ isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Details">
      <div>{content}</div>
    </BaseModal>
  );
};
```

**Form modal with action button:**
```tsx
import { BaseModal } from '@/components/shared';

const MyFormModal: React.FC = ({ isOpen, onClose }) => {
  const { control, handleSubmit, formState: { isDirty } } = useForm();
  const mutation = useCreateItem();
  
  const onSubmit = async (data) => {
    await mutation.mutateAsync(data);
    onClose();
  };
  
  return (
    <BaseModal 
      isOpen={isOpen}
      onClose={onClose}
      title="Add Item"
      showActionButton
      actionButtonLabel="Save"
      onActionClick={handleSubmit(onSubmit)}
      actionButtonDisabled={!isDirty}
      actionButtonLoading={mutation.isPending}
      initialBreakpoint={0.75}
      breakpoints={[0, 0.75, 1]}
    >
      <form>
        <TextField name="name" control={control} label="Name" required />
        <TextAreaField name="description" control={control} label="Description" />
      </form>
    </BaseModal>
  );
};
```

**Modal with loading state:**
```tsx
<BaseModal 
  isOpen={isOpen}
  onClose={onClose}
  title="Item Details"
  isLoading={isLoadingData}
  loadingMessage="Loading item..."
>
  {itemData && <div>{itemData.name}</div>}
</BaseModal>
```

**Modal with custom buttons:**
```tsx
<BaseModal 
  isOpen={isOpen}
  onClose={onClose}
  title="Edit Item"
  endButtons={
    <IonButton onClick={handleDelete} color="danger">
      <IonIcon icon={trash} />
    </IonButton>
  }
>
  {content}
</BaseModal>
```

---

## Form Components

All form components use `react-hook-form` for state management and validation.

### Common Form Props

```typescript
name: Path<T>;              // Required: Field name (react-hook-form)
control: Control<T>;        // Required: Form control (react-hook-form)
label: string;              // Required: Field label
placeholder?: string;       // Placeholder text
required?: boolean;         // Show asterisk, add "required" to label
error?: FieldError;         // Error object from formState.errors
disabled?: boolean;         // Disable the field
```

---

### TextField

**Location:** `@/components/shared/FormFields`

Standard text input field.

#### Additional Props
```typescript
type?: 'text' | 'email' | 'password' | 'tel' | 'url';  // Default: 'text'
```

#### Usage

```tsx
import { TextField } from '@/components/shared/FormFields';

const MyForm: React.FC = () => {
  const { control, formState: { errors } } = useForm<FormData>();
  
  return (
    <form>
      <TextField
        name="name"
        control={control}
        label="Product Name"
        placeholder="Enter product name"
        required
        error={errors.name}
      />
      
      <TextField
        name="email"
        control={control}
        label="Email"
        type="email"
        placeholder="user@example.com"
        error={errors.email}
      />
    </form>
  );
};
```

---

### TextAreaField

**Location:** `@/components/shared/FormFields`

Multi-line text input.

#### Additional Props
```typescript
rows?: number;  // Default: 3
```

#### Usage

```tsx
<TextAreaField
  name="description"
  control={control}
  label="Description"
  placeholder="Enter detailed description"
  rows={5}
  error={errors.description}
/>
```

---

### SelectField

**Location:** `@/components/shared/FormFields`

Dropdown select field.

#### Additional Props
```typescript
options: SelectOption[];                                  // Required
interface?: 'action-sheet' | 'alert' | 'popover';        // Default: 'popover'

// SelectOption type
type SelectOption = {
  value: string;
  label: string;
};
```

#### Usage

```tsx
<SelectField
  name="category_id"
  control={control}
  label="Category"
  placeholder="Select category"
  options={[
    { value: '', label: 'No Category' },
    { value: '1', label: 'Beverages' },
    { value: '2', label: 'Food' }
  ]}
  interface="action-sheet"
  error={errors.category_id}
/>
```

---

### SelectFieldWithAdd

**Location:** `@/components/shared/FormFields`

Select field with an "Add" button to create new options.

#### Additional Props
```typescript
onAddClick: () => void;                                  // Required: Handler to open create modal
interface?: 'action-sheet' | 'alert' | 'popover';       // Default: 'popover'
```

#### Usage

```tsx
const [showCategoryModal, setShowCategoryModal] = useState(false);

<SelectFieldWithAdd
  name="category_id"
  control={control}
  label="Category"
  placeholder="Select category"
  options={categoryOptions}
  onAddClick={() => setShowCategoryModal(true)}
  error={errors.category_id}
/>

<BaseModal 
  isOpen={showCategoryModal}
  onClose={() => setShowCategoryModal(false)}
  title="Add Category"
>
  {/* Category form */}
</BaseModal>
```

---

### PriceField

**Location:** `@/components/shared/FormFields`

Currency input with automatic formatting.

#### Additional Props
```typescript
currency?: string;  // Default: 'USD'
```

#### Features
- Auto-formats to currency when not focused
- Shows raw number when focused for easy editing
- Automatically handles decimal places

#### Usage

```tsx
import { useShop } from '@/hooks/useShop';

const MyForm: React.FC = () => {
  const { currentShop } = useShop();
  
  return (
    <PriceField
      name="price"
      control={control}
      label="Price"
      placeholder="0.00"
      required
      error={errors.price}
      currency={currentShop?.currency_code || 'USD'}
    />
  );
};
```

---

### NumberField

**Location:** `@/components/shared/FormFields`

Numeric input for integers or decimals.

#### Additional Props
```typescript
min?: number;           // Minimum value
max?: number;           // Maximum value
step?: number | 'any';  // Default: 1
```

#### Usage

```tsx
<NumberField
  name="quantity"
  control={control}
  label="Quantity"
  placeholder="0"
  required
  error={errors.quantity}
  min={0}
  step="any"
/>

<NumberField
  name="sequence"
  control={control}
  label="Display Order"
  placeholder="0"
  required
  error={errors.sequence}
  min={0}
  step={1}
/>
```

---

## UI Components

### CardContainer

**Location:** `@/components/shared/CardContainer`

A reusable card wrapper with consistent styling, title, search, and action buttons.

#### Props

```typescript
interface CardContainerProps {
  title?: string;                        // Card title
  subtitle?: string | ReactNode;         // Subtitle text
  actionButton?: ReactNode;              // Custom action button
  onActionClick?: () => void;            // Quick add button handler
  actionIcon?: string;                   // Action button icon (default: add)
  actionLabel?: string;                  // Action button aria-label
  showSearch?: boolean;                  // Enable search
  searchValue?: string;                  // Controlled search value
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;            // Default: "Search..."
  noPadding?: boolean;                   // Remove padding (for IonList)
  variant?: 'default' | 'flat';          // Default: 'default'
  children: ReactNode;
}
```

#### Usage Examples

**List container with action button:**
```tsx
import { CardContainer } from '@/components/shared';

<CardContainer 
  title="Products" 
  onActionClick={handleAddProduct}
  noPadding
>
  <IonList>{products.map(renderProduct)}</IonList>
</CardContainer>
```

**Container with search:**
```tsx
<CardContainer
  title="Inventory Items"
  showSearch
  searchValue={searchText}
  onSearchChange={setSearchText}
  searchPlaceholder="Search inventory..."
  onActionClick={handleAddItem}
  noPadding
>
  <IonList>{items.map(renderItem)}</IonList>
</CardContainer>
```

**Info card with subtitle:**
```tsx
<CardContainer 
  title="Product Details"
  subtitle="SKU: 12345"
>
  <div>{content}</div>
</CardContainer>
```

**Custom action button:**
```tsx
<CardContainer 
  title="Settings"
  actionButton={
    <IonButton onClick={handleSave}>
      <IonIcon icon={save} />
      Save
    </IonButton>
  }
>
  {content}
</CardContainer>
```

---

### SaveButton

**Location:** `@/components/shared/SaveButton`

A button with loading state for save/submit actions.

#### Props

```typescript
interface SaveButtonProps {
  isSaving: boolean;                    // Required: Loading state
  disabled?: boolean;                   // Disable button
  label?: string;                       // Default: "Save"
  savingLabel?: string;                 // Default: "Saving..."
  expand?: 'block' | 'full';            // Button width
  size?: 'small' | 'default' | 'large'; // Default: 'default'
  type?: 'button' | 'submit' | 'reset'; // Default: 'button'
  onClick?: () => void;                 // Click handler
  icon?: string;                        // Default: save icon
  iconOnly?: boolean;                   // Show only icon
}
```

#### Usage

```tsx
import { SaveButton } from '@/components/shared/SaveButton';

const MyForm: React.FC = () => {
  const { formState: { isDirty } } = useForm();
  const mutation = useCreateItem();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      
      <SaveButton
        type="submit"
        expand="block"
        disabled={!isDirty}
        isSaving={mutation.isPending}
        label="Create Item"
        savingLabel="Creating..."
      />
    </form>
  );
};
```

**Icon-only button:**
```tsx
<SaveButton
  isSaving={isSaving}
  onClick={handleSave}
  iconOnly
  size="large"
/>
```

---

### DeleteConfirmationAlert

**Location:** `@/components/shared/DeleteConfirmationAlert`

A confirmation alert that requires typing the item name for safety.

#### Props

```typescript
interface DeleteConfirmationAlertProps {
  isOpen: boolean;                      // Required: Open state
  onDismiss: () => void;                // Required: Dismiss handler
  onConfirm: () => void | Promise<void>; // Required: Confirm handler
  itemName: string;                     // Required: Name to type for confirmation
  itemType?: string;                    // Default: "item"
  header?: string;                      // Custom header
  message?: string;                     // Custom message
}
```

#### Features
- User must type the exact item name to confirm deletion
- Prevents accidental deletions
- Alert stays open if name doesn't match

#### Usage

```tsx
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';

const MyComponent: React.FC = () => {
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const deleteItem = useDeleteItem();
  
  const handleDelete = async () => {
    if (!deletingItemId) return;
    await deleteItem.mutateAsync(deletingItemId);
    setDeletingItemId(null);
  };
  
  return (
    <>
      <IonButton onClick={() => setDeletingItemId(item.id)} color="danger">
        Delete
      </IonButton>
      
      <DeleteConfirmationAlert
        isOpen={!!deletingItemId}
        onDismiss={() => setDeletingItemId(null)}
        onConfirm={handleDelete}
        itemName={item.name}
        itemType="Product"
      />
    </>
  );
};
```

---

## Best Practices

### Page Structure

**✅ DO:**
```tsx
import { BasePage, CenteredLayout } from '@/components/layouts';
import { CardContainer } from '@/components/shared';

const MyPage: React.FC = () => {
  return (
    <BasePage title="My Page" showMenu>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>
      
      <CenteredLayout>
        <CardContainer title="Items" onActionClick={handleAdd} noPadding>
          <IonList>{items}</IonList>
        </CardContainer>
      </CenteredLayout>
    </BasePage>
  );
};
```

**❌ DON'T:**
```tsx
// Don't manually wrap with IonPage, IonHeader, IonContent
const MyPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonMenuButton />
          <IonTitle>My Page</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Use BasePage instead */}
      </IonContent>
    </IonPage>
  );
};
```

---

### Form Structure

**✅ DO:**
```tsx
import { BaseModal } from '@/components/shared';
import { TextField, SelectField, PriceField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';

const MyFormModal: React.FC = ({ isOpen, onClose }) => {
  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', price: 0 }
  });
  
  const mutation = useCreateItem();
  
  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync(data);
    onClose();
  };
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Item"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          name="name"
          control={control}
          label="Name"
          required
          error={errors.name}
        />
        
        <PriceField
          name="price"
          control={control}
          label="Price"
          required
          error={errors.price}
        />
        
        <SaveButton
          type="submit"
          expand="block"
          disabled={!isDirty}
          isSaving={mutation.isPending}
        />
      </form>
    </BaseModal>
  );
};
```

**❌ DON'T:**
```tsx
// Don't manually create form inputs without using FormFields
<IonInput
  label="Name"
  value={name}
  onIonInput={(e) => setName(e.detail.value)}
/>
// Use TextField instead for consistency and validation
```

---

### Modal Patterns

**✅ DO:** Use controlled state for modals
```tsx
const [showModal, setShowModal] = useState(false);

<BaseModal isOpen={showModal} onClose={() => setShowModal(false)} title="Details">
  {content}
</BaseModal>
```

**✅ DO:** Reset form on close
```tsx
const handleClose = () => {
  setShowModal(false);
  reset(); // Reset react-hook-form
};
```

**✅ DO:** Use sheet breakpoints for mobile-friendly modals
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Edit"
  initialBreakpoint={0.75}
  breakpoints={[0, 0.75, 1]}
>
  {content}
</BaseModal>
```

---

### Loading & Error States

**✅ DO:** Use built-in loading states
```tsx
<BasePage title="Products" isLoading={isLoading} notFound={!product}>
  {product && <div>{product.name}</div>}
</BasePage>
```

**✅ DO:** Show loading state on buttons
```tsx
<SaveButton
  type="submit"
  isSaving={mutation.isPending}
  disabled={!isDirty}
/>
```

**✅ DO:** Handle loading in modals
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Details"
  isLoading={isLoadingData}
>
  {data && <div>{data.name}</div>}
</BaseModal>
```

---

### Accessibility

**✅ DO:** Always provide labels
```tsx
<TextField name="name" control={control} label="Product Name" required />
```

**✅ DO:** Use required prop to show asterisk
```tsx
<TextField name="email" control={control} label="Email" required />
// Displays as "Email *"
```

**✅ DO:** Provide error messages through validation schema
```tsx
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});
```

---

### Validation

**✅ DO:** Use Zod for schema validation
```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be positive'),
  email: z.string().email('Invalid email address'),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

**✅ DO:** Show validation errors on fields
```tsx
<TextField
  name="name"
  control={control}
  label="Name"
  error={errors.name}  // Pass error from formState.errors
/>
```

---

### Consistency Checklist

When creating a new page or modal, ensure:

- [ ] Use `BasePage` for all pages (not manual IonPage/IonHeader/IonContent)
- [ ] Use `BaseModal` for all modals
- [ ] Use `CenteredLayout` for content (unless full-width needed)
- [ ] Use `CardContainer` for list/grid sections
- [ ] Use FormField components (TextField, SelectField, etc.)
- [ ] Use `SaveButton` for save/submit actions
- [ ] Use `DeleteConfirmationAlert` for deletions
- [ ] Use `react-hook-form` with Zod validation
- [ ] Handle loading states with built-in props
- [ ] Show error messages from validation
- [ ] Use `onMoreClick` for additional actions instead of multiple header buttons
- [ ] Wrap lists with `noPadding` on CardContainer
- [ ] Use proper TypeScript types for all props

---

## Quick Reference

### Import Patterns

```tsx
// Layouts
import { BasePage, CenteredLayout } from '@/components/layouts';

// Modals
import { BaseModal } from '@/components/shared';

// Form Fields
import { 
  TextField, 
  TextAreaField, 
  SelectField, 
  SelectFieldWithAdd,
  PriceField, 
  NumberField 
} from '@/components/shared/FormFields';

// UI Components
import { CardContainer } from '@/components/shared';
import { SaveButton } from '@/components/shared/SaveButton';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';

// Hooks
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
```

---

## Common Patterns

### List Page
```tsx
<BasePage title="Items" showMenu onMoreClick={handleMore}>
  <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
    <IonRefresherContent />
  </IonRefresher>
  <CenteredLayout>
    <CardContainer 
      title="Items" 
      showSearch
      searchValue={search}
      onSearchChange={setSearch}
      onActionClick={handleAdd}
      noPadding
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <IonList>{items.map(renderItem)}</IonList>
      )}
    </CardContainer>
  </CenteredLayout>
</BasePage>
```

### Detail Page with Collapsible Header
```tsx
const titleRef = useRef<HTMLDivElement>(null);

<BasePage
  title={item.name}
  backHref="/items"
  collapsible
  observedElementRef={titleRef}
  isLoading={isLoading}
  notFound={!item}
>
  <CenteredLayout>
    <div ref={titleRef}>
      <h1>{item.name}</h1>
    </div>
    {/* Rest of content */}
  </CenteredLayout>
</BasePage>
```

### Form Modal
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title={isNew ? 'Add Item' : 'Edit Item'}
  initialBreakpoint={0.75}
  breakpoints={[0, 0.75, 1]}
>
  <form onSubmit={handleSubmit(onSubmit)}>
    <TextField name="name" control={control} label="Name" required error={errors.name} />
    <PriceField name="price" control={control} label="Price" required error={errors.price} />
    <SaveButton type="submit" expand="block" isSaving={mutation.isPending} disabled={!isDirty} />
  </form>
</BaseModal>
```

---

**Last Updated:** January 4, 2026  
**Version:** 1.0.0
