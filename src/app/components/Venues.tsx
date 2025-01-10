"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserData, useAccessToken } from "@nhost/nextjs";
import "../loader.css"
import {
  SPORTS_LIST,
  AMENITIES_LIST,
  AMENITY_CATEGORIES,
} from "../constants/venue-options";

interface VenueDetails {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  open_at: string | null;
  close_at: string | null;
  sports: string[];
  amenities: string[];
  user_id: string;
  image_id?: string | null;
  extra_image_ids?: string[] | null;
}

const UpdateVenuePage = () => {
  const user = useUserData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const accessToken = useAccessToken();
  const [formData, setFormData] = useState<VenueDetails>({
    id: "",
    title: "",
    description: null,
    location: null,
    open_at: null,
    close_at: null,
    sports: [],
    amenities: [],
    user_id: "",
  });

  // Fetch venue data
  useEffect(() => {
    const fetchVenueDetails = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `
                query GetVenueByUserId {
                  venues(where: {user_id: {_eq: "${user.id}"}}) {
                    id
                    title
                    description
                    location
                    open_at
                    close_at
                    sports
                    amenities
                    user_id
                    image_id
                    extra_image_ids
                  }
                }
              `,
            }),
          }
        );

        const data = await response.json();
        if (data.errors) {
          throw new Error("Failed to fetch venue data");
        }

        const venueData = data.data.venues[0];
        setFormData(venueData);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setError("Failed to load venue details");
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [user?.id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSportToggle = (sportName: string) => {
    setFormData((prev) => ({
      ...prev,
      sports: prev.sports.includes(sportName)
        ? prev.sports.filter((sport) => sport !== sportName)
        : [...prev.sports, sportName],
    }));
  };

  const handleAmenityToggle = (amenityName: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityName)
        ? prev.amenities.filter((amenity) => amenity !== amenityName)
        : [...prev.amenities, amenityName],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Hasura-role": "seller",
        },
        body: JSON.stringify({
          query: `
              mutation UpdateVenue($id: uuid!, $updates: venues_set_input!) {
                update_venues_by_pk(
                  pk_columns: { id: $id }
                  _set: $updates
                ) {
                  id
                }
              }
            `,
          variables: {
            id: formData.id,
            updates: {
              title: formData.title,
              description: formData.description,
              location: formData.location,
              open_at: formData.open_at,
              close_at: formData.close_at,
              sports: formData.sports,
              amenities: formData.amenities,
            },
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to update venue");
      alert("Venue updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update venue");
    } finally {
      setIsSubmitting(false);
    }
  };

  


  if (loading) return <div className="flex items-center justify-center min-h-screen">
  <div id="preloader"></div>
</div>;
  if (error) return <div>Error: {error}</div>;
  if (!formData) return <div>No venue found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Update Venue Details</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Timing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Open At</label>
              <Input
                type="time"
                name="open_at"
                value={formData.open_at || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Close At</label>
              <Input
                type="time"
                name="close_at"
                value={formData.close_at || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Sports Available</h2>
          <div className="grid grid-cols-2 gap-4">
            {SPORTS_LIST.map((sport) => (
              <label key={sport.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.sports.includes(sport.name)}
                  onChange={() => handleSportToggle(sport.name)}
                  className="rounded border-gray-300"
                />
                <span>
                  {sport.icon} {sport.name}
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Amenities</h2>
          {AMENITY_CATEGORIES.map((category) => (
            <div key={category.id} className="mb-6">
              <h3 className="text-md font-medium mb-3">{category.name}</h3>
              <div className="grid grid-cols-2 gap-4">
                {AMENITIES_LIST.filter(
                  (amenity) => amenity.category === category.id
                ).map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.name)}
                      onChange={() => handleAmenityToggle(amenity.name)}
                      className="rounded border-gray-300"
                    />
                    <span>{amenity.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Venue"}
        </Button>
      </form>
    </div>
  );
};

export default UpdateVenuePage;
