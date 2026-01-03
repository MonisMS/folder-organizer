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
                © 2024 FolderMage. Free & Open Source under MIT License.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a 
                href="https://github.com/MonisMS/folder-organizer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a 
                href="https://github.com/MonisMS/folder-organizer/releases" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Releases
              </a>
              <a 
                href="https://github.com/MonisMS/folder-organizer/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Report Bug
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
