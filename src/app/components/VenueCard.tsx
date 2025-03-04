import React, { useEffect, useState } from "react";
import { format } from "date-fns";

const VenueCard = ({ gameId, venueId, sport, difficulty, date, time, participants, totalSeats }) => {
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Format the difficulty range (e.g., "Beginner - Professional")
  const formatDifficulty = (difficulty) => {
    if (!difficulty) return "Any Level";
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };
  
  // Convert time string to 12-hour format
  const formatTimeString = (timeStr) => {
    if (!timeStr) return "";
    
    try {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (err) {
      return timeStr;
    }
  };
  
  // Format time range (e.g., "09:00 PM - 10:00 PM")
  const formatTimeRange = (timeStr) => {
    if (!timeStr) return "";
    
    const startTime = formatTimeString(timeStr);
    
    // Calculate end time assuming 1 hour duration
    try {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours, 10);
      const endHour = (hour + 1) % 24;
      const ampm = endHour >= 12 ? "PM" : "AM";
      const formattedEndHour = endHour % 12 || 12;
      return `${startTime} - ${formattedEndHour}:${minutes} ${ampm}`;
    } catch (err) {
      return startTime;
    }
  };
  
  const fetchVenueDetails = async (venueId) => {
    if (!venueId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
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
                distance
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
        setError("Failed to load venue details");
        setLoading(false);
        return;
      }

      if (responseData.data?.venues_by_pk) {
        setVenue(responseData.data.venues_by_pk);
      } else {
        setError("Venue not found");
      }
    } catch (error) {
      console.error("Failed to fetch venue details:", error);
      setError("Failed to load venue details");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVenueDetails(venueId);
  }, [venueId]);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md max-w-md w-full animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md max-w-md w-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-md max-w-md w-full">
      <div className="flex items-center mb-3">
        <div className="rounded-full bg-gray-200 w-10 h-10 flex items-center justify-center text-gray-700 mr-3">
          <span>⚽</span>
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-lg mr-1">{participants}/{totalSeats}</h3>
            <span className="text-gray-600">Going</span>
          </div>
          <p className="text-gray-500 text-sm">
            {venue ? venue.title : "Loading venue..."}
          </p>
        </div>
      </div>
      
      <p className="text-gray-700 mb-2">
        <time>
          {date ? format(new Date(date), "EEE, dd MMM yyyy") : "Date TBD"}, {formatTimeRange(time)}
        </time>
      </p>
      
      <div className="flex items-center mb-4">
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {venue ? venue.location : "Location TBD"}
        </span>
        <span className="mx-1">~</span>
        <span className="text-gray-500">{venue?.distance || "2.40"} Kms</span>
      </div>
      
      <div className="flex">
        <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {formatDifficulty(difficulty)}
          {difficulty && difficulty.toLowerCase() !== "professional" && 
            <span> - Professional</span>
          }
        </div>
      </div>
    </div>
  );
};

export default VenueCard;