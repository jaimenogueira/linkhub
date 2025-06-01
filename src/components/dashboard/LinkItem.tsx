
import type { LinkEntry } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface LinkItemProps {
  link: LinkEntry;
}

export function LinkItem({ link }: LinkItemProps) {
  const isValidUrl = link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'));

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out group">
      <Link href={isValidUrl ? link.url : '#'} target="_blank" rel="noopener noreferrer" passHref legacyBehavior>
        <a className={`flex flex-col items-center p-4 text-center h-full ${!isValidUrl ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
          <CardHeader className="p-2">
            <div className="relative w-20 h-20 mb-3 rounded-lg overflow-hidden shadow-md mx-auto">
              <Image
                src={link.iconPath || "https://placehold.co/80x80.png"}
                alt={`${link.name} icon`}
                layout="fill"
                objectFit="cover"
                className="group-hover:scale-110 transition-transform duration-300"
                data-ai-hint="app logo"
                unoptimized={link.iconPath?.endsWith('.svg')} // Next/image optimization not ideal for SVGs from user uploads
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
    </Card>
  );
}
