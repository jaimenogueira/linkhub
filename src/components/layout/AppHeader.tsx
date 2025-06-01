
import Link from 'next/link';
import { getAuthStatus } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react'; // Removido LogOut, Settings2 que não estavam sendo usados aqui. PlusCircle movido para o novo componente.
import { LogoutButton } from '../auth/LogoutButton';
import { AddLinkButtonWithModal } from './AddLinkButtonWithModal'; // Novo componente

export default async function AppHeader() {
  const { isAuthenticated, username } = await getAuthStatus();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-headline font-bold text-primary">
          LinkHub
        </Link>
        <nav className="flex items-center gap-4">
          <AddLinkButtonWithModal isAuthenticated={isAuthenticated} />
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {username}</span>
              <LogoutButton />
            </>
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
