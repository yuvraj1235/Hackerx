// app/auth/callback/route.ts
import { createClient } from "@/utils/superbase/server"
import { NextResponse } from 'next/server';
import { ensureUserProfile } from '@/app/actions/user'; // Import the Server Action

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard'; // Redirect to dashboard after login

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // *** IMPORTANT: Call the Server Action to ensure user profile exists ***
      const { success, message } = await ensureUserProfile();
      if (!success) {
        console.error('Failed to ensure user profile:', message);
        // Handle this error appropriately, e.g., redirect to an error page
        return NextResponse.redirect(`${origin}/auth/profile-error`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}