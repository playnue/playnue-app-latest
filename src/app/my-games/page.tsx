"use client";
import AppSidebar from "@/components/user-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
// import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Profile from "../components/Profile";
import "../loader.css"
import Navbar from "../components/Navbar";
import MyGames from "../components/MyGames";
export default function Page() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
      setIsClient(true);
    }, []);
  
    // If not client-side, render nothing or a placeholder
    if (!isClient) {
      return (
        <>
          {/* <Navbar /> */}
          <div className="flex items-center justify-center min-h-screen">
            <div id="preloader"></div>
          </div>
        </>
      );
    }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>My Games</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
      <MyGames/>
      </SidebarInset>
    </SidebarProvider>
  );
}
