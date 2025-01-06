"use client";
import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  LogOut,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { useUserData } from "@nhost/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { nhost } from "@/lib/nhost";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Playnue",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "My Bookings",
      url: "/user-bookings",
      icon: Bot,
    },
    {
      title: "Venues",
      url: "/venues",
      icon: BookOpen,
    },
  ],
};

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = useUserData();
  
  // Check if user has seller role
  const isSeller = user?.defaultRole=="seller";
  console.log(isSeller)
  const baseNavItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "My Bookings",
      url: "/user-bookings",
      icon: Bot,
    }
  ];

  // Create venue navigation items based on role
  const venueNavItem = isSeller ? {
    title: "Venue",
    url: "#",
    icon: BookOpen,
    items: [
      {
        title: "Venue Details",
        url: "#",
      },
      {
        title: "Courts",
        url: "#",
      },
      {
        title: "Slots",
        url: "#",
      },
    ],
  } : {
    title: "Venues",
    url: "/venues",
    icon: BookOpen,
  };

  // Combine the navigation items
  const navItems = [...baseNavItems, venueNavItem];

  const teams = [
    {
      name: "Playnue",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <button
          onClick={async () => {
            try {
              await nhost.auth.signOut();
              localStorage.removeItem("user")
              // Optionally, you can redirect the user after signing out
              window.location.href = "/login"; // or use your routing method to navigate to the login page
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }}
          className="w-full flex items-center justify-center p-2 hover:bg-gray-100 text-red-500 transition-colors duration-200 text-gray-600 hover:text-gray-900"
        >
          <LogOut className="mr-2 w-5 h-5 text-red-500" />
          Logout
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
