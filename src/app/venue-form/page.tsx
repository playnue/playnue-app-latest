"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
// Import existing TimePicker component from your code
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

  const handleTimeChange = (
    newHours: string,
    newMinutes: string,
    newPeriod: string
  ) => {
    let hour = parseInt(newHours);

    // Convert to 24-hour format
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
                <SelectContent
                  position="popper"
                  className="max-h-[200px] overflow-y-auto"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                    <SelectItem
                      key={hour}
                      value={hour.toString().padStart(2, "0")}
                      className="cursor-pointer hover:bg-gray-100"
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
                <SelectContent
                  position="popper"
                  className="max-h-[200px] overflow-y-auto"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <SelectItem
                      key={minute}
                      value={minute.toString().padStart(2, "0")}
                      className="cursor-pointer hover:bg-gray-100"
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
                <SelectContent position="popper">
                  <SelectItem
                    value="AM"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    AM
                  </SelectItem>
                  <SelectItem
                    value="PM"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    PM
                  </SelectItem>
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
  const [venueId, setVenueId] = useState(null);
  const [courtId, setCourtId] = useState(null);

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
  });

  const [court, setCourt] = useState({
    name: "",
    description: "",
  });

  const [slots, setSlots] = useState([
    {
      startTime: venue.openingTime || "12:00",
      endTime: venue.closingTime || "24:00",
      price: "",
    },
  ]);

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
      const hasuraEndpoint = "https://local.hasura.local.nhost.run/v1/graphql";

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
          "x-hasura-admin-secret": "nhost-admin-secret",
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

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = await fetchUserIdByEmail(venue.sellerEmail);
      console.log(venue.openingTime);
      if (!userId) {
        alert("No user found with the provided email.");
        return;
      }

      const mutation = `
        mutation InsertVenue($object: venues_insert_input!) {
          insert_venues_one(object: $object) {
            id
            title
          }
        }
      `;

      const variables = {
        object: {
          title: venue.title,
          description: venue.description,
          location: venue.location,
          open_at: venue.openingTime || "00:00",
          close_at: venue.closingTime || "00:00",
          amenities: venue.amenities,
          sports: venue.sports,
          user_id: userId,
        },
      };

      const response = await fetch(
        "https://local.hasura.local.nhost.run/v1/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": "nhost-admin-secret",
          },
          body: JSON.stringify({ query: mutation, variables }),
        }
      );

      const result = await response.json();
      if (result.data?.insert_venues_one?.id) {
        setVenueId(result.data.insert_venues_one.id);
        setStep(2);
      }
    } catch (error) {
      console.error("Error saving venue:", error);
      alert("Failed to save venue");
    }
  };

  const handleCourtSubmit = async (e) => {
    e.preventDefault();
    try {
      const mutation = `
        mutation InsertCourt($object: courts_insert_input!) {
          insert_courts_one(object: $object) {
            id
            name
          }
        }
      `;

      const variables = {
        object: {
          name: court.name,
          venue_id: venueId,
        },
      };

      const response = await fetch(
        "https://local.hasura.local.nhost.run/v1/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": "nhost-admin-secret",
          },
          body: JSON.stringify({ query: mutation, variables }),
        }
      );

      const result = await response.json();
      if (result.data?.insert_courts_one?.id) {
        setCourtId(result.data.insert_courts_one.id);
        setStep(3);
      }
    } catch (error) {
      console.error("Error saving court:", error);
      alert("Failed to save court");
    }
  };

  const handleSlotSubmit = async (e) => {
    console.log(slots.map((slot) => console.log(slot.startTime)));
    e.preventDefault();
    try {
      const mutation = `
        mutation InsertSlots($objects: [slots_insert_input!]!) {
          insert_slots(objects: $objects) {
            affected_rows
          }
        }
      `;

      const slotObjects = slots.map((slot) => ({
        start_at: slot.startTime + ":00",
        end_at: slot.endTime + ":00",
        price: parseFloat(slot.price),
        court_id: courtId,
      }));

      const variables = {
        objects: slotObjects,
      };

      const response = await fetch(
        "https://local.hasura.local.nhost.run/v1/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": "nhost-admin-secret",
          },
          body: JSON.stringify({ query: mutation, variables }),
        }
      );

      const result = await response.json();
      if (result.data?.insert_slots?.affected_rows > 0) {
        alert("All data saved successfully!");
        // Reset form or redirect
      }
    } catch (error) {
      console.error("Error saving slots:", error);
      alert("Failed to save slots");
    }
  };

  const addSlot = () => {
    setSlots([
      ...slots,
      {
        startTime: "09:00",
        endTime: "10:00",
        price: "",
      },
    ]);
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
        {step === 1 && (
          <form onSubmit={handleVenueSubmit} className="space-y-6">
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Mail className="inline-block w-4 h-4 mr-1" />
                  Seller Email
                </label>
                <Input
                  type="email"
                  name="sellerEmail"
                  value={venue.sellerEmail}
                  onChange={handleInputChange}
                  placeholder="Enter seller email"
                  required
                />
              </div>
              {/* {Images} */}
              {/* <div>
                        <label className="block text-sm font-medium mb-1">
                          Upload Venue Images
                        </label>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full"
                        />
          
                        {venue.imageUrls && venue.imageUrls.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {venue.imageUrls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Venue image ${index + 1}`}
                                className="w-20 h-20 object-cover rounded"
                              />
                            ))}
                          </div>
                        )}
                      </div> */}
            </div>

            {/* <Button type="submit" className="w-full">
              Save Venue
            </Button> */}
            <Button type="submit" className="w-full">
              Next: Add Court
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCourtSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Court Name
              </label>
              <Input
                value={court.name}
                onChange={(e) => setCourt({ ...court, name: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-4">
              <Button type="button" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Next: Add Slots
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSlotSubmit} className="space-y-6">
            {slots.map((slot, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Slot {index + 1}</h3>
                  {slots.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeSlot(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TimePicker
                    label="Start Time"
                    value={slot.startTime}
                    onChange={(value) =>
                      handleSlotTimeChange(index, "startTime", value)
                    }
                  />
                  <TimePicker
                    label="End Time"
                    value={slot.endTime}
                    onChange={(value) =>
                      handleSlotTimeChange(index, "endTime", value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price
                  </label>
                  <Input
                    type="number"
                    value={slot.price}
                    onChange={(e) => {
                      const newSlots = [...slots];
                      newSlots[index].price = e.target.value;
                      setSlots(newSlots);
                    }}
                    required
                  />
                </div>
              </div>
            ))}
            <Button type="button" onClick={addSlot} className="w-full mb-4">
              <Plus className="w-4 h-4 mr-2" /> Add Another Slot
            </Button>
            <div className="flex gap-4">
              <Button type="button" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Save All
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiStepVenueForm;
