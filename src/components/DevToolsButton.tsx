import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
import { Button } from '@/components/ui/button';
import { Crown, Home, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const DevToolsButton: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  // Hide DevToolsButton - using header dev tools instead
  return null;

  // Check if we're currently in dev mode (any route starting with /dev)
  const isInDevMode = location.pathname.startsWith('/dev');

  const handleClick = () => {
    if (isInDevMode) {
      // If in dev mode, go back to main site
      navigate('/');
    } else {
      // If on main site, go to dev tools
      navigate('/dev');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`fixed bottom-4 right-4 shadow-lg z-50 ${
        isInDevMode 
          ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
          : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
      }`}
    >
      {isInDevMode ? (
        <>
          <Home className="h-4 w-4 mr-2" />
          Main Site
        </>
      ) : (
        <>
          <Crown className="h-4 w-4 mr-2" />
          Dev Tools
        </>
      )}
    </Button>
  );
};

export default DevToolsButton;
