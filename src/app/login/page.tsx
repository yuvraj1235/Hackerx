// app/login/page.tsx
import AuthButton from '@/app/components/AuthButton';
import { createClient } from '@/utils/superbase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/protected'); // Redirect authenticated users away from login page
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-purple-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-purple-700 mb-6">Login to Your Account</h1>
        <div className="mb-4">
          <AuthButton /> {/* Your Google Sign-In button */}
        </div>
        <p className="text-gray-600">
          Don&apos;t have an account? Sign in above!
        </p>
        <Link href="/" className="mt-6 inline-block px-6 py-3 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 transition duration-300">
          Back to Home
        </Link>
      </div>
    </div>
  );
}