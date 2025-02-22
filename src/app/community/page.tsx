"use client"
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAccessToken } from '@nhost/nextjs';
import Link from 'next/link';

const CommunityGames = () => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const accessToken = useAccessToken();
  const [filters, setFilters] = useState({
    sport: '',
    difficulty: '',
    location: '',
    date: ''
  });

  // Fetch games using fetch API
  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        //   "Authorization": `Bearer ${accessToken}`,
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

      console.log("Raw games data:", JSON.stringify(data, null, 2));

      if (errors) {
        console.error("GraphQL errors:", errors);
        throw new Error(errors[0].message);
      }

      // Process and set the games data
      const processedGames = data.games.map(game => ({
        ...game,
        venue_name: game.venue?.title || 'N/A',
      }));

      setGames(processedGames);
      setFilteredGames(processedGames);
    } catch (error) {
      console.error("Error fetching games:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch games on component mount
  useEffect(() => {
    fetchGames();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...games];
    
    if (filters.sport) {
      result = result.filter(game => game.sport === filters.sport);
    }
    
    if (filters.difficulty) {
      result = result.filter(game => game.difficulty === filters.difficulty);
    }
    
    if (filters.location) {
      result = result.filter(game => game.location.includes(filters.location));
    }
    
    if (filters.date) {
      result = result.filter(game => game.date === filters.date);
    }
    
    setFilteredGames(result);
  }, [filters, games]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create a new game
  const createGame = async (gameData) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Hasura-Role": "user",
        },
        body: JSON.stringify({
          query: `
            mutation CreateGame($game: games_insert_input!) {
              insert_games_one(object: $game) {
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
                user {
                  id
                  displayName
                  email
                }
                venue {
                  id
                  title
                }
              }
            }
          `,
          variables: {
            game: gameData,
          },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Add new game to state
      setGames(prev => [...prev, data.insert_games_one]);
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game");
    }
  };

  // Rest of your component remains the same...
  if (loading) return <div className="text-center py-8">Loading games...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Find Community Games</h1>
      
      {/* Filters */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sport</label>
            <select 
              name="sport" 
              value={filters.sport} 
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">All Sports</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="tennis">Tennis</option>
              <option value="cricket">Cricket</option>
              <option value="hockey">Hockey</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select 
              name="difficulty" 
              value={filters.difficulty} 
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Any Difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Enter location"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
      
      {/* Games List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.length > 0 ? (
          filteredGames.map(game => (
            <div key={game.id} className="border rounded-lg overflow-hidden shadow-md">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{game.title}</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {game.sport}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 text-sm">{game.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium">Date: </span>
                    {format(new Date(game.date), 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Time: </span>
                    {game.time}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Location: </span>
                    {game.location}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Difficulty: </span>
                    {game.difficulty}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">
                    {game.seats} {game.seats === 1 ? 'spot' : 'spots'} left
                  </div>
                  <Link href={`/community-details/${game.id}`}>
                  <button
                    // onClick={() => handleJoinGame(game.id)}
                    disabled={game.seats <= 0}
                    className={`px-4 py-2 rounded ${
                      game.seats > 0 
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    >
                    {game.seats > 0 ? 'Join Game' : 'Full'}
                  </button>
                    </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            No games match your filters. Try adjusting your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityGames;