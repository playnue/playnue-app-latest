"use client";
import React, { useState, useEffect } from "react";
import { useUserData, useAccessToken } from "@nhost/nextjs";
import { Card,CardContent,CardDescription,CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown, Edit2, IndianRupee, Save, X , Clock, DollarSign, CalendarDays, LayoutGrid, Percent} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdvancedPriceUpdate({ courts, onUpdatePrices, open, onOpenChange }) {
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [timeSlot, setTimeSlot] = useState("all");
  const [updateFrequency, setUpdateFrequency] = useState("all");
  const [updateType, setUpdateType] = useState("fixed");
  const [priceValue, setPriceValue] = useState("");
  const [specificTime, setSpecificTime] = useState({ start: "", end: "" });
  
  const handleSubmit = () => {
    onUpdatePrices({
      courtId: selectedCourt,
      dateRange,
      timeSlot,
      updateType,
      priceValue: parseFloat(priceValue),
      specificTime,
      updateFrequency,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <IndianRupee className="w-6 h-6" />
            Advanced Price Update
          </DialogTitle>
          <DialogDescription>
            Update prices for specific dates and time slots across your courts
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-6 py-4">
          {/* Left Column */}
          <div className="col-span-12 md:col-span-7 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5" />
                  Select Court
                </CardTitle>
                <CardDescription>Choose which court to update</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                  <SelectTrigger className="w-full">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Date Range
                </CardTitle>
                <CardDescription>Select the dates to update</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  className="rounded-md border"
                  numberOfMonths={2}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="col-span-12 md:col-span-5 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Time Settings
                </CardTitle>
                <CardDescription>Configure when to apply changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <Select value={timeSlot} onValueChange={setTimeSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Slots</SelectItem>
                      <SelectItem value="morning">Morning (Before 12 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                      <SelectItem value="evening">Evening (After 5 PM)</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {timeSlot === "custom" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custom Time Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        value={specificTime.start}
                        onChange={(e) => setSpecificTime(prev => ({ ...prev, start: e.target.value }))}
                      />
                      <Input
                        type="time"
                        value={specificTime.end}
                        onChange={(e) => setSpecificTime(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Apply To</label>
                  <Select value={updateFrequency} onValueChange={setUpdateFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Days</SelectItem>
                      <SelectItem value="weekdays">Weekdays Only</SelectItem>
                      <SelectItem value="weekends">Weekends Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Price Update
                </CardTitle>
                <CardDescription>Set your new pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Type</label>
                  <Select value={updateType} onValueChange={setUpdateType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="percentage">Percentage Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {updateType === "fixed" ? "New Price" : "Percentage Change"}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {updateType === "fixed" ? "₹" : "%"}
                    </div>
                    <Input 
                      type="number"
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value)}
                      className="pl-8"
                      placeholder={updateType === "fixed" ? "Enter new price" : "Enter percentage"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSubmit} 
              className="w-full h-12 text-lg"
              disabled={!selectedCourt || !priceValue}
            >
              Update Prices
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

//   exp AdvancedPriceUpdate;

const CourtManagement = () => {
  const [expandedCourt, setExpandedCourt] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(Date.now());
  const [editingCourt, setEditingCourt] = useState(null);
  const [editingCourtName, setEditingCourtName] = useState("");
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingPrice, setEditingPrice] = useState("");
  const [showBulkPriceDialog, setShowBulkPriceDialog] = useState(false);
  const [bulkPriceType, setBulkPriceType] = useState("fixed"); // 'fixed' or 'percentage'
  const [bulkPriceValue, setBulkPriceValue] = useState("");
  const [bulkPriceTimeSlot, setBulkPriceTimeSlot] = useState("all"); // 'all', 'morning', 'afternoon', 'evening'
  const [selectedCourtForBulk, setSelectedCourtForBulk] = useState(null);
  const [showAdvancedPriceDialog, setShowAdvancedPriceDialog] = useState(false);
  const accessToken = useAccessToken();
  const user = useUserData();

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date) => {
    if (date) {
      // Set the time to noon of the selected date to avoid timezone issues
      const selectedDateAtNoon = new Date(date);
      selectedDateAtNoon.setHours(12, 0, 0, 0);
      setSelectedDate(selectedDateAtNoon);
      setLoading(true);
    }
  };

  // Memoize the formatted date to prevent unnecessary re-renders
  const formattedDate = React.useMemo(
    () => formatDate(selectedDate),
    [selectedDate]
  );

  const handleAdvancedPriceUpdate = async (updateData) => {
    try {
      // Get slots that match the criteria
      const startDate = formatDate(updateData.dateRange.from);
      const endDate = formatDate(updateData.dateRange.to);

      // Fetch all slots for the date range
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetSlots($courtId: uuid!, $startDate: date!, $endDate: date!) {
              slots(
                where: {
                  court_id: { _eq: $courtId }
                  date: { _gte: $startDate, _lte: $endDate }
                }
              ) {
                id
                start_at
                end_at
                date
                price
              }
            }
          `,
          variables: {
            courtId: updateData.courtId,
            startDate,
            endDate,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to fetch slots");

      // Filter slots based on time criteria
      let slotsToUpdate = data.data.slots.filter((slot) => {
        const slotDate = new Date(slot.date);
        const dayOfWeek = slotDate.getDay();

        // Check frequency (weekdays/weekends)
        if (
          updateData.updateFrequency === "weekdays" &&
          (dayOfWeek === 0 || dayOfWeek === 6)
        )
          return false;
        if (
          updateData.updateFrequency === "weekends" &&
          dayOfWeek > 0 &&
          dayOfWeek < 6
        )
          return false;

        // Check time slot
        const slotHour = parseInt(slot.start_at.split(":")[0]);
        switch (updateData.timeSlot) {
          case "morning":
            return slotHour < 12;
          case "afternoon":
            return slotHour >= 12 && slotHour < 17;
          case "evening":
            return slotHour >= 17;
          case "custom":
            const startHour = parseInt(
              updateData.specificTime.start.split(":")[0]
            );
            const endHour = parseInt(updateData.specificTime.end.split(":")[0]);
            return slotHour >= startHour && slotHour < endHour;
          default:
            return true;
        }
      });

      // Calculate new prices
      const updates = slotsToUpdate.map((slot) => {
        const newPrice =
          updateData.updateType === "fixed"
            ? updateData.priceValue
            : slot.price * (1 + updateData.priceValue / 100);

        return {
          where: { id: { _eq: slot.id } },
          _set: { price: Math.round(newPrice * 100) / 100 },
        };
      });

      // Update all matching slots
      const updateResponse = await fetch(
        process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
            mutation BulkUpdateSlotPrices($updates: [slots_updates!]!) {
              update_slots_many(updates: $updates) {
                affected_rows
              }
            }
          `,
            variables: {
              updates,
            },
          }),
        }
      );

      const updateData = await updateResponse.json();
      if (updateData.errors) throw new Error("Failed to update slot prices");

      fetchCourtsAndSlots();
      setShowAdvancedPriceDialog(false);
    } catch (error) {
      console.error("Error in advanced price update:", error);
    }
  };

  const fetchCourtsAndSlots = async () => {
    if (!user?.id) return;

    const formattedDate = formatDate(selectedDate);
    console.log("Fetching courts for date:", formattedDate); // Debug log

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetCourtsAndSlots($userId: uuid!, $date: date!) {
              courts(where: { venue: { user_id: { _eq: $userId } } }) {
                id
                name
                slots(where: { date: { _eq: $date } }) {
                  id
                  start_at
                  end_at
                  price
                  booked
                  date
                }
              }
            }
          `,
          variables: {
            userId: user.id,
            date: formattedDate, // Use the formatted date string
          },
        }),
      });

      const data = await response.json();
      console.log("Response data:", data); // Debug log

      if (data.errors) {
        console.error("GraphQL Errors:", data.errors);
        return;
      }

      setCourts(data.data.courts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching courts:", error);
      setLoading(false);
    }
  };

  const handleCourtNameEdit = async (courtId) => {
    if (!editingCourtName.trim()) return;

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation UpdateCourtName($courtId: uuid!, $name: String!) {
              update_courts_by_pk(
                pk_columns: { id: $courtId }
                _set: { name: $name }
              ) {
                id
                name
              }
            }
          `,
          variables: {
            courtId,
            name: editingCourtName,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to update court name");

      setCourts(
        courts.map((court) =>
          court.id === courtId ? { ...court, name: editingCourtName } : court
        )
      );
      setEditingCourt(null);
      setEditingCourtName("");
    } catch (error) {
      console.error("Error updating court name:", error);
    }
  };

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

      fetchCourtsAndSlots();
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

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

  const handlePriceUpdate = async () => {
    if (!selectedSlot || !editingPrice) return;

    try {
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
            slotId: selectedSlot.id,
            price: parseFloat(editingPrice),
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to update slot price");

      fetchCourtsAndSlots();
      setShowSlotDialog(false);
      setSelectedSlot(null);
      setEditingPrice("");
    } catch (error) {
      console.error("Error updating slot price:", error);
    }
  };

  const groupSlotsByPeriod = (slots) => {
    return slots.reduce((groups, slot) => {
      const hour = new Date(slot.start_at).getHours();
      let period = "morning";
      if (hour >= 12 && hour < 17) period = "afternoon";
      else if (hour >= 17) period = "evening";

      if (!groups[period]) groups[period] = [];
      groups[period].push(slot);
      return groups;
    }, {});
  };

  const handleBulkPriceUpdate = async () => {
    if (!selectedCourtForBulk || !bulkPriceValue) return;

    try {
      const selectedCourt = courts.find(
        (court) => court.id === selectedCourtForBulk
      );
      let slotsToUpdate = selectedCourt.slots;

      // Filter slots based on selected time period
      if (bulkPriceTimeSlot !== "all") {
        slotsToUpdate = slotsToUpdate.filter((slot) => {
          const hour = new Date(`2000-01-01T${slot.start_at}`).getHours();
          switch (bulkPriceTimeSlot) {
            case "morning":
              return hour < 12;
            case "afternoon":
              return hour >= 12 && hour < 17;
            case "evening":
              return hour >= 17;
            default:
              return true;
          }
        });
      }

      // Prepare the mutation for bulk update
      const slotUpdates = slotsToUpdate.map((slot) => {
        const newPrice =
          bulkPriceType === "fixed"
            ? parseFloat(bulkPriceValue)
            : slot.price * (1 + parseFloat(bulkPriceValue) / 100);

        return {
          id: slot.id,
          price: Math.round(newPrice * 100) / 100, // Round to 2 decimal places
        };
      });

      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation BulkUpdateSlotPrices($updates: [slots_updates!]!) {
              update_slots_many(updates: $updates) {
                affected_rows
              }
            }
          `,
          variables: {
            updates: slotUpdates.map((update) => ({
              where: { id: { _eq: update.id } },
              _set: { price: update.price },
            })),
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to update slot prices");

      fetchCourtsAndSlots();
      setShowBulkPriceDialog(false);
      resetBulkPriceForm();
    } catch (error) {
      console.error("Error updating slot prices:", error);
    }
  };

  const resetBulkPriceForm = () => {
    setBulkPriceType("fixed");
    setBulkPriceValue("");
    setBulkPriceTimeSlot("all");
    setSelectedCourtForBulk(null);
  };

  useEffect(() => {
    if (user?.id && accessToken && selectedDate) {
      setLoading(true);
      fetchCourtsAndSlots();
    }
  }, [user?.id, accessToken, selectedDate]); // Keep selectedDate in dependency array

  // Calendar selection handler

  if (loading)
    return <div className="flex justify-center p-4">Loading courts...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Court Management</h2>
        {/* <div className="flex flex-col gap-4 mb-4">
          <Button
            onClick={() => setShowBulkPriceDialog(true)}
            className="flex items-center gap-2"
          >
            <IndianRupee className="h-4 w-4" />
            Bulk Price Update
          </Button>
          <Button
            onClick={() => setShowAdvancedPriceDialog(true)}
            className="flex items-center gap-2"
          >
            <IndianRupee className="h-4 w-4" />
            Advanced Price Update
          </Button>
        </div> */}

        <div className="mb-6">
          <div className="mb-2 text-sm text-gray-600">
            Selected Date: {formattedDate}
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect} // Use the new handler
            className="rounded-md border"
          />
        </div>
        {loading ? (
          <div className="flex justify-center p-4">Loading courts...</div>
        ) : courts.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No courts found for the selected date
          </div>
        ) : (
          // Rest of your courts mapping JSX remains the same...
          // (Keep the existing courts rendering code)
          <>
            {courts.map((court) => (
              <div key={court.id} className="mb-4 border rounded-lg">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center space-x-4">
                    {editingCourt === court.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={editingCourtName}
                          onChange={(e) => setEditingCourtName(e.target.value)}
                          className="w-48"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCourtNameEdit(court.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCourt(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium">{court.name}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCourt(court.id);
                            setEditingCourtName(court.name);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setExpandedCourt(
                        expandedCourt === court.id ? null : court.id
                      )
                    }
                  >
                    <ChevronDown
                      className={`transform transition-transform ${
                        expandedCourt === court.id ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </div>

                {expandedCourt === court.id && (
                  <div className="p-4">
                    {Object.entries(groupSlotsByPeriod(court.slots)).map(
                      ([period, slots]) => (
                        <div key={period} className="mb-6">
                          <h4 className="text-lg font-medium capitalize mb-3">
                            {period}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {slots?.map((slot) => (
                              <div
                                key={slot.id}
                                className={`p-4 rounded-lg border ${
                                  slot.booked ? "bg-orange-100" : "bg-green-100"
                                }`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">
                                    {formatTimeRange(
                                      slot.start_at,
                                      slot.end_at
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSlot(slot);
                                      setEditingPrice(slot.price.toString());
                                      setShowSlotDialog(true);
                                    }}
                                  >
                                    ₹{slot.price}
                                  </Button>
                                  <Button
                                    variant={
                                      slot.booked ? "secondary" : "default"
                                    }
                                    size="sm"
                                    onClick={() => handleBookingToggle(slot)}
                                  >
                                    {slot.booked ? "Booked" : "Mark as Booked"}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        <AdvancedPriceUpdate
          courts={courts}
          onUpdatePrices={handleAdvancedPriceUpdate}
          open={showAdvancedPriceDialog}
          onOpenChange={setShowAdvancedPriceDialog}
        />
        <Dialog
          open={showBulkPriceDialog}
          onOpenChange={setShowBulkPriceDialog}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Bulk Update Prices</DialogTitle>
              <DialogDescription>
                Update prices for multiple slots at once.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <Select
                value={selectedCourtForBulk}
                onValueChange={setSelectedCourtForBulk}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Court" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={bulkPriceTimeSlot}
                onValueChange={setBulkPriceTimeSlot}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Slots</SelectItem>
                  <SelectItem value="morning">
                    Morning (Before 12 PM)
                  </SelectItem>
                  <SelectItem value="afternoon">
                    Afternoon (12 PM - 5 PM)
                  </SelectItem>
                  <SelectItem value="evening">Evening (After 5 PM)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bulkPriceType} onValueChange={setBulkPriceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Update Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="percentage">Percentage Change</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                value={bulkPriceValue}
                onChange={(e) => setBulkPriceValue(e.target.value)}
                placeholder={
                  bulkPriceType === "fixed"
                    ? "Enter new price"
                    : "Enter percentage change"
                }
              />

              <Button onClick={handleBulkPriceUpdate} className="w-full">
                Update Prices
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Slot Price</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <Input
                type="number"
                value={editingPrice}
                onChange={(e) => setEditingPrice(e.target.value)}
                placeholder="Enter new price"
              />
              <Button onClick={handlePriceUpdate} className="w-full">
                Update Price
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};

export default CourtManagement;
