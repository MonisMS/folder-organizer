'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FolderOpen,
  Copy,
  History,
  Briefcase,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Files',
    href: '/dashboard/files',
    icon: FolderOpen,
  },
  {
    title: 'Duplicates',
    href: '/dashboard/duplicates',
    icon: Copy,
  },
  {
    title: 'History',
    href: '/dashboard/history',
    icon: History,
  },
  {
    title: 'Jobs',
    href: '/dashboard/jobs',
    icon: Briefcase,
  },
  {
    title: 'Schedules',
    href: '/dashboard/schedules',
    icon: Calendar,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border/60 pb-0">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">FolderMage</h2>
            <p className="text-[11px] text-muted-foreground">Smart file organizer</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'group relative w-full justify-start rounded-lg px-3 py-2 nav-item-transition',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <Link href={item.href}>
                        <Icon
                          className={cn(
                            'mr-2.5 h-4 w-4 shrink-0',
                            isActive ? 'text-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                          )}
                        />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
