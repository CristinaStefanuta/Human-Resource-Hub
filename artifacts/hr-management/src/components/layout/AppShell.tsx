import React from 'react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';
import { LayoutDashboard, Megaphone, CalendarCheck, Clock, Settings, CheckCircle2 } from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { currentUser, switchUser } = useUser();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Announcements', icon: Megaphone, href: '/announcements' },
    { label: 'Requests', icon: CalendarCheck, href: '/requests' },
    { label: 'Time & Clock', icon: Clock, href: '/clock' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="border-b border-border/50 py-4 px-4">
            <div className="flex items-center gap-2 mb-6 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-sidebar-foreground">PeopleHub</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start h-auto py-3 px-3">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {currentUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start flex-1 overflow-hidden">
                      <span className="text-sm font-medium leading-none truncate w-full text-left">{currentUser.name}</span>
                      <span className="text-xs text-muted-foreground mt-1 truncate w-full text-left">{currentUser.role}</span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[240px]" align="start">
                <DropdownMenuLabel>Switch Role (Mock Auth)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => switchUser("Admin")} className="cursor-pointer flex justify-between">
                  <div>
                    <p className="font-medium text-sm">Sarah Chen</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                  {currentUser.role === 'Admin' && <Badge variant="secondary">Active</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchUser("Employee")} className="cursor-pointer flex justify-between">
                  <div>
                    <p className="font-medium text-sm">Marcus Webb</p>
                    <p className="text-xs text-muted-foreground">Employee</p>
                  </div>
                  {currentUser.role === 'Employee' && <Badge variant="secondary">Active</Badge>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="flex items-center gap-3 w-full h-10 px-3 transition-colors">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border/50">
             <div className="text-xs text-muted-foreground px-2">
                PeopleHub v1.0
             </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-4 border-b border-border bg-background lg:hidden shrink-0">
            <SidebarTrigger />
            <span className="ml-4 font-bold text-foreground">PeopleHub</span>
          </header>
          <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
