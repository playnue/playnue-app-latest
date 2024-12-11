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
import jsPDF from "jspdf";
export default function Page() {
  const { data: session } = useSession();
  const [userBookings, setUserBookings] = useState([]);

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

        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Your Bookings</h2>

          {userBookings.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">
                    Booking Date
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Court Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Start Time
                  </th>
                  <th className="border border-gray-300 px-4 py-2">End Time</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Created At
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Total Price
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userBookings
                  .sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                  )
                  .map((booking) => (
                    <tr key={booking.id}>
                      <td className="border border-gray-300 px-4 py-2">
                        {booking.booking_date}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {booking.court_name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {booking.start_time}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {booking.end_time}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(booking.created_at).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {booking.price}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          onClick={() => downloadInvoice(booking)}
                          className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                          Download Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p>No bookings found.</p>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
