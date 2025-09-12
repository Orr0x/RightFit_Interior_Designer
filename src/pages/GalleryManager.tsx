import React from 'react';
import GalleryManager from '@/components/GalleryManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserTier } from '@/types/user-tiers';

const GalleryManagerPage: React.FC = () => {
  return (
    <ProtectedRoute 
      requiredTier={UserTier.DEV}
      requireAuth={true}
      godOverride={true}
      showUpgradePrompt={true}
    >
      <GalleryManager />
    </ProtectedRoute>
  );
};

export default GalleryManagerPage;
