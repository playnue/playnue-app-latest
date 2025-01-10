import React, { useState, useEffect } from "react";
import { useAccessToken } from "@nhost/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminCourtManagement = () => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedCourt, setExpandedCourt] = useState(null);
  const accessToken = useAccessToken();

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Fetch all venues first
  const fetchVenues = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetVenues {
              venues {
                id
                title
                user_id
              }
            }
          `
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to fetch venues");
      setVenues(data.data.venues);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching venues:", error);
      setLoading(false);
    }
  };

  // Fetch courts for selected venue
  const fetchCourts = async (venueId) => {
    if (!venueId) return;
    
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetCourts($venueId: uuid!) {
              courts(where: { venue_id: { _eq: $venueId } }) {
                id
                name
              }
            }
          `,
          variables: {
            venueId,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to fetch courts");
      setCourts(data.data.courts);
    } catch (error) {
      console.error("Error fetching courts:", error);
    }
  };

  // Fetch slots for selected court and date
  const fetchSlots = async (courtId, date) => {
    if (!courtId || !date) return;

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetSlots($courtId: uuid!, $date: date!) {
              slots(where: { court_id: { _eq: $courtId }, date: { _eq: $date } }) {
                id
                start_at
                end_at
                price
                booked
                date
              }
            }
          `,
          variables: {
            courtId,
            date: formatDate(date),
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to fetch slots");
      
      // Update the courts array with the fetched slots
      setCourts(courts.map(court => 
        court.id === courtId 
          ? { ...court, slots: data.data.slots } 
          : court
      ));
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  // Handle booking toggle
  const handleBookingToggle = async (slot) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation UpdateSlot($slotId: uuid!, $booked: Boolean!) {
              update_slots_by_pk(
                pk_columns: { id: $slotId }
                _set: { booked: $booked }
              ) {
                id
                booked
              }
            }
          `,
          variables: {
            slotId: slot.id,
            booked: !slot.booked,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to update booking status");

      // Refresh slots after update
      fetchSlots(selectedCourt, selectedDate);
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  // Format time range for display
  const formatTimeRange = (startTime, endTime) => {
    const formatTime = (time) => {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  useEffect(() => {
    if (accessToken) {
      fetchVenues();
    }
  }, [accessToken]);

  useEffect(() => {
    if (selectedVenue) {
      fetchCourts(selectedVenue);
      setSelectedCourt(null); // Reset selected court when venue changes
    }
  }, [selectedVenue]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchSlots(selectedCourt, selectedDate);
    }
  }, [selectedCourt, selectedDate]);

  if (loading) return <div className="flex justify-center p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Admin Court Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Venue Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Venue</label>
            <Select value={selectedVenue} onValueChange={setSelectedVenue}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Court Selection */}
          {selectedVenue && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Court</label>
              <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a court" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Calendar and Slots */}
          {selectedCourt && (
            <>
              <div className="mb-6">
                <div className="mb-2 text-sm text-gray-600">
                  Selected Date: {formatDate(selectedDate)}
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>

              {/* Slots Display */}
              <div className="space-y-4">
                {courts.find(c => c.id === selectedCourt)?.slots?.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-lg border ${
                      slot.booked ? "bg-orange-100" : "bg-green-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {formatTimeRange(slot.start_at, slot.end_at)}
                      </span>
                      <Button
                        variant={slot.booked ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleBookingToggle(slot)}
                      >
                        {slot.booked ? "Booked" : "Mark as Booked"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCourtManagement;