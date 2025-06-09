
'use client';

import type { LinkEntry } from '@/lib/constants';
import { LinkItem } from './LinkItem';
import { getAuthStatus, getLinks as fetchLinksAction } from '@/lib/actions';
import { useEffect, useState, useTransition, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LinkGridClientProps {
  initialLinks: LinkEntry[];
  isAuthenticated: boolean;
}

export default function LinkGridClient({ 
  initialLinks: serverInitialLinks, 
  isAuthenticated: serverIsAuthenticated 
}: LinkGridClientProps) {
  const [links, setLinks] = useState<LinkEntry[]>(serverInitialLinks);
  const [isAuthenticated, setIsAuthenticated] = useState(serverIsAuthenticated);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const { toast } = useToast();

  const refreshLinksAndAuth = useCallback(() => {
    startRefreshTransition(async () => {
      try {
        const newLinks = await fetchLinksAction();
        const authStatus = await getAuthStatus();
        setLinks(newLinks);
        setIsAuthenticated(authStatus.isAuthenticated);
      } catch (error) {
        toast({ 
          title: "Error refreshing links", 
          description: "Could not update link list. Please try again.", 
          variant: "destructive" 
        });
        console.error("Error in refreshLinksAndAuth:", error);
      }
    });
  }, [toast, startRefreshTransition]);


  useEffect(() => {
    setLinks(serverInitialLinks);
  }, [serverInitialLinks]);

  useEffect(() => {
    setIsAuthenticated(serverIsAuthenticated);
  }, [serverIsAuthenticated]);

  return (
    <div>
      {links.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg">
          No links added yet. {isAuthenticated ? "Click 'Add New Link' in the header to get started!" : "Login to add links."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {links.map((link) => (
            <LinkItem 
              key={link.id} 
              link={link} 
              isAuthenticated={isAuthenticated} 
              onLinkDeleted={refreshLinksAndAuth} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
