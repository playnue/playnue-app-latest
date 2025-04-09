"use client";
import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Trophy,
  MessageCircle,
  Home,
  Contact,
  ArrowLeft,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { motion } from "framer-motion";
import Link from "next/link";

const GameDetails = () => {
  const params = useParams();
  const [copySuccess, setCopySuccess] = useState(false);
  const router = useRouter();
  const gameId = params?.id;
  const [game, setGame] = useState(null);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({
    params: params,
    gameId: null,
    responseData: null,
  });

  const copyToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Hide the success message after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };
  
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
          console.log(gameData)
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


  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full"></div>
            <div className="w-12 h-12 bg-purple-400/20 rounded-full"></div>
            <div className="w-12 h-12 bg-purple-300/20 rounded-full"></div>
          </div>
        </div>
      </>
    );
  }

  if (!game) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full"
          >
            <Card className="bg-gray-800/50 backdrop-blur-lg border border-purple-500/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-purple-300">
                  Game Details Not Available
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  We couldn't retrieve the game details. This might be due to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                  <li>Invalid game ID</li>
                  <li>Connection issues</li>
                  <li>The game may have been removed</li>
                </ul>
                <div className="mt-6 flex space-x-4">
                  <Button
                    onClick={() => router.push('/community')}
                    className="bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Games
                  </Button>
                  <Button
                    onClick={fetchGameDetails}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Retry Loading
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            <Card className="bg-gray-800/50 backdrop-blur-lg border border-red-500/20 shadow-xl">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xl font-semibold text-red-400 mb-4">{error}</p>
                  <div className="flex space-x-4 justify-center">
                    <Button
                      onClick={() => router.push('/community')}
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Games
                    </Button>
                    <Button
                      onClick={fetchGameDetails}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link href="/community">
              <Button
                variant="ghost"
                className="text-purple-300 hover:text-purple-200 hover:bg-purple-900/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
              </Button>
            </Link>
          </motion.div>

          {/* Main content */}
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl w-full"
            >
              <Card className="bg-gray-800/50 backdrop-blur-lg border border-purple-500/20 shadow-xl overflow-hidden">
                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white p-8">
                  <h1 className="text-3xl font-bold text-center mb-4">
                    {game.sport.toUpperCase() || "Untitled Game"} Game
                  </h1>
                  <div className="flex flex-wrap justify-center gap-3">
                    {game.sport && (
                      <Badge className="bg-purple-600/50 text-purple-100 px-3 py-1">
                        {game.sport}
                      </Badge>
                    )}
                    {game.difficulty && (
                      <Badge variant="outline" className="border-purple-300/30 text-purple-100">
                        {game.difficulty === 1
                ? "Beginner"
                : game.difficulty === 2
                ? "Intermediate"
                : game.difficulty === 3
                ? "Advanced"
                : game.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Game Details */}
                  <div className="grid gap-4 bg-gray-700/30 p-6 rounded-xl border border-purple-500/10">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-200">
                        {formatDate(game.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-200">
                        {game.location || "Location not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Contact className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-200">
                        {game.title || "Location not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Timer className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-200">
                        {game.time.split('+')[0] || "Location not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-200">
                        {game.seats || "0"} {game.seats === 1 ? "spot" : "spots"} available
                      </span>
                    </div>
                    {venue && (
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-purple-400" />
                        <span className="text-gray-200">
                          Venue: {venue.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="bg-gray-700/20 p-6 rounded-xl border border-purple-500/10">
                    <h3 className="text-lg font-semibold text-purple-300 mb-3">
                      About this Game
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {game.description || "No description available"}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-center">
  <Button 
    onClick={copyToClipboard}
    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
  >
    {copySuccess ? (
      <>
        <Check className="w-4 h-4" />
        Copied!
      </>
    ) : (
      <>
        <Share className="w-4 h-4" />
        Share Game
      </>
    )}
  </Button>
</div>
                  {/* Action Buttons */}
                  {/* <div className="bg-yellow-500/10 p-6 rounded-xl border border-yellow-500/30 flex items-start space-x-4">
                    <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                        Responsibility Disclaimer
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        By participating in this game, you acknowledge that the host bears full responsibility for organizing and managing the event. Participants are required to exercise personal judgment, follow safety guidelines, and participate at their own risk. The platform serves merely as a facilitator and is not liable for any incidents or outcomes related to the game.
                      </p>
                    </div>
                  </div> */}
                </CardContent>
                
              </Card>
              
            </motion.div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default GameDetails;