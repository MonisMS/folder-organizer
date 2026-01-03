'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, FolderOpen, Zap, Download, Shield } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>Free & Open Source Desktop App</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            FolderMage
            <span className="block text-primary">Smart File Organizer</span>
          </h1>
          
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
            Automatically organize your local files, detect duplicates, and schedule cleanup tasks.
            100% private — works completely offline on your computer.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-lg">
              <a href="#download">
                <Download className="mr-2 h-5 w-5" />
                Download Free
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg">
              <a href="https://github.com/MonisMS/folder-organizer" target="_blank" rel="noopener noreferrer">
                View on GitHub
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              <span>Smart Organization</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>Automated Tasks</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>100% Private</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

