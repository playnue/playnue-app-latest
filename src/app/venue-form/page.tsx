"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { nhost } from "../../lib/nhost";
import { NhostClient } from "@nhost/nhost-js";
import { useAccessToken, useNhostClient, useUserData } from "@nhost/nextjs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Clock,
  MapPin,
  Mail,
  Star,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TimePicker = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [period, setPeriod] = useState("AM");

  React.useEffect(() => {
    if (value) {
      const timeArr = value.split(":");
      let hour = parseInt(timeArr[0]);
      const minute = timeArr[1];

      if (hour >= 12) {
        setPeriod("PM");
        if (hour > 12) hour -= 12;
      } else {
        setPeriod("AM");
        if (hour === 0) hour = 12;
      }

      setHours(hour.toString().padStart(2, "0"));
      setMinutes(minute);
    }
  }, [value]);

  const handleTimeChange = (newHours, newMinutes, newPeriod) => {
    let hour = parseInt(newHours);
    if (newPeriod === "PM" && hour !== 12) hour += 12;
    if (newPeriod === "AM" && hour === 12) hour = 0;
    const time = `${hour.toString().padStart(2, "0")}:${newMinutes}`;
    onChange(time);
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium mb-1">
        <Clock className="inline-block w-4 h-4 mr-1" />
        {label}
      </label>
      <div className="relative">
        <div
          className="flex items-center border rounded-md p-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex-1">{`${hours}:${minutes} ${period}`}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg">
            <div className="p-2 grid grid-cols-3 gap-1 min-w-[200px]">
              <Select
                value={hours}
                onValueChange={(val) => {
                  setHours(val);
                  handleTimeChange(val, minutes, period);
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                    <SelectItem
                      key={hour}
                      value={hour.toString().padStart(2, "0")}
                    >
                      {hour.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={minutes}
                onValueChange={(val) => {
                  setMinutes(val);
                  handleTimeChange(hours, val, period);
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <SelectItem
                      key={minute}
                      value={minute.toString().padStart(2, "0")}
                    >
                      {minute.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={period}
                onValueChange={(val) => {
                  setPeriod(val);
                  handleTimeChange(hours, minutes, val);
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// Assuming TimePicker component exists as previously defined

const MultiStepVenueForm = () => {
  const [step, setStep] = useState(1);
  const [slotDuration, setSlotDuration] = useState("60");
  const [venueId, setVenueId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [courtId, setCourtId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quickCourts, setQuickCourts] = useState([{ name: "", price: "" }]);
  const accessToken = useAccessToken();
  const user = useUserData();
  const router = useRouter();

  const [selectedDates, setSelectedDates] = useState([]);
  // const nhost = useNhostClient();
  const [newAmenity, setNewAmenity] = useState("");
  const [newSport, setNewSport] = useState("");

  // Form states
  const [venue, setVenue] = useState({
    title: "",
    description: "",
    location: "",
    openingTime: "",
    closingTime: "",
    amenities: [],
    sports: [],
    sellerEmail: "",
    imageUrls: [],
    image_id: "",
  });

  const handleDateSelect = (dates) => {
    setSelectedDates(Array.isArray(dates) ? dates : [dates]);
  };
  const [courts, setCourts] = useState([
    {
      name: "",
      slots: [
        {
          timeSlots: [
            {
              startTime: "09:00",
              endTime: "10:00",
              price: "",
            },
          ],
        },
      ],
    },
  ]);

  const removeItem = (field: "amenities" | "sports", index: number) => {
    setVenue((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };
  const [slots, setSlots] = useState([
    {
      startTime: venue.openingTime || "12:00",
      endTime: venue.closingTime || "24:00",
      price: "",
    },
  ]);

  const addQuickCourtRow = () => {
    setQuickCourts([...quickCourts, { name: "", price: "" }]);
  };

  const removeQuickCourtRow = (index) => {
    setQuickCourts(quickCourts.filter((_, i) => i !== index));
  };

  // const generateCourtSlots = () => {
  //   const generatedCourts = quickCourts.map((court) => ({
  //     name: court.name,
  //     slots: [
  //       {
  //         timeSlots: Array.from({ length: 24 }, (_, hour) => ({
  //           startTime: `${hour.toString().padStart(2, "0")}:00`,
  //           endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
  //           price: court.price,
  //         })),
  //       },
  //     ],
  //   }));

  //   setCourts(generatedCourts);
  // };
  const handleSlotTimeChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index] = {
      ...newSlots[index],
      [field]: value,
    };
    setSlots(newSlots);
  };

  const fetchUserIdByEmail = async (email: string) => {
    try {
      // Replace with your Hasura GraphQL endpoint
      const hasuraEndpoint = process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL;

      const query = `
        query MyQuery($email: citext!) {
          users(where: {email: {_eq: $email}}) {
            id
            email
            createdAt
          }
        }
      `;

      const response = await fetch(hasuraEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          // "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
        },
        body: JSON.stringify({
          query,
          variables: { email },
        }),
      });

      const result = await response.json();
      console.log(result);
      if (response.ok && result.data.users.length > 0) {
        console.log("User found:", result.data.users[0]); // Log full user details
        return result.data.users[0].id;
      } else {
        console.error("No user found with this email");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user ID:", error);
      return null;
    }
  };

  const uploadImages = async (e) => {
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const { fileMetadata, error } = await nhost.storage.upload({
        file,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Hasura-role": "seller",
        },
      });
      console.log("Access token available:");
      console.log(fileMetadata);
      if (error) {
        console.error("Nhost upload error:", error);
        throw error;
      }

      if (!fileMetadata) {
        throw new Error("No file metadata received");
      }

      console.log("Upload successful:", fileMetadata);

      setVenue((prev) => ({
        ...prev,
        image_id: fileMetadata.id,
      }));
    } catch (error) {
      console.error("Full error details:", error);
      alert(`Upload failed: ${error.message || "Internal server error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  // const removeImage = async (url, index) => {
  //   try {
  //     // Extract fileId from the URL if needed for deletion from storage
  //     // const fileId = ... extract from url if possible ...
  //     // await nhostClient.storage.delete({ fileId });

  //     setVenue((prev) => ({
  //       ...prev,
  //       imageUrls: prev.imageUrls.filter((_, i) => i !== index),
  //     }));
  //   } catch (error) {
  //     console.error("Error removing image:", error);
  //     alert("Failed to remove image");
  //   }
  // };

  const addCourt = () => {
    setCourts([
      ...courts,
      {
        name: "",
        slots: [
          {
            timeSlots: [
              {
                startTime: "09:00",
                endTime: "10:00",
                price: "",
              },
            ],
          },
        ],
      },
    ]);
  };

  const SlotDurationSelector = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Slot Duration</label>
      <RadioGroup
        value={slotDuration}
        onValueChange={setSlotDuration}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="60" id="hour" />
          <Label htmlFor="hour">1 Hour</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="30" id="half-hour" />
          <Label htmlFor="half-hour">30 Minutes</Label>
        </div>
      </RadioGroup>
    </div>
  );

  const addTimeSlot = (courtIndex, slotPatternIndex) => {
    const newCourts = [...courts];
    const slots = newCourts[courtIndex].slots[slotPatternIndex].timeSlots;

    // Get end time of last slot or use default start time
    let startTime = "00:00";
    let endTime = slotDuration === "60" ? "01:00" : "00:30";

    if (slots.length > 0) {
      const lastSlot = slots[slots.length - 1];
      startTime = lastSlot.endTime;

      // Calculate end time based on start time and duration
      const [hours, minutes] = startTime.split(":").map(Number);
      const endMinutes = minutes + (slotDuration === "30" ? 30 : 60);
      const endHours = hours + Math.floor(endMinutes / 60);
      endTime = `${String(endHours % 24).padStart(2, "0")}:${String(
        endMinutes % 60
      ).padStart(2, "0")}`;
    }

    newCourts[courtIndex].slots[slotPatternIndex].timeSlots.push({
      startTime,
      endTime,
      price: "",
    });

    setCourts(newCourts);
  };

  const generateCourtSlots = () => {
    if (selectedDates.length === 0 || quickCourts.length === 0) {
      alert("Please select dates and add at least one court");
      return;
    }

    // Create a new array of courts with slots
    const generatedCourts = quickCourts.map((quickCourt) => {
      // Generate 24 hours of slots based on selected duration
      const timeSlots = [];
      const slotCount = 24 * (slotDuration === "30" ? 2 : 1); // 48 slots for 30min, 24 for 1hr

      for (let i = 0; i < slotCount; i++) {
        const intervalMinutes = slotDuration === "30" ? 30 : 60;
        const startMinutes = i * intervalMinutes;
        const endMinutes = startMinutes + intervalMinutes;

        const startHours = Math.floor(startMinutes / 60);
        const startMins = startMinutes % 60;

        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;

        timeSlots.push({
          startTime: `${String(startHours).padStart(2, "0")}:${String(
            startMins
          ).padStart(2, "0")}`,
          endTime: `${String(endHours % 24).padStart(2, "0")}:${String(
            endMins
          ).padStart(2, "0")}`,
          price: quickCourt.price,
        });
      }

      return {
        name: quickCourt.name,
        slots: [
          {
            timeSlots,
          },
        ],
      };
    });

    setCourts(generatedCourts);
  };

  const removeTimeSlot = (courtIndex, slotPatternIndex, timeSlotIndex) => {
    const newCourts = [...courts];
    const currentTimeSlots =
      newCourts[courtIndex].slots[slotPatternIndex].timeSlots;
    if (currentTimeSlots.length > 1) {
      newCourts[courtIndex].slots[slotPatternIndex].timeSlots =
        currentTimeSlots.filter((_, index) => index !== timeSlotIndex);
      setCourts(newCourts);
    }
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };
  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setVenue((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimeChange = (name: string, value: any) => {
    setVenue((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayInput = (field: string, value: string) => {
    if (field === "amenities") {
      setNewAmenity("");
      setVenue((prev) => ({
        ...prev,
        amenities: [...prev.amenities, value],
      }));
    } else if (field === "sports") {
      setNewSport("");
      setVenue((prev) => ({
        ...prev,
        sports: [...prev.sports, value],
      }));
    }
  };

  const removeCourt = (courtIndex) => {
    setCourts((prev) => prev.filter((_, index) => index !== courtIndex));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Get user ID

      // Step 2: Create venue
      const venueResponse = await fetch(
        process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "x-hasura-role": "seller",
            // "x-hasura-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET
          },
          body: JSON.stringify({
            query: `
            mutation CreateVenue($venueData: venues_insert_input!) {
              insert_venues_one(object: $venueData) {
                id
              }
            }
          `,
            variables: {
              venueData: {
                title: venue.title,
                description: venue.description,
                location: venue.location,
                open_at: venue.openingTime || "00:00",
                close_at: venue.closingTime || "00:00",
                amenities: venue.amenities,
                sports: venue.sports,
                // image_id:venue.image_id
              },
            },
          }),
        }
      );

      const venueResult = await venueResponse.json();
      const venueId = venueResult.data?.insert_venues_one?.id;

      if (!venueId) {
        throw new Error("Failed to create venue");
      }

      // Step 3: Create courts with slots across selected dates
      const courtsWithSlots = courts.map((court) => ({
        name: court.name,
        venue_id: venueId,
        slots: {
          data: selectedDates.flatMap((date) =>
            court.slots[0].timeSlots.map((slot) => ({
              date: date,
              start_at: slot.startTime + ":00",
              end_at: slot.endTime + ":00",
              price: parseFloat(slot.price),
            }))
          ),
        },
      }));

      await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role": "seller",
        },
        body: JSON.stringify({
          query: `
            mutation CreateCourtsAndSlots($objects: [courts_insert_input!]!) {
              insert_courts(objects: $objects) {
                affected_rows
              }
            }
          `,
          variables: {
            objects: courtsWithSlots,
          },
        }),
      });

      alert("Venue, courts and slots created successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Failed to save data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {step === 1 && "Add Venue Details"}
          {step === 2 && "Add Court Details"}
          {step === 3 && "Add Time Slots"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  name="title"
                  value={venue.title}
                  onChange={handleInputChange}
                  placeholder="Enter venue title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={venue.description}
                  onChange={handleInputChange}
                  placeholder="Enter venue description"
                  required
                  className="h-32"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <MapPin className="inline-block w-4 h-4 mr-1" />
                  Location (City)
                </label>
                <Input
                  name="location"
                  value={venue.location}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  required
                />
              </div>
            </div>

            {/* Time Details */}
            <p className="block text-sm font-medium text-red-500">
              If open 24/7 leave this
            </p>

            <div className="grid grid-cols-2 gap-4">
              <TimePicker
                label="Opening Time"
                value={venue.openingTime}
                onChange={(value: any) =>
                  handleTimeChange("openingTime", value)
                }
              />
              <TimePicker
                label="Closing Time"
                value={venue.closingTime}
                onChange={(value: any) =>
                  handleTimeChange("closingTime", value)
                }
              />
            </div>

            {/* Rest of the form remains the same */}
            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amenities
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Add amenity"
                />
                <Button
                  type="button"
                  onClick={() =>
                    newAmenity && handleArrayInput("amenities", newAmenity)
                  }
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center gap-1"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeItem("amenities", index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Sports */}
            <div>
              <label className="block text-sm font-medium mb-1">Sports</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSport}
                  onChange={(e) => setNewSport(e.target.value)}
                  placeholder="Add sport"
                />
                <Button
                  type="button"
                  onClick={() =>
                    newSport && handleArrayInput("sports", newSport)
                  }
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {venue.sports.map((sport, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-2 py-1 rounded-md flex items-center gap-1"
                  >
                    {sport}
                    <button
                      type="button"
                      onClick={() => removeItem("sports", index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Contact and Location */}
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Upload Venue Images
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={uploadImages}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Saving..." : "Next: Add Courts"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left column: Calendar */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Dates</h3>
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                />
                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    Selected dates: {selectedDates.length}
                  </p>
                </div>
              </div>
              <div className="border p-4 rounded-lg bg-gray-50 mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Slot Duration
                  </label>
                  <RadioGroup
                    value={slotDuration}
                    onValueChange={setSlotDuration}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="60" id="hour" />
                      <Label htmlFor="hour">1 Hour</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="30" id="half-hour" />
                      <Label htmlFor="half-hour">30 Minutes</Label>
                    </div>
                  </RadioGroup>
                </div>
                <h3 className="text-lg font-semibold mb-4">
                  Quick Court Generation
                </h3>
                {quickCourts.map((court, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Court Name"
                      value={court.name}
                      onChange={(e) => {
                        const newQuickCourts = [...quickCourts];
                        newQuickCourts[index].name = e.target.value;
                        setQuickCourts(newQuickCourts);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Price/Hour"
                      value={court.price}
                      onChange={(e) => {
                        const newQuickCourts = [...quickCourts];
                        newQuickCourts[index].price = e.target.value;
                        setQuickCourts(newQuickCourts);
                      }}
                    />
                    {quickCourts.length > 1 && (
                      <Button
                        onClick={() => removeQuickCourtRow(index)}
                        variant="destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Button onClick={addQuickCourtRow} type="button">
                    <Plus className="w-4 h-4 mr-2" /> Add Court
                  </Button>
                  <Button
                    onClick={generateCourtSlots}
                    type="button"
                    variant="secondary"
                  >
                    Generate 24-Hour Slots
                  </Button>
                </div>
              </div>
              {/* Right column: Courts management */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Courts</h3>
                  <Button onClick={addCourt} type="button" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Court
                  </Button>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {courts.map((court, courtIndex) => (
                    <div
                      key={courtIndex}
                      className="border rounded-lg p-4 bg-white shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <Input
                          placeholder="Court Name"
                          value={court.name}
                          onChange={(e) => {
                            const newCourts = [...courts];
                            newCourts[courtIndex].name = e.target.value;
                            setCourts(newCourts);
                          }}
                          className="w-2/3"
                        />
                        {courts.length > 1 && (
                          <Button
                            onClick={() => removeCourt(courtIndex)}
                            variant="destructive"
                            size="sm"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {court.slots.map((slotPattern, slotPatternIndex) => (
                        <div key={slotPatternIndex} className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium">Time Slots</h5>
                            <Button
                              onClick={() =>
                                addTimeSlot(courtIndex, slotPatternIndex)
                              }
                              size="sm"
                              type="button"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Slot
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {slotPattern.timeSlots.map(
                              (timeSlot, timeSlotIndex) => (
                                <div
                                  key={timeSlotIndex}
                                  className="border rounded p-3 bg-gray-50"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">
                                      Slot {timeSlotIndex + 1}
                                    </span>
                                    {slotPattern.timeSlots.length > 1 && (
                                      <Button
                                      onClick={() => removeTimeSlot(courtIndex, slotPatternIndex, timeSlotIndex)}
                                      variant="destructive"
                                      size="sm"
                                      type="button" // Add this line
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 mb-2">
                                    <TimePicker
                                      label="Start"
                                      value={timeSlot.startTime}
                                      onChange={(value) => {
                                        const newCourts = [...courts];
                                        newCourts[courtIndex].slots[
                                          slotPatternIndex
                                        ].timeSlots[timeSlotIndex].startTime =
                                          value;
                                        setCourts(newCourts);
                                      }}
                                    />
                                    <TimePicker
                                      label="End"
                                      value={timeSlot.endTime}
                                      onChange={(value) => {
                                        const newCourts = [...courts];
                                        newCourts[courtIndex].slots[
                                          slotPatternIndex
                                        ].timeSlots[timeSlotIndex].endTime =
                                          value;
                                        setCourts(newCourts);
                                      }}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-1">
                                      Price
                                    </label>
                                    <Input
                                      type="number"
                                      value={timeSlot.price}
                                      onChange={(e) => {
                                        const newCourts = [...courts];
                                        newCourts[courtIndex].slots[
                                          slotPatternIndex
                                        ].timeSlots[timeSlotIndex].price =
                                          e.target.value;
                                        setCourts(newCourts);
                                      }}
                                      placeholder="Enter price"
                                    />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                onClick={() => setStep(1)}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : "Save All"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiStepVenueForm;
