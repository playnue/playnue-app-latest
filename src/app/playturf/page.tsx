"use client"
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
import { useAccessToken } from '@nhost/nextjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const QuickSlotGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const accessToken = useAccessToken();

  const PLAYTURF_VENUE_ID = "25d039e0-8a4d-49b1-ac06-5439c3af4a6f";
  const PLAYTURF_COURT_ID = "c1b8314a-f4f0-4ed3-8f86-9e8f2bc2d711";

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const lastDayOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
    
    for (let d = new Date(nextMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const generateSlots = (dates) => {
    const slots = [];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      
      // 5 AM to 5 PM slots (₹1000)
      for (let hour = 5; hour < 17; hour++) {
        slots.push({
          court_id: PLAYTURF_COURT_ID,
          venue_id: PLAYTURF_VENUE_ID,
          start_at: `${hour.toString().padStart(2, '0')}:00:00`,
          end_at: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          price: 1000,
          date: dateStr,
          booked: false,
          timezone: timeZone
        });
      }

      // 5 PM to 5 AM slots (₹1200)
      for (let hour = 17; hour < 24; hour++) {
        slots.push({
          court_id: PLAYTURF_COURT_ID,
          venue_id: PLAYTURF_VENUE_ID,
          start_at: `${hour.toString().padStart(2, '0')}:00:00`,
          end_at: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          price: 1200,
          date: dateStr,
          booked: false,
          timezone: timeZone
        });
      }
      
      for (let hour = 0; hour < 5; hour++) {
        slots.push({
          court_id: PLAYTURF_COURT_ID,
          venue_id: PLAYTURF_VENUE_ID,
          start_at: `${hour.toString().padStart(2, '0')}:00:00`,
          end_at: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          price: 1200,
          date: dateStr,
          booked: false,
          timezone: timeZone
        });
      }
    });
    
    return slots;
  };

  const handleGenerateSlots = async () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "You must be logged in to generate slots",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const dates = generateDates();
      const slots = generateSlots(dates);
      
      const mutation = `
        mutation InsertPlayTurfSlots($objects: [slots_insert_input!]!) {
          insert_slots(
            objects: $objects,
            on_conflict: {
              constraint: slots_pkey,
              update_columns: [price, booked]
            }
          ) {
            affected_rows
          }
        }
      `;

      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-hasura-role': 'seller'
        },
        body: JSON.stringify({
          query: mutation,
          variables: { objects: slots }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const nextMonth = new Date().getMonth() + 1;
      const monthName = new Date(2024, nextMonth - 1, 1).toLocaleString('default', { month: 'long' });
      
      toast({
        title: "Success",
        description: `Generated ${result.data.insert_slots.affected_rows} slots for ${monthName}`
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate slots",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Quick Slot Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">This will generate:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Next month's slots (24 hours per day)</li>
              <li>• 5:00 AM - 5:00 PM: ₹1000 per hour</li>
              <li>• 5:00 PM - 5:00 AM: ₹1200 per hour</li>
            </ul>
          </div>

          <Button 
            onClick={handleGenerateSlots} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Generating Slots..." : "Generate Next Month's Slots"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickSlotGenerator;