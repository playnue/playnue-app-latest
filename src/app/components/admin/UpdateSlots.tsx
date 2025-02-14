import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToastContainer, toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DatePicker from "@/components/ui/datePicker";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccessToken } from "@nhost/nextjs";

const SlotPriceEditor = () => {
  // Multi-slot state
  const [slotIds, setSlotIds] = useState("");
  const [multiPrice, setMultiPrice] = useState("");

  // Single-slot state
  const [singleSlotId, setSingleSlotId] = useState("");
  const [singlePrice, setSinglePrice] = useState("");
  
  // weekend states
  const [weekendPrice, setWeekendPrice] = useState("");
  const getNextWeekend = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0-6, 0 being Sunday
    const daysUntilWeekend = currentDay === 6 ? 0 : 6 - currentDay; // If today is Saturday, use today, otherwise get to next Saturday
    
    const nextWeekend = new Date();
    nextWeekend.setDate(today.getDate() + daysUntilWeekend);
    return nextWeekend;
  };
  const [startDate, setStartDate] = useState(getNextWeekend());
const [endDate, setEndDate] = useState(() => {
  const oneMonthFromStart = new Date(getNextWeekend());
  oneMonthFromStart.setMonth(oneMonthFromStart.getMonth() + 1);
  return oneMonthFromStart;
});
  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");

  useEffect(() => {
    fetchVenues();
  }, []);

  // Fetch courts when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      fetchCourts(selectedVenue);
    } else {
      setCourts([]);
      setSelectedCourt("");
    }
  }, [selectedVenue]);

  const fetchVenues = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          // Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetVenues {
              venues {
                id
                title
              }
            }
          `,
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message);
      }

      setVenues(result.data.venues);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      setStatus({
        type: "error",
        message: "Failed to load venues. Please try again.",
      });
    }
  };

  const fetchCourts = async (venueId) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          // Authorization: `Bearer ${accessToken}`,
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

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message);
      }

      setCourts(result.data.courts);
    } catch (error) {
      console.error("Failed to fetch courts:", error);
      setStatus({
        type: "error",
        message: "Failed to load courts. Please try again.",
      });
    }
  };

  // Common state
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useAccessToken();

  const validateUUID = (id) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const validatePrice = (price) => {
    const priceNum = parseFloat(price);
    return !isNaN(priceNum) && priceNum >= 0;
  };

  const updateSlotPrice = async (slotId, price) => {
    const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation UpdateSlotPrice($slotId: uuid!, $price: money!) {
            update_slots_by_pk(
              pk_columns: { id: $slotId }
              _set: { price: $price }
            ) {
              id
              price
            }
          }
        `,
        variables: {
          slotId: slotId,
          price: price,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL operation failed");
    }

    return result.data.update_slots_by_pk;
  };

// Modified fetchWeekendSlots function
const fetchWeekendSlots = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set time to midnight to ensure consistent date handling
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const formattedStartDate = start.toISOString().split('T')[0];
  const formattedEndDate = end.toISOString().split('T')[0];

  const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Hasura-Role": "seller"
    },
    body: JSON.stringify({
      query: `
        query GetWeekendSlots($startDate: date!, $endDate: date!, $courtId: uuid!, $venueId: uuid!) {
          slots(
            where: {
              date: { _gte: $startDate, _lte: $endDate },
              court_id: { _eq: $courtId },
              court: {
                venue_id: { _eq: $venueId }
              }
            }
          ) {
            id
            date
            court {
              id
              venue_id
            }
          }
        }
      `,
      variables: {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        courtId: selectedCourt,
        venueId: selectedVenue
      },
    }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL operation failed");
  }

  return result.data.slots.filter(slot => {
    const date = new Date(slot.date);
    const day = date.getDay();
    return day === 0 || day === 6;
  });
};

  const handleSingleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      if (!validateUUID(singleSlotId)) {
        throw new Error("Invalid UUID format");
      }

      if (!validatePrice(singlePrice)) {
        throw new Error("Please enter a valid positive price");
      }

      const result = await updateSlotPrice(singleSlotId, singlePrice);

      setStatus({
        type: "success",
        message: `Successfully updated slot ${singleSlotId} to price ${singlePrice}`,
      });
      setSingleSlotId("");
      setSinglePrice("");
    } catch (error) {
      console.error("Update failed:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to update price. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const slots = slotIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      if (slots.length === 0) {
        throw new Error("Please enter at least one slot ID");
      }

      const invalidIds = slots.filter((id) => !validateUUID(id));
      if (invalidIds.length > 0) {
        throw new Error(`Invalid UUID format for: ${invalidIds.join(", ")}`);
      }

      if (!validatePrice(multiPrice)) {
        throw new Error("Please enter a valid positive price");
      }

      const updatePromises = slots.map((slotId) =>
        updateSlotPrice(slotId, multiPrice)
      );

      await Promise.all(updatePromises);

      setStatus({
        type: "success",
        message: `Successfully updated ${slots.length} slot${
          slots.length > 1 ? "s" : ""
        }`,
      });
      
      setSlotIds("");
      setMultiPrice("");
    } catch (error) {
      console.error("Update failed:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to update prices. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeekendUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      if (!selectedVenue || !selectedCourt) {
        throw new Error("Please select both venue and court");
      }

      if (!validatePrice(weekendPrice)) {
        throw new Error("Please enter a valid positive price");
      }

      const weekendSlots = await fetchWeekendSlots(startDate, endDate);
      
      if (weekendSlots.length === 0) {
        throw new Error("No weekend slots found in the selected date range");
      }

      const updatePromises = weekendSlots.map(slot => 
        updateSlotPrice(slot.id, weekendPrice)
      );

      await Promise.all(updatePromises);

      setStatus({
        type: "success",
        message: `Successfully updated ${weekendSlots.length} weekend slots`,
      });
      
      setWeekendPrice("");
    } catch (error) {
      console.error("Weekend update failed:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to update weekend prices. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Update Slot Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single">Single Slot</TabsTrigger>
              <TabsTrigger value="multi">Multiple Slots</TabsTrigger>
              {/* <TabsTrigger value="weekend">Weekend Slots</TabsTrigger> */}
            </TabsList>

            <TabsContent value="single">
              <form onSubmit={handleSingleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slot ID</label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={singleSlotId}
                    onChange={(e) => setSingleSlotId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter new price"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Price"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="multi">
              <form onSubmit={handleMultiUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slot IDs</label>
                  <Input
                    placeholder="Enter comma-separated UUIDs"
                    value={slotIds}
                    onChange={(e) => setSlotIds(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Separate multiple UUIDs with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter new price"
                    value={multiPrice}
                    onChange={(e) => setMultiPrice(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Prices"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="weekend">
              <form onSubmit={handleWeekendUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Venue</label>
                  <Select
                    value={selectedVenue}
                    onValueChange={setSelectedVenue}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a venue" />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Court</label>
                  <Select
                    value={selectedCourt}
                    onValueChange={setSelectedCourt}
                    disabled={isLoading || !selectedVenue}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a court" />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <DatePicker
                      placeholder="Start date"
                      value={startDate}
                      onChange={setStartDate}
                      disabled={isLoading}
                    />
                    <DatePicker
                      placeholder="End date"
                      value={endDate}
                      onChange={setEndDate}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Weekend Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter weekend price"
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  className="w-full" 
                  type="submit" 
                  disabled={isLoading || !selectedVenue || !selectedCourt}
                >
                  {isLoading ? "Updating..." : "Update Weekend Prices"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {status.message && (
            <Alert
              variant={status.type === "error" ? "destructive" : status.type}
              className="mt-4"
            >
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default SlotPriceEditor;
