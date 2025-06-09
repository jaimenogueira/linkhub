
'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { AddLinkForm } from '@/components/dashboard/AddLinkForm';

interface AddLinkButtonWithModalProps {
  isAuthenticated: boolean;
}

export function AddLinkButtonWithModal({ isAuthenticated }: AddLinkButtonWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isAuthenticated) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Link
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-primary">Add New Link</DialogTitle>
            <DialogDescription>
              Fill in the details for your new link. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <AddLinkForm onSuccess={() => setIsModalOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  } else {
    // If not authenticated, the button links to login.
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Link
        </Link>
      </Button>
    );
  }
}
