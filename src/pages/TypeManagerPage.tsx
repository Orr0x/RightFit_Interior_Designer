import React from 'react';
import TypeManager from '@/components/TypeManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserTier } from '@/types/user-tiers';

const TypeManagerPage: React.FC = () => {
  return (
    <ProtectedRoute
      requiredTier={UserTier.DEV}
      requireAuth={true}
      godOverride={true}
      showUpgradePrompt={true}
    >
      <TypeManager />
    </ProtectedRoute>
  );
};

export default TypeManagerPage;
