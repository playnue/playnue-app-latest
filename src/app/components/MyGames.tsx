"use client";
import React, { useState, useEffect } from "react";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import Link from "next/link";

const MyGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const accessToken = useAccessToken();
  const userData = useUserData();

  useEffect(() => {
    // Only fetch games if user is logged in and we have an access token
    if (userData?.id && accessToken) {
      fetchUserGames();
    }
  }, [userData, accessToken]);

  const fetchUserGames = async () => {
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
            query GetUserGames($userId: uuid!) {
              games(where: {user_id: {_eq: $userId}}) {
                id
                title
                sport
                difficulty
                location
                date
                seats
                description
                venue_id
              }
            }
          `,
          variables: {
            userId: userData.id
          }
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(errors[0].message);
      }

      setGames(data.games || []);
    } catch (error) {
      console.error("Error fetching user games:", error);
      setError("Failed to load your games. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Function to convert difficulty number to text
  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 1: return "Beginner";
      case 2: return "Intermediate";
      case 3: return "Advanced";
      default: return "Unknown";
    }
  };

  // Function to get sport icon
  const getSportIcon = (sport) => {
    const sportLower = sport?.toLowerCase() || "";
    
    if (sportLower.includes("soccer") || sportLower.includes("football")) {
      return "⚽";
    } else if (sportLower.includes("basketball")) {
      return "🏀";
    } else if (sportLower.includes("tennis")) {
      return "🎾";
    } else if (sportLower.includes("baseball")) {
      return "⚾";
    } else if (sportLower.includes("volleyball")) {
      return "🏐";
    } else if (sportLower.includes("hockey")) {
      return "🏒";
    } else if (sportLower.includes("golf")) {
      return "⛳";
    } else {
      return "🏆";
    }
  };

  // Function to get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 1: return "bg-green-900 text-green-200";
      case 2: return "bg-yellow-900 text-yellow-200";
      case 3: return "bg-red-900 text-red-200";
      default: return "bg-gray-700 text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-40 bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-800 rounded-xl p-6">
                <div className="h-6 w-3/4 bg-gray-700 rounded mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-16 bg-gray-700 rounded"></div>
                  <div className="h-6 w-24 bg-gray-700 rounded"></div>
                  <div className="h-6 w-20 bg-gray-700 rounded"></div>
                </div>
                <div className="h-4 w-1/2 bg-gray-700 rounded mb-3"></div>
                <div className="h-4 w-2/3 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-red-100 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-2">Unable to Load Games</h3>
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchUserGames}
            className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl shadow-lg max-w-2xl mx-auto text-center border border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-2xl font-bold text-white mb-3">No Games Found</h3>
          <p className="text-gray-400 mb-6 text-lg">You haven't created any games yet. Start your sports journey today!</p>
          <Link 
            href="/community"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white text-lg font-medium rounded-lg shadow-md transition-all duration-300 inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Browse Community Games
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">My Games</h2>
          {/* <Link 
            href="/create-game"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-colors duration-200 hidden sm:flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Game
          </Link> */}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <Link
              href={`/update-game/${game.id}`}
              key={game.id}
              className="group block"
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-700 hover:border-purple-500">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors duration-200 line-clamp-2">
                      {game.sport}
                    </h3>
                    <span className="text-3xl">{getSportIcon(game.sport)}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-purple-900 text-purple-100 text-xs font-medium rounded-full flex items-center">
                      {game.sport}
                    </span>
                    <span className={`px-3 py-1 ${getDifficultyColor(game.difficulty)} text-xs font-medium rounded-full flex items-center`}>
                      {getDifficultyText(game.difficulty)}
                    </span>
                    <span className="px-3 py-1 bg-blue-900 text-blue-100 text-xs font-medium rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      {game.seats}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between text-gray-300 text-sm space-y-2 sm:space-y-0">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(game.date)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate max-w-xs">{game.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-3 flex justify-between items-center border-t border-gray-700">
                  <span className="text-gray-400 text-sm font-medium">Created by You</span>
                  <span className="inline-flex items-center text-sm font-medium text-purple-300 group-hover:text-white transition-colors duration-200">
                    View Details
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* <div className="mt-8 flex justify-center sm:hidden">
          <Link 
            href="/create-game"
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-colors duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Game
          </Link>
        </div> */}
      </div>
    </div>
  );
};

export default MyGames;