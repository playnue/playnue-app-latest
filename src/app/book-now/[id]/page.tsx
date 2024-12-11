"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/app/components/Navbar";

import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const page = () => {
  const { id } = useParams();
  const [venue, setVenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [duration, setDuration] = useState(30);
  const [cart, setCart] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [courts, setCourts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlots] = useState([]);
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const { data: session } = useSession();

  const logSlotTimes = (slots, setSlots, bookedSlots) => {
    const allSlots = []; // Array to store all the time intervals

    // Convert booked slots to Date ranges
    const bookedRanges = bookedSlots.map((booked) => {
      const [startHour, startMinute, startSecond] = booked.start_time
        .split(":")
        .map(Number);
      const [endHour, endMinute, endSecond] = booked.end_time
        .split(":")
        .map(Number);

      const start = new Date();
      start.setHours(startHour, startMinute, startSecond);

      const end = new Date();
      end.setHours(endHour, endMinute, endSecond);

      return { start, end };
    });

    slots.forEach((slot) => {
      const startTimeParts = slot.start_at.split(":").map(Number);
      const endTimeParts = slot.end_at.split(":").map(Number);

      const startTime = new Date();
      const endTime = new Date();

      startTime.setHours(
        startTimeParts[0],
        startTimeParts[1],
        startTimeParts[2]
      );
      endTime.setHours(endTimeParts[0], endTimeParts[1], endTimeParts[2]);

      const durationMinutes = slot.duration;
      let currentTime = new Date(startTime);

      while (currentTime < endTime) {
        const slotEndTime = new Date(currentTime);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + durationMinutes);

        // Check if this slot overlaps with any booked slot
        const isBooked = bookedRanges.some(
          (range) => currentTime < range.end && slotEndTime > range.start // Overlap condition
        );

        if (!isBooked) {
          allSlots.push({
            id: slot.id, // Include the slot ID for reference
            time: new Date(currentTime), // Store the time as a Date object
            price: slot.price, // Include the price for this slot
            duration: slot.duration, // Include the duration
          });
        }

        currentTime.setMinutes(currentTime.getMinutes() + durationMinutes);
      }
    });

    // Update the state with the filtered slots
    setSlots(allSlots);

    // Log the available slots (optional)
    console.log("All available slots:", allSlots);
  };

  const fetchSlotsForCourt = async (courtId, selectedDate) => {
    try {
      // Fetch slots for the selected court
      const slotResponse = await fetch(
        "https://local.hasura.local.nhost.run/v1/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": "nhost-admin-secret",
          },
          body: JSON.stringify({
            query: `query GetSlots {
              slots(where: {court_id: {_eq: "${courtId}"}}) {
                id
                start_at
                end_at
                price
                duration
              }
            }`,
          }),
        }
      );

      const slotData = await slotResponse.json();
      if (slotData.errors) {
        throw new Error("Failed to fetch slots data");
      }

      const fetchedSlots = slotData.data.slots;

      // Fetch existing bookings for the selected date
      const bookingResponse = await fetch(
        "https://local.hasura.local.nhost.run/v1/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": "nhost-admin-secret",
          },
          body: JSON.stringify({
            query: `query GetBookings {
              bookings(where: {court_id: {_eq: "${courtId}"}, booking_date: {_eq: "${format(
              selectedDate,
              "yyyy-MM-dd"
            )}"}}) {
                start_time
                end_time
              }
            }`,
          }),
        }
      );

      const bookingData = await bookingResponse.json();
      if (bookingData.errors) {
        throw new Error("Failed to fetch bookings data");
      }
      const bookedSlots = bookingData?.data?.bookings;
      console.log(bookedSlots);
      logSlotTimes(fetchedSlots, setSlots, bookedSlots);
      // Generate available slots
    } catch (error) {
      console.log(error);
    }
  };

  function convertTo24HourFormat(time) {
    // Ensure the input time is a valid string with "AM" or "PM" at the end.
    const regex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = time.trim().match(regex);

    if (!match) {
      return "Invalid Time Format"; // If input doesn't match the format, return an error message
    }

    let [_, hour, minute, period] = match; // Extract hour, minute, and period (AM/PM)

    let hour24 = parseInt(hour, 10);

    // Convert the hour to 24-hour format based on AM/PM
    if (period.toUpperCase() === "PM" && hour24 !== 12) {
      hour24 += 12; // Add 12 for PM times (except for 12 PM)
    } else if (period.toUpperCase() === "AM" && hour24 === 12) {
      hour24 = 0; // Convert 12 AM to 00
    }

    // Return the time in 24-hour format
    return `${hour24.toString().padStart(2, "0")}:${minute}`;
  }

  const handleAddToCart = () => {
    // Ensure a court is selected
    if (!selectedCourt) {
      alert("Please select a court first");
      return;
    }

    // Format selected time to 24-hour format
    const formattedTime = convertTo24HourFormat(selectedTime);
    console.log("Formatted Time:", formattedTime); // Log formatted time

    // Find the selected court's name
    const selectedCourtName =
      courts.find((court) => court.id === selectedCourt)?.name || "Court";

    // Find the selected slot's price
    console.log(selectedSlot.price);
    const selectedSlotPrice = parseFloat(
      selectedSlot.price.replace(/[^0-9.-]+/g, "")
    );
    console.log(selectedSlotPrice);

    // Calculate the total price (price per 30-minute block)
    const totalPrice = selectedSlotPrice * (duration / 30);
    console.log(totalPrice);
    // Create a new booking object
    const newBooking = {
      id: Date.now(),
      time: formattedTime, // Use the formatted time
      duration,
      court: selectedCourtName, // Use the selected court's name
      price: totalPrice, // Calculate total price based on duration
    };

    // Add the new booking to the cart
    console.log(newBooking.price);
    setCart([...cart, newBooking]);

    // Optionally, log the updated cart to verify
    console.log("Updated Cart:", cart);
  };

  const handleRemoveFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const handleIncreaseDuration = () => {
    if (duration < 240) setDuration(duration + 30); // Maximum duration: 240 minutes (4 hours)
  };

  const handleDecreaseDuration = () => {
    if (duration > 30) setDuration(duration - 30); // Minimum duration: 30 minutes
  };

  const totalCost = cart.reduce((sum, item) => sum + item.price, 0);

  const handleBookNow = async () => {
    // Ensure the cart is not empty and necessary fields are available
    if (cart.length === 0) {
      alert("Your cart is empty. Please add a court and time to book.");
      return;
    }

    // Prepare the booking data (replace these with actual values from the cart)
    const { court, time, duration, price } = cart[0]; // Assuming one item in the cart for simplicity
    const bookingDate = new Date().toISOString().split("T")[0]; // Use the current date (you can adjust this)

    const startTime = time; // This should be formatted as HH:MM
    const endTime = calculateEndTime(startTime, duration); // Calculate the end time based on the duration

    // Prepare the mutation variables
    const bookingData = {
      // You should have a selectedSlot object with the slot_id
      booking_date: bookingDate,
      court_id: selectedCourt, // The selected court ID
      start_time: startTime,
      end_time: endTime,
      price: price,
      rzp_id: "sample_razorpay_id", // Replace with actual Razorpay ID after payment
      user_id: "1cff347d-6685-4b9d-9940-f64f646bd683", // Replace with the logged-in user ID
    };

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
            mutation InsertBooking(
              $booking_date: date!,
              $court_id: uuid!,
              $start_time: time,
              $end_time: time,
              $price:Int,
              $rzp_id: String!,
              $user_id: uuid!
            ) {
              insert_bookings_one(object: {
                booking_date: $booking_date,
                court_id: $court_id,
                start_time: $start_time,
                end_time: $end_time,
                price: $price
                rzp_id: $rzp_id,
                user_id: $user_id
              }) {
                id
              }
            }
          `,
            variables: bookingData,
          }),
        }
      );

      const data = await response.json();
      if (data.errors) {
        console.error(data.errors);
        alert("Error creating booking.");
      } else {
        setCart([]); // Clear the cart after booking
        router.push("/user-bookings"); 
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("An error occurred while processing your booking.");
    }
  };

  // Helper function to calculate the end time based on the start time and duration
  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes);
    endDate.setMinutes(endDate.getMinutes() + duration); // Add duration in minutes
    return endDate.toTimeString().slice(0, 5); // Format as HH:mm
  };

  useEffect(() => {
    const fetchVenueDetails = async () => {
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
              query: `query MyQuery {
                venues(where: {id: {_eq: "${id}"}}) {
                  id
                  title
                  sports
                }
              }`,
            }),
          }
        );

        const data = await response.json();
        if (data.errors) {
          throw new Error("Failed to fetch venue data");
        }
        setVenue(data.data.venues[0]);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    const fetchCourtDetails = async () => {
      try {
        const courtResponse = await fetch(
          "https://local.hasura.local.nhost.run/v1/graphql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-hasura-admin-secret": "nhost-admin-secret",
            },
            body: JSON.stringify({
              query: `query GetCourts {
                courts(where: { venue_id: { _eq: "${id}" } }) {
                  id
                  name
                }
              }`,
            }),
          }
        );

        const courtData = await courtResponse.json();
        if (courtData.errors) {
          throw new Error("Failed to fetch courts data");
        }
        setCourts(courtData.data.courts);
        if (courtData.data.courts.length > 0) {
          const { open_time, close_time } = courtData.data.courts[0];
          // setOpenTime(open_time);
          // setCloseTime(close_time);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchVenueDetails();
    fetchCourtDetails();
  }, [id]);

  useEffect(() => {
    if (selectedCourt) {
      fetchSlotsForCourt(selectedCourt, selectedDate);
    }
  }, [selectedCourt, selectedDate]); // Added selectedDate dependency

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto p-4">
        <Card className="p-4 mb-4">
          <h2 className="text-xl font-bold mb-4">{venue?.title}</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Sport</label>
            <Select defaultValue="">
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {venue?.sports?.map((sport, index) => (
                  <SelectItem key={index} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedDate
                    ? format(selectedDate, "yyyy-MM-dd")
                    : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedTime || "Select Time"}
                  <Clock className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Time</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {slots.length === 0 ? (
                    <p className="text-center col-span-3">
                      Please select court
                    </p>
                  ) : (
                    slots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={
                          selectedTime === slot.time.toISOString()
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setSelectedTime(
                            slot.time.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          );
                          setSelectedSlots(slot);
                        }}
                        className="text-sm"
                      >
                        {slot.time.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Duration</label>
            <div className="flex items-center justify-between">
              <Button
                onClick={handleDecreaseDuration}
                disabled={duration === 30}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span>{duration} mins</span> {/* Display duration in minutes */}
              <Button
                onClick={handleIncreaseDuration}
                disabled={duration === 240}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Court</label>
            <Select onValueChange={setSelectedCourt}>
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
          </div>

          <Button onClick={handleAddToCart} className="w-full">
            Add to Cart
          </Button>
        </Card>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Your Cart</h2>
          <div className="space-y-4">
            {cart.map((item) => (
              <Card
                key={item.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-sm">{item.court}</p>
                  <p className="text-sm">{item.time}</p>{" "}
                  {/* Ensure item.time is a string */}
                  <p className="text-sm">{item.duration} Minute(s)</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">₹{item.price}</p>
                  <Button
                    onClick={() => handleRemoveFromCart(item.id)}
                    variant="ghost"
                    className="p-2 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-xl font-semibold">Total: ₹{totalCost}</p>
            <Button
              onClick={handleBookNow}
              className="bg-blue-500 text-white px-6 py-2"
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;

// id- uuid, primary key, unique, default: gen_random_uuid()

// created_at- timestamp with time zone, default: now()

// updated_at- timestamp with time zone, default: now()

// slot_id- uuid, nullable

// user_id- uuid

// rzp_id- text

// booking_date- date

// court_id- uuid

// start_time- time without time zone, nullable

// end_time- time without time zone, nullable
