'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download as DownloadIcon, Monitor, Apple, Terminal, ExternalLink, Github } from 'lucide-react';

const APP_VERSION = '1.0.0';
const GITHUB_REPO = 'https://github.com/your-username/file-manager';

const downloads = [
  {
    platform: 'Windows',
    icon: Monitor,
    description: 'Windows 10/11 (64-bit)',
    filename: `File-Manager-${APP_VERSION}-Windows-Setup.exe`,
    size: '~85 MB',
    instructions: 'Download and run the installer',
  },
  {
    platform: 'macOS',
    icon: Apple,
    description: 'macOS 11+ (Intel & Apple Silicon)',
    filename: `File-Manager-${APP_VERSION}-macOS-universal.dmg`,
    size: '~90 MB',
    instructions: 'Open DMG and drag to Applications',
  },
  {
    platform: 'Linux',
    icon: Terminal,
    description: 'AppImage (Most distributions)',
    filename: `File-Manager-${APP_VERSION}-Linux-x64.AppImage`,
    size: '~95 MB',
    instructions: 'Make executable and run',
  },
];

export function Download() {
  const getDownloadUrl = (filename: string) => {
    return `${GITHUB_REPO}/releases/latest/download/${filename}`;
  };

  return (
    <section id="download" className="py-20 md:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Free & Open Source
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Download for Desktop
          </h2>
          <p className="text-lg text-muted-foreground">
            Get the full power of File Manager on your desktop. Organize files locally
            with complete privacy — no cloud required.
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {downloads.map((download) => {
            const Icon = download.icon;
            return (
              <Card key={download.platform} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{download.platform}</CardTitle>
                  <CardDescription>{download.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Size: {download.size}</p>
                    <p className="mt-1">{download.instructions}</p>
                  </div>
                  <Button asChild className="w-full" size="lg">
                    <a href={getDownloadUrl(download.filename)} download>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Version {APP_VERSION} •{' '}
            <a
              href={`${GITHUB_REPO}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground inline-flex items-center gap-1"
            >
              View all releases
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" asChild>
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* System Requirements */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-center mb-6">System Requirements</h3>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="p-4 rounded-lg bg-background border">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Windows
              </div>
              <ul className="text-muted-foreground space-y-1">
                <li>• Windows 10 or later</li>
                <li>• 64-bit processor</li>
                <li>• 4 GB RAM minimum</li>
                <li>• 200 MB disk space</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Apple className="h-4 w-4" />
                macOS
              </div>
              <ul className="text-muted-foreground space-y-1">
                <li>• macOS 11 (Big Sur) or later</li>
                <li>• Intel or Apple Silicon</li>
                <li>• 4 GB RAM minimum</li>
                <li>• 200 MB disk space</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Linux
              </div>
              <ul className="text-muted-foreground space-y-1">
                <li>• Ubuntu 20.04+ or equivalent</li>
                <li>• 64-bit processor</li>
                <li>• 4 GB RAM minimum</li>
                <li>• 200 MB disk space</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
