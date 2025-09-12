import React from 'react';
import ComponentManager from '@/components/ComponentManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserTier } from '@/types/user-tiers';

const ComponentManagerPage: React.FC = () => {
  return (
    <ProtectedRoute 
      requiredTier={UserTier.DEV}
      requireAuth={true}
      godOverride={true}
      showUpgradePrompt={true}
    >
      <ComponentManager />
    </ProtectedRoute>
  );
};

export default ComponentManagerPage;
