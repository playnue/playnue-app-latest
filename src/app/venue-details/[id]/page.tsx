"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

interface VenueDetails {
  id: string;
  title: string;
  address: string;
  description: string;
  sports: { name: string; icon: string }[];
  amenities: string[];
  images: string[];
  location: string;
  latitude: number;
  longitude: number;
  open_at: string;
  close_at: string;
  rating?: number; // Optional fields can be added based on available data
  reviews?: number;
}

const sportIcons = {
  Football: " ⚽ ",
  Basketball: " 🏀 ",
  Cricket: " 🏏 ",
  Badminton: " 🏸 ",
  Tennis: " 🎾 ",
};

const VenuePage = () => {
  const { id } = useParams();
  console.log(id);
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  // Fetch data from Hasura
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
              query: `
              query MyQuery {
                venues(where: {id: {_eq: "${id}"}}) {
                  id
                  title
                  description
                  sports
                  amenities
                  images
                  location
                  map
                  open_at
                  close_at
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
        setVenue(data.data.venues[0]);
        console.log(data.data.venues[0].images);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!venue) return <p>Venue not found.</p>;

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{venue.title}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <p>{venue.location}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/book-now/${venue.id}`}>
              <button className="px-6 py-2 bg-green-500 text-white rounded-lg">
                Book Now
              </button>
            </Link>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative mb-8">
          <div className="relative h-60 overflow-hidden rounded-lg">
            <img
              src={venue?.images[currentImage]}
              alt={`Venue image ${currentImage + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
              onClick={() =>
                setCurrentImage((prev) => (prev + 1) % venue.images.length)
              }
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex justify-center gap-2 mt-2">
            {venue.images.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentImage ? "bg-green-500" : "bg-gray-300"
                }`}
                onClick={() => setCurrentImage(idx)}
              />
            ))}
          </div>
        </div>

        {/* Info Sections */}
        <div className="">
          <div className="col-span-2">
            {/* Timing */}
            <Card className="p-4 mb-4">
              <h2 className="text-lg font-semibold mb-2">Timing</h2>
              <p>
                {venue.open_at} - {venue.close_at}
              </p>
            </Card>

            {/* Sports Available */}
            <Card className="p-4 mb-4">
              <h2 className="text-lg font-semibold mb-2">Sports Available</h2>
              <div className="flex gap-4">
                {venue.sports?.map((sport: string) => (
                  <>
                    <span key={sport}>{sportIcons[sport] || "❓"}</span>
                    <p>{sport}</p>
                  </>
                ))}
              </div>
            </Card>

            {/* Amenities */}
            <Card className="p-4 mb-4">
              <h2 className="text-lg font-semibold mb-2">Amenities</h2>
              <div className="grid grid-cols-2 gap-4">
                {venue.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {amenity}
                  </div>
                ))}
              </div>
            </Card>

            {/* About Venue */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-2">About Venue</h2>
              <p>{venue.description}</p>
            </Card>
          </div>

          {/* Map Location */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDfpdR57AhvUccjGREgfhGaljfwohSOGt4&q=${venue?.map[0]},${venue?.map[1]}`}
                width="100%"
                height="300"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-none"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VenuePage;
