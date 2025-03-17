"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Calendar, Clock, CreditCard, Users } from "lucide-react";
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
  const [bookings, setTurfBookings] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const accessToken = useAccessToken();
  const user = useUserData();

  // Function to fetch customer details
  // const fetchCustomerDetails = async (userId) => {
  //   try {
  //     const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${accessToken}`,
  //         "X-Hasura-Role": "seller",
  //       },
  //       body: JSON.stringify({
  //         query: `
  //           query GetCustomerDetails($userId: uuid!) {
  //             user(id: $userId) {
  //               id
  //               email
  //               displayName
  //               phoneNumber
  //             }
  //           }
  //         `,
  //         variables: { userId },
  //       }),
  //     });

  //     const { data, errors } = await response.json();

  //     if (errors) {
  //       console.error("GraphQL errors:", errors);
  //       return null;
  //     }

  //     return data?.users_by_pk;
  //   } catch (error) {
  //     console.error(
  //       `Error fetching customer details for user ${userId}:`,
  //       error
  //     );
  //     return null;
  //   }
  // };

  const fetchTurfBookings = async (userId) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
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
                    end_at
                    price
                    bookings {
                      id
                      created_at
                      payment_type
                      user_id
                      user {
                        id
                        displayName
                        email
                      }
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
      
      console.log("Raw booking data:", JSON.stringify(data, null, 2));
  
      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }
  
      // Flatten the nested structure
      const allBookings =
        data?.venues.flatMap((venue) =>
          venue.courts.flatMap((court) =>
            court.slots.flatMap((slot) =>
              slot.bookings.map((booking) => ({
                ...booking,
                venue_name: venue.title,
                court_name: court.name,
                slot: {
                  date: slot.date,
                  start_at: slot.start_at,
                  end_at: slot.end_at,
                  price: slot.price,
                }
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    return new Date(`2000-01-01 ${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const calculatePaymentAmount = (booking) => {
    // Remove currency symbol and commas, then parse as float
    const fullPrice = parseFloat(booking.slot.price.replace(/[$,₹]/g, ""));
    return booking.payment_type === 1 ? fullPrice / 2 : fullPrice;
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

        <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Turf Bookings
            </CardTitle>
            <CardDescription className="mt-1.5">
              {bookings.length} active {bookings.length === 1 ? 'booking' : 'bookings'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {bookings.map((booking) => (
            <div 
              key={booking.id}
              className="p-6 hover:bg-gray-50/50 transition-colors duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700">
                      {booking.court_name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {booking.court_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {booking.venue_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.slot.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatTime(booking.slot.start_at)} - {formatTime(booking.slot.end_at)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <span className="text-gray-600">
                        {booking.user?.displayName || 'Guest User'}
                      </span>
                      <div className="text-gray-400 text-xs">
                        {booking.user?.email || 'No email provided'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                    <div className="font-medium text-gray-900">
                          ₹{calculatePaymentAmount(booking).toLocaleString('en-IN')}
                          {booking.payment_type === 2 && (
                            <span className="text-xs text-gray-500 ml-1">
                              of ₹{parseFloat(booking.slot.price.replace(/[$,₹]/g, "")).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      <div>
                        {booking.payment_type === 2 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CreditCard className="w-3 h-3 mr-1" />
                            Full Payment
                          </span>
                        ) : booking.payment_type === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <CreditCard className="w-3 h-3 mr-1" />
                            50% Advance
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
      </SidebarInset>
    </SidebarProvider>
  );
}
