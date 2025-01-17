"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import AppSidebar from "@/components/user-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function SellerBookingsPage() {
  const [turfBookings, setTurfBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const accessToken = useAccessToken();
  const user = useUserData();

  const fetchTurfBookings = async (userId) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Hasura-Role": "seller",
        },
        body: JSON.stringify({
          query: `
            query GetSellerBookings($userId: uuid!) {
              venues(where: { user_id: { _eq: $userId } }) {
                id
                title
                courts {
                  id
                  name
                  slots {
                    id
                    date
                    start_at
                    price
                    bookings {
                      id
                      created_at
                      user_id
                    }
                  }
                }
              }
            }
          `,
          variables: { userId },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors in bookings query:", errors);
        return;
      }

      // Flatten the nested structure to get all bookings
      const allBookings = data?.venues.flatMap((venue) =>
        venue.courts.flatMap((court) =>
          court.slots.flatMap((slot) =>
            slot.bookings.map((booking) => ({
              ...booking,
              venue_name: venue.title,
              court_name: court.name,
              slot: {
                date: slot.date,
                start_at: slot.start_at,
                price: slot.price,
              },
            }))
          )
        )
      ) || [];

      // Sort bookings by date and time
      const sortedBookings = allBookings.sort((a, b) => {
        const dateA = new Date(`${a.slot.date} ${a.slot.start_at}`);
        const dateB = new Date(`${b.slot.date} ${b.slot.start_at}`);
        return dateB - dateA;
      });

      setTurfBookings(sortedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTurfBookings(user.id);
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/seller/dashboard">
                    Dashboard
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
          {turfBookings.length > 0 ? (
            <>
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Turf Bookings
                </CardTitle>
                <CardDescription>
                  Manage all your turf bookings in one place
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                          Venue
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                          Court
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                          Customer ID
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                          Time
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {turfBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {booking.venue_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {booking.court_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {booking.user_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {booking.slot.date}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {booking.slot.start_at}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-right">
                            ₹{booking.slot.price.replace("$", "")}
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
              <CardTitle className="text-2xl font-bold text-gray-800 mb-4">
                No Bookings Yet
              </CardTitle>
              <CardDescription className="text-gray-600 mb-6 max-w-md">
                You haven't received any bookings for your turfs yet. Make sure
                your listings are complete and attractive to potential
                customers.
              </CardDescription>
              <Link
                href="/seller/venues"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 font-semibold"
              >
                Manage Venues <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </CardContent>
          )}
        </Card>
      </SidebarInset>
    </SidebarProvider>
  );
}