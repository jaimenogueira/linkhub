
'use client';

import type { LinkEntry } from '@/lib/constants';
import { LinkItem } from './LinkItem';
// Removidos: Button, PlusCircle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, AddLinkForm, useState

interface LinkGridClientProps {
  initialLinks: LinkEntry[];
  isAuthenticated: boolean;
}

export default function LinkGridClient({ initialLinks, isAuthenticated }: LinkGridClientProps) {
  // Removido: const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      {/* Removida a seção do botão "Add New Link" e Dialog daqui */}
      {initialLinks.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg">
          No links added yet. {isAuthenticated ? "Click 'Add New Link' in the header to get started!" : "Login to add links."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {initialLinks.map((link) => (
            <LinkItem key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
