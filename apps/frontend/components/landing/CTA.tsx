'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Github } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8 md:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to Organize Your Files?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                FolderMage is completely free and open source. Download now and take control
                of your digital files with powerful automation tools.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="text-lg">
                  <a href="#download">
                    <Download className="mr-2 h-5 w-5" />
                    Download FolderMage
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg">
                  <a href="https://github.com/MonisMS/folder-organizer" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-5 w-5" />
                    Star on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

