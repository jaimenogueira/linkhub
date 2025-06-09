import { getLinks, getAuthStatus } from '@/lib/actions';
import LinkGridClient from '@/components/dashboard/LinkGridClient';

export default async function HomePage() {
  const links = await getLinks();
  const { isAuthenticated } = await getAuthStatus();

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-headline font-bold text-center text-primary">
        Welcome to LinkHub
      </h1>
      <LinkGridClient initialLinks={links} isAuthenticated={isAuthenticated} />
    </div>
  );
}
