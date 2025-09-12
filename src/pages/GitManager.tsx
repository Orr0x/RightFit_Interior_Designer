import React from 'react';
import GitUIManager from '@/components/GitUIManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserTier } from '@/types/user-tiers';

const GitManager: React.FC = () => {
  return (
    <ProtectedRoute 
      requiredTier={UserTier.DEV}
      requireAuth={true}
      godOverride={true}
      showUpgradePrompt={true}
    >
      <GitUIManager />
    </ProtectedRoute>
  );
};

export default GitManager;
