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
  Cricket_Net:"🏏"
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
        setImage(data.data.venues[0].id);
        console.log(data.data.venues[0].image_id);
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
      default:
        return null;
    }
  };

  const imageSource = getImageSource(image);

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
            <button
              onClick={handleButtonClick}
              disabled={isLoading} // Disable button during loading
              className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed" // Disabled style
                  : "bg-green-500 text-white" // Normal style
              }`}
            >
              {isLoading ? (
                <div className="loader w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Book Now"
              )}
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative mb-8">
          <div className="relative h-60 overflow-hidden rounded-lg">
            <img
              src={imageSource}
              alt={`Venue image ${currentImage + 1}`}
              className="w-full h-full object-cover"
            />
            {/* <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
              onClick={() =>
                setCurrentImage(
                  (prev) => (prev + 1) % venue.extra_image_ids.length
                )
              }
            >
              <ChevronRight className="w-6 h-6" />
            </button> */}
          </div>
          <div className="flex justify-center gap-2 mt-2">
            {venue?.extra_image_ids?.map((_, idx) => (
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
                {venue.open_at === "00:00:00" && venue.close_at === "00:00:00"
                  ? "24/7"
                  : `${venue.open_at} - ${venue.close_at}`}
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
            <Card className="p-4">
              <Link
                href={`https://google.com/maps/search/?api=1&query=${venue.location}`}
              >
                <h2 className="text-lg font-semibold mb-2">Map</h2>
              </Link>
            </Card>
          </div>

          {/* Map Location */}
          {/* <div>
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
          </div> */}
        </div>
      </div>
    </>
  );
};

export default VenuePage;
