"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import Script from "next/script";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tag } from "lucide-react";

// import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Clock,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Calculator,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import { useRouter } from "next/navigation";
import "../../loader.css";
import { useAccessToken, useUserData } from "@nhost/nextjs";
export default function BookNow() {
  const { id } = useParams();
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const VALID_COUPON = "PLAYNUE99";
  const COUPON_DISCOUNT = 99;
  const CONVENIENCE_FEE_PERCENTAGE = 2.36;
  const discount = isCouponApplied ? COUPON_DISCOUNT : 0;
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const convenienceFees = subtotal * (CONVENIENCE_FEE_PERCENTAGE / 100);
  const totalCost = Math.round(subtotal + convenienceFees - discount);
  const [venue, setVenue] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [duration, setDuration] = useState(60);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [courts, setCourts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlots] = useState([]);
  const router = useRouter();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const data = localStorage.getItem("user");
  // const parsedData = JSON.parse(data);

  const accessToken = useAccessToken();
  const user = useUserData();

  const [isClient, setIsClient] = useState(false);
  const handleCouponSubmit = () => {
    if (couponCode.trim() === VALID_COUPON) {
      setIsCouponApplied(true);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code");
      setIsCouponApplied(false);
    }
  };

  const logSlotTimes = (slots, setSlots) => {
    const allSlots = [];

    slots.forEach((slot) => {
      const [startHour, startMinute] = slot.start_at.split(":").map(Number);
      const [endHour, endMinute] = slot.end_at.split(":").map(Number);

      // Create base date objects for start and end times
      const startTime = new Date();
      startTime.setHours(startHour, startMinute, 0);

      const endTime = new Date();
      endTime.setHours(endHour, endMinute, 0);

      // Handle overnight slots (when end time is before start time)
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const durationMinutes = 60; // Default duration or you can use slot.duration
      const currentTime = new Date(startTime);

      // Generate slots until we reach the end time
      while (currentTime < endTime) {
        const slotEndTime = new Date(currentTime);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + durationMinutes);

        allSlots.push({
          id: slot.id,
          time: new Date(currentTime),
          price: slot.price,
          duration: durationMinutes,
        });

        currentTime.setMinutes(currentTime.getMinutes() + durationMinutes);
      }
    });

    // Sort slots by time
    allSlots.sort((a, b) => a.time - b.time);
    setSlots(allSlots);
  };

  const fetchSlotsForCourt = async (courtId, selectedDate) => {
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      const today = format(now, "yyyy-MM-dd");
      
      const slotResponse = await fetch(
        process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query GetSlots($courtId: uuid!, $date: date!, $currentTime: time!, $today: date!) {
                slots(where: {
                  court_id: {_eq: $courtId},
                  date: {_eq: $date},
                  booked: {_eq: false},
                  _or: [
                    {date: {_gt: $today}},
                    {_and: [
                      {date: {_eq: $today}},
                      {start_at: {_gt: $currentTime}}
                    ]}
                  ]
                }) {
                  id
                  start_at
                  end_at
                  price
                }
              }
            `,
            variables: {
              courtId: courtId,
              date: formattedDate,
              currentTime: currentTime,
              today: today,
            },
          }),
        }
      );
  
      const responseData = await slotResponse.json();
      if (responseData.errors) {
        throw new Error("Failed to fetch slots data");
      }
  
      const availableSlots = responseData.data.slots;
  
      // Sort available slots by start time
      availableSlots.sort((a, b) => {
        const timeA = convertTo24HourFormat(a.start_at);
        const timeB = convertTo24HourFormat(b.start_at);
        return timeA.localeCompare(timeB);
      });
  
      setSlots(availableSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
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

  function convertTo24HourFormat(time) {
    // Ensure the input time is a valid string with "AM" or "PM" at the end.
    const regex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = time.trim().match(regex);

    if (!match) {
      return "Invalid Time Format"; // If input doesn't match the format, return an error message
    }
    // eslint-disable-next-line no-unused-vars
    const [_, hour, minute, period] = match; // Extract hour, minute, and period (AM/PM)

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
    if (!selectedCourt || !selectedSlot) {
      alert("Please select a court and time slot first");
      return;
    }

    if(!user){
      router.push("/login");
    }

    const selectedCourtName =
      courts.find((court) => court.id === selectedCourt)?.name || "Court";
    const selectedSlotPrice = parseFloat(
      selectedSlot.price.replace(/[^0-9.-]+/g, "")
    );

    const newBooking = {
      id: Date.now(),
      time: formatTimeRange(selectedSlot.start_at, selectedSlot.end_at),
      duration: duration,
      court: selectedCourtName,
      price: selectedSlotPrice,
    };

    setCart([...cart, newBooking]);
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

  // const totalCost = cart.reduce((sum, item) => sum + item.price, 0);
  const slotId = selectedSlot.id;

  const handleBookNow = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty. Please add a court and time to book.");
      return;
    }
    console.log("success");
    if(!user){
      router.push("/login")
    }
    try {
      // Create order via your backend
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_FUNCTIONS}/razorpay/order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount: totalCost, // Backend will multiply by 100
            slot_ids: [slotId],
          }),
        }
      );

      if (!orderResponse.ok) {
        throw new Error("Failed to create Razorpay order");
      }

      const orderData = await orderResponse.json();
      console.log("Razorpay Order Created:", orderData);

      // Razorpay checkout options
      console.log(selectedDate);
      const date = new Date(selectedDate);

      // Extract year, month, and day
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based
      const day = String(date.getDate()).padStart(2, "0");

      // Combine into YYYY-MM-DD format
      const formattedDate = `${year}-${month}-${day}`;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY, // Your Razorpay Key ID
        amount: orderData.amount, // Amount from the created order
        currency: orderData.currency,
        name: "Your Sport Venue",
        description: "Court Booking",
        order_id: orderData.id, // Use the order_id from the created order
        handler: async function (response) {
          console.log("todo: add handler")
          console.log("response", response);
            // TODO: Add handler.
        },
        prefill: {
          name: user.displayName || "Guest",
          email: user.email || "guest@example.com",
        },
        theme: {
          color: "#3399cc",
        },
      };

      // Initialize Razorpay
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        console.error("Razorpay SDK not loaded");
        alert("Payment gateway is temporarily unavailable");
      }
    } catch (error) {
      toast.error("Could not process your booking. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
          process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
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
      } catch (error) {
        console.log(error);
      }
    };

    const fetchCourtDetails = async () => {
      try {
        const courtResponse = await fetch(
          process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  // If not client-side, render nothing or a placeholder
  if (!isClient) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div id="preloader"></div>
        </div>
      </>
    );
  }
  return (
    <>
      <ToastContainer />
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => console.log("Razorpay script loaded successfully")}
      />
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
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Date</label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                >
                  {selectedDate
                    ? format(selectedDate, "yyyy-MM-dd")
                    : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsPopoverOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setIsDialogOpen(!isDialogOpen)}
                >
                  {selectedTime || "Select Time"}
                  <Clock className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[500px] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Select Time</DialogTitle>
                </DialogHeader>
                <div
                  className="grid grid-cols-2 gap-2 mt-4 overflow-y-auto pr-2"
                  style={{ maxHeight: "400px" }}
                >
                  {!selectedCourt ? (
                    <p className="text-center col-span-2">
                      Please select a court first
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-center col-span-2">
                      No slots available for the selected date
                    </p>
                  ) : (
                    slots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={
                          selectedSlot?.id === slot.id ? "default" : "outline"
                        }
                        onClick={() => {
                          setSelectedTime(
                            formatTimeRange(slot.start_at, slot.end_at)
                          );
                          setSelectedSlots(slot);
                          setIsDialogOpen(false);
                        }}
                        className="text-sm"
                      >
                        {formatTimeRange(slot.start_at, slot.end_at)}
                      </Button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
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
                  <p className="text-sm">{item.time}</p>
                  {/* <p className="text-sm">{item.duration} Minute(s)</p> */}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    ₹{item.price.toFixed(2)}
                  </p>
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

          <Card className="mt-4 p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Input
                  maxLength={9}
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-grow"
                />
                <Button
                  onClick={handleCouponSubmit}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Apply
                </Button>
              </div>
              {couponError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{couponError}</AlertDescription>
                </Alert>
              )}
              {isCouponApplied && (
                <Alert className="mt-2 bg-green-50">
                  <AlertDescription className="text-green-600">
                    Coupon applied successfully! ₹99 discount added.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="text-gray-700">Subtotal</span>
                </div>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="text-gray-700">
                    Convenience Fees ({CONVENIENCE_FEE_PERCENTAGE}%)
                  </span>
                </div>
                <span className="font-semibold">
                  ₹{convenienceFees.toFixed(2)}
                </span>
              </div>
              {isCouponApplied && (
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-green-600" />
                    <span className="text-green-600">Coupon Discount</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    -₹{COUPON_DISCOUNT.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-blue-600">
                  ₹{totalCost.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handleBookNow}
                className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600"
              >
                Book Now
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
