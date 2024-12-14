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
import { Download, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import Link from "next/link";
import "../loader.css"
export default function Page() {
  const { data: session } = useSession();
  const [userBookings, setUserBookings] = useState([]);
  const [isClient, setIsClient] = useState(false);
  // Function to fetch bookings
  const fetchUserBookings = async (userId) => {
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
              query MyQuery($userId: uuid!) {
                bookings(where: { user_id: { _eq: $userId } }) {
                  booking_date
                  court_id
                  created_at
                  end_time
                  id
                  price
                  start_time
                }
              }
            `,
            variables: { userId },
          }),
        }
      );

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }

      // Fetch court names for each booking
      const bookingsWithCourtNames = await Promise.all(
        data?.bookings.map(async (booking) => {
          const courtName = await fetchCourtName(booking.court_id);
          return {
            ...booking,
            court_name: courtName,
          };
        })
      );

      setUserBookings(bookingsWithCourtNames || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const downloadInvoice = (booking) => {
    const doc = new jsPDF();

    // Add invoice content
    doc.setFontSize(16);
    doc.text("Booking Invoice", 20, 20);

    doc.setFontSize(12);
    doc.text(`Invoice ID: ${booking.id}`, 20, 40);
    doc.text(`Booking Date: ${booking.booking_date}`, 20, 50);
    doc.text(`Court Name: ${booking.court_name}`, 20, 60);
    doc.text(`Start Time: ${booking.start_time}`, 20, 70);
    doc.text(`End Time: ${booking.end_time}`, 20, 80);
    doc.text(`Total Price: ₹${booking.price}`, 20, 90);
    doc.text(
      `Created At: ${new Date(booking.created_at).toLocaleString()}`,
      20,
      100
    );

    // Footer
    doc.text("Thank you for booking with us!", 20, 130);

    // Save the PDF
    doc.save(`Invoice_${booking.id}.pdf`);
  };
  
  const fetchCourtName = async (courtId) => {
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
              query MyQuery2($courtId: uuid!) {
                courts(where: { id: { _eq: $courtId } }) {
                  name
                }
              }
            `,
            variables: { courtId },
          }),
        }
      );

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return "Unknown Court";
      }

      return data?.courts[0]?.name || "Unknown Court";
    } catch (error) {
      console.error("Error fetching court name:", error);
      return "Unknown Court";
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserBookings(session.user.id);
    }
  }, [session]);

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
                  <BreadcrumbPage>Bookings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <Card className="w-full max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
          {userBookings.length > 0 ? (
            <>
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl font-bold text-gray-800">Your Bookings</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                          Booking Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                          Start Time
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                          Total Price
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {userBookings
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map((booking) => (
                          <tr 
                            key={booking.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {booking.booking_date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {booking.start_time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{booking.price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => downloadInvoice(booking)}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <img 
                src="empty-cart.jpeg" 
                alt="No bookings" 
                className="mb-6 rounded-lg"
              />
              <CardTitle className="text-2xl font-bold text-gray-800 mb-4">
                No Bookings Yet
              </CardTitle>
              <CardDescription className="text-gray-600 mb-6 max-w-md">
                It seems you haven't made any bookings yet. Explore our venues and book your perfect sports court today!
              </CardDescription>
              <Link 
                href="/venues"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 font-semibold"
              >
                Find Venues <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </CardContent>
          )}
        </Card>
      </SidebarInset>
    </SidebarProvider>
  );
}