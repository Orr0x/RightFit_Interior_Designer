import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, TIER_NAMES, getUserTierPermissions } from '@/types/user-tiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Database, GitBranch, Settings, Users } from 'lucide-react';

const DevTools: React.FC = () => {
  const { user } = useAuth();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case UserTier.GOD: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case UserTier.ADMIN: return 'bg-gradient-to-r from-purple-400 to-purple-600';
      case UserTier.DEV: return 'bg-gradient-to-r from-blue-400 to-blue-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900">Developer Tools</h1>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="secondary" className={`${getTierColor(userTier)} text-white px-4 py-2`}>
              {TIER_NAMES[userTier]} Access
            </Badge>
            <span className="text-gray-600">Welcome, {user?.email}</span>
          </div>
        </div>

        {/* Permissions Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Permissions</CardTitle>
            <CardDescription>
              What you can access with your current tier level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <GitBranch className={`h-5 w-5 ${permissions.canAccessGitUI ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={permissions.canAccessGitUI ? 'text-green-700' : 'text-gray-500'}>
                  Git UI Manager
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className={`h-5 w-5 ${permissions.canAccessDatabaseTools ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={permissions.canAccessDatabaseTools ? 'text-green-700' : 'text-gray-500'}>
                  Database Tools
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className={`h-5 w-5 ${permissions.canManageUsers ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={permissions.canManageUsers ? 'text-green-700' : 'text-gray-500'}>
                  User Management
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className={`h-5 w-5 ${permissions.canAccessSystemSettings ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={permissions.canAccessSystemSettings ? 'text-green-700' : 'text-gray-500'}>
                  System Settings
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tool Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Git UI Manager */}
          <Card className={!permissions.canAccessGitUI ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5" />
                <span>Git UI Manager</span>
              </CardTitle>
              <CardDescription>
                Visual interface for managing Git branches, commits, and deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                disabled={!permissions.canAccessGitUI}
                onClick={() => permissions.canAccessGitUI && (window.location.href = '/dev/git')}
              >
                {permissions.canAccessGitUI ? 'Open Git Manager' : 'Access Denied'}
              </Button>
            </CardContent>
          </Card>

          {/* Database Tools */}
          <Card className={!permissions.canAccessDatabaseTools ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Tools</span>
              </CardTitle>
              <CardDescription>
                Database administration, migrations, and data management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                disabled={!permissions.canAccessDatabaseTools}
                onClick={() => window.location.href = '/dev/database'}
              >
                {permissions.canAccessDatabaseTools ? 'Open Database Tools' : 'Admin Only'}
              </Button>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className={!permissions.canManageUsers ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage user accounts, tiers, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                disabled={!permissions.canManageUsers}
                onClick={() => window.location.href = '/dev/users'}
              >
                {permissions.canManageUsers ? 'Manage Users' : 'Admin Only'}
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className={!permissions.canAccessSystemSettings ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>System Settings</span>
              </CardTitle>
              <CardDescription>
                Global system configuration and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                disabled={!permissions.canAccessSystemSettings}
                onClick={() => window.location.href = '/dev/system'}
              >
                {permissions.canAccessSystemSettings ? 'System Settings' : 'God Mode Only'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tier Info */}
        <Card>
          <CardHeader>
            <CardTitle>Tier System Status</CardTitle>
            <CardDescription>
              Database migration completed successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Database Migration:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✅ Completed
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Existing Users:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✅ Upgraded to GOD Tier
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Your Current Tier:</span>
                <Badge className={getTierColor(userTier)}>
                  {TIER_NAMES[userTier]}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevTools;
