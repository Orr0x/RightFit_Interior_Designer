import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Crown, 
  GitBranch, 
  Database, 
  Users, 
  Settings, 
  Upload, 
  FileText, 
  Images, 
  Globe 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, TIER_NAMES } from '@/types/user-tiers';

interface DevToolsHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const DevToolsHeader: React.FC<DevToolsHeaderProps> = ({ title, description, icon }) => {
  const { user } = useAuth();
  const location = useLocation();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case UserTier.GOD: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case UserTier.ADMIN: return 'bg-gradient-to-r from-purple-400 to-purple-600';
      case UserTier.DEV: return 'bg-gradient-to-r from-blue-400 to-blue-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  // Quick navigation items
  const quickNavItems = [
    { path: '/dev/git', icon: <GitBranch className="h-4 w-4" />, label: 'Git' },
    { path: '/dev/media', icon: <Upload className="h-4 w-4" />, label: 'Media' },
    { path: '/dev/blog', icon: <FileText className="h-4 w-4" />, label: 'Blog' },
    { path: '/dev/gallery', icon: <Images className="h-4 w-4" />, label: 'Gallery' },
    { path: '/dev/database', icon: <Database className="h-4 w-4" />, label: 'Database' },
    { path: '/dev/users', icon: <Users className="h-4 w-4" />, label: 'Users' },
    { path: '/dev/system', icon: <Settings className="h-4 w-4" />, label: 'System' },
    { path: '/dev/cms', icon: <Globe className="h-4 w-4" />, label: 'CMS' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 space-y-4">
          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Back to DevTools Button */}
              <Link to="/dev">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dev Tools
                </Button>
              </Link>
              
              {/* Current Tool Info */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className={`${getTierColor(userTier)} text-white px-3 py-1`}>
                <Crown className="h-3 w-3 mr-1" />
                {TIER_NAMES[userTier]}
              </Badge>
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Quick Nav:</span>
            {quickNavItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant={location.pathname === item.path ? "default" : "ghost"} 
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {item.icon}
                  <span className="ml-1 hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevToolsHeader;
