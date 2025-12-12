import { supabase } from '../supabase/config';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export const authService = {
  /**
   * Login with email and password
   * Returns AuthUser if successful, null otherwise
   */
  async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error('Login failed:', error?.message || 'Unknown error');
        return null;
      }

      // Get user profile to check admin status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch failed:', profileError?.message);
        return null;
      }

      // Update last login timestamp
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      return {
        id: data.user.id,
        email: data.user.email!,
        isAdmin: profile.is_admin,
      };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return null;
    }
  },

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    }
  },

  /**
   * Get current session if exists
   * Returns AuthUser if session is valid, null otherwise
   */
  async getSession(): Promise<AuthUser | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return null;
      }

      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        return null;
      }

      return {
        id: session.user.id,
        email: session.user.email!,
        isAdmin: profile.is_admin,
      };
    } catch (error) {
      console.error('Session check error:', error);
      return null;
    }
  },

  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // User signed in, get their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          callback({
            id: session.user.id,
            email: session.user.email!,
            isAdmin: profile.is_admin,
          });
        } else {
          callback(null);
        }
      } else {
        // User signed out
        callback(null);
      }
    });

    return data;
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      return false;
    }
  },
};
