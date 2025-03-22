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
const getLocationFromCoords = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    
    if (data.address) {
      const city = data.address.city || data.address.town || data.address.village;
      const state = data.address.state;
      const country = data.address.country;
      
      return {
        city,
        state,
        country,
        formattedLocation: `${city}, ${state}, ${country}`
      };
    }
    throw new Error("Unable to get location details");
  } catch (error) {
    console.error("Error getting location from coordinates:", error);
    return null;
  }
};
export default function Bookings() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState("Lucknow, Uttar Pradesh");
  const [venues, setVenues] = useState([]);
  const [localVenues, setLocalVenues] = useState([]);
  const [otherVenues, setOtherVenues] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationError, setLocationError] = useState("");
  const accessToken = useAccessToken();
  const [filteredVenues, setFilteredVenues] = useState([]);
  const userData = useUserData();
  // Geolocation hook
  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
      timeout: 5000,
    },
    userDecisionTimeout: 5000,
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    const detectLocation = async () => {
      setLocationError("");
      
      // First try using browser geolocation
      if (coords?.latitude && coords?.longitude) {
        const locationData = await getLocationFromCoords(coords.latitude, coords.longitude);
        if (locationData) {
          setLocation(locationData.formattedLocation);
          return;
        }
      }

      // Fall back to IP-based services
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data.city && data.region && data.country_name) {
          setLocation(`${data.city}, ${data.region}, ${data.country_name}`);
        } else {
          setLocationError("Unable to detect location automatically. Please enter your location.");
        }
      } catch (error) {
        setLocationError("Unable to detect location automatically. Please enter your location.");
      }
    };

    detectLocation();
  }, [coords]);

  // Ensure component only renders on client

  
  // Fetch location details based on coordinates

  

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
    LawnTennis: " 🎾 ",
    PS4: "🎮",
    Cricket_Net: "🏏",
  };

  useEffect(() => {
    if (!venues.length) return;

    const filterVenues = () => {
      const searchTerm = searchQuery.toLowerCase();
      const filtered = venues.filter(venue => {
        const venueLocation = venue.location.toLowerCase();
        const venueTitle = venue.title.toLowerCase();
        
        // Check if the search term matches location or title
        return venueLocation.includes(searchTerm) || 
               venueTitle.includes(searchTerm);
      });

      // Sort venues by relevance (exact matches first)
      filtered.sort((a, b) => {
        const aExactMatch = a.location.toLowerCase() === searchTerm;
        const bExactMatch = b.location.toLowerCase() === searchTerm;
        return bExactMatch - aExactMatch;
      });

      setFilteredVenues(filtered);
    };

    filterVenues();
  }, [searchQuery, venues]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const requestLocationPermission = () => {
    setLocationError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          console.log("Location permission granted");
        },
        error => {
          setLocationError("Please allow location access or enter your location manually.");
          console.error("Error getting location:", error);
        }
      );
    }
  };
  const handleToggle = () => {
    setIsSearching((prev) => !prev);
  };

  const scrollToVenues = () => {
    const venueSection = document.getElementById("venues-section");
    if (venueSection) {
      venueSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  const LocationButton = () => (
    <button 
      onClick={requestLocationPermission}
      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
    >
      Use My Current Location
    </button>
  );

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
        case "cb9162ae-c5c2-44a9-ab6a-8c496f253a34":
          return "/playerTown.jpg";
        case "de83245f-6326-4373-9a54-d3137bd1a125":
          return "/lpg.jpg";
        case "36b6825d-ba31-4a8f-aa06-5dfd0ec71e8e":
          return "/lpg.jpg";
        case "9e0ebacb-1667-4e23-ac6e-628fe534b08b":
          return "/dugouto.jpg";
        case "e252f954-548c-4463-bbaf-e3323475fd6f":
          return "/gj.jpg";
        case "3f4c9df0-2a4e-48d3-a11e-c2083dc38f1d":
          return "/dbo.jpg";
        case "2775568b-4776-4f51-a0c0-6b24646624b4":
          return "/ppo.jpg";
        case "8e2ab06a-8d23-4fc5-858e-44118d3e0f28":
          return "/partyPoly.jpg";
        case "562cb30c-f543-4f19-86fd-a424c4265091":
          return "/picklepro.jpg";
        case "0dbd3a09-30f4-4e34-b178-a6a7c4398255":
          return "/tt1.jpg";
        default:
          return "/comingSoon.jpeg";
      }
    };

    const imageSource = getImageSource(item.id);

    return (
      
      <div className="venue-card bg-[#1a1b26] rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
        {/* Image Section */}
        <div className="h-64 overflow-hidden">
          {imageSource ? (
            <img
              src={imageSource}
              alt={`${item.title}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <p className="text-xl font-bold text-gray-400">Coming Soon</p>
            </div>
          )}
        </div>

        {/* Compact Content Section */}
        <div className="venue-content p-4 transition-transform duration-300">
          {/* Title and Location */}
          <div className="mb-2">
            <h3 className="text-xl font-semibold text-white">{item.title}</h3>
            <div className="flex items-center text-sm text-gray-400">
              <span className="mr-1">📍</span>
              <span className="capitalize">{item.location}</span>
            </div>
          </div>

          {/* Timing - if available in API */}
          {item.open_at && item.close_at && (
            <div className="text-gray-400 text-xs mb-2">
              ⏰{" "}
              {item.open_at === "00:00:00" && item.close_at === "00:00:00"
                ? "24/7"
                : `${item.open_at} - ${item.close_at}`}
            </div>
          )}

          {/* Sports - if available in API */}
          {item.sports && item.sports.length > 0 && (
            <div className="flex gap-1 mb-3">
              {item.sports.map((sport) => (
                <span key={sport} className="text-lg" title={sport}>
                  {sportIcons[sport] || "❓"}
                </span>
              ))}
            </div>
          )}

          {/* Book Now Button */}
          <Link href={`/venue-details/${item.id}`}>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              Book Now
            </button>
          </Link>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    getVenues();
  }, [location]);

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
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Our <span className="text-purple-500">Venues</span>
            </h1>
            <p className="text-gray-400">
              Discover our premium locations perfect for your next match
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by city or venue name"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full bg-gray-800 text-white border-gray-700 rounded-lg pl-10 pr-4 py-2"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
              
              {locationError && (
                <p className="text-yellow-500 text-sm text-center">{locationError}</p>
              )}
              
              <button 
                onClick={requestLocationPermission}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
              >
                Use My Current Location
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(searchQuery ? filteredVenues : venues).map(renderVenueCard)}
          </div>

          {venues.length === 0 && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div id="preloader"></div>
            </div>
          )}

          {venues.length > 0 && (
            <div className="text-center mt-8">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                More Venues
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
