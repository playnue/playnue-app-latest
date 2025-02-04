"use client"
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { useAccessToken } from '@nhost/nextjs';

const PlayTurfSlotGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const { toast } = useToast();
  const accessToken = useAccessToken();

  // PlayTurf's venue and court IDs (replace with actual IDs)
  const PLAYTURF_VENUE_ID = "25d039e0-8a4d-49b1-ac06-5439c3af4a6f";
  const PLAYTURF_COURT_ID = "c1b8314a-f4f0-4ed3-8f86-9e8f2bc2d711";

  const generateSlots = (dates) => {
    const slots = [];

    // Generate slots for each selected date
    dates.forEach(date => {
      // 5 AM to 5 PM slots (₹1000)
      for (let hour = 5; hour < 17; hour++) {
        slots.push({
          court_id: PLAYTURF_COURT_ID,
          start_at: `${hour.toString().padStart(2, '0')}:00:00`,
          end_at: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          price: 1000,
          date: date.toISOString().split('T')[0]
        });
      }

      // 5 PM to 5 AM slots (₹1200)
      for (let hour = 17; hour < 24; hour++) {
        slots.push({
          court_id: PLAYTURF_COURT_ID,
          start_at: `${hour.toString().padStart(2, '0')}:00:00`,
          end_at: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          price: 1200,
          date: date.toISOString().split('T')[0]
        });
      }
      for (let hour = 0; hour < 5; hour++) {
        slots.push({
          court_id: PLAYTURF_COURT_ID,
          start_at: `${hour.toString().padStart(2, '0')}:00:00`,
          end_at: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          price: 1200,
          date: date.toISOString().split('T')[0]
        });
      }
    });
    
    return slots;
  };

  const handleGenerateSlots = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one date",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const slots = generateSlots(selectedDates);

      const mutation = `
        mutation InsertPlayTurfSlots($objects: [slots_insert_input!]!) {
          insert_slots(
            objects: $objects,
            on_conflict: {
              constraint: slots_pkey,
              update_columns: [price]
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
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role":"seller"
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

      toast({
        title: "Success",
        description: `Generated ${result.data.insert_slots.affected_rows} slots for ${selectedDates.length} selected dates`
      });

    } catch (error) {
      console.error('Error generating slots:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate slots. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDates = () => {
    setSelectedDates([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Generate PlayTurf Slots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Select Dates</h3>
              {selectedDates.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearDates}>
                  Clear Selection
                </Button>
              )}
            </div>
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={setSelectedDates}
              className="rounded-md border"
            />
          </div>

          {selectedDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date) => (
                <Badge key={date.toISOString()} variant="secondary">
                  {date.toLocaleDateString()}
                </Badge>
              ))}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Slot Pattern</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 5:00 AM - 5:00 PM: ₹1000 per hour</li>
              <li>• 5:00 PM - 5:00 AM: ₹1200 per hour</li>
              <li>• Will generate slots for all selected dates</li>
            </ul>
          </div>

          <Button 
            onClick={handleGenerateSlots} 
            className="w-full"
            disabled={isLoading || selectedDates.length === 0}
          >
            {isLoading 
              ? "Generating Slots..." 
              : `Generate Slots for ${selectedDates.length} ${selectedDates.length === 1 ? 'Date' : 'Dates'}`
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayTurfSlotGenerator;