// app/protected/page.tsx
import { createClient } from '@/utils/superbase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AuthButton from "@/app/components/AuthButton";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login'); // Redirect to your desired login page
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Protected Content</h1>
        <p className="text-lg text-gray-700 mb-6">Hello, <span className="font-semibold">{user.email}</span>! You are successfully logged in and viewing protected content.</p>

        {/* Add the AuthButton here */}
        <div className="mt-4 flex flex-col items-center space-y-4">
          <AuthButton />
          <Link href="/" className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-800 transition duration-300">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}