// Shop Team Page - Manage shop team members

import { zodResolver } from '@hookform/resolvers/zod';
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
  type RefresherEventDetail,
} from '@ionic/react';
import { lockClosed, trash } from 'ionicons/icons';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { BaseModal, CardContainer } from '@/components/shared';
import { Div } from '@/components/shared/base/Div';
import { SelectField, TextField } from '@/components/shared/FormFields';
import { SaveButton } from '@/components/shared/SaveButton';
import { LoadingSpinner } from '@/components/ui';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import { useUI } from '@/contexts/UIContext';
import {
  useShop,
  useShopUsers,
  useUpdateTeamMember,
  useCreateTeamMember,
  useResetTeamMemberPassword,
  useRemoveTeamMember,
} from '@/hooks/useShop';
import type { ShopUser, ShopRole } from '@/types';

// --- Schemas ---

const addMemberSchema = z.object({
  displayName: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['manager', 'staff']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const editMemberSchema = z.object({
  displayName: z.string().min(1, 'Name is required'),
  role: z.enum(['manager', 'staff']),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AddMemberForm = z.infer<typeof addMemberSchema>;
type EditMemberForm = z.infer<typeof editMemberSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// --- Role badge colour ---
const roleBadgeColor: Record<ShopRole, string> = {
  owner: 'primary',
  manager: 'secondary',
  staff: 'medium',
};

const roleOptions: { value: 'manager' | 'staff'; label: string; description: string }[] = [
  { value: 'manager', label: 'Manager', description: 'Can manage products, inventory, and sales' },
  { value: 'staff', label: 'Staff', description: 'Can use POS and view products and inventory' },
];

// --- Helper: avatar initial ---
function avatarInitial(name: string | null | undefined): string {
  return (name ?? '?').charAt(0).toUpperCase();
}

// --- Page ---

const ShopTeamPage: React.FC = () => {
  const { currentShop, isLoading: shopLoading } = useShop();
  const shopId = currentShop?.id;
  const { showError } = useUI();

  const { data: members, isLoading: membersLoading, refetch } = useShopUsers(shopId);
  const isLoading = shopLoading || membersLoading;

  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const resetPassword = useResetTeamMemberPassword();
  const removeMember = useRemoveTeamMember();

  // Search
  const [searchText, setSearchText] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<ShopUser | null>(null);
  const [resetMember, setResetMember] = useState<ShopUser | null>(null);
  const [removingMember, setRemovingMember] = useState<ShopUser | null>(null);

  // Forms
  const addForm = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { role: 'staff' },
  });

  const editForm = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema),
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // --- Filtered members ---
  const memberName = (m: ShopUser) => m.user_profiles?.display_name ?? m.email ?? 'Unknown';

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!searchText) return members;
    const lower = searchText.toLowerCase();
    return members.filter(
      (m) =>
        memberName(m).toLowerCase().includes(lower) ||
        m.email?.toLowerCase().includes(lower)
    );
  }, [members, searchText]);

  // --- Pull-to-refresh ---
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  // --- Handlers ---

  const handleAdd = addForm.handleSubmit(async (values) => {
    if (!shopId) return;
    try {
      await createMember.mutateAsync({
        shopId,
        data: {
          email: values.email,
          displayName: values.displayName,
          password: values.password,
          role: values.role,
        },
      });
      addForm.reset();
      setShowAddModal(false);
    } catch (err) {
      showError((err as Error)?.message ?? 'Failed to add team member');
    }
  });

  const openEditModal = (member: ShopUser) => {
    setEditingMember(member);
    editForm.reset({
      displayName: member.user_profiles?.display_name ?? '',
      role: member.role === 'owner' ? 'staff' : member.role,
    });
  };

  const handleEditMember = editForm.handleSubmit(async (values) => {
    if (!shopId || !editingMember) return;
    try {
      await updateMember.mutateAsync({
        shopId,
        userId: editingMember.user_id,
        data: { displayName: values.displayName, role: values.role },
      });
      setEditingMember(null);
    } catch (err) {
      showError((err as Error)?.message ?? 'Failed to update member');
    }
  });

  const handleResetPassword = resetForm.handleSubmit(async (values) => {
    if (!shopId || !resetMember) return;
    try {
      await resetPassword.mutateAsync({ shopId, userId: resetMember.user_id, password: values.password });
      resetForm.reset();
      setResetMember(null);
    } catch (err) {
      showError((err as Error)?.message ?? 'Failed to reset password');
    }
  });

  const handleRemove = async () => {
    if (!shopId || !removingMember) return;
    try {
      await removeMember.mutateAsync({ shopId, userId: removingMember.user_id });
      setRemovingMember(null);
    } catch (err) {
      showError((err as Error)?.message ?? 'Failed to remove team member');
    }
  };

  // --- Render helpers ---

  const renderMember = (member: ShopUser, last: boolean=false) => (
    <IonItem
      key={member.user_id}
      button={member.role !== 'owner'}
      onClick={member.role !== 'owner' ? () => openEditModal(member) : undefined}
      lines={last ? 'none' : 'full'}
    >
      <Div
        slot="start"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--ion-color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 8,
        }}
      >
        <span style={{ color: 'white', fontWeight: 600 }}>
          {avatarInitial(member.user_profiles?.display_name)}
        </span>
      </Div>
      <IonLabel>
        <h2>{memberName(member)} </h2>
        <IonBadge color={roleBadgeColor[member.role]}>
            {member.role}
          </IonBadge>
        {member.email && <p>{member.email}</p>}
      </IonLabel>
      
    </IonItem>
  );

  const renderEmptyState = () => (
    <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
      <h2>No Team Members Yet</h2>
      <p>Add team members to collaborate on your shop</p>
    </Div>
  );

  // No shop selected
  if (!currentShop && !shopLoading) {
    return (
      <BasePage title="Shop Team" backHref="/shops">
        <CenteredLayout>
          <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
            <h2>No Shop Selected</h2>
            <p>Please select a shop to manage team members</p>
          </Div>
        </CenteredLayout>
      </BasePage>
    );
  }

  return (
    <BasePage title="Shop Team" backHref={`/shops/${shopId}/settings`}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <CenteredLayout>
        <CardContainer
          title="Team Members"
          onActionClick={() => {
            addForm.reset({ role: 'staff' });
            setShowAddModal(true);
          }}
          noPadding
          showSearch={true}
          searchPlaceholder="Search members..."
          searchValue={searchText}
          onSearchChange={setSearchText}
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : !members || members.length === 0 ? (
            renderEmptyState()
          ) : filteredMembers.length === 0 ? (
            <Div className="empty-state ion-text-center" style={{ padding: '48px 16px' }}>
              <IonText>
                <h3>No members match your search</h3>
              </IonText>
            </Div>
          ) : (
            <IonList lines="none">
              {filteredMembers.map((member, index) => renderMember(member, index === filteredMembers.length - 1))}
            </IonList>
          )}
        </CardContainer>
      </CenteredLayout>

      {/* Add Member Modal */}
      <BaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Team Member"
        initialBreakpoint={.75}
        breakpoints={[0, 0.75]}
      >
        <TextField
          control={addForm.control}
          name="displayName"
          label="Full Name"
          placeholder="e.g. Maria Santos"
          error={addForm.formState.errors.displayName}
        />
        <TextField
          control={addForm.control}
          name="email"
          label="Email"
          placeholder="staff@example.com"
          type="email"
          error={addForm.formState.errors.email}
        />
        <SelectField
          control={addForm.control}
          name="role"
          label="Role"
          options={roleOptions}
        />
        <TextField
          control={addForm.control}
          name="password"
          label="Temporary Password"
          placeholder="Min. 6 characters"
          type="password"
          error={addForm.formState.errors.password}
        />
        <Div style={{ marginTop: 16 }}>
          <SaveButton
            expand="block"
            onClick={handleAdd}
            isSaving={createMember.isPending}
            label="Add Member"
            savingLabel="Adding..."
          />
        </Div>
      </BaseModal>

      {/* Edit Member Modal */}
      <BaseModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        title={editingMember ? memberName(editingMember) : 'Edit Member'}
        initialBreakpoint={.75}
        breakpoints={[0, 0.75]}
      >
        <SelectField
          control={editForm.control}
          name="role"
          label="Role"
          options={roleOptions}
        />
        <Div style={{ marginTop: 16 }}>
          <SaveButton
            expand="block"
            onClick={handleEditMember}
            isSaving={updateMember.isPending}
            label="Change Role"
            savingLabel="Saving..."
          />
        </Div>

        <Div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => {
              const member = editingMember;
              setEditingMember(null);
              if (member) {
                resetForm.reset();
                setResetMember(member);
              }
            }}
          >
            <IonIcon icon={lockClosed} slot="start" />
            Reset Password
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            onClick={() => {
              const member = editingMember;
              setEditingMember(null);
              if (member) setRemovingMember(member);
            }}
          >
            <IonIcon icon={trash} slot="start" />
            Remove Member
          </IonButton>
        </Div>
      </BaseModal>

      {/* Reset Password Modal */}
      <BaseModal
        isOpen={!!resetMember}
        onClose={() => setResetMember(null)}
        title="Reset Password"
      >
        <TextField
          control={resetForm.control}
          name="password"
          label="New Password"
          placeholder="Min. 6 characters"
          type="password"
          error={resetForm.formState.errors.password}
        />
        <TextField
          control={resetForm.control}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Repeat password"
          type="password"
          error={resetForm.formState.errors.confirmPassword}
        />
        <Div style={{ marginTop: 16 }}>
          <SaveButton
            expand="block"
            onClick={handleResetPassword}
            isSaving={resetPassword.isPending}
            label="Save Password"
            savingLabel="Saving..."
          />
        </Div>
      </BaseModal>

      {/* Remove confirmation */}
      <DeleteConfirmationAlert
        isOpen={!!removingMember}
        onDismiss={() => setRemovingMember(null)}
        onConfirm={handleRemove}
        itemName={removingMember ? memberName(removingMember) : ''}
        itemType="Team Member"
      />
    </BasePage>
  );
};

export default ShopTeamPage;
