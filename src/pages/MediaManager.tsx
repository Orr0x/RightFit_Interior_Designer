import React from 'react';
import MediaManager from '@/components/MediaManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserTier } from '@/types/user-tiers';

const MediaManagerPage: React.FC = () => {
  return (
    <ProtectedRoute 
      requiredTier={UserTier.DEV}
      requireAuth={true}
      godOverride={true}
      showUpgradePrompt={true}
    >
      <MediaManager />
    </ProtectedRoute>
  );
};

export default MediaManagerPage;
