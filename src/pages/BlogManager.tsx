import React from 'react';
import BlogManager from '@/components/BlogManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserTier } from '@/types/user-tiers';

const BlogManagerPage: React.FC = () => {
  return (
    <ProtectedRoute 
      requiredTier={UserTier.DEV}
      requireAuth={true}
      godOverride={true}
      showUpgradePrompt={true}
    >
      <BlogManager />
    </ProtectedRoute>
  );
};

export default BlogManagerPage;
