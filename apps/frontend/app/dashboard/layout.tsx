'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Header } from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <SidebarNav />
        <SidebarInset>
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

