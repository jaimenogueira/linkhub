import Link from 'next/link';
import { getAuthStatus } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Settings2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogoutButton } from '../auth/LogoutButton';


export default async function AppHeader() {
  const { isAuthenticated, username } = await getAuthStatus();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-headline font-bold text-primary">
          LinkHub
        </Link>
        <nav>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {username}</span>
              <LogoutButton />
            </div>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
