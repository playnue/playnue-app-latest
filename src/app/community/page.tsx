"use client";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { format } from "date-fns";
import CreateGameButton from "../components/CreateGameButton";
import { MdSportsEsports  } from "react-icons/md";
import { GiPodiumWinner  } from "react-icons/gi";
import { HiCalendar, HiLocationMarker, HiAdjustments } from "react-icons/hi";
import { motion } from "framer-motion";

const CommunityGames = () => {
  // Keep all the existing state declarations and functions
  const [games, setGames] = useState([]);
  const [localGames, setLocalGames] = useState([]);
  const [otherGames, setOtherGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [location, setLocation] = useState("Lucknow, Uttar Pradesh");
  const [locationError, setLocationError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const accessToken = useAccessToken();
  const userData = useUserData();
  const [coords, setCoords] = useState(null);
  const [filters, setFilters] = useState({
    sport: "",
    difficulty: "",
    location: "",
    date: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
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
  // Fetch location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      setLocationError("");

      // First try using browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCoords({ latitude, longitude });

            const locationData = await getLocationFromCoords(
              latitude,
              longitude
            );
            if (locationData) {
              setLocation(locationData.formattedLocation);
              // Update the location filter
              setFilters((prev) => ({
                ...prev,
                location: locationData.city || "",
              }));
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            fallbackToIpLocation();
          }
        );
      } else {
        fallbackToIpLocation();
      }
    };

    const fallbackToIpLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data.city && data.region && data.country_name) {
          setLocation(`${data.city}, ${data.region}, ${data.country_name}`);
          // Update the location filter
          setFilters((prev) => ({
            ...prev,
            location: data.city || "",
          }));
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
    setIsClient(true);
  }, []);

  // Fetch games using fetch API
  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: `
            query GetGames {
              games {
                id
                title
                description
                sport
                difficulty
                location
                date
                time
                seats
                user_id
                venue_id
              }
            }
          `,
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        throw new Error(errors[0].message);
      }

      // Process and set the games data
      const processedGames = data.games.map((game) => ({
        ...game,
        venue_name: game.venue?.title || "N/A",
        venue_location: game.venue?.location || game.location || "N/A",
      }));

      setGames(processedGames);

      // Get the current city
      const currentCity = location.split(",")[0].trim().toLowerCase();

      // Filter games by location
      const localGamesList = processedGames.filter(
        (game) =>
          game.venue_location.toLowerCase().includes(currentCity) ||
          game.location.toLowerCase().includes(currentCity)
      );

      const otherGamesList = processedGames.filter(
        (game) =>
          !game.venue_location.toLowerCase().includes(currentCity) &&
          !game.location.toLowerCase().includes(currentCity)
      );

      setLocalGames(localGamesList);
      setOtherGames(otherGamesList);
    } catch (error) {
      console.error("Error fetching games:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch games when location is set
  useEffect(() => {
    if (isClient) {
      fetchGames();
    }
  }, [isClient, location]);

  // Handle search and filters
  useEffect(() => {
    if (
      searchQuery ||
      filters.sport ||
      filters.difficulty ||
      filters.date ||
      filters.location
    ) {
      setIsSearching(true);

      // Start with all games
      let result = [...games];

      if (filters.sport) {
        result = result.filter((game) => game.sport === filters.sport);
      }

      if (filters.difficulty) {
        result = result.filter(
          (game) => game.difficulty === filters.difficulty
        );
      }

      if (filters.location) {
        result = result.filter(
          (game) =>
            game.location
              .toLowerCase()
              .includes(filters.location.toLowerCase()) ||
            game.venue_location
              ?.toLowerCase()
              .includes(filters.location.toLowerCase())
        );
      }

      if (filters.date) {
        result = result.filter((game) => game.date === filters.date);
      }

      // Apply search query if present
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        result = result.filter(
          (game) =>
            game.title.toLowerCase().includes(searchTerm) ||
            game.location.toLowerCase().includes(searchTerm) ||
            game.venue_location?.toLowerCase().includes(searchTerm) ||
            game.sport.toLowerCase().includes(searchTerm)
        );
      }

      setSearchResults(result);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, filters, games]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Loading state
  if (!isClient || loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="animate-pulse flex space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full"></div>
            <div className="w-12 h-12 bg-purple-400 rounded-full"></div>
            <div className="w-12 h-12 bg-purple-300 rounded-full"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8 bg-red-900/20 rounded-lg border border-red-500/50">
            <h2 className="text-red-400 text-xl mb-2">Error</h2>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </>
    );
  }

  const GameCard = ({ game }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl"
    >
       <div className="absolute top-4 right-4 z-20">
        <img 
          src="user.jpeg" 
          alt={game.sport} 
          className="w-16 h-16 rounded-full border-2 border-purple-500/50 object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
            {game.sport.toUpperCase()}
          </h3>
          
        </div>

        <p className="text-gray-300 mb-4 line-clamp-2">{game.description}</p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-300">
            <HiCalendar className="w-5 h-5 mr-2 text-purple-400" />
            {format(new Date(game.date), "MMM d, yyyy")}
          </div>
          <div className="flex items-center text-gray-300">
            <HiLocationMarker className="w-5 h-5 mr-2 text-purple-400" />
            {game.venue_name !== "N/A"
              ? `${game.venue_name}, ${game.venue_location}`
              : game.location}
          </div>
          <div className="flex items-center text-gray-300">
            <GiPodiumWinner   className="w-5 h-5 mr-2 text-purple-400" />
            <span className="capitalize">
              {game.difficulty === 1
                ? "Beginner"
                : game.difficulty === 2
                ? "Intermediate"
                : game.difficulty === 3
                ? "Advanced"
                : game.difficulty}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-purple-300">
            {game.seats} {game.seats === 1 ? "spot" : "spots"} left
          </span>
          <Link href={`/community-details/${game.id}`}>
            <button
              disabled={game.seats <= 0}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                game.seats > 0
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {game.seats > 0 ? "View Details" : "Full"}
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
  // Add this before the return statement
  const filteredLocalGames = localGames.filter((game) => {
    // Check if the game matches all selected filters
    const matchesSport =
      !filters.sport ||
      game.sport.toLowerCase() === filters.sport.toLowerCase();
    const matchesDifficulty =
      !filters.difficulty ||
      game.difficulty.toLowerCase() === filters.difficulty.toLowerCase();
    const matchesDate = !filters.date || game.date === filters.date;
    const matchesLocation =
      !filters.location ||
      game.location.toLowerCase().includes(filters.location.toLowerCase()) ||
      (game.venue_location &&
        game.venue_location
          .toLowerCase()
          .includes(filters.location.toLowerCase()));

    // Return true only if all applicable filters match
    return matchesSport && matchesDifficulty && matchesDate && matchesLocation;
  });
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover Sports Games Near You
            </h1>
            <p className="text-xl text-purple-300">
              Join community games in {location.split(",")[0]} and connect with
              fellow sports enthusiasts
            </p>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl shadow-2xl mb-8 border border-purple-500/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Sport Filter */}
              <div className="filter-group">
                <label className="text-purple-300 text-sm font-medium mb-2 block">
                  Sport Type
                </label>
                <select
                  name="sport"
                  value={filters.sport}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-800/90 border border-purple-500/30 text-white rounded-lg px-4 py-2.5 
        focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
        hover:border-purple-400 transition-all duration-300
        appearance-none cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  <option value="">All Sports</option>
                  <option value="football">Football</option>
                  <option value="basketball">Basketball</option>
                  <option value="tennis">Tennis</option>
                  <option value="cricket">Cricket</option>
                  <option value="hockey">Hockey</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="filter-group">
                <label className="text-purple-300 text-sm font-medium mb-2 block">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={filters.difficulty}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-800/90 border border-purple-500/30 text-white rounded-lg px-4 py-2.5 
        focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
        hover:border-purple-400 transition-all duration-300
        appearance-none cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  <option value="">Any Difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Location Filter */}
              <div className="filter-group">
                <label className="text-purple-300 text-sm font-medium mb-2 block">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Enter location"
                  className="w-full bg-gray-800/90 border border-purple-500/30 text-white rounded-lg px-4 py-2.5 
        focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
        hover:border-purple-400 transition-all duration-300
        placeholder-gray-400 shadow-lg shadow-purple-500/10"
                />
              </div>

              {/* Date Filter */}
              <div className="filter-group">
                <label className="text-purple-300 text-sm font-medium mb-2 block">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-800/90 border border-purple-500/30 text-white rounded-lg px-4 py-2.5 
        focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
        hover:border-purple-400 transition-all duration-300
        shadow-lg shadow-purple-500/10
        [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              {/* Search Input */}
              <div className="filter-group">
                <label className="text-purple-300 text-sm font-medium mb-2 block">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search games"
                  className="w-full bg-gray-800/90 border border-purple-500/30 text-white rounded-lg px-4 py-2.5 
        focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
        hover:border-purple-400 transition-all duration-300
        placeholder-gray-400 shadow-lg shadow-purple-500/10"
                />
              </div>
            </div>
          </motion.div>

          {/* Games Display Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isSearching ? (
              // Search Results
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Search Results ({searchResults.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>
            ) : (
              // Local Games
              <>
                {filteredLocalGames.length > 0 ? (
                  <div className="space-y-6 mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      Games Near You
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLocalGames.map((game) => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">
                      No games found in your area. Try adjusting your filters or
                      create a new game!
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
      <CreateGameButton />
    </>
  );
};

export default CommunityGames;
