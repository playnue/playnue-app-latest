"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import "../../loader.css";
import { parse } from "path";
import { nhost } from "@/lib/nhost";
interface VenueDetails {
  id: string;
  title: string;
  address: string;
  description: string;
  sports: { name: string; icon: string }[];
  amenities: string[];
  extra_image_ids: string[];
  location: string;
  open_at: string;
  close_at: string;
  rating?: number; // Optional fields can be added based on available data
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
  Pool: "🎱",
  PS4: "🎮",
  LawnTennis: "🎾",
  Cricket_Net: "🏏",
  // TableTennis: " :table "
};

const VenuePage = () => {
  const { id } = useParams();
  console.log(id);
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [image, setImage] = useState();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const handleButtonClick = (e) => {
    e.preventDefault(); // Prevent the default behavior of the link
    setIsLoading(true);
    router.push(`/book-now/${venue.id}`);
  };
  // Fetch data from Hasura
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
              // Authorization: `Bearer ${parsedData.accessToken}`,
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
        console.log(data?.data);
        // setImage(data.data.venues[0].id);
        // console.log(data.data.venues[0].image_id);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [id]);

  const getImageSource = (id) => {
    switch (id) {
      case "063a2e3f-8365-40f3-8613-9613f6024d78":
        return "/cueLords.jpg";
      case "25d039e0-8a4d-49b1-ac06-5439c3af4a6f":
        return "/playturf.jpg";
      case "dfac7e28-16d2-45ff-93d9-add6a0a006e2":
        return "/bsa.jpg";
      case "d718a6cf-e982-42cf-b383-825134db21f6":
        return "/playerTown.jpg";
      case "cb9162ae-c5c2-44a9-ab6a-8c496f253a34":
        return "/playerTown.jpg";
      case "de83245f-6326-4373-9a54-d3137bd1a125":
        return "/lpg.jpg";
      case "36b6825d-ba31-4a8f-aa06-5dfd0ec71e8e":
        return "/lpg.jpg";
      case "9e0ebacb-1667-4e23-ac6e-628fe534b08b":
        return "/dugouti.jpg";
      case "e252f954-548c-4463-bbaf-e3323475fd6f":
        return "/gj.jpg";
      case "3f4c9df0-2a4e-48d3-a11e-c2083dc38f1d":
        return "/dbi.jpg";
      case "2775568b-4776-4f51-a0c0-6b24646624b4":
        return "/ppi.jpg";
      case "8e2ab06a-8d23-4fc5-858e-44118d3e0f28":
        return "/partyPolyin.jpg";
        case "562cb30c-f543-4f19-86fd-a424c4265091":
          return "/picklepro.jpg";
          case "0dbd3a09-30f4-4e34-b178-a6a7c4398255":
          return "/tt2.jpg";
      default:
        return "/playturf.jpg";
    }
  };

  const imageSource = getImageSource(venue?.id);

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!venue) return <p>Venue not found.</p>;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="bg-[#1a1b26] rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="relative h-96">
              <img
                src={imageSource}
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
                    {venue.open_at === "00:00:00" &&
                    venue.close_at === "00:00:00"
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
                        <span className="text-2xl mr-2">
                          {sportIcons[sport]}
                        </span>
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
