// Mowatib - Supabase Client & Auth Service

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const authService = {
  async signInWithGoogle() {
    if (!supabase) {
      console.warn('Supabase not configured. Using local demo session.');
      return { user: { id: 'demo-user', email: 'student@mowatib.app', user_metadata: { full_name: 'طالب مواظب (Demo)' } }, error: null };
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { data, error };
  },

  async signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    return { success: true };
  },

  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getUser() {
    if (!supabase) {
      return { id: 'demo-user', email: 'student@mowatib.app', user_metadata: { full_name: 'طالب مواظب' } };
    }
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  },

  onAuthStateChange(callback) {
    if (!supabase) {
      // Mock listener
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  }
};
