import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Logger } from '@/utils/Logger';

// Get environment variables - these will be set from .env files based on build mode
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables are present
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  Logger.error('❌ Missing Supabase environment variables');
  Logger.error('Please check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  throw new Error('Missing required Supabase configuration');
}

// Create Supabase client with simple, reliable configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});