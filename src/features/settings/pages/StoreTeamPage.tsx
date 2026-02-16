// Store Team Page - Manage shop team members

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonActionSheet,
  IonAvatar,
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
} from '@ionic/react';
import { ellipsisVertical } from 'ionicons/icons';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BasePage, CenteredLayout } from '@/components/layouts';
import { BaseModal } from '@/components/shared';
import { CardContainer } from '@/components/shared/CardContainer';
import { SelectField, TextField } from '@/components/shared/FormFields';
import { LoadingSpinner } from '@/components/ui';
import DeleteConfirmationAlert from '@/components/shared/DeleteConfirmationAlert';
import {
  useShop,
  useShopUsers,
  useUpdateUserRole,
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

const editRoleSchema = z.object({
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
type EditRoleForm = z.infer<typeof editRoleSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// --- Role badge colour ---
const roleBadgeColor: Record<ShopRole, string> = {
  owner: 'primary',
  manager: 'secondary',
  staff: 'medium',
};

const roleOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
];

// --- Helper: avatar initial ---
function avatarInitial(name: string | null | undefined): string {
  return (name ?? '?').charAt(0).toUpperCase();
}

// --- Page ---

const StoreTeamPage: React.FC = () => {
  const { currentShop } = useShop();
  const shopId = currentShop?.id;

  const { data: members, isLoading } = useShopUsers(shopId);

  const createMember = useCreateTeamMember();
  const updateRole = useUpdateUserRole();
  const resetPassword = useResetTeamMemberPassword();
  const removeMember = useRemoveTeamMember();

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<ShopUser | null>(null);
  const [resetMember, setResetMember] = useState<ShopUser | null>(null);
  const [removingMember, setRemovingMember] = useState<ShopUser | null>(null);
  const [actionSheetMember, setActionSheetMember] = useState<ShopUser | null>(null);

  // Forms
  const addForm = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { role: 'staff' },
  });

  const editForm = useForm<EditRoleForm>({
    resolver: zodResolver(editRoleSchema),
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

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
    } catch {
      // error displayed via createMember.isError
    }
  });

  const openEditModal = (member: ShopUser) => {
    setEditingMember(member);
    editForm.reset({ role: member.role === 'owner' ? 'staff' : member.role });
  };

  const handleEditRole = editForm.handleSubmit(async (values) => {
    if (!shopId || !editingMember) return;
    try {
      await updateRole.mutateAsync({ shopId, userId: editingMember.user_id, role: values.role });
      setEditingMember(null);
    } catch {
      // error silently prevented from becoming unhandled rejection
    }
  });

  const handleResetPassword = resetForm.handleSubmit(async (values) => {
    if (!shopId || !resetMember) return;
    try {
      await resetPassword.mutateAsync({ shopId, userId: resetMember.user_id, password: values.password });
      resetForm.reset();
      setResetMember(null);
    } catch {
      // error displayed via resetPassword.isError
    }
  });

  const handleRemove = async () => {
    if (!shopId || !removingMember) return;
    try {
      await removeMember.mutateAsync({ shopId, userId: removingMember.user_id });
      setRemovingMember(null);
    } catch {
      // error silently prevented from becoming unhandled rejection
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const memberName = (m: ShopUser) => m.user_profiles?.display_name ?? m.email ?? 'Unknown';

  return (
    <BasePage title="Store Team" backHref={`/shops/${shopId}/settings`}>
      <CenteredLayout>
        <CardContainer
          title="Team Members"
          onActionClick={() => {
            addForm.reset({ role: 'staff' });
            setShowAddModal(true);
          }}
          noPadding
        >
          <IonList lines="none">
            {(members ?? []).map((member) => (
              <IonItem key={member.user_id}>
                <IonAvatar
                  slot="start"
                  style={{
                    width: 36,
                    height: 36,
                    background: 'var(--ion-color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: 'white', fontWeight: 600 }}>
                    {avatarInitial(member.user_profiles?.display_name)}
                  </span>
                </IonAvatar>
                <IonLabel>
                  <h2>{memberName(member)}</h2>
                  {member.email && <p>{member.email}</p>}
                </IonLabel>
                <IonBadge color={roleBadgeColor[member.role]} slot="end" style={{ marginRight: 8 }}>
                  {member.role}
                </IonBadge>
                {member.role !== 'owner' && (
                  <IonButton fill="clear" slot="end" onClick={() => setActionSheetMember(member)}>
                    <IonIcon icon={ellipsisVertical} />
                  </IonButton>
                )}
              </IonItem>
            ))}
          </IonList>
        </CardContainer>

        {/* Action sheet for member actions */}
        <IonActionSheet
          isOpen={!!actionSheetMember}
          onDidDismiss={() => setActionSheetMember(null)}
          header={actionSheetMember ? memberName(actionSheetMember) : undefined}
          buttons={[
            {
              text: 'Edit Role',
              handler: () => {
                if (actionSheetMember) openEditModal(actionSheetMember);
              },
            },
            {
              text: 'Reset Password',
              handler: () => {
                if (actionSheetMember) {
                  setResetMember(actionSheetMember);
                  resetForm.reset();
                }
              },
            },
            {
              text: 'Remove',
              role: 'destructive',
              handler: () => {
                if (actionSheetMember) setRemovingMember(actionSheetMember);
              },
            },
            { text: 'Cancel', role: 'cancel' },
          ]}
        />

        {/* Add Member Modal */}
        <BaseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Team Member"
          showActionButton
          actionButtonLabel="Add"
          onActionClick={handleAdd}
          actionButtonLoading={createMember.isPending}
          actionButtonDisabled={createMember.isPending}
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
          {createMember.isError && (
            <IonText color="danger">
              <p style={{ padding: '0 16px' }}>{(createMember.error as Error)?.message}</p>
            </IonText>
          )}
        </BaseModal>

        {/* Edit Role Modal */}
        <BaseModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          title="Edit Role"
          showActionButton
          actionButtonLabel="Save"
          onActionClick={handleEditRole}
          actionButtonLoading={updateRole.isPending}
          actionButtonDisabled={updateRole.isPending}
        >
          <SelectField
            control={editForm.control}
            name="role"
            label="Role"
            options={roleOptions}
          />
        </BaseModal>

        {/* Reset Password Modal */}
        <BaseModal
          isOpen={!!resetMember}
          onClose={() => setResetMember(null)}
          title="Reset Password"
          showActionButton
          actionButtonLabel="Save"
          onActionClick={handleResetPassword}
          actionButtonLoading={resetPassword.isPending}
          actionButtonDisabled={resetPassword.isPending}
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
          {resetPassword.isError && (
            <IonText color="danger">
              <p style={{ padding: '0 16px' }}>{(resetPassword.error as Error)?.message}</p>
            </IonText>
          )}
        </BaseModal>

        {/* Remove confirmation */}
        <DeleteConfirmationAlert
          isOpen={!!removingMember}
          onDismiss={() => setRemovingMember(null)}
          onConfirm={handleRemove}
          itemName={removingMember ? memberName(removingMember) : ''}
          itemType="Team Member"
        />
      </CenteredLayout>
    </BasePage>
  );
};

export default StoreTeamPage;
