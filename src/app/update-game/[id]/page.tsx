"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import Link from "next/link";

const UpdateGame = () => {
  const params = useParams();
  const gameId = params?.id;
  const router = useRouter();
  const accessToken = useAccessToken();
  const userData = useUserData();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [game, setGame] = useState(null);
  const [venue, setVenue] = useState({});
  // Form state - only tracking seats and description
  const [formData, setFormData] = useState({
    seats: 1,
    title:"",
    description: "",
    date:"",
  });

  // Fetch game data on component mount
  useEffect(() => {
    if (userData?.id && accessToken && gameId) {
      fetchGameDetails();
    }
  }, [userData, accessToken, gameId]);

  // Function to fetch game details
  const fetchGameDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role": "user",
        },
        body: JSON.stringify({
          query: `
            query GetGameDetails($gameId: uuid!) {
              games_by_pk(id: $gameId) {
                id
                title
                sport
                difficulty
                location
                date
                seats
                description
                venue_id
                user_id
              }
            }
          `,
          variables: {
            gameId,
          },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(errors[0].message);
      }

      const gameData = data.games_by_pk;

      // Check if the game exists and belongs to the current user
      if (!gameData) {
        throw new Error("Game not found");
      }
      if (gameData.venue_id) {
        fetchVenueDetails(gameData.venue_id);
      }
      if (gameData.user_id !== userData.id) {
        throw new Error("You don't have permission to edit this game");
      }

      // Set game data
      setGame(gameData);
      // Only set seats and description in form data
      setFormData({
        seats: gameData.seats || 1,
        title:gameData.title || "",
        description: gameData.description || "",
        date:gameData.date || ""
      });
    } catch (error) {
      console.error("Error fetching game details:", error);
      setError(error.message || "Failed to load game details");
    } finally {
      setLoading(false);
    }
  };

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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "seats" ? parseInt(value, 10) : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role": "user",
        },
        body: JSON.stringify({
          query: `
            mutation UpdateGame(
              $gameId: uuid!,
              $seats: Int!,
              $title: String!,
              $date: date!,
              $description: String
            ) {
              update_games_by_pk(
                pk_columns: { id: $gameId },
                _set: {
                  seats: $seats,
                  title:$title,
                  date:$date,
                  description: $description
                }
              ) {
                id
                title
              }
            }
          `,
          variables: {
            gameId,
            seats: formData.seats,
            title: formData.title,
            date:formData.date,
            description: formData.description,
          },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(errors[0].message);
      }

      setSuccess(true);

      // Redirect after short delay to show success message
      setTimeout(() => {
        router.push("/my-games");
      }, 1500);
    } catch (error) {
      console.error("Error updating game:", error);
      setError(error.message || "Failed to update game. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle game deletion
  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this game? This action cannot be undone."
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role": "user",
        },
        body: JSON.stringify({
          query: `
            mutation DeleteGame($gameId: uuid!) {
              delete_games_by_pk(id: $gameId) {
                id
              }
            }
          `,
          variables: {
            gameId,
          },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Redirect back to my games
      router.push("/my-games");
    } catch (error) {
      console.error("Error deleting game:", error);
      setError(error.message || "Failed to delete game. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-gray-700 rounded mb-8"></div>
            <div className="h-6 w-full bg-gray-800 rounded"></div>
            <div className="h-6 w-3/4 bg-gray-800 rounded"></div>
            <div className="h-32 w-full bg-gray-800 rounded"></div>
            <div className="h-6 w-2/4 bg-gray-800 rounded"></div>
            <div className="h-6 w-2/4 bg-gray-800 rounded"></div>
            <div className="h-10 w-full bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-red-100 p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="mb-4">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => router.back()}
              className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
            >
              Go Back
            </button>
            <Link
              href="/my-games"
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              My Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center">
          <Link
            href="/my-games"
            className="flex items-center text-gray-400 hover:text-purple-400 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to My Games
          </Link>
        </div>

        {/* Venue Box at the top */}
        {venue && venue.title && (
  <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-lg shadow-md border border-gray-700 overflow-hidden mb-4 transition-all duration-200">
    <div className="p-4 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-bold text-white">{venue.title}</h3>
        {venue.location && (
          <div className="flex items-center text-gray-300 text-xs mt-1">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 mr-1 text-indigo-300" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{venue.location}</span>
            <Link href="/venues">
              <span className="ml-2 text-indigo-300 hover:text-white underline underline-offset-2 text-xs">
                Change
              </span>
            </Link>
          </div>
        )}
      </div>
      
      <Link href={`/book-now/${venue.id}`}>
        <button className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-medium rounded-md shadow-sm">
          Book Now
        </button>
      </Link>
    </div>
  </div>
)}

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-gray-700">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Update Game
            </h2>
            <p className="mt-1 text-gray-400">
              Update the number of players and game instructions.
            </p>
          </div>

          {success && (
            <div className="m-6 bg-gradient-to-r from-green-900 to-green-800 text-green-100 p-4 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p>Game updated successfully! Redirecting...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="seats"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Players
                </label>
                <input
                  type="number"
                  id="seats"
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Number of players"
                />
              </div>
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Contact Details"
                />
              </div>
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Contact Details
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Contact Details"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Instructions
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Game instructions and details"
                ></textarea>
              </div>
              
            </div>

            {error && (
              <div className="bg-red-900 text-red-200 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Buttons in a row */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Delete
              </button>

              <Link
                href="/my-games"
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateGame;