// OwnerOnlyGuard - Protect routes that require owner role

import { IonLoading } from '@ionic/react';
import type React from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { useShop } from '@/hooks/useShop';

interface OwnerOnlyGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps routes that require the owner role.
 * Redirects non-owners to the shop home page.
 */
function OwnerOnlyGuard({ children }: OwnerOnlyGuardProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole, isLoading } = useShop();

  if (isLoading) {
    return <IonLoading isOpen={true} message="Loading..." />;
  }

  if (currentRole !== 'owner') {
    return <Redirect to={`/shops/${shopId}`} />;
  }

  return <>{children}</>;
}

export default OwnerOnlyGuard;
