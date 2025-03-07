"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccessToken, useUserData } from "@nhost/nextjs";

const CreateGameButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("");
  const [teamType, setTeamType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [time, setTime] = useState("");
  // Form step state
  const [currentStep, setCurrentStep] = useState(1);

  // Venues state
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [venueId, setVenueId] = useState("");
  const [selectedVenueLocation, setSelectedVenueLocation] = useState("");
  const [loadingVenues, setLoadingVenues] = useState(false);

  const accessToken = useAccessToken();
  const userData = useUserData();
  const router = useRouter();

  // Fetch all venues when the modal opens
  useEffect(() => {
    if (showModal) {
      fetchVenues();
    }
  }, [showModal, accessToken]);

  const sportsTeams = {
    cricket: ["11-a-side", "6-a-side"],
    football: ["11-a-side", "7-a-side", "5-a-side"],
    tennis: ["Singles", "Doubles", "Mixed Doubles"],
    snooker: ["Singles", "Doubles"],
    basketball: ["5-a-side", "3-a-side"],
    golf: ["Singles", "Doubles", "Team Play"],
    pickleball: ["Singles", "Doubles"],
    pool: ["Singles", "Doubles"],
    hockey: ["11-a-side", "7-a-side", "5-a-side"],
  };

  // Filter venues when sport changes
  useEffect(() => {
    if (sport && venues.length > 0) {
      const matchingVenues = venues.filter(
        (venue) =>
          venue.sports &&
          venue.sports.some(
            (venueSport) => venueSport.toLowerCase() === sport.toLowerCase()
          )
      );
      console.log("Matching venues:", matchingVenues);

      setFilteredVenues(matchingVenues);

      // Reset venue selection when sport changes
      setVenueId("");
      setSelectedVenueLocation("");
      setTeamType("");
    } else {
      setFilteredVenues([]);
    }
  }, [sport, venues]);

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
                sports
                location
              }
            }
          `,
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
    setError("");
    setSuccess(false);

    try {
      // Check if user is authenticated
      if (!userData || !accessToken) {
        throw new Error("You must be logged in to create a game");
      }

      // Combine date and time
      const dateTimeString = `${date}T${time}`;

      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role": "user",
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
              title: contact,
              description: `${description} (${teamType})`,
              sport,
              difficulty,
              time,
              location: selectedVenueLocation || "",
              date: date, // Using the combined date and time
              seats: parseInt(seats),
              venue_id: venueId,
            },
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

  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!sport) {
        setError("Please select a sport");
        return;
      }
      if (!teamType && sportsTeams[sport]) {
        setError("Please select a team type");
        return;
      }
    } else if (currentStep === 2) {
      if (!venueId) {
        setError("Please select a venue");
        return;
      }
    }

    setError("");
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError("");
    setCurrentStep((prev) => prev - 1);
  };

  // Render form steps
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-300 mb-2">
              Step 1: Select a Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              required
              className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded text-lg"
            >
              <option value="">Select Sport</option>
              <option value="football">Football</option>
              <option value="badminton">Badminton</option>
              <option value="table-tennis">Table Tennis</option>
              <option value="lawntennis">Lawn Tennis</option>
              <option value="tennis">Tennis</option>
              <option value="cricket">BoxCricket</option>
              <option value="snooker">Snooker</option>
              <option value="golf">Golf</option>
              <option value="pickleball">Pickleball</option>
              <option value="pool">Pool</option>
            </select>

            {sport && sportsTeams[sport] && (
              <div className="mt-6">
                <label className="block text-lg font-medium text-gray-300 mb-2">
                  Select Team Type
                </label>
                <div className="flex flex-wrap gap-3">
                  {sportsTeams[sport].map((team) => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => setTeamType(team)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        teamType === team
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-300 mb-2">
              Step 2: Select a Venue
            </label>
            {loadingVenues ? (
              <p className="text-gray-400">Loading venues...</p>
            ) : filteredVenues.length > 0 ? (
              <div className="space-y-3">
                <p className="text-gray-400 mb-2">
                  Select a venue that offers {sport}:
                </p>

                <div className="max-h-60 overflow-y-auto pr-2">
                  {filteredVenues.map((venue) => (
                    <div
                      key={venue.id}
                      onClick={() => {
                        setVenueId(venue.id);
                        setSelectedVenueLocation(venue.location);
                      }}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        venueId === venue.id
                          ? "border-purple-500 bg-purple-900"
                          : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      <h3 className="font-medium text-white">{venue.title}</h3>
                      <p className="text-sm text-gray-400">
                        Sports:{" "}
                        {venue.sports ? venue.sports.join(", ") : "None listed"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-yellow-400">
                No venues found that offer {sport}. Please go back and select a
                different sport.
              </p>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-300">
              Step 3: Game Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Contact*
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Enter your contact details (Phone no. / Email id)"
                required
                className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Difficulty*
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                >
                  <option value="">Select Difficulty</option>
                  <option value="1">Beginner</option>
                  <option value="2">Intermediate</option>
                  <option value="3">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Required Players*
                </label>
                <input
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Time*
                </label>
                <input
                  type="time" // Correct input type for time
                  value={time} // Use the time state
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description*
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter Instructions for players"
                required
                rows={3}
                className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded"
              ></textarea>
              {teamType && (
                <p className="text-sm text-gray-400 mt-1">
                  Team type: {teamType} (will be added to description)
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
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
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Create Game
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Create New Game
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 ${step < 3 ? "border-t-2" : ""} ${
                        step <= currentStep
                          ? "border-purple-500"
                          : "border-gray-700"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                          step === currentStep
                            ? "bg-purple-600 text-white"
                            : step < currentStep
                            ? "bg-purple-800 text-white"
                            : "bg-gray-800 text-gray-500 border border-gray-700"
                        }`}
                      >
                        {step < currentStep ? (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          step
                        )}
                      </div>
                      <div className="text-xs text-center mt-1 text-gray-400">
                        {step === 1
                          ? "Sport & Team"
                          : step === 2
                          ? "Venue"
                          : "Game Details"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-900 text-red-200 p-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateGame}>
                {renderFormStep()}

                <div className="flex justify-between mt-6">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-red-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      Next
                    </button>
                  ) : (
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
                  )}
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
