'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FolderOpen, Zap, Download, Shield, Monitor, Sparkles } from 'lucide-react';

const APP_VERSION = '1.1.0';
const GITHUB_REPO = 'https://github.com/MonisMS/folder-organizer';
const WINDOWS_DOWNLOAD_URL = `${GITHUB_REPO}/releases/download/v${APP_VERSION}/FolderMage-${APP_VERSION}-Windows-Setup.exe`;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            v{APP_VERSION} — Free & Open Source Desktop App
          </Badge>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              FolderMage
            </span>
            <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Smart File Organizer
            </span>
          </h1>
          
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
            Automatically organize your local files, detect duplicates, and schedule cleanup tasks.
            <span className="font-medium text-foreground"> 100% private</span> — works completely offline on your computer.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-6">
            <Button asChild size="lg" className="text-lg h-14 px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <a href={WINDOWS_DOWNLOAD_URL}>
                <Monitor className="mr-2 h-5 w-5" />
                Download for Windows
                <Download className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg h-14 px-8">
              <a href="https://github.com/MonisMS/folder-organizer" target="_blank" rel="noopener noreferrer">
                View on GitHub
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-12">
            macOS & Linux coming soon • No account required
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <span>Smart Organization</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Automated Tasks</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>100% Private</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

