// User Tier System Types and Utilities

export enum UserTier {
  GUEST = 'guest',      // Unlogged users - 1 room, no save
  FREE = 'free',        // Basic registered users
  BASIC = 'basic',      // Limited premium features
  STANDARD = 'standard', // More premium features
  PRO = 'pro',          // Full design suite
  DEV = 'dev',          // Git UI + dev tools
  ADMIN = 'admin',      // Full system access
  GOD = 'god'           // No restrictions whatsoever
}

export type UserTierType = keyof typeof UserTier;

export interface TierPermissions {
  // Design Basics
  maxRooms: number | 'unlimited';
  allowedRoomTypes: string[];
  canSave: boolean;
  canLoad: 'none' | 'own' | 'own-and-public' | 'all';
  
  // Components
  componentAccess: 'basic' | 'some-premium' | 'more-premium' | 'all' | 'all-plus-custom';
  
  // Views & Export
  availableViews: string[];
  has3DViewer: boolean | 'basic' | 'enhanced' | 'full';
  canExport: boolean | 'png-only' | 'png-pdf' | 'all-formats';
  canPrint: boolean;
  
  // Collaboration
  canShare: boolean | 'view-only' | 'edit-links' | 'full-sharing';
  canComment: boolean;
  canUseTeamWorkspaces: boolean;
  
  // Developer Tools
  canAccessGitUI: boolean;
  canAccessDatabaseTools: boolean;
  canManageUsers: boolean;
  canAccessSystemSettings: boolean;
  
  // Session
  sessionTimeout?: number; // minutes, undefined = no timeout
}

export const TIER_PERMISSIONS: Record<UserTier, TierPermissions> = {
  [UserTier.GUEST]: {
    maxRooms: 1,
    allowedRoomTypes: ['kitchen'],
    canSave: false,
    canLoad: 'none',
    componentAccess: 'basic',
    availableViews: ['plan'],
    has3DViewer: false,
    canExport: false,
    canPrint: false,
    canShare: false,
    canComment: false,
    canUseTeamWorkspaces: false,
    canAccessGitUI: false,
    canAccessDatabaseTools: false,
    canManageUsers: false,
    canAccessSystemSettings: false,
    sessionTimeout: 30
  },
  
  [UserTier.FREE]: {
    maxRooms: 3,
    allowedRoomTypes: ['kitchen', 'bedroom'],
    canSave: true,
    canLoad: 'own',
    componentAccess: 'basic',
    availableViews: ['plan', 'front'],
    has3DViewer: 'basic',
    canExport: false,
    canPrint: false,
    canShare: false,
    canComment: false,
    canUseTeamWorkspaces: false,
    canAccessGitUI: false,
    canAccessDatabaseTools: false,
    canManageUsers: false,
    canAccessSystemSettings: false
  },
  
  [UserTier.BASIC]: {
    maxRooms: 5,
    allowedRoomTypes: ['kitchen', 'bedroom', 'bathroom'],
    canSave: true,
    canLoad: 'own',
    componentAccess: 'some-premium',
    availableViews: ['plan', 'front', 'back'],
    has3DViewer: 'basic',
    canExport: 'png-only',
    canPrint: false,
    canShare: 'view-only',
    canComment: false,
    canUseTeamWorkspaces: false,
    canAccessGitUI: false,
    canAccessDatabaseTools: false,
    canManageUsers: false,
    canAccessSystemSettings: false
  },
  
  [UserTier.STANDARD]: {
    maxRooms: 10,
    allowedRoomTypes: ['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room'],
    canSave: true,
    canLoad: 'own',
    componentAccess: 'more-premium',
    availableViews: ['plan', 'front', 'back', 'left', 'right'],
    has3DViewer: 'enhanced',
    canExport: 'png-pdf',
    canPrint: true,
    canShare: 'edit-links',
    canComment: true,
    canUseTeamWorkspaces: false,
    canAccessGitUI: false,
    canAccessDatabaseTools: false,
    canManageUsers: false,
    canAccessSystemSettings: false
  },
  
  [UserTier.PRO]: {
    maxRooms: 'unlimited',
    allowedRoomTypes: ['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'utility', 'under-stairs', 'master-bedroom', 'guest-bedroom', 'ensuite', 'office', 'dressing-room'],
    canSave: true,
    canLoad: 'own-and-public',
    componentAccess: 'all-plus-custom',
    availableViews: ['plan', 'front', 'back', 'left', 'right'],
    has3DViewer: 'full',
    canExport: 'all-formats',
    canPrint: true,
    canShare: 'full-sharing',
    canComment: true,
    canUseTeamWorkspaces: true,
    canAccessGitUI: false,
    canAccessDatabaseTools: false,
    canManageUsers: false,
    canAccessSystemSettings: false
  },
  
  [UserTier.DEV]: {
    maxRooms: 'unlimited',
    allowedRoomTypes: ['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'utility', 'under-stairs', 'master-bedroom', 'guest-bedroom', 'ensuite', 'office', 'dressing-room'],
    canSave: true,
    canLoad: 'own-and-public',
    componentAccess: 'all-plus-custom',
    availableViews: ['plan', 'front', 'back', 'left', 'right'],
    has3DViewer: 'full',
    canExport: 'all-formats',
    canPrint: true,
    canShare: 'full-sharing',
    canComment: true,
    canUseTeamWorkspaces: true,
    canAccessGitUI: true,
    canAccessDatabaseTools: false,
    canManageUsers: false,
    canAccessSystemSettings: false
  },
  
  [UserTier.ADMIN]: {
    maxRooms: 'unlimited',
    allowedRoomTypes: ['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'utility', 'under-stairs', 'master-bedroom', 'guest-bedroom', 'ensuite', 'office', 'dressing-room'],
    canSave: true,
    canLoad: 'all',
    componentAccess: 'all-plus-custom',
    availableViews: ['plan', 'front', 'back', 'left', 'right'],
    has3DViewer: 'full',
    canExport: 'all-formats',
    canPrint: true,
    canShare: 'full-sharing',
    canComment: true,
    canUseTeamWorkspaces: true,
    canAccessGitUI: true,
    canAccessDatabaseTools: true,
    canManageUsers: true,
    canAccessSystemSettings: false
  },
  
  [UserTier.GOD]: {
    maxRooms: 'unlimited',
    allowedRoomTypes: ['kitchen', 'bedroom', 'bathroom', 'living-room', 'dining-room', 'utility', 'under-stairs', 'master-bedroom', 'guest-bedroom', 'ensuite', 'office', 'dressing-room'],
    canSave: true,
    canLoad: 'all',
    componentAccess: 'all-plus-custom',
    availableViews: ['plan', 'front', 'back', 'left', 'right'],
    has3DViewer: 'full',
    canExport: 'all-formats',
    canPrint: true,
    canShare: 'full-sharing',
    canComment: true,
    canUseTeamWorkspaces: true,
    canAccessGitUI: true,
    canAccessDatabaseTools: true,
    canManageUsers: true,
    canAccessSystemSettings: true
  }
};

export const TIER_LEVELS: Record<UserTier, number> = {
  [UserTier.GUEST]: 1,
  [UserTier.FREE]: 2,
  [UserTier.BASIC]: 3,
  [UserTier.STANDARD]: 4,
  [UserTier.PRO]: 5,
  [UserTier.DEV]: 6,
  [UserTier.ADMIN]: 7,
  [UserTier.GOD]: 8
};

export const TIER_NAMES: Record<UserTier, string> = {
  [UserTier.GUEST]: 'Guest',
  [UserTier.FREE]: 'Free',
  [UserTier.BASIC]: 'Basic',
  [UserTier.STANDARD]: 'Standard',
  [UserTier.PRO]: 'Pro',
  [UserTier.DEV]: 'Developer',
  [UserTier.ADMIN]: 'Administrator',
  [UserTier.GOD]: 'God Mode'
};

// Utility functions
export const getUserTierPermissions = (tier: UserTier): TierPermissions => {
  return TIER_PERMISSIONS[tier];
};

export const hasMinimumTier = (userTier: UserTier, requiredTier: UserTier): boolean => {
  return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier];
};

export const isGodTier = (tier: UserTier): boolean => {
  return tier === UserTier.GOD;
};

export const canAccessFeature = (
  userTier: UserTier, 
  feature: keyof TierPermissions
): boolean => {
  const permissions = getUserTierPermissions(userTier);
  return Boolean(permissions[feature]);
};
