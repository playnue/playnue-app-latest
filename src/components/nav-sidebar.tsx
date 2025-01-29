import React from "react";
import {
  Settings,
  Monitor,
  Book,
  Cog,
  Building2,
  BarChart2,
  Plane,
  MoreHorizontal,
  HelpCircle,
  Trophy,
  MapPin,
  LogOut,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
// import { useSession } from "next-auth/react";
import Link from "next/link";
import { nhost } from "@/lib/nhost";
import { useUserData } from "@nhost/nextjs";

export default function Sidebar() {
  const user = useUserData();
  const handleSignout = async () => {
    try {
      await nhost.auth.signOut();
      // Optionally, you can redirect the user after signing out
      window.location.href = "/login"; // or use your routing method to navigate to the login page
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  // const data = localStorage.getItem("user");
  // const parsedDdata = JSON.parse(data);
  // const user = parsedDdata?.user;
  const menuItems = [
    {
      // title: "Platform",
      items: [
        { name: "Play", href: "/venues", icon: <MapPin  size={18} /> },
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard  size={18} />,
        },
        {
          name: "Tournaments",
          href: "/tournament",
          icon: <Trophy  size={18} />,
        },
      ],
    },
  ];
  return (
    <div className="w-64 h-screen bg-black text-gray-300 p-4 flex flex-col">
      {/* Company Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <div>
          <Link href="/">
            <h1 className="font-semibold text-white">Playnue</h1>
          </Link>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="flex-1">
        {menuItems.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="text-xs text-gray-500 uppercase mb-2">
              {section.title}
            </p>
            {section.items.map((item) => (
              <Link href={item.href}>
                <div key={item.name}>
                  <p className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 mb-1">
                    {item.icon}
                    <span>{item.name}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Footer Items */}
      {/* <div className="border-t border-gray-800 pt-4">
        <a
          href="#"
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 mb-1"
        >
          <HelpCircle size={18} />
          <span>Support</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 mb-1"
        >
          <MessageSquare size={18} />
          <span>Feedback</span>
        </a>
      </div> */}

      {/* User Profile */}
      <div className="flex items-center gap-2 p-2 mt-2 rounded hover:bg-gray-800 cursor-pointer">
  <div className="w-8 h-8 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
    <LogOut size={18} className="text-white" /> 
  </div>
  <div className="flex-1" onClick={handleSignout}>
    <p className="text-sm">{user?.displayName}</p>
    <p className="text-xs text-gray-500">Logout</p>
  </div>
</div>
    </div>
  );
}
