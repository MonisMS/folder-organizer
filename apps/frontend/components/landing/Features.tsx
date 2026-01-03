'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FolderTree, 
  Copy, 
  Clock, 
  Search, 
  BarChart3, 
  Shield,
  Wifi,
  HardDrive
} from 'lucide-react';

const features = [
  {
    icon: FolderTree,
    title: 'Smart File Organization',
    description: 'Automatically categorize and organize files by type into structured folders. Documents, images, videos, and more.',
  },
  {
    icon: Copy,
    title: 'Duplicate Detection',
    description: 'Find and remove duplicate files using SHA-256 hashing. Reclaim valuable storage space instantly.',
  },
  {
    icon: Clock,
    title: 'Scheduled Automation',
    description: 'Set up automated tasks to organize files on a schedule. Daily, weekly, or custom intervals.',
  },
  {
    icon: Wifi,
    title: 'Works Offline',
    description: 'No internet required. FolderMage works completely offline on your local machine.',
  },
  {
    icon: HardDrive,
    title: 'Local Storage Only',
    description: 'Your files never leave your computer. 100% private with no cloud uploads.',
  },
  {
    icon: Shield,
    title: 'Safe Operations',
    description: 'Complete operation history with undo functionality. Never lose a file with our safety features.',
  },
];

export function Features() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to manage and organize your files efficiently
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

