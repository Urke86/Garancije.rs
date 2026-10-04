import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { authStorage } from '@/lib/auth/storage';
import { DEMO_MODE } from '@/lib/demo/demo-mode';
import { createDemoSupabase } from '@/lib/demo/mock-supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = DEMO_MODE
  ? (createDemoSupabase() as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
