'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download as DownloadIcon, Monitor, Apple, Terminal, ExternalLink, Github, CheckCircle2, Clock } from 'lucide-react';

const APP_VERSION = '1.1.0';
const GITHUB_REPO = 'https://github.com/MonisMS/folder-organizer';
const WINDOWS_DOWNLOAD_URL = `${GITHUB_REPO}/releases/download/v${APP_VERSION}/FolderMage-${APP_VERSION}-Windows-Setup.exe`;

const downloads = [
  {
    platform: 'Windows',
    icon: Monitor,
    description: 'Windows 10/11 (64-bit)',
    filename: `FolderMage-${APP_VERSION}-Windows-Setup.exe`,
    size: '~85 MB',
    instructions: 'Download and run the installer',
    available: true,
    downloadUrl: WINDOWS_DOWNLOAD_URL,
  },
  {
    platform: 'macOS',
    icon: Apple,
    description: 'macOS 11+ (Intel & Apple Silicon)',
    filename: `FolderMage-${APP_VERSION}-macOS.dmg`,
    size: 'Coming Soon',
    instructions: 'Open DMG and drag to Applications',
    available: false,
    downloadUrl: '#',
  },
  {
    platform: 'Linux',
    icon: Terminal,
    description: 'AppImage (Most distributions)',
    filename: `FolderMage-${APP_VERSION}.AppImage`,
    size: 'Coming Soon',
    instructions: 'Make executable and run',
    available: false,
    downloadUrl: '#',
  },
];

export function Download() {
  return (
    <section id="download" className="py-20 md:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Free & Open Source
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Download FolderMage
          </h2>
          <p className="text-lg text-muted-foreground">
            Get the full power of FolderMage on your desktop. Organize files locally
            with complete privacy — no cloud required.
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {downloads.map((download) => {
            const Icon = download.icon;
            return (
              <Card 
                key={download.platform} 
                className={`relative overflow-hidden transition-all duration-300 ${
                  download.available 
                    ? 'hover:shadow-xl hover:scale-105 border-primary/50' 
                    : 'opacity-75'
                }`}
              >
                {download.available && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                )}
                {!download.available && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                    download.available ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Icon className={`h-8 w-8 ${download.available ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <CardTitle className="text-xl">{download.platform}</CardTitle>
                  <CardDescription>{download.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground">
                    <p className={download.available ? '' : 'text-primary font-medium'}>{download.size}</p>
                    <p className="mt-1">{download.instructions}</p>
                  </div>
                  {download.available ? (
                    <Button asChild className="w-full" size="lg">
                      <a href={download.downloadUrl}>
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Download Now
                      </a>
                    </Button>
                  ) : (
                    <Button disabled className="w-full" size="lg" variant="secondary">
                      <Clock className="mr-2 h-4 w-4" />
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Windows Highlight */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                  <Monitor className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Windows Version Available Now!</h3>
                  <p className="text-sm text-muted-foreground">
                    Full-featured desktop app with smart file organization, duplicate detection, and scheduled automation.
                  </p>
                </div>
                <Button asChild size="lg" className="shrink-0">
                  <a href={WINDOWS_DOWNLOAD_URL}>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download for Windows
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
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
            <div className="p-4 rounded-lg bg-background border-2 border-primary/30">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                Windows
                <Badge variant="default" className="ml-auto text-xs">Available</Badge>
              </div>
              <ul className="text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Windows 10 or later
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  64-bit processor
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  4 GB RAM minimum
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  200 MB disk space
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background border opacity-60">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Apple className="h-4 w-4" />
                macOS
                <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
              </div>
              <ul className="text-muted-foreground space-y-1">
                <li>• macOS 11 (Big Sur) or later</li>
                <li>• Intel or Apple Silicon</li>
                <li>• 4 GB RAM minimum</li>
                <li>• 200 MB disk space</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background border opacity-60">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Linux
                <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
              </div>
              <ul className="text-muted-foreground space-y-1">
                <li>• Ubuntu 20.04+ / Fedora 35+</li>
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
