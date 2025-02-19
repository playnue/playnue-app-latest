"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import "../../loader.css";
import { nhost } from "@/lib/nhost";

interface VenueDetails {
  id: string;
  title: string;
  address: string;
  description: string;
  sports: string[];
  amenities: string[];
  extra_image_ids: string[];
  location: string;
  open_at: string;
  close_at: string;
  rating?: number;
  reviews?: number;
}

const sportIcons = {
  Football: " ⚽ ",
  Basketball: " 🏀 ",
  Cricket: " 🏏 ",
  Golf: " ⛳ ",
  Pickleball: " 🎾 ",
  Badminton: " 🏸 ",
  Tennis: " 🎾 ",
  BoxCricket: " 🏏 ",
  Snooker: " 🎱🥢 ",
  Pool: "🎱🥢"
};

const VenuePage = () => {
  const { id } = useParams();
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(`/book-now/${venue?.id}`);
  };

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL!,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
                  image_id
                  location
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
        setLoading(false);
      } catch (error) {
        console.log(error);
        setError("Failed to load venue details");
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [id]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div id="preloader"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen text-white">
          {error}
        </div>
      </>
    );
  }

  if (!venue) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="bg-[#1a1b26] rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="relative h-96">
              <img
                src="/playturf.jpg"
                alt={venue.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {venue.title}
                </h1>
                <p className="text-gray-300 flex items-center">
                  <span className="mr-2">📍</span>
                  {venue.location}
                </p>
              </div>
            </div>

            {/* Venue Details */}
            <div className="p-8">
              {/* Timing Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Operating Hours
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <p className="text-gray-300">
                    ⏰{" "}
                    {venue.open_at === "00:00:00" && venue.close_at === "00:00:00"
                      ? "24/7"
                      : `${venue.open_at} - ${venue.close_at}`}
                  </p>
                </div>
              </div>

              {/* Sports Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Available Sports
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <div className="flex flex-wrap gap-4">
                    {venue.sports?.map((sport) => (
                      <div
                        key={sport}
                        className="bg-purple-600/20 px-4 py-2 rounded-lg flex items-center"
                      >
                        <span className="text-2xl mr-2">{sportIcons[sport]}</span>
                        <span className="text-white">{sport}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Amenities Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Amenities
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {venue.amenities?.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center text-gray-300"
                      >
                        <span className="text-purple-500 mr-2">✓</span>
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  About Venue
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <p className="text-gray-300">{venue.description}</p>
                </div>
              </div>

              {/* Map Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Location
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <Link
                    href={`https://google.com/maps/search/?api=1&query=${venue.location}`}
                    className="flex items-center justify-center text-purple-400 hover:text-purple-300 py-4"
                  >
                    <span className="mr-2">🗺️</span>
                    View on Map
                  </Link>
                </div>
              </div>

              {/* Book Now Button */}
              <button
                onClick={handleButtonClick}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:-translate-y-1 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loader"></div>
                  </div>
                ) : (
                  "Book Now"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VenuePage;