'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginUser } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('password', data.password);
      
      const result = await loginUser(formData);
      if (result?.error) {
        setError(result.error);
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          {...form.register('username')}
          placeholder="Enter your username"
          className={form.formState.errors.username ? 'border-destructive' : ''}
        />
        {form.formState.errors.username && (
          <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...form.register('password')}
          placeholder="Enter your password"
          className={form.formState.errors.password ? 'border-destructive' : ''}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Login
      </Button>
    </form>
  );
}
