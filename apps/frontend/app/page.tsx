import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Download } from '@/components/landing/Download';
import { CTA } from '@/components/landing/CTA';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Download />
      <CTA />
      
      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © 2024 File Manager. Built with Next.js, Fastify, and TypeScript.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Tech Stack:</span>
                <span className="rounded bg-primary/10 px-2 py-1 text-xs">Next.js</span>
                <span className="rounded bg-primary/10 px-2 py-1 text-xs">Fastify</span>
                <span className="rounded bg-primary/10 px-2 py-1 text-xs">PostgreSQL</span>
                <span className="rounded bg-primary/10 px-2 py-1 text-xs">Redis</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
