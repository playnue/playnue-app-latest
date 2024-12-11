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
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: session } = useSession();
  console.log(session);
  const [userDetails, setUserDetails] = useState(null);

  // Function to fetch user details
  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(
        "https://local.hasura.local.nhost.run/v1/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": "nhost-admin-secret",
          },
          body: JSON.stringify({
            query: `
              query MyQuery($id: uuid!) {
                user(id: $id) {
                  displayName
                  email
                  phoneNumber
                }
              }
            `,

            variables: { id: userId },
          }),
        }
      );

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }

      setUserDetails(data?.user);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserDetails(session.user.id);
      console.log(session)
    }
  }, [session]);
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
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50">
              {userDetails ? (
                <div>
                  <h3 className="text-xl font-bold">User Details</h3>
                  <p>
                    <strong>Name:</strong> {userDetails?.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {userDetails?.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {userDetails?.phone}
                  </p>
                </div>
              ) : (
                <p>Loading user details...</p>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
