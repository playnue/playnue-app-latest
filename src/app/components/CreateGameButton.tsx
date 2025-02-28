"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccessToken, useUserData } from "@nhost/nextjs";

const CreateGameButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(1);
  const [contactType, setContactType] = useState('none');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // New state for venues
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState('');
  const [loadingVenues, setLoadingVenues] = useState(false);
  
  const accessToken = useAccessToken();
  const userData = useUserData();
  const router = useRouter();

  // Fetch venues when the modal opens
  useEffect(() => {
    if (showModal) {
      fetchVenues();
    }
  }, [showModal, accessToken]);

  // Function to fetch venues
  const fetchVenues = async () => {
    if (!accessToken) return;
    
    setLoadingVenues(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetVenues {
              venues {
                id
                title
              }
            }
          `
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(errors[0].message);
      }

      setVenues(data.venues || []);
    } catch (error) {
      console.error("Error fetching venues:", error);
      setError(error.message || "Failed to load venues. Please try again.");
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Check if user is authenticated
      if (!userData || !accessToken) {
        throw new Error("You must be logged in to create a game");
      }
      
      // Using the exact same mutation structure as in your original code
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "x-hasura-role":"user"
        },
        body: JSON.stringify({
          query: `
            mutation CreateGame($game: games_insert_input!) {
              insert_games_one(object: $game) {
                id
              }
            }
          `,
          variables: {
            game: {
              title,
              description,
              sport,
              difficulty,
              location,
              date,
              seats: parseInt(seats),
              venue_id: venueId, // Include the venue_id in the mutation
            }
          },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Success!
      setSuccess(true);
      
      // Redirect to the new game page
      setTimeout(() => {
        router.push(`/community-details/${data.insert_games_one.id}`);
      }, 1500);
      
    } catch (error) {
      console.error("Error creating game:", error);
      setError(error.message || "Failed to create game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Create Game
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Create New Game</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="bg-red-900 text-red-200 p-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateGame}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title*
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Game title"
                      required
                      className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Sport*
                    </label>
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                    >
                      <option value="">Select Sport</option>
                      <option value="football">Football</option>
                      <option value="basketball">Basketball</option>
                      <option value="tennis">Tennis</option>
                      <option value="cricket">Cricket</option>
                      <option value="hockey">Hockey</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Difficulty*
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                    >
                      <option value="">Select Difficulty</option>
                      <option value={1}>Beginner</option>
                      <option value={2}>Intermediate</option>
                      <option value={3}>Advanced</option>
                    </select>
                  </div>

                  {/* Venue selection dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Venue*
                    </label>
                    <select
                      value={venueId}
                      onChange={(e) => setVenueId(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                      disabled={loadingVenues}
                    >
                      <option value="">
                        {loadingVenues ? "Loading venues..." : "Select Venue"}
                      </option>
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Location*
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Game location"
                      required
                      className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Date*
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Available Seats*
                    </label>
                    <input
                      type="number"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      min="1"
                      required
                      className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Contact
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter your contact information Email or Phone"
                    required
                    rows="3"
                    className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded text-white ${
                      loading
                        ? "bg-purple-800 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    } transition-colors`}
                  >
                    {loading ? "Creating..." : "Create Game"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateGameButton;