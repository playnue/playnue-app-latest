"use client"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
// import UpdatePrice from "../../components/admin/UpdateSlots"
import "../loader.css"
import { useEffect, useState } from "react"
import CourtManagement from "../components/SellerCourts"

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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
                <BreadcrumbPage>Edit Price</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <CourtManagement/>
      </SidebarInset>
    </SidebarProvider>
  )
}





