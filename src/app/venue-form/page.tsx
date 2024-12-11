"use client";
import React, { useState } from "react";
import {
  Clock,
  MapPin,
  Mail,
  Star,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { nhost } from "@/lib/nhost";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";

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

  const handleTimeChange = (newHours: string, newMinutes: string, newPeriod: string) => {
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

const VenueForm = () => {
  const { data: session } = useSession();
  const token = session?.token; // Replace `token` with the actual key storing your JWT if needed
  console.log("Bearer Token:", token);
  const [venue, setVenue] = useState({
    title: "",
    description: "",
    location: "",
    openingTime: "",
    closingTime: "",
    amenities: [],
    sports: [],
    sellerEmail: "",
    latitude: "",
    longitude: "",
    rating: 0,
    // images: [],
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [newSport, setNewSport] = useState("");

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
          "x-hasura-admin-secret": "nhost-admin-secret"
        },
        body: JSON.stringify({
          query,
          variables: { email}
        })
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

  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
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

  const removeItem = (field: string, index: number) => {
    setVenue((prev) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: any) => i !== index),
    }));
  };

  const handleImageUpload = async (e: { target: { files: Iterable<unknown> | ArrayLike<unknown>; }; }) => {
    const files = Array.from(e.target.files);
    try {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const { fileMetadata, error } = await nhost.storage.upload({ file });
          if (error) {
            console.error("Error uploading file:", error.message);
            return null;
          }
          return nhost.storage.getPublicUrl({ fileId: fileMetadata.id });
        })
      );

      setVenue((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages.filter(Boolean)], // Filter out failed uploads
      }));
    } catch (error) {
      console.error("Error uploading images:", error.message);
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    try {
      const userId = await fetchUserIdByEmail(venue.sellerEmail);

      if (!userId) {
        alert("No user found with the provided email.");
        return;
      }
      // Replace with your Hasura GraphQL endpoint
      const hasuraEndpoint = "https://local.hasura.local.nhost.run/v1/graphql";
      const hasuraSecret = "nhost-admin-secret";

      // Construct the mutation payload
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
          open_at: venue.openingTime,
          close_at: venue.closingTime,
          amenities: venue.amenities,
          sports: venue.sports,
          user_id: userId, // Map sellerEmail to user_id for simplicity
          map: [`${venue.latitude},${venue.longitude}`],
          rating: parseInt(venue.rating, 10),
          // images: venue.images,
        },
      };

      const response = await fetch(hasuraEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": "nhost-admin-secret"
          // "Authorization":`Bearer ${token}`
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        alert("Venue added successfully!");
        // Reset form or handle success state
        setVenue({
          title: "",
          description: "",
          location: "",
          openingTime: "",
          closingTime: "",
          amenities: [],
          sports: [],
          user_id: "",
          latitude: "",
          longitude: "",
          rating: 0,
          // images: [],
        });
      } else {
        console.error("Error saving venue:", result.errors);
        alert("Failed to save the venue. Please check your input.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Venue</CardTitle>
      </CardHeader>
      <CardContent>
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
          <div className="grid grid-cols-2 gap-4">
            <TimePicker
              label="Opening Time"
              value={venue.openingTime}
              onChange={(value: any) => handleTimeChange("openingTime", value)}
            />
            <TimePicker
              label="Closing Time"
              value={venue.closingTime}
              onChange={(value: any) => handleTimeChange("closingTime", value)}
            />
          </div>

          {/* Rest of the form remains the same */}
          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium mb-1">Amenities</label>
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
                onClick={() => newSport && handleArrayInput("sports", newSport)}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Latitude
                </label>
                <Input
                  type="number"
                  name="latitude"
                  value={venue.latitude}
                  onChange={handleInputChange}
                  placeholder="Enter latitude"
                  required
                  step="any"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Longitude
                </label>
                <Input
                  type="number"
                  name="longitude"
                  value={venue.longitude}
                  onChange={handleInputChange}
                  placeholder="Enter longitude"
                  required
                  step="any"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Star className="inline-block w-4 h-4 mr-1" />
                Rating
              </label>
              <Input
                type="number"
                name="rating"
                value={venue.rating}
                onChange={handleInputChange}
                min="0"
                max="5"
                step="1"
                required
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium mb-1">Images</label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
              <div className="mt-2 text-sm text-gray-500">
                Selected files: {venue.images.length}
              </div>
            </div> */}
          </div>

          <Button type="submit" className="w-full">
            Save Venue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VenueForm;
