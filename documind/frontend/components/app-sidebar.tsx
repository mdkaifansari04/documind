"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Database,
  FileText,
  Search,
  MessageCircleQuestion,
  MessagesSquare,
  HardDrive,
  Brain,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Image from "next/image";

const mainNavItems = [
  {
    title: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Instances",
    href: "/instances",
    icon: Server,
  },
  {
    title: "Knowledge Bases",
    href: "/knowledge-bases",
    icon: Database,
  },
  {
    title: "Resources",
    href: "/resources",
    icon: FileText,
  },
];

const queryNavItems = [
  {
    title: "Search",
    href: "/search",
    icon: Search,
  },
  {
    title: "Ask",
    href: "/ask",
    icon: MessageCircleQuestion,
  },
  {
    title: "Chat Workspace",
    href: "/chat",
    icon: MessagesSquare,
  },
];

const systemNavItems = [
  {
    title: "Collections & System",
    href: "/system",
    icon: HardDrive,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Sidebar className="border-r border-white/6">
      <SidebarHeader className="border-b border-white/6 px-4 py-3.5">
        <Link href="/docs" className="hidden lg:flex items-center gap-1">
          <Image
            src="/images/logo.png"
            alt="DocuMind"
            width={40}
            height={40}
            className="rounded-md"
          />
          <span className="font-semibold text-foreground">DocuMind</span>
        </Link>
        <span className="block lg:hidden font-semibold text-foreground">
          DocuMind
        </span>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="gap-1">
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] uppercase tracking-widest text-muted-foreground/40">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 transition-colors"
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.5} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="gap-1">
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] uppercase tracking-widest text-muted-foreground/40">
            Query
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {queryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 transition-colors"
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.5} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="gap-1">
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] uppercase tracking-widest text-muted-foreground/40">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 transition-colors"
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.5} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/6 px-4 py-3">
        <p className="text-[10px] text-muted-foreground/40">DocuMind v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
