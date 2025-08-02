import AuthButton from '@/app/components/AuthButton'
import { createClient } from "@/utils/superbase/server"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const page = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/protected') // Redirect authenticated users away from login page
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold text-gray-900">
            Welcome to SecureAuth
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            A seamless authentication demo built with Supabase and Next.js.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-md text-gray-700">
            Experience secure sign-in, session management, and protected routes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <AuthButton /> {/* Your existing AuthButton */}
            <Link href="/protected" passHref>
              <Button className="w-full sm:w-auto" variant="outline">
                Go to Protected Page
              </Button>
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center mt-4">
          <Link href="/login" passHref>
            <Button variant="link" className="text-blue-600 hover:text-blue-800">
              Visit Login Page Directly
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default page