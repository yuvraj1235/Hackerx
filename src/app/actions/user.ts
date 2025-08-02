// app/actions/user.ts
'use server';

import { createClient } from "@/utils/superbase/server"; // Your server-side Supabase client

/**
 * Ensures a user profile exists in the public.profiles table.
 * If a profile for the current authenticated user (auth.uid()) doesn't exist, it creates one.
 * If it exists, it updates their email, name, and avatar_url based on current auth data.
 * @returns {Promise<{ success: boolean; message?: string; profile?: any }>}
 */
export async function ensureUserProfile() {
  const supabase = await createClient();

  // 1. Get the current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // If no user is authenticated, we cannot create a profile.
    // This action should only be called when a user is known to be logged in.
    console.error('ensureUserProfile: No authenticated user found.', userError);
    return { success: false, message: 'User not authenticated' };
  }

  // 2. Prepare profile data from user object (especially for Google logins)
  // user.user_metadata contains additional data from OAuth providers like Google
  const profileData = {
    id: user.id,
    email: user.email,
    // Safely get name and avatar from user_metadata for Google logins
    name: user.user_metadata?.full_name || user.email, // Use full_name if available, else email
    avatar_url: user.user_metadata?.avatar_url,
  };

  // 3. Upsert the profile data into the public.profiles table
  // upsert will insert if the ID doesn't exist, or update if it does.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' }) // 'onConflict: id' ensures upsert behavior
    .select() // Select the created/updated row
    .single(); // Expect a single row back

  if (profileError) {
    console.error('ensureUserProfile: Error upserting profile:', profileError.message);
    return { success: false, message: `Error managing user profile: ${profileError.message}` };
  }

  console.log('ensureUserProfile: Profile successfully ensured:', profile);
  return { success: true, profile };
}

/**
 * Fetches the current user's profile data.
 * @returns {Promise<{ success: boolean; message?: string; profile?: any }>}
 */
export async function fetchUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'User not authenticated' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code === 'PGRST116') { // No rows found
    return { success: true, profile: null, message: 'Profile not found, user authenticated.' };
  }
  if (profileError) {
    console.error('fetchUserProfile: Error fetching profile:', profileError.message);
    return { success: false, message: `Error fetching user profile: ${profileError.message}` };
  }

  return { success: true, profile };
}