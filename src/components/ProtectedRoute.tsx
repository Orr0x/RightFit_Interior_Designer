import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, hasMinimumTier, isGodTier, TIER_NAMES } from '@/types/user-tiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Zap } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier?: UserTier;
  requireAuth?: boolean;
  godOverride?: boolean;
  fallbackPath?: string;
  showUpgradePrompt?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredTier = UserTier.FREE,
  requireAuth = true,
  godOverride = true,
  fallbackPath = '/login',
  showUpgradePrompt = true
}) => {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Guest access (no auth required)
  if (!requireAuth && !user) {
    return <>{children}</>;
  }

  // Get user tier (default to FREE for authenticated users without tier)
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;

  // GOD users can access everything
  if (godOverride && isGodTier(userTier)) {
    return <>{children}</>;
  }

  // Check if user meets minimum tier requirement
  if (hasMinimumTier(userTier, requiredTier)) {
    return <>{children}</>;
  }

  // User doesn't have required tier - show upgrade prompt or redirect
  if (showUpgradePrompt) {
    return <AccessDenied currentTier={userTier} requiredTier={requiredTier} />;
  }

  return <Navigate to={fallbackPath} replace />;
};

interface AccessDeniedProps {
  currentTier: UserTier;
  requiredTier: UserTier;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ currentTier, requiredTier }) => {
  const getTierIcon = (tier: UserTier) => {
    if (tier === UserTier.GOD) return <Crown className="h-6 w-6 text-yellow-500" />;
    if ([UserTier.DEV, UserTier.ADMIN].includes(tier)) return <Zap className="h-6 w-6 text-blue-500" />;
    return <Lock className="h-6 w-6 text-gray-500" />;
  };

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case UserTier.GOD: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case UserTier.ADMIN: return 'text-purple-600 bg-purple-50 border-purple-200';
      case UserTier.DEV: return 'text-blue-600 bg-blue-50 border-blue-200';
      case UserTier.PRO: return 'text-green-600 bg-green-50 border-green-200';
      case UserTier.STANDARD: return 'text-orange-600 bg-orange-50 border-orange-200';
      case UserTier.BASIC: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getTierIcon(requiredTier)}
          </div>
          <CardTitle className="text-2xl">Access Restricted</CardTitle>
          <CardDescription>
            This feature requires a higher tier subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-lg border bg-gray-50">
            <span className="text-sm text-gray-600">Your current tier:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getTierColor(currentTier)}`}>
              {TIER_NAMES[currentTier]}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg border bg-green-50 border-green-200">
            <span className="text-sm text-gray-600">Required tier:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getTierColor(requiredTier)}`}>
              {TIER_NAMES[requiredTier]}
            </span>
          </div>

          <div className="pt-4 space-y-2">
            <Button className="w-full" size="lg">
              Upgrade to {TIER_NAMES[requiredTier]}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>

          {requiredTier === UserTier.DEV && (
            <div className="text-xs text-center text-gray-500 mt-4">
              Developer access is by invitation only. Contact support if you believe this is an error.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProtectedRoute;
