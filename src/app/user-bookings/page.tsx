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
import { Download, ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import Link from "next/link";
import "../loader.css";
import "jspdf-autotable";
import { useAccessToken, useUserData } from "@nhost/nextjs";

export default function Page() {
  const [userBookings, setUserBookings] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  const accessToken = useAccessToken();
  const user = useUserData();

  // Function to fetch bookings with venue information
  const fetchUserBookings = async (userId) => {
    try {
      const [bookingsResponse, userResponse] = await Promise.all([
        // Fetch bookings
        fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-Hasura-Role": "user",
          },
          body: JSON.stringify({
            query: `
              query GetUserBookings($userId: uuid!) {
                bookings(where: { user_id: { _eq: $userId } }) {
                  id
                  created_at
                  slot {
                    id
                    date
                    start_at
                    price
                    court {
                      id
                      name
                      venue {
                        id
                        title
                      }
                    }
                  }
                }
              }
            `,
            variables: { userId },
          }),
        }),
        // Fetch user data for loyalty points
        fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-Hasura-Role": "user",
          },
          body: JSON.stringify({
            query: `
              query GetUserPoints($userId: uuid!) {
                user(id: $userId) {
                  metadata
                }
              }
            `,
            variables: { userId },
          }),
        }),
      ]);

      const [bookingsData, userData] = await Promise.all([
        bookingsResponse.json(),
        userResponse.json(),
      ]);

      if (bookingsData.errors) {
        console.error("GraphQL errors in bookings query:", bookingsData.errors);
        return;
      }

      if (userData.errors) {
        console.error("GraphQL errors in user query:", userData.errors);
        return;
      }

      // Sort bookings by date and time
      const sortedBookings = bookingsData.data?.bookings.sort((a, b) => {
        const dateA = new Date(`${a.slot.date} ${a.slot.start_at}`);
        const dateB = new Date(`${b.slot.date} ${b.slot.start_at}`);
        return dateB - dateA;
      }) || [];

      setUserBookings(sortedBookings);
      setLoyaltyPoints(userData.data?.user?.metadata?.loyaltyPoints || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserBookings(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div id="preloader"></div>
      </div>
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
                  <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
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
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Your Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                          Booking ID
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                          Venue
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                          Court
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 tracking-wider">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {userBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {booking.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {booking.slot.court.venue.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {booking.slot.court.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {booking.slot.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {booking.slot.start_at}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                            ₹{booking.slot.price.replace("$", "") || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Loyalty Points Card */}
                {/* <div className="mt-8 bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-blue-700">
                        Loyalty Points
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {loyaltyPoints}
                      </p>
                    </div>
                  </div>
                </div> */}
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
                It seems you haven't made any bookings yet. Explore our venues
                and book your perfect sports court today!
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