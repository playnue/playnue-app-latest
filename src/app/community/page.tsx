"use client";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { format } from "date-fns";
import CreateGameButton from "../components/CreateGameButton";
import { MdSportsEsports } from "react-icons/md";
import { GiPodiumWinner } from "react-icons/gi";
import { HiCalendar, HiLocationMarker, HiAdjustments, HiStar, HiCheck, HiPlay, HiClock } from "react-icons/hi";
import { motion } from "framer-motion";

const CommunityGames = () => {
  // Keep all the existing state declarations and functions
  const [games, setGames] = useState([]);
  const [localGames, setLocalGames] = useState([]);
  const [otherGames, setOtherGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [pastGames, setPastGames] = useState([]);
  const [ongoingGames, setOngoingGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [showStatus, setShowStatus] = useState("upcoming");
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
    date:"", // Today's date in YYYY-MM-DD format
    status: "upcoming" // Default to show upcoming games
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

  // Function to determine game status
  const getGameStatus = (gameDate, gameTime) => {
    const now = new Date();
    
    // Clean the time string by removing the timezone part if it exists
    const cleanTime = gameTime ? gameTime.replace(/([+-]\d{2})$/, '') : '00:00:00';
    
    // Create a proper date string
    const dateTimeString = `${gameDate}T${cleanTime}`;
    
    // Parse the date
    const gameDateTime = new Date(dateTimeString);
    
    // Assume a game lasts 2 hours
    const gameEndTime = new Date(gameDateTime);
    gameEndTime.setHours(gameEndTime.getHours() + 2);
    
    if (now < gameDateTime) {
      return "upcoming";
    } else if (now >= gameDateTime && now <= gameEndTime) {
      return "ongoing";
    } else {
      return "past";
    }
  };

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
  
      // Get all unique venue IDs
      const venueIds = [...new Set(data.games
        .filter(game => game.venue_id)
        .map(game => game.venue_id))];
      
      // If we have venue IDs, fetch venue data
      let venuesData = {};
      if (venueIds.length > 0) {
        venuesData = await fetchVenuesData(venueIds);
      }
  
      // Process and set the games data
      const processedGames = data.games.map((game) => {
        const venueInfo = game.venue_id ? venuesData[game.venue_id] : null;
        
        return {
          ...game,
          venue_name: venueInfo?.title || "N/A",
          venue_location: venueInfo?.location || game.location || "N/A",
          status: getGameStatus(game.date, game.time)
        };
      });
  
      setGames(processedGames);
      
      // Categorize games by status
      const pastGamesArray = processedGames.filter(game => game.status === "past");
      const ongoingGamesArray = processedGames.filter(game => game.status === "ongoing");
      const upcomingGamesArray = processedGames.filter(game => game.status === "upcoming");
      
      setPastGames(pastGamesArray);
      setOngoingGames(ongoingGamesArray);
      setUpcomingGames(upcomingGamesArray);
      
      const uniqueLocations = getAllUniqueLocations(processedGames);
      setAvailableLocations(uniqueLocations);
      
      // Continue with your existing code for filtering local and other games
      const currentCity = location.split(",")[0].trim().toLowerCase();
      
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
  
  // Add this new function to fetch venues data
  const fetchVenuesData = async (venueIds) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetVenues($ids: [uuid!]) {
              venues(where: {id: {_in: $ids}}) {
                id
                title
                location
              }
            }
          `,
          variables: {
            ids: venueIds
          }
        }),
      });
  
      const { data, errors } = await response.json();
  
      if (errors) {
        console.error("GraphQL errors when fetching venues:", errors);
        return {};
      }
  
      // Create a mapping of venue ID to venue data
      const venuesMap = {};
      data.venues.forEach(venue => {
        venuesMap[venue.id] = venue;
      });
  
      return venuesMap;
    } catch (error) {
      console.error("Error fetching venues:", error);
      return {};
    }
  };

  const getAllUniqueLocations = (gamesData) => {
    // Get all locations (both venue_location and direct location)
    const allLocations = gamesData.flatMap((game) => {
      const locations = [];
      if (game.location) locations.push(game.location);
      if (game.venue_location && game.venue_location !== game.location)
        locations.push(game.venue_location);
      return locations;
    });

    // Filter out duplicates and empty values
    const uniqueLocations = [...new Set(allLocations)]
      .filter((location) => location && location !== "N/A")
      .sort();

    return uniqueLocations;
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
      filters.location ||
      filters.status
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
      
      if (filters.status) {
        result = result.filter((game) => game.status === filters.status);
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
  
  // Handle status filter change
  const handleStatusChange = (status) => {
    setShowStatus(status);
    setFilters((prev) => ({
      ...prev,
      status: status
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

  const GameCard = ({ game }) => {
    // Status badge configuration based on game status
    const statusConfig = {
      upcoming: {
        bgColor: "bg-gradient-to-r from-blue-600 to-blue-400",
        textColor: "text-white",
        icon: <HiClock className="w-3.5 h-3.5 mr-1" />,
        text: "Upcoming"
      },
      ongoing: {
        bgColor: "bg-gradient-to-r from-green-600 to-green-400",
        textColor: "text-white",
        icon: <HiPlay className="w-3.5 h-3.5 mr-1" />,
        text: "Ongoing"
      },
      past: {
        bgColor: "bg-gradient-to-r from-gray-600 to-gray-400",
        textColor: "text-white",
        icon: <HiCheck className="w-3.5 h-3.5 mr-1" />,
        text: "Past"
      }
    };
    
    const { bgColor, textColor, icon, text } = statusConfig[game.status];
    
    // Calculate difficulty stars
    const difficultyStars = () => {
      const stars = [];
      for (let i = 0; i < game.difficulty; i++) {
        stars.push(<HiStar key={i} className="w-4 h-4 text-yellow-400" />);
      }
      for (let i = game.difficulty; i < 3; i++) {
        stars.push(<HiStar key={i + 3} className="w-4 h-4 text-gray-600" />);
      }
      return stars;
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -5 }}
        className="group relative bg-gray-900/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-700/50 hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/20"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="p-6 relative z-10">
          {/* Header section with Sport name, User icon and Status Badge */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                {game.sport.toUpperCase()}
              </h3>
              
              {/* Status Badge - Moved inside the header section */}
              <div className={`${bgColor} ${textColor} text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg mt-2 self-start`}>
                {icon}
                {text}
              </div>
            </div>
            
            {/* Sport icon - Moved inside the header section */}
            <div className="relative">
              <img
                src="user.jpeg"
                alt={game.sport}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-500/70 ring-offset-2 ring-offset-gray-900 group-hover:scale-110 transition-all duration-300 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center bg-purple-600 text-white text-xs font-bold rounded-full border-2 border-gray-900">
                {game.players_joined}
              </span>
            </div>
          </div>
  
          <p className="text-gray-300 mb-5 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
  
          <div className="space-y-3.5 mb-6">
            <div className="flex items-center text-gray-200 group-hover:text-gray-100 transition-colors">
              <HiCalendar className="w-5 h-5 mr-3 text-purple-400 group-hover:text-purple-300" />
              <span>{format(new Date(game.date), "EEEE, MMM d, yyyy • h:mm a")}</span>
            </div>
            
            <div className="flex items-center text-gray-200 group-hover:text-gray-100 transition-colors">
              <HiLocationMarker className="w-5 h-5 mr-3 text-purple-400 group-hover:text-purple-300" />
              <span>
                {game.venue_name !== "N/A"
                  ? `${game.venue_name}`
                  : game.location}
              </span>
            </div>
            
            <div className="flex items-center text-gray-200 group-hover:text-gray-100 transition-colors">
              <GiPodiumWinner className="w-5 h-5 mr-3 text-purple-400 group-hover:text-purple-300" />
              <span className="flex items-center">
                <span className="mr-2 capitalize">
                  {game.difficulty === 1
                    ? "Beginner"
                    : game.difficulty === 2
                    ? "Intermediate"
                    : game.difficulty === 3
                    ? "Advanced"
                    : game.difficulty}
                </span>
                <span className="flex">{difficultyStars()}</span>
              </span>
            </div>
          </div>
  
          <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Available Spots</span>
              <span className="text-lg font-semibold text-purple-300">
                {game.seats} <span className="text-sm">{game.seats === 1 ? "spot" : "spots"}</span>
              </span>
            </div>
            
            <Link href={`/community-details/${game.id}`}>
              <button
                disabled={game.seats <= 0}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 
                  ${game.seats > 0
                    ? "bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-lg hover:shadow-purple-500/30 hover:translate-y-[-2px]"
                    : "bg-gray-800 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {game.seats > 0 ? "View Details" : "Full"}
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };
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
    const matchesStatus = !filters.status || game.status === filters.status;

    // Return true only if all applicable filters match
    return matchesSport && matchesDifficulty && matchesDate && matchesLocation && matchesStatus;
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
              Join Community Games in {location.split(",")[0]} and Connect with
              Fellow Sports Enthusiasts
            </p>
          </motion.div>

          {/* Status Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex justify-center space-x-2 md:space-x-4">
              <button
                onClick={() => handleStatusChange("upcoming")}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 ${
                  showStatus === "upcoming"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Upcoming Games
              </button>
              <button
                onClick={() => handleStatusChange("ongoing")}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 ${
                  showStatus === "ongoing"
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Ongoing Games
              </button>
              <button
                onClick={() => handleStatusChange("past")}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 ${
                  showStatus === "past"
                    ? "bg-gray-500 text-white shadow-lg shadow-gray-500/25"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Past Games
              </button>
            </div>
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
                <select
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-800/90 border border-purple-500/30 text-white rounded-lg px-4 py-2.5 
    focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
    hover:border-purple-400 transition-all duration-300
    appearance-none cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  <option value="">All Locations</option>
                  {availableLocations.map((location, index) => (
                    <option key={index} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
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
                      {showStatus === "upcoming" ? "Upcoming" : showStatus === "ongoing" ? "Ongoing" : "Past"} Games Near You
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
                      No {showStatus} games found in your area. Try adjusting your filters or
                      {showStatus === "upcoming" ? " create a new game!" : ""}
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