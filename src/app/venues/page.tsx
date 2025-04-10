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
      const city =
        data.address.city || data.address.town || data.address.village;
      const state = data.address.state;
      const country = data.address.country;

      return {
        city,
        state,
        country,
        formattedLocation: `${city}, ${state}, ${country}`,
      };
    }
    throw new Error("Unable to get location details");
  } catch (error) {
    console.error("Error getting location from coordinates:", error);
    return null;
  }
};

export default function Bookings() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllVenues, setShowAllVenues] = useState(false);
  const [showAllSports, setShowAllSports] = useState(false);
  const [showFilterExplanation, setShowFilterExplanation] = useState(true);

  const [location, setLocation] = useState("Lucknow, Uttar Pradesh");
  const [venues, setVenues] = useState([]);
  const [featuredVenues, setFeaturedVenues] = useState([]);
  const [localVenues, setLocalVenues] = useState([]);
  const [otherVenues, setOtherVenues] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationError, setLocationError] = useState("");
  const [selectedSportCategory, setSelectedSportCategory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const accessToken = useAccessToken();
  const [filteredVenues, setFilteredVenues] = useState([]);
  const userData = useUserData();

  const requestedFeaturedIds = [
    "562cb30c-f543-4f19-86fd-a424c4265091", // PicklePro
    "cfde78ee-6686-475d-b343-1ca966023db7", // Lords Cricket
    "ae50b3c5-9129-45c6-8d59-6d1c90bf5f9b", // Sports Square
  ];

  // Sport categories for dropdown
  const sportCategories = [
    {
      id: 1,
      name: "Racket Sports",
      sports: ["Pickleball", "LawnTennis", "Badminton", "Tennis"],
    },
    {
      id: 2,
      name: "Team Sports",
      sports: ["Football", "Cricket", "Cricket_Net", "BoxCricket"],
    },
    {
      id: 3,
      name: "Indoor Games",
      sports: ["Snooker", "Pool", "PS4"],
    },
  ];

  // Geolocation hook
  const { coords, isGeolocationAvailable, isGeolocationEnabled } =
    useGeolocated({
      positionOptions: {
        enableHighAccuracy: true,
        timeout: 5000,
      },
      userDecisionTimeout: 5000,
    });

  // Loyalty points useEffect
  useEffect(() => {
    const addInitialLoyaltyPoints = async () => {
      // Only proceed if we have valid userData and accessToken
      if (userData && accessToken) {
        try {
          // Fetch current user data to check metadata
          const response = await fetch(
            process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "x-hasura-role": "user",
              },
              body: JSON.stringify({
                query: `
                query GetUser($id: uuid!) {
                  user(id: $id) {
                    metadata
                  }
                }
              `,
                variables: { id: userData.id },
              }),
            }
          );

          const { data, errors } = await response.json();

          if (errors) {
            console.error("GraphQL errors:", errors);
            return;
          }

          // Check if loyaltyPoints already exists in metadata
          const userMetadata = data?.user?.metadata || {};

          if (userMetadata.loyaltyPoints === undefined) {
            // If not, update the metadata with 50 loyalty points
            const updatedMetadata = {
              ...userMetadata,
              loyaltyPoints: 100,
            };

            // Update user metadata with GraphQL
            const updateResponse = await fetch(
              process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                  "x-hasura-role": "user",
                },
                body: JSON.stringify({
                  query: `
                  mutation UpdateUser($id: uuid!, $metadata: jsonb) {
                    updateUser(
                      pk_columns: { id: $id },
                      _set: { metadata: $metadata }
                    ) {
                      id
                      metadata
                    }
                  }
                `,
                  variables: {
                    id: userData.id,
                    metadata: updatedMetadata,
                  },
                }),
              }
            );

            const updateResult = await updateResponse.json();

            if (updateResult.errors) {
              console.error(
                "Error adding loyalty points:",
                updateResult.errors
              );
            } else {
              console.log("Successfully added 50 loyalty points for new user");
            }
          }
        } catch (error) {
          console.error("Failed to update user metadata:", error);
        }
      }
    };

    addInitialLoyaltyPoints();
  }, [userData, accessToken]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const detectLocation = async () => {
      setLocationError("");

      // First try using browser geolocation
      if (coords?.latitude && coords?.longitude) {
        const locationData = await getLocationFromCoords(
          coords.latitude,
          coords.longitude
        );
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
          setLocationError(
            "Unable to detect location automatically. Please enter your location."
          );
        }
      } catch (error) {
        setLocationError(
          "Unable to detect location automatically. Please enter your location."
        );
      }
    };

    detectLocation();
  }, [coords]);

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
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
              created_at
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
    const requestedFeaturedVenues = venuesWithImages.filter((venue) =>
      requestedFeaturedIds.includes(venue.id)
    );
    if (requestedFeaturedVenues.length === 3) {
      setFeaturedVenues(requestedFeaturedVenues);
    } else {
      // Fallback to original logic - 3 latest venues based on created_at
      const sortedVenues = [...venuesWithImages].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setFeaturedVenues(sortedVenues.slice(0, 3));
      console.log(
        "Not all requested featured venues found, using latest venues instead"
      );
    }

    const currentCity = location.split(",")[0].trim().toLowerCase();

    const localVenuesList = venuesWithImages.filter(
      (venue) => venue.location.toLowerCase() === currentCity
    );

    const otherVenuesList = venuesWithImages.filter(
      (venue) => venue.location.toLowerCase() !== currentCity
    );

    setLocalVenues(localVenuesList);
    setOtherVenues(otherVenuesList);

    // Reset filtered venues when venues change
    handleFilterBySportCategory(selectedSportCategory);
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
      const filtered = venues.filter((venue) => {
        const venueLocation = venue.location.toLowerCase();
        const venueTitle = venue.title.toLowerCase();

        // Check if the search term matches location or title
        return (
          venueLocation.includes(searchTerm) || venueTitle.includes(searchTerm)
        );
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
    setSelectedSportCategory(null); // Reset sport category filter when searching
  };

  // Handle filtering by sport category
  // This code should replace your existing handleFilterBySportCategory function

  // Modify the handleFilterBySportCategory function
  const handleFilterBySportCategory = (categoryId) => {
    setSelectedSportCategory(categoryId);
    setShowFilterExplanation(false); // Hide the explanation once any filter is applied

    if (!categoryId) {
      // Show all venues when "All Sports" is selected
      setFilteredVenues(venues);
      setShowAllVenues(true);
      setIsDropdownOpen(false); // Close the dropdown when "All Sports" is selected
      return;
    }

    const category = sportCategories.find((cat) => cat.id === categoryId);
    if (!category) {
      setFilteredVenues(venues);
      return;
    }

    const filtered = venues.filter((venue) => {
      if (!venue.sports || !venue.sports.length) return false;

      // Check if any sport in the venue matches any sport in the category
      return venue.sports.some((sport) => category.sports.includes(sport));
    });

    setFilteredVenues(filtered);
    setSearchQuery(""); // Clear search query when filtering by sport
    setIsDropdownOpen(false); // Close the dropdown after selection
    setShowAllVenues(false); // Hide the "all venues" section since we're showing filtered results
  };

  const requestLocationPermission = () => {
    setLocationError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted");
        },
        (error) => {
          setLocationError(
            "Please allow location access or enter your location manually."
          );
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
  const renderVenueCard = (item, isFeatured = false) => {
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
        case "8158e7e5-714e-4fb6-b7b9-0668a3180e04":
          return "/arcadia.webp";
        case "37d1eeb4-d8b6-4edd-a6db-fb3cb8b8457b":
          return "/infinity.jpg";
        case "ae50b3c5-9129-45c6-8d59-6d1c90bf5f9b":
          return "/sportsSquare.webp";
        case "cfde78ee-6686-475d-b343-1ca966023db7":
          return "/lordsCricket.webp";
        default:
          return "/comingSoon.jpeg";
      }
    };

    const imageSource = getImageSource(item.id);

    return (
      <div
        className={`venue-card bg-[#1a1b26] rounded-lg overflow-hidden shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${
          isFeatured ? "relative" : ""
        }`}
      >
        {/* Featured Badge - Smaller and more compact */}
        {isFeatured && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2 py-0.5 rounded-bl-lg z-10 font-medium text-xs">
            Featured
          </div>
        )}

        {/* Image Section - Further reduced height */}
        <div className="h-32 md:h-40 overflow-hidden">
          {imageSource ? (
            <img
              src={imageSource}
              alt={`${item.title}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <p className="text-sm font-bold text-gray-400">Coming Soon</p>
            </div>
          )}
        </div>

        {/* More Compact Content Section */}
        <div className="venue-content p-2">
          {/* Title and Location in more compact layout */}
          <div className="mb-1">
            <h3 className="text-base font-semibold text-white truncate">
              {item.title}
            </h3>
            <div className="flex items-center text-xs text-gray-400">
              <span className="mr-0.5">📍</span>
              <span className="capitalize truncate text-xs">
                {item.location}
              </span>
            </div>
          </div>

          {/* Sports icons - Smaller and more compact */}
          {item.sports && item.sports.length > 0 && (
            <div className="flex gap-0.5 mb-1.5">
              {item.sports.map((sport) => (
                <span key={sport} className="text-sm" title={sport}>
                  {sportIcons[sport] || "❓"}
                </span>
              ))}
            </div>
          )}

          {/* Smaller Book Now Button */}
          <Link href={`/venue-details/${item.id}`}>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-2 rounded text-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              Book Now
            </button>
          </Link>
        </div>
      </div>
    );
  };

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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          {/* Page Header with subtle animation */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 animate-fadeIn">
              Our <span className="text-purple-500">Venues</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover our premium locations perfect for your next match
            </p>
          </div>

          {/* Search & Filter Area */}
          <div className="max-w-4xl mx-auto mb-12 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Box */}
            <div className="w-full md:w-2/3 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search for venues..."
                className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
            </div>

            {/* Category Dropdown */}
            <div className="w-full md:w-1/3 relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-gray-800 text-white px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className="text-lg truncate">
                  {selectedSportCategory
                    ? sportCategories.find(
                        (cat) => cat.id === selectedSportCategory
                      )?.name
                    : "All Sports"}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isDropdownOpen ? "transform rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {isDropdownOpen && (
                <>
                  {/* Backdrop for closing dropdown when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                    aria-hidden="true"
                  ></div>

                  <div
                    className="absolute mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto"
                    role="listbox"
                  >
                    {/* "All Sports" option */}
                    {/* "All Sports" option */}
                    <div className="border-b border-gray-700">
                      <button
                        onClick={() => {
                          handleFilterBySportCategory(null); // Clear filter
                          setIsDropdownOpen(false); // Close dropdown
                        }}
                        className={`w-full text-left px-4 py-3 text-white hover:bg-gray-700 ${
                          !selectedSportCategory ? "bg-purple-800" : ""
                        }`}
                        role="option"
                        aria-selected={!selectedSportCategory}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">🏆</span>
                          All Sports
                        </span>
                      </button>
                    </div>

                    {/* Sport Categories */}
                    <div className="py-1">
                      {sportCategories.map((category) => (
                        <div
                          key={category.id}
                          className="border-t border-gray-700 first:border-t-0"
                        >
                          <button
                            onClick={() => {
                              handleFilterBySportCategory(category.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-white hover:bg-gray-700 flex items-center justify-between ${
                              selectedSportCategory === category.id
                                ? "bg-purple-800"
                                : ""
                            }`}
                            role="option"
                            aria-selected={
                              selectedSportCategory === category.id
                            }
                          >
                            <span>{category.name}</span>
                            <div className="flex space-x-1">
                              {category.sports.slice(0, 3).map((sport) => (
                                <span
                                  key={sport}
                                  title={sport}
                                  className="text-lg"
                                >
                                  {sportIcons[sport]}
                                </span>
                              ))}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Featured Venues Section - Vertical Layout */}
          {featuredVenues.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-6">
                <span className="text-purple-500 mr-2">⭐</span> Featured Venues
              </h2>

              <div className="flex flex-col space-y-4">
                {featuredVenues.map((venue) => (
                  <div key={venue.id} className="max-w-md mx-auto w-full">
                    {renderVenueCard(venue, true)}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Filter Explanation Section - Shown by default */}
          {showFilterExplanation && (
            <div className="mb-16">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">
                  <span className="text-purple-500 mr-2">🔍</span> Filter Venues
                  by Sport
                </h2>

                <p className="text-gray-300 mb-6">
                  Select a sport category from the dropdown above to find venues
                  that offer specific sports.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {sportCategories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <button
                        onClick={() => handleFilterBySportCategory(category.id)}
                        className="w-full h-full p-4 text-left"
                      >
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {category.name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {category.sports.slice(0, 3).map((sport) => (
                            <span key={sport} className="text-lg" title={sport}>
                              {sportIcons[sport] || "❓"}
                            </span>
                          ))}
                          {category.sports.length > 3 && (
                            <span className="text-sm text-gray-400">
                              +{category.sports.length - 3} more
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      handleFilterBySportCategory(null);
                      setIsDropdownOpen(false);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    View All Venues
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Category Venues Section - Improved with sorting options */}
          {selectedSportCategory && (
            <div id="category-venues-section" className="mb-16 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">
                  {
                    sportCategories.find(
                      (cat) => cat.id === selectedSportCategory
                    )?.name
                  }{" "}
                  Venues
                </h2>

                {/* Sort options */}
              </div>

              {filteredVenues.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredVenues.map((venue) => renderVenueCard(venue))}
                  </div>

                  {/* Results summary */}
                  <div className="mt-6 text-center text-gray-400">
                    Showing {filteredVenues.length}{" "}
                    {filteredVenues.length === 1 ? "venue" : "venues"} in this
                    category
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-800 rounded-lg shadow-lg">
                  <svg
                    className="w-16 h-16 mb-4 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <p className="text-xl font-semibold">
                    No venues found in this category
                  </p>
                  <p className="mt-2 mb-6">
                    Please try selecting a different category
                  </p>
                  <button
                    onClick={() => handleFilterBySportCategory(null)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      ></path>
                    </svg>
                    Show All Venues
                  </button>
                </div>
              )}
            </div>
          )}

          {/* All Venues Section with improved toggle interaction */}
          {!selectedSportCategory && (
            <div className="mt-12">
              {!showAllVenues ? (
                <div className="text-center">
                  <p className="text-gray-400 mb-6">
                    Want to explore all our venues at once?
                  </p>
                  <button
                    onClick={() => setShowAllVenues(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center mx-auto"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      ></path>
                    </svg>
                    View All Venues
                  </button>
                </div>
              ) : (
                <div id="all-venues-section" className="animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">
                      All Available Venues
                    </h2>

                    {/* Filter & Sort Area */}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {venues.map((venue) => renderVenueCard(venue))}
                  </div>

                  {/* Improved Load More UI */}
                  {venues.length > 0 && (
                    <div className="flex flex-col items-center mt-12 space-y-4">
                      <p className="text-gray-400">
                        Showing {venues.length} of {venues.length} venues
                      </p>
                      <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                        Load More Venues
                      </button>

                      {/* Hide all venues button */}
                      <button
                        onClick={() => setShowAllVenues(false)}
                        className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center text-sm"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 15l7-7 7 7"
                          ></path>
                        </svg>
                        Collapse View
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
