'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Github, Monitor, Rocket } from 'lucide-react';

const APP_VERSION = '1.1.0';
const GITHUB_REPO = 'https://github.com/MonisMS/folder-organizer';
const WINDOWS_DOWNLOAD_URL = `${GITHUB_REPO}/releases/download/v${APP_VERSION}/FolderMage-${APP_VERSION}-Windows-Setup.exe`;

export function CTA() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <Card className="border-2 bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <CardContent className="p-8 md:p-12 relative z-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to Organize Your Files?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                FolderMage is completely free and open source. Download now and take control
                of your digital files with powerful automation tools.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="text-lg h-14 px-8 shadow-lg shadow-primary/25">
                  <a href={WINDOWS_DOWNLOAD_URL}>
                    <Monitor className="mr-2 h-5 w-5" />
                    Download for Windows
                    <Download className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg h-14 px-8">
                  <a href="https://github.com/MonisMS/folder-organizer" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-5 w-5" />
                    Star on GitHub
                  </a>
                </Button>
              </div>
              
              <p className="mt-6 text-sm text-muted-foreground">
                v{APP_VERSION} • macOS & Linux coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

