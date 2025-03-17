"use client";
import * as React from "react";
import {
  Bot,
  BookOpen,
  Command,
  GalleryVerticalEnd,
  LogOut,
  SquareTerminal,
  Gamepad,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { TeamSwitcher } from "@/components/team-switcher";
import { useUserData } from "@nhost/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { nhost } from "@/lib/nhost";

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = useUserData();
  const isSeller = user?.defaultRole === "seller";

  // Define navigation items based on user role
  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    // Booking navigation item
    {
      title: isSeller ? "Venue Bookings" : "My Bookings",
      url: isSeller ? "/seller-bookings" : "/user-bookings",
      icon: Bot,
    },
    // Venue navigation item
    isSeller
      ? {
          title: "Venue",
          url: "#",
          icon: BookOpen,
          items: [
            {
              title: "Venue Profile",
              url: "/venue",
            },
            {
              title: "Offline Slot Booking",
              url: "/courts&slots",
            },
          ],
        }
      : {
          title: "Venues",
          url: "/venues",
          icon: BookOpen,
        },
    // My Games - only for non-sellers
    ...(isSeller ? [] : [{ title: "My Games", url: "/my-games", icon: Gamepad }]),
    // Update Slots - only for sellers
    ...(isSeller ? [{ title: "Create Time Slots", url: "/slotsUpdate", icon: Command }] : []),
  ];

  const teams = [
    {
      name: "Playnue",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ];

  const handleSignOut = async () => {
    try {
      await nhost.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
          onClick={handleSignOut}
          className="w-full flex items-center justify-center p-2 hover:bg-gray-100 transition-colors duration-200 text-red-500"
        >
          <LogOut className="mr-2 w-5 h-5" />
          Logout
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}