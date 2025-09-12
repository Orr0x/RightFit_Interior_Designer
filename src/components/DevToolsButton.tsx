import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
import { Button } from '@/components/ui/button';
import { Crown, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DevToolsButton: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  // Only show for users who have dev access
  if (!permissions.canAccessGitUI && userTier !== UserTier.ADMIN && userTier !== UserTier.GOD) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate('/dev')}
      className="fixed bottom-4 right-4 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg z-50"
    >
      <Crown className="h-4 w-4 mr-2" />
      Dev Tools
    </Button>
  );
};

export default DevToolsButton;
