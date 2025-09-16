/**
 * God Mode Utilities - For development and testing
 * Provides utilities to enable God mode access for development
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Enable God mode for current user (development only)
 * This function should only be used in development/testing
 */
export const enableGodMode = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ [GodMode] No authenticated user found');
      return false;
    }

    // Update user profile to god tier
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        user_tier: 'god',
        display_name: user.email?.split('@')[0] || 'God User',
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ [GodMode] Failed to enable God mode:', error);
      return false;
    }

    console.log('🔥 [GodMode] God mode enabled! Refresh the page to see dev tools.');
    return true;

  } catch (error) {
    console.error('❌ [GodMode] Error enabling God mode:', error);
    return false;
  }
};

/**
 * Disable God mode for current user
 */
export const disableGodMode = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ [GodMode] No authenticated user found');
      return false;
    }

    // Update user profile to free tier
    const { error } = await supabase
      .from('profiles')
      .update({
        user_tier: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ [GodMode] Failed to disable God mode:', error);
      return false;
    }

    console.log('👤 [GodMode] God mode disabled. Refresh the page.');
    return true;

  } catch (error) {
    console.error('❌ [GodMode] Error disabling God mode:', error);
    return false;
  }
};

/**
 * Check current user tier
 */
export const checkUserTier = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ [GodMode] No authenticated user found');
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_tier')
      .eq('user_id', user.id)
      .maybeSingle();

    const tier = profile?.user_tier || 'free';
    console.log(`👤 [GodMode] Current user tier: ${tier}`);
    return tier;

  } catch (error) {
    console.error('❌ [GodMode] Error checking user tier:', error);
    return null;
  }
};

// Make functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).enableGodMode = enableGodMode;
  (window as any).disableGodMode = disableGodMode;
  (window as any).checkUserTier = checkUserTier;
  
  console.log('🔥 [GodMode] Development utilities loaded:');
  console.log('  - enableGodMode() - Enable God mode access');
  console.log('  - disableGodMode() - Disable God mode access'); 
  console.log('  - checkUserTier() - Check current user tier');
}
