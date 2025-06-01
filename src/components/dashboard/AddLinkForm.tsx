
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addLink } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from 'react';
import Image from 'next/image';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];

const AddLinkSchema = z.object({
  name: z.string().min(1, "Application name is required"),
  url: z.string().url("Invalid URL format. Please include http:// or https://"),
  icon: z.instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), ".jpg, .jpeg, .png, .svg and .gif files are accepted.")
    .optional(), // Icon is optional. If provided, it's validated.
});

type AddLinkFormValues = z.infer<typeof AddLinkSchema>;

interface AddLinkFormProps {
  onSuccess?: () => void;
}

export function AddLinkForm({ onSuccess }: AddLinkFormProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const form = useForm<AddLinkFormValues>({
    resolver: zodResolver(AddLinkSchema),
    defaultValues: {
      name: '',
      url: '',
      icon: undefined, // Default to undefined for optional file
    }
  });

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { // A file is selected
      form.setValue('icon', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else { // No file selected or selection cleared
      setIconPreview(null);
      form.setValue('icon', undefined, { shouldValidate: true }); // Explicitly set to undefined
    }
  };

  const onSubmit = (data: AddLinkFormValues) => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('url', data.url);
      
      if (data.icon) { // Only append icon if it's present (File object)
        formData.append('icon', data.icon);
      }
      
      const result = await addLink(formData);
      if (result?.error) {
        setError(result.error);
        toast({
          title: "Failed to Add Link",
          description: result.error + (result.details ? ` ${JSON.stringify(result.details)}` : ''),
          variant: "destructive",
        });
      } else if (result?.success) {
        toast({
          title: "Link Added",
          description: result.success,
        });
        form.reset(); // Resets to defaultValues, so icon will be undefined
        setIconPreview(null);
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}
      <div>
        <Label htmlFor="name">Application Name</Label>
        <Input id="name" {...form.register('name')} className={form.formState.errors.name ? 'border-destructive' : ''} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Input id="url" type="url" {...form.register('url')} placeholder="https://example.com" className={form.formState.errors.url ? 'border-destructive' : ''} />
        {form.formState.errors.url && <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>}
      </div>
      <div>
        <Label htmlFor="icon">Icon/Image (Optional)</Label>
        <Input 
          id="icon" 
          type="file" 
          accept={ACCEPTED_IMAGE_TYPES.join(",")} 
          onChange={handleIconChange} // Using onChange to manage form.setValue
          className={form.formState.errors.icon ? 'border-destructive' : ''} 
        />
        {/* 
          We don't use form.register('icon') directly here because file inputs are tricky with react-hook-form's default register.
          onChange gives more control. Zod validation will still run on the 'icon' field value.
        */}
        {form.formState.errors.icon && <p className="text-sm text-destructive">{(form.formState.errors.icon as any).message}</p>}
        {iconPreview && (
          <div className="mt-2 relative w-24 h-24 border rounded-md overflow-hidden">
            <Image src={iconPreview} alt="Icon preview" layout="fill" objectFit="cover" data-ai-hint="app logo" />
          </div>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Link
      </Button>
    </form>
  );
}
