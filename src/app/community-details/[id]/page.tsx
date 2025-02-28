"use client";
import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Trophy,
  MessageCircle,
  Home
} from "lucide-react";
import { useParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";

const GameDetails = () => {
  const params = useParams();
  const gameId = params?.id; // Extract the actual ID parameter
  const [game, setGame] = useState(null);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({
    params: params,
    gameId: null,
    responseData: null,
  });

  // Separate function to fetch game details
  const fetchGameDetails = async () => {
    setLoading(true);
    try {
      // Store the gameId for debugging
      setDebug((prev) => ({ ...prev, gameId }));

      // Query to fetch a specific game by ID (without venue details)
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetGame($gameId: uuid!) {
              games_by_pk(id: $gameId) {
                id
                title
                description
                sport
                difficulty
                location
                date
                time
                seats
                venue_id
              }
            }
          `,
          variables: {
            gameId: gameId,
          },
        }),
      });

      const responseData = await response.json();
      // Store response for debugging
      setDebug((prev) => ({ ...prev, responseData }));

      if (responseData.errors) {
        throw new Error(responseData.errors[0].message);
      }

      // Update to use the specific game from response
      if (responseData.data?.games_by_pk) {
        const gameData = responseData.data.games_by_pk;
        setGame(gameData);
        
        // If venue_id exists, call the venue fetch function
        if (gameData.venue_id) {
          fetchVenueDetails(gameData.venue_id);
        }
      } else {
        // Fallback to try getting all games if specific game not found
        const allGamesResponse = await fetch(
          process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
                  venue_id
                }
              }
            `,
            }),
          }
        );

        const allGamesData = await allGamesResponse.json();
        if (allGamesData.errors) {
          throw new Error(allGamesData.errors[0].message);
        }

        // Use the first game or null if empty
        if (allGamesData.data.games && allGamesData.data.games.length > 0) {
          const gameData = allGamesData.data.games[0];
          setGame(gameData);
          
          // If venue_id exists, call the venue fetch function
          if (gameData.venue_id) {
            fetchVenueDetails(gameData.venue_id);
          }
        } else {
          setGame(null);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated function to fetch venue details separately
  const fetchVenueDetails = async (venueId) => {
    if (!venueId) return;
    
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetVenue($venueId: uuid!) {
              venues_by_pk(id: $venueId) {
                id
                title
                location
              }
            }
          `,
          variables: {
            venueId: venueId,
          },
        }),
      });

      const responseData = await response.json();
      
      if (responseData.errors) {
        console.error("Error fetching venue:", responseData.errors);
        return;
      }

      if (responseData.data?.venues_by_pk) {
        setVenue(responseData.data.venues_by_pk);
      }
    } catch (error) {
      console.error("Failed to fetch venue details:", error);
    }
  };

  useEffect(() => {
    fetchGameDetails();
  }, [gameId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    try {
      const date = parseISO(dateString);
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const handleJoin = () => {
    // Implementation for joining the game
    alert(`You've joined the game: ${game?.title || "Unknown game"}`);
  };

  const handleSendQuery = () => {
    // Implementation for sending a query about the game
    alert(
      `Your query about "${
        game?.title || "this game"
      }" has been sent to the organizer`
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div id="preloader"></div>
      </div>
    );

  // Show detailed debug information if game data isn't loading correctly
  if (!game) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-gray-900">
        <Card className="max-w-lg w-full bg-gray-800 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-500">
              Game Details Not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              We couldn't retrieve the game details. This might be due to one of
              the following reasons:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>The game ID parameter is missing or incorrect</li>
              <li>The API endpoint is not responding</li>
              <li>The game might have been removed</li>
              <li>There's an issue with the GraphQL query</li>
            </ul>
            <div className="mt-4 p-4 bg-gray-700 rounded-md">
              <p className="font-semibold text-gray-300">Debug Information:</p>
              <p className="text-gray-300">URL Parameters: {JSON.stringify(debug.params)}</p>
              <p className="text-gray-300">Game ID: {debug.gameId || "Not available"}</p>
              <p className="text-gray-300">API Response: {debug.responseData ? "Received" : "None"}</p>
            </div>
            <div className="pt-4 flex justify-center">
              <Button
                onClick={fetchGameDetails}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Retry Loading
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-gray-900">
        <Card className="bg-red-50 border-gray-700 max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-xl font-semibold">{error}</p>
              <Button
                onClick={fetchGameDetails}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 min-h-screen bg-gray-900">
        <div className="flex justify-center items-center">
          <Card className="max-w-md w-full border border-gray-700 rounded-lg overflow-hidden shadow-md bg-gray-800">
            {/* Featured date and location banner at top */}
            <div className="bg-purple-800 text-white p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {formatDate(game.date)} at {game.time || "Time not specified"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">
                  {game.location || "Location not specified"}
                </span>
              </div>
            </div>

            <CardHeader className="space-y-3 pt-6">
              <div className="flex flex-col gap-2 items-center text-center">
                <CardTitle className="text-2xl font-bold text-white">
                  {game.title || "Untitled Game"}
                </CardTitle>
                {game.sport && (
                  <Badge className="text-sm capitalize bg-purple-800 text-purple-200 px-2 py-1 rounded">
                    {game.sport}
                  </Badge>
                )}
                {game.difficulty && (
                  <Badge variant="outline" className="text-sm capitalize mt-1 border-gray-600 text-gray-300">
                    {game.difficulty} Level
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-gray-400 text-base leading-relaxed text-center">
                {game.description || "No description available"}
              </p>

              <div className="grid grid-cols-1 gap-3 bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300">
                    {game.seats || "0"} {game.seats === 1 ? "spot" : "spots"} available
                  </span>
                </div>

                {game.difficulty && (
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300 capitalize">
                      {game.difficulty} difficulty
                    </span>
                  </div>
                )}
                
                {/* Display venue information */}
                {game.venue_id && (
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300">
                      Venue: {venue?.title || "Loading venue..."}
                    </span>
                  </div>
                )}
              </div>

              
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default GameDetails;