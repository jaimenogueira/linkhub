
'use client';

import type { LinkEntry } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Trash, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useTransition } from 'react';
import { deleteLink } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface LinkItemProps {
  link: LinkEntry;
  isAuthenticated: boolean;
  onLinkDeleted?: () => void;
}

export function LinkItem({ link, isAuthenticated, onLinkDeleted }: LinkItemProps) {
  const isValidUrl = link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'));
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPendingDelete, startTransitionDelete] = useTransition();

  const handleDelete = async () => {
    if (!link.id) return;
    startTransitionDelete(async () => {
      const result = await deleteLink(link.id);
      if (result.error) {
        toast({ title: "Error Deleting Link", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Link Deleted", description: result.success });
        if (onLinkDeleted) onLinkDeleted(); 
      }
      setIsDeleteDialogOpen(false);
    });
  };

  const imageSrc = (link.iconPath && link.iconPath.trim() !== '') ? link.iconPath : "https://placehold.co/80x80.png";
  const altText = `${link.name || 'Link'} icon`;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out group relative">
      <Link href={isValidUrl ? link.url : '#'} target="_blank" rel="noopener noreferrer" passHref legacyBehavior>
        <a className={`flex flex-col items-center p-4 text-center h-full ${!isValidUrl ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
          <CardHeader className="p-2">
            <div className="relative w-20 h-20 mb-3 rounded-lg overflow-hidden shadow-md mx-auto">
              <Image
                src={imageSrc}
                alt={altText}
                layout="fill"
                objectFit="cover"
                className="group-hover:scale-110 transition-transform duration-300"
                data-ai-hint="app logo"
                unoptimized={link.iconPath?.endsWith('.svg')}
              />
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-grow flex flex-col justify-center">
            <CardTitle className="text-lg font-headline group-hover:text-primary transition-colors duration-300">
              {link.name}
            </CardTitle>
            {isValidUrl && (
              <ArrowUpRight className="absolute top-2 right-2 w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </CardContent>
        </a>
      </Link>
      {isAuthenticated && (
        <div className="absolute bottom-1 right-1 flex gap-1 p-1 bg-card/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Edit Button Placeholder - to be implemented later
          <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 h-7 w-7">
            <Pencil className="h-4 w-4" />
          </Button>
          */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 h-7 w-7">
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the link &quot;{link.name}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPendingDelete}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isPendingDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  {isPendingDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
}
