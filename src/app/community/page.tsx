"use client"
import { useAccessToken, useUserData } from "@nhost/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { format } from "date-fns";
import CreateGameButton from "../components/CreateGameButton";

const CommunityGames = () => {
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
    if (searchQuery || filters.sport || filters.difficulty || filters.date || filters.location) {
      setIsSearching(true);
      
      // Start with all games
      let result = [...games];
      
      if (filters.sport) {
        result = result.filter((game) => game.sport === filters.sport);
      }
      
      if (filters.difficulty) {
        result = result.filter((game) => game.difficulty === filters.difficulty);
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
  if (!isClient || loading)
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div id="preloader"></div>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Navbar />
        <div className="text-center py-8 text-red-500">Error: {error}</div>
      </>
    );

  // Filter local games based on user filters
  const filteredLocalGames = localGames.filter((game) => {
    return (
      (!filters.sport || game.sport === filters.sport) &&
      (!filters.difficulty || game.difficulty === filters.difficulty) &&
      (!filters.date || game.date === filters.date)
    );
  });

  return (
    <>
      <Navbar />
      <div className="flex justify-center bg-gray-900 min-h-screen">
        <div className="container max-w-6xl mx-auto p-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              Find Community Games
            </h1>
            <p className="text-gray-400 mt-2">
              Discover games near {location.split(",")[0]}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 p-4 rounded-lg mb-6 overflow-x-auto max-w-4xl mx-auto">
            <div className="flex flex-row space-x-4 min-w-max justify-center">
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sport
                </label>
                <select
                  name="sport"
                  value={filters.sport}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                >
                  <option value="">All Sports</option>
                  <option value="football">Football</option>
                  <option value="basketball">Basketball</option>
                  <option value="tennis">Tennis</option>
                  <option value="cricket">Cricket</option>
                  <option value="hockey">Hockey</option>
                </select>
              </div>

              <div className="w-48">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={filters.difficulty}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                >
                  <option value="">Any Difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="w-48">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Enter location"
                  className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                />
              </div>

              <div className="w-48">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                />
              </div>
              
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search games"
                  className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                />
              </div>
            </div>
          </div>

          {/* SEARCH RESULTS SECTION */}
          {isSearching ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-4 text-center">
                Search Results
              </h2>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                  {searchResults.map((game) => (
                    <div
                      key={game.id}
                      className="border border-gray-700 rounded-lg overflow-hidden shadow-md bg-gray-800 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full max-w-sm"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h2 className="text-xl font-semibold text-white">
                            {game.title}
                          </h2>
                          <span className="bg-purple-800 text-purple-200 text-xs px-2 py-1 rounded">
                            {game.sport}
                          </span>
                        </div>

                        <p className="text-gray-400 mb-4 text-sm">
                          {game.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="text-sm text-gray-300">
                            <span className="font-medium">Date: </span>
                            {format(new Date(game.date), "MMM d, yyyy")}
                          </div>

                          <div className="text-sm text-gray-300">
                            <span className="font-medium">Location: </span>
                            {game.venue_name !== "N/A"
                              ? `${game.venue_name}, ${game.venue_location}`
                              : game.location}
                          </div>
                          <div className="text-sm text-gray-300">
                            <span className="font-medium">Difficulty: </span>
                            <span className="capitalize">{game.difficulty}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium text-gray-300">
                            {game.seats} {game.seats === 1 ? "spot" : "spots"}{" "}
                            left
                          </div>
                          <Link href={`/community-details/${game.id}`}>
                            <button
                              disabled={game.seats <= 0}
                              className={`px-4 py-2 rounded ${
                                game.seats > 0
                                  ? "bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300"
                                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {game.seats > 0 ? "Join Game" : "Full"}
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-800 rounded-lg mb-8">
                  <p className="text-gray-400">
                    No games found matching your search criteria.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* LOCAL GAMES SECTION - Only shown if there are local games and not searching */}
              {filteredLocalGames.length > 0 ? (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4 text-center">
                    Games Near You
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                    {filteredLocalGames.map((game) => (
                      <div
                        key={game.id}
                        className="border border-gray-700 rounded-lg overflow-hidden shadow-md bg-gray-800 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full max-w-sm"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-semibold text-white">
                              {game.title}
                            </h2>
                            <span className="bg-purple-800 text-purple-200 text-xs px-2 py-1 rounded">
                              {game.sport}
                            </span>
                          </div>

                          <p className="text-gray-400 mb-4 text-sm">
                            {game.description}
                          </p>

                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="text-sm text-gray-300">
                              <span className="font-medium">Date: </span>
                              {format(new Date(game.date), "MMM d, yyyy")}
                            </div>

                            <div className="text-sm text-gray-300">
                              <span className="font-medium">Location: </span>
                              {game.venue_name !== "N/A"
                                ? `${game.venue_name}, ${game.venue_location}`
                                : game.location}
                            </div>
                            <div className="text-sm text-gray-300">
                              <span className="font-medium">Difficulty: </span>
                              <span className="capitalize">{game.difficulty}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-gray-300">
                              {game.seats} {game.seats === 1 ? "spot" : "spots"}{" "}
                              left
                            </div>
                            <Link href={`/community-details/${game.id}`}>
                              <button
                                disabled={game.seats <= 0}
                                className={`px-4 py-2 rounded ${
                                  game.seats > 0
                                    ? "bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                {game.seats > 0 ? "Join Game" : "Full"}
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-8 text-center py-4 bg-gray-800 rounded-lg">
                  <p className="text-gray-400">
                    No games found near {location.split(",")[0]}.
                  </p>
                  
                  {/* Only show other games section if there are no local games */}
                  {otherGames.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-semibold text-white mb-4">
                        Other Available Games
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                        {otherGames
                          .filter((game) => {
                            return (
                              (!filters.sport || game.sport === filters.sport) &&
                              (!filters.difficulty || game.difficulty === filters.difficulty) &&
                              (!filters.date || game.date === filters.date)
                            );
                          })
                          .map((game) => (
                            <div
                              key={game.id}
                              className="border border-gray-700 rounded-lg overflow-hidden shadow-md bg-gray-800 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full max-w-sm"
                            >
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h2 className="text-xl font-semibold text-white">
                                    {game.title}
                                  </h2>
                                  <span className="bg-purple-800 text-purple-200 text-xs px-2 py-1 rounded">
                                    {game.sport}
                                  </span>
                                </div>

                                <p className="text-gray-400 mb-4 text-sm">
                                  {game.description}
                                </p>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                  <div className="text-sm text-gray-300">
                                    <span className="font-medium">Date: </span>
                                    {format(new Date(game.date), "MMM d, yyyy")}
                                  </div>

                                  <div className="text-sm text-gray-300">
                                    <span className="font-medium">Location: </span>
                                    {game.venue_name !== "N/A"
                                      ? `${game.venue_name}, ${game.venue_location}`
                                      : game.location}
                                  </div>
                                  <div className="text-sm text-gray-300">
                                    <span className="font-medium">Difficulty: </span>
                                    <span className="capitalize">{game.difficulty}</span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <div className="text-sm font-medium text-gray-300">
                                    {game.seats} {game.seats === 1 ? "spot" : "spots"}{" "}
                                    left
                                  </div>
                                  <Link href={`/community-details/${game.id}`}>
                                    <button
                                      disabled={game.seats <= 0}
                                      className={`px-4 py-2 rounded ${
                                        game.seats > 0
                                          ? "bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300"
                                          : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                      }`}
                                    >
                                      {game.seats > 0 ? "Join Game" : "Full"}
                                    </button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <CreateGameButton/>
    </>
  );
};


export default CommunityGames;