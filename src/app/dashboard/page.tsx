// app/dashboard/page.tsx
import { createClient } from "@/utils/superbase/server"
import { redirect } from 'next/navigation';
import { fetchUserProfile } from '@/app/actions/user'; // Import the fetch profile action
import AuthButton from '@/app/components/AuthButton'; // Assuming AuthButton is on dashboard/layout

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // If no user is authenticated, redirect to login
    redirect('/login');
  }

  // Fetch the user's profile to display additional info
  const { success, profile, message } = await fetchUserProfile();

  if (!success) {
    console.error("Dashboard failed to load profile:", message);
    // You might choose to redirect or show a generic message
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
        <h1 className="text-3xl font-bold text-red-700 mb-4">Error Loading Dashboard</h1>
        <p className="text-gray-700">{message || "Could not retrieve user profile."}</p>
        <AuthButton /> {/* Provide sign out option even on error */}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="bg-gray-50 p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Your Dashboard!</h1>
        <p className="text-lg text-gray-700 mb-2">
          Hello, <span className="font-semibold">{profile?.name || user.email}</span>!
        </p>
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="User Avatar"
            className="w-24 h-24 rounded-full mx-auto my-4 border-4 border-indigo-500"
          />
        )}
        <p className="text-gray-600 mb-6">Your email: {user.email}</p>
        {/* Add more dashboard content here */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <AuthButton /> {/* Ensure sign-out option is present */}
            <a href="/documents" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
                Manage Documents
            </a>
            {/* Add more links */}
        </div>
      </div>
    </div>
  );
}