"use client"
import { useState, useEffect } from 'react';

/**
 * Custom hook to get user's current location
 * @returns {Object} An object containing location data and loading/error states
 */
export function useUserLocation() {
  // State to store location data
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null
  });

  // State to track loading status
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      setLocation(prev => ({
        ...prev, 
        error: 'Geolocation is not supported by this browser'
      }));
      setIsLoading(false);
      return;
    }

    // Options for geolocation
    const options = {
      enableHighAccuracy: true, // Request most accurate position
      timeout: 5000,            // 5 seconds timeout
      maximumAge: 0             // Do not use cached location
    };

    // Success callback
    const onSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setLocation({
        latitude,
        longitude,
        accuracy,
        error: null
      });
      setIsLoading(false);
    };

    // Error callback
    const onError = (error) => {
      setLocation(prev => ({
        ...prev,
        error: error.message
      }));
      setIsLoading(false);
    };

    // Request current position
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }, []); // Empty dependency array means this runs once on mount

  return { 
    location, 
    isLoading, 
    isError: !!location.error 
  };
}

// Example component demonstrating usage
export default function LocationDisplay() {
  const { location, isLoading, isError } = useUserLocation();

  if (isLoading) {
    return <div>Loading location...</div>;
  }

  if (isError) {
    return <div>Unable to retrieve location</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-2">Your Location</h2>
      <p>Latitude: {location.latitude}</p>
      <p>Longitude: {location.longitude}</p>
      <p>Accuracy: {location.accuracy} meters</p>
    </div>
  );
}