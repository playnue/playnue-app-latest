"use client";
import { Input } from "@/components/ui/input";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { nhost } from "../../lib/nhost"; // Adjust path to your Nhost client
import { useEffect, useState } from "react";
import { useGeolocated } from "react-geolocated";
import Navbar from "../components/Navbar";
import "../loader.css";
import { useAccessToken, useUserData } from "@nhost/nextjs";
export default function Bookings() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState("Lucknow, Uttar Pradesh");
  const [venues, setVenues] = useState([]);
  const [localVenues, setLocalVenues] = useState([]);
  const [otherVenues, setOtherVenues] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const accessToken = useAccessToken();
  const userData = useUserData();
  // Geolocation hook
  const { coords, isGeolocationAvailable, isGeolocationEnabled } =
    useGeolocated({
      positionOptions: {
        enableHighAccuracy: false,
      },
      userDecisionTimeout: 5000,
    });

  // Ensure component only renders on client

  // Fetch location details based on coordinates
  useEffect(() => {
    const fetchLocationWithBackup = async () => {
      const services = [
        "https://ipapi.co/json/",
        "https://ip-api.com/json/",
        "https://ipinfo.io/json",
      ];

      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl);
          const data = await response.json();

          const city = data.city || data.City || data.cityName;
          const state = data.region || data.regionName || data.region_name;
          const country = data.country_name || data.country || data.Country;

          if (city && state && country) {
            setLocation(`${city}, ${state}, ${country}`);
            break;
          }
        } catch (error) {
          console.error(`Location fetch failed for ${serviceUrl}`, error);
        }
      }
    };

    fetchLocationWithBackup();
  }, []);

  const getVenues = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token?.accessToken}`,
        },
        body: JSON.stringify({
          query: `
          query {
            venues {
              amenities
              close_at
              open_at
              sports
              title
              id
              location
              description
              user_id
              image_id
            }
          }
        `,
        }),
      }
    );

    const { data, errors } = await response.json();

    if (errors) {
      console.error("GraphQL Errors:", errors);
      return;
    }

    const fetchedVenues = data?.venues || [];
    const venuesWithImages = await Promise.all(
      fetchedVenues.map(async (venue) => {
        if (venue.image_id) {
          console.log("Fetching presigned URL for file:", venue.image_id);
          const url = nhost.storage.getPublicUrl({
            fileId: venue.image_id,
          });
          console.log("url: ", url);
          console.log("expiration: ", url);

          venue.imageUrl = url;
        }
        return venue;
      })
    );

    setVenues(venuesWithImages);

    const currentCity = location.split(",")[0].trim().toLowerCase();

    const localVenuesList = venuesWithImages.filter(
      (venue) => venue.location.toLowerCase() === currentCity
    );

    const otherVenuesList = venuesWithImages.filter(
      (venue) => venue.location.toLowerCase() !== currentCity
    );

    setLocalVenues(localVenuesList);
    setOtherVenues(otherVenuesList);
  };

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
    Pool: "🎱🥢",
  };

  useEffect(() => {
    // Fetch venues when component mounts, regardless of geolocation
    getVenues();
  }, []);
  const handleToggle = () => {
    setIsSearching((prev) => !prev);
  };

  const scrollToVenues = () => {
    const venueSection = document.getElementById("venues-section");
    if (venueSection) {
      venueSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Venue card rendering component

  const renderVenueCard = (item) => {
    // Function to get the correct image source based on item.id
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
        case "dfac7e28-16d2-45ff-93d9-add6a0a006e2":
          return "/playerTown.jpg";

        default:
          return null;
      }
    };

    const imageSource = getImageSource(item.id);

    return (
      <div
        key={item.id}
        className={`relative aspect-[4/3] rounded-xl overflow-hidden p-4 text-black shadow-lg transition-transform duration-300 ${
          hoveredItem === item?.id ? "scale-105" : "scale-100"
        }`}
        onMouseEnter={() => setHoveredItem(item?.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {imageSource ? (
          <img
            src={imageSource}
            alt={`${item.title}'s image`}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-xl font-bold text-gray-600">Coming Soon</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-4 flex flex-col justify-end">
          <p className="text-white text-lg font-bold">{item.title}</p>
          <p className="text-white text-sm">Rating: {item.rating} ⭐</p>
          <div className="text-white text-xl flex gap-2">
            {item.sports?.map((sport: string) => (
              <span key={sport}>{sportIcons[sport] || "❓"}</span>
            ))}
          </div>
          {hoveredItem === item.id && (
            <Link href={`/venue-details/${item.id}`}>
              <button className="mt-2 bg-green-500 text-white w-full py-1 rounded-lg shadow-md">
                Book Now
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  };

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

  // Render geolocation error states
  if (!isGeolocationAvailable) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          Your browser does not support Geolocation
        </div>
      </>
    );
  }

  // useEffect(() => {
  //   const preloader = document.getElementById("preloader");
  //   if (preloader) {
  //     preloader.style.opacity = "0"; // Fade out effect
  //     setTimeout(() => {
  //       preloader.style.display = "none"; // Hide preloader
  //     }, 600); // Matches CSS transition duration
  //   }
  // }, []);

  return (
    <>
      <Navbar />
      {/* <div id="preloader"></div> Add Preloader */}
      <SidebarInset>
        <header className="flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold text-black-600">
            PlayNue - Venues
          </h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Box: Welcome Message */}
            <div className="rounded-xl bg-green-600 p-6 text-white shadow-md">
              <h2 className="text-2xl font-semibold">
                Welcome to PlayNue in Lucknow!
              </h2>
              <p className="mt-4 text-sm">
                We are excited to launch our platform in the vibrant city of{" "}
                Lucknow. Explore top-rated sports venues and make your bookings
                with ease. Enjoy a hassle-free experience at the best locations!
              </p>
              <button
                onClick={scrollToVenues}
                className="mt-4 bg-white text-green-600 py-2 px-4 rounded-lg shadow-md hover:bg-gray-100"
              >
                Explore Venues Below
              </button>
            </div>

            {/* Second Box: City Info & Map */}
          </div>
          <div
            id="venues-section"
            className="min-h-[250vh] flex-1 rounded-xl bg-muted/50 md:min-h-min"
          >
            {/* Local Venues Section */}
            {localVenues.length > 0 && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {/* Venues in {location.split(",")[0]} */}
                </h2>
                <div className="grid auto-rows-min gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {localVenues.map(renderVenueCard)}
                </div>
              </div>
            )}

            {/* Other Venues Section */}
            {otherVenues.length > 0 && (
              <div className="p-6">
                {/* <h2 className="text-2xl font-bold mb-6">Other Venues</h2> */}
                <div className="grid auto-rows-min gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {otherVenues.map(renderVenueCard)}
                </div>
              </div>
            )}

            {/* No Venues Found */}
            {localVenues.length === 0 && otherVenues.length === 0 && (
              <div className="flex items-center justify-center min-h-screen">
                <div id="preloader"></div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
