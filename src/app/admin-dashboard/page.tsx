"use client";
import { AppSidebar } from "@/components/app-sidebar";
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
import { useEffect, useState } from "react";

export default function Page() {
  const [venues, setVenues] = useState([]);
  const getVenues = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token?.accessToken}`,
        },
        body: JSON.stringify({
          query: `
            query {
            venues {
              user_id
              title
              user {
                email
              }
              id
              }
            }
          `,
        }),
      }
    );

    const { data, errors } = await response.json();

    if (errors) {
      console.error("GraphQL Errors:", errors);
      return;
    }

    console.log(data.venues);
    setVenues(data?.venues);
  };
  useEffect(() => {
    getVenues();
  }, []);
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
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {
          //venue fetched here
        }
      </SidebarInset>
    </SidebarProvider>
  );
}
