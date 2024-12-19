"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NhostClient } from "@nhost/nhost-js";
import { useNhostClient } from "@nhost/nextjs";
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
import { nhost } from "@/lib/nhost";
// Import existing TimePicker component from your code
const TimePicker = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [period, setPeriod] = useState("AM");
  const nhost = useNhostClient();

  // const [nhostClient] = useState(() => createNhostClient());

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [courtId, setCourtId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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
    // imageUrls: [],
    images: [],
  });

  const [courts, setCourts] = useState([
    {
      name: "",
      // description: "",
      slots: [
        {
          startTime: "09:00",
          endTime: "10:00",
          price: "",
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
          "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
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

  // const uploadImages = async (files) => {
  //   if (!files || files.length === 0) return;

  //   const uploadedUrls = [];
  //   setIsUploading(true);

  //   try {
  //     for (let i = 0; i < files.length; i++) {
  //       const file = files[i];

  //       // Create a unique file path for each image
  //       const filePath = `venues/${Date.now()}-${file.name}`;

  //       const { error, fileMetadata } = await nhost.storage.upload({
  //         file,
  //         bucketId: "venues",
  //       });

  //       if (error) {
  //         console.error("Upload error:", error);
  //         throw error;
  //       }

  //       // Get the public URL for the uploaded file
  //       const publicUrl = nhost.storage.getPublicUrl({
  //         fileId: fileMetadata.id,
  //       });

  //       uploadedUrls.push(publicUrl);
  //       // Update progress
  //       setUploadProgress(((i + 1) / files.length) * 100);
  //     }

  //     // Update venue state with new image URLs
  //     setVenue((prev) => ({
  //       ...prev,
  //       imageUrls: [...prev.imageUrls, ...uploadedUrls],
  //     }));
  //   } catch (error) {
  //     console.error("Error uploading images:", error);
  //     alert("Failed to upload images: " + error.message);
  //   } finally {
  //     setIsUploading(false);
  //     setUploadProgress(0);
  //   }
  // };

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
          // image_id: venue.imageUrls,
        },
      };

      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

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

  const addCourt = () => {
    setCourts([
      ...courts,
      {
        name: "",
        slots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            price: "",
          },
        ],
      },
    ]);
  };

  // Remove a court
  const removeCourt = (index) => {
    const updatedCourts = courts.filter((_, i) => i !== index);
    setCourts(updatedCourts);
  };

  const addSlotToCourt = (courtIndex) => {
    const updatedCourts = [...courts];
    updatedCourts[courtIndex].slots.push({
      startTime: "09:00",
      endTime: "10:00",
      price: "",
    });
    setCourts(updatedCourts);
  };

  // Remove a slot from a specific court
  const removeSlotFromCourt = (courtIndex, slotIndex) => {
    const updatedCourts = [...courts];
    updatedCourts[courtIndex].slots = updatedCourts[courtIndex].slots.filter(
      (_, i) => i !== slotIndex
    );
    setCourts(updatedCourts);
  };

  // Update court details
  const updateCourtDetail = (courtIndex, field, value) => {
    const updatedCourts = [...courts];
    updatedCourts[courtIndex] = {
      ...updatedCourts[courtIndex],
      [field]: value,
    };
    setCourts(updatedCourts);
  };

  // Update slot details for a specific court
  const updateCourtSlot = (courtIndex, slotIndex, field, value) => {
    const updatedCourts = [...courts];
    updatedCourts[courtIndex].slots[slotIndex] = {
      ...updatedCourts[courtIndex].slots[slotIndex],
      [field]: value,
    };
    setCourts(updatedCourts);
  };

  const handleCourtsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // First, insert courts
      const courtsMutation = `
        mutation InsertCourts($objects: [courts_insert_input!]!) {
          insert_courts_one(objects: $objects) {
            returning {
              id
              name
            }
          }
        }
      `;

      const courtsVariables = {
        objects: courts.map((court) => ({
          name: court.name,
          venue_id: venueId,
        })),
      };

      const courtsResponse = await fetch(
        process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
          },
          body: JSON.stringify({
            query: courtsMutation,
            variables: courtsVariables,
          }),
        }
      );

      const courtsResult = await courtsResponse.json();

      // If courts were inserted successfully, proceed to insert slots
      if (courtsResult.data?.insert_courts?.returning) {
        const courtIds = courtsResult.data.insert_courts.returning.map(
          (court, index) => ({
            id: court.id,
            courtIndex: index,
          })
        );

        // Prepare slots mutation
        const slotsMutation = `
          mutation InsertSlots($objects: [slots_insert_input!]!) {
            insert_slots_one(objects: $objects) {
              affected_rows
            }
          }
        `;

        // Prepare slots with corresponding court IDs
        const slotObjects = courtIds.flatMap(({ id, courtIndex }) =>
          courts[courtIndex].slots.map((slot) => ({
            start_at: slot.startTime + ":00",
            end_at: slot.endTime + ":00",
            price: parseFloat(slot.price),
            court_id: id,
          }))
        );

        const slotsResponse = await fetch(
          process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
            },
            body: JSON.stringify({
              query: slotsMutation,
              variables: { objects: slotObjects },
            }),
          }
        );

        const slotsResult = await slotsResponse.json();

        if (slotsResult.data?.insert_slots?.affected_rows > 0) {
          alert("Venue, Courts, and Slots saved successfully!");
          // Reset or navigate as needed
        }
      }
    } catch (error) {
      console.error("Error saving courts and slots:", error);
      alert("Failed to save courts and slots");
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    try {
      const base64Promises = files.map((file) => fileToBase64(file));
      const base64Results = await Promise.all(base64Promises);

      setVenue((prev) => ({
        ...prev,
        images: [...prev.images, ...base64Results],
      }));
    } catch (error) {
      console.error("Error converting images:", error);
      alert("Failed to process images");
    }
  };

  // Remove image
  const removeImage = (index) => {
    setVenue((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
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

      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

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

  const handleVenueAndCourtsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Fetch user ID
      const userId = await fetchUserIdByEmail(venue.sellerEmail);
      if (!userId) {
        throw new Error("No user found with the provided email.");
      }

      // Prepare the nested mutation
      const mutation = `
        mutation CreateVenueWithCourtsAndSlots($venueData: venues_insert_input!) {
          insert_venues_one(object: $venueData) {
            id
            title
          }
        }
      `;

      // Prepare variables with nested courts and slots
      const variables = {
        venueData: {
          title: venue.title,
          description: venue.description,
          location: venue.location,
          open_at: venue.openingTime || "00:00",
          close_at: venue.closingTime || "00:00",
          amenities: venue.amenities,
          sports: venue.sports,
          user_id: userId,
          extra_image_ids: venue.images,
          courts: {
            data: courts.map((court) => ({
              name: court.name,

              slots: {
                data: court.slots.map((slot) => ({
                  start_at: slot.startTime + ":00",
                  end_at: slot.endTime + ":00",
                  price: parseFloat(slot.price),
                })),
              },
            })),
          },
        },
      };

      // Execute the mutation
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": `${process.env.NEXT_PUBLIC_ADMIN_SECRET}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();

      if (result.data?.insert_venues_one?.id) {
        // Successfully created venue with courts and slots
        alert("Venue, Courts, and Slots saved successfully!");
        // Reset form or navigate as needed
      } else {
        throw new Error("Failed to create venue");
      }
    } catch (error) {
      console.error("Error saving venue and courts:", error);
      alert(error.message || "Failed to save venue and courts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      handleVenueAndCourtsSubmit(e);
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
            <div className="space-y-4">
              <div>
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
              </div>

              {/* Image preview section */}
              {venue.images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {venue.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Venue ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 
                         opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
          onChange={(e) => uploadImages(e.target.files)}
          className="w-full"
          disabled={isUploading}
        />
        
        {isUploading && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Uploading: {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {venue.imageUrls && venue.imageUrls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {venue.imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Venue image ${index + 1}`}
                  className="w-20 h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url, index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 
                           opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div> */}
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

            {/* <Button type="submit" className="w-full">
              Save Venue
            </Button> */}
</div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Saving..." : "Next: Add Courts"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {courts?.map((court, courtIndex) => (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Courts ({courts.length})
                  </h3>
                  <Button
                    type="button"
                    onClick={addCourt}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Court
                  </Button>
                </div>
                <div key={courtIndex} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Court {courtIndex + 1}</h3>
                    {courts.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeCourt(courtIndex)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Court Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Court Name
                    </label>
                    <Input
                      value={court.name}
                      onChange={(e) =>
                        updateCourtDetail(courtIndex, "name", e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Slots for this Court */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Time Slots</h4>
                      <Button
                        type="button"
                        onClick={() => addSlotToCourt(courtIndex)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Slot
                      </Button>
                    </div>
                    {court.slots.map((slot, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="border rounded-lg p-3 space-y-3 bg-white"
                      >
                        <div className="flex justify-between items-center">
                          <span>Slot {slotIndex + 1}</span>
                          {court.slots.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() =>
                                removeSlotFromCourt(courtIndex, slotIndex)
                              }
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
                              updateCourtSlot(
                                courtIndex,
                                slotIndex,
                                "startTime",
                                value
                              )
                            }
                          />
                          <TimePicker
                            label="End Time"
                            value={slot.endTime}
                            onChange={(value) =>
                              updateCourtSlot(
                                courtIndex,
                                slotIndex,
                                "endTime",
                                value
                              )
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
                            onChange={(e) =>
                              updateCourtSlot(
                                courtIndex,
                                slotIndex,
                                "price",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add Slot Button for this Court */}

                    {/* <div className="flex gap-4">
                      <Button type="button" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? "Saving..." : "Save All"}
                      </Button>
                    </div> */}
                  </div>
                </div>
              </>
            ))}

            {/* Add Court Button */}
            <div className="flex gap-4">
              <Button type="button" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : "Save All"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiStepVenueForm;
