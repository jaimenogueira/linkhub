'use client';

import type { LinkEntry } from '@/lib/constants';
import { LinkItem } from './LinkItem';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddLinkForm } from './AddLinkForm';
import { useState } from 'react';

interface LinkGridClientProps {
  initialLinks: LinkEntry[];
  isAuthenticated: boolean;
}

export default function LinkGridClient({ initialLinks, isAuthenticated }: LinkGridClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      {isAuthenticated && (
        <div className="mb-6 text-center">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-primary">Add New Link</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new link. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <AddLinkForm onSuccess={() => setIsModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      )}
      {initialLinks.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg">
          No links added yet. {isAuthenticated ? "Click 'Add New Link' to get started!" : "Login to add links."}
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
