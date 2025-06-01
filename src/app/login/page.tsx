import { LoginForm } from '@/components/auth/LoginForm';
import { getAuthStatus } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const { isAuthenticated } = await getAuthStatus();

  if (isAuthenticated) {
    redirect('/');
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Login to LinkHub</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
