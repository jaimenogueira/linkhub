'use client';

import { logoutUser } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useTransition } from 'react';

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser();
    });
  };

  return (
    <Button onClick={handleLogout} variant="ghost" disabled={isPending}>
      <LogOut className="mr-2 h-4 w-4" /> {isPending ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
