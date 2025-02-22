"use client"
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, Users, Trophy } from 'lucide-react';
import { useParams } from 'next/navigation';

const GameDetails = () => {
  const gameId = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGameDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
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
              }
            }
          `,
        }),
      });

      const { data, errors } = await response.json();
      if (errors) {
        throw new Error(errors[0].message);
      }

      setGame(data.games);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
    }
  }, [gameId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-4">
      <Card className="bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="text-xl font-semibold">{error}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  if (!game) return null;

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold">{game.title}</CardTitle>
            <Badge className="text-lg capitalize bg-blue-100 text-blue-800">
              {game.sport}
            </Badge>
          </div>
          <Badge variant="outline" className="text-base capitalize">
            {game.difficulty} Level
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-lg leading-relaxed">
            {game.description}
          </p>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-gray-700">{formatDate(game.date)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <span className="text-gray-700">{game.time}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-blue-600" />
              <span className="text-gray-700">{game.location}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-gray-700">{game.seats} spots available</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-blue-600" />
              <span className="text-gray-700 capitalize">{game.difficulty} difficulty</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              size="lg"
              className={`w-full ${game.seats > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'}`}
              disabled={game.seats <= 0}
            >
              {game.seats > 0 ? 'Join Game' : 'Game Full'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameDetails;