"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X, Clock } from 'lucide-react';
import { useAccessToken } from '@nhost/nextjs';

const SlotManagement = () => {
  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useAccessToken();
  const [slots, setSlots] = useState([
    {
      startTime: "01:00",
      endTime: "02:00",
      price: ""
    }
  ]);

  // Fetch venues on component mount
  useEffect(() => {
    fetchVenues();
  }, []);

  // Fetch courts when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      fetchCourts(selectedVenue);
    }
  }, [selectedVenue]);

  const fetchVenues = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        })
      });
      
      const result = await response.json();
      setVenues(result.data.venues);
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const fetchCourts = async (venueId) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          query: `
            query GetCourts($venueId: uuid!) {
              courts(where: { venue_id: { _eq: $venueId } }) {
                id
                name
              }
            }
          `,
          variables: {
            venueId
          }
        })
      });
      
      const result = await response.json();
      setCourts(result.data.courts);
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  };

  const addSlot = () => {
    const lastSlot = slots[slots.length - 1];
    const lastEndHour = parseInt(lastSlot.endTime.split(':')[0]);
    
    // Calculate next slot times
    const nextStartHour = lastEndHour;
    const nextEndHour = (nextStartHour + 1) % 24;
    
    const nextSlot = {
      startTime: `${String(nextStartHour).padStart(2, '0')}:00`,
      endTime: `${String(nextEndHour).padStart(2, '0')}:00`,
      price: lastSlot.price // Optionally copy the price from the last slot
    };
    
    setSlots([...slots, nextSlot]);
  };

  const removeSlot = (index) => {
    if (slots.length > 1) {
      const newSlots = slots.filter((_, i) => i !== index);
      
      // Recalculate times for all slots after the removed one
      const updatedSlots = newSlots.map((slot, i) => {
        if (i === 0) return slot; // Keep first slot as is
        
        const startHour = (i + 1) % 24;
        const endHour = (startHour + 1) % 24;
        
        return {
          ...slot,
          startTime: `${String(startHour).padStart(2, '0')}:00`,
          endTime: `${String(endHour).padStart(2, '0')}:00`
        };
      });
      
      setSlots(updatedSlots);
    }
  };

  // Modified handleSubmit function for SlotManagement
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Use the same approach as your working component - create objects first
    const slotObjects = selectedDates.flatMap(date => 
      slots.map(slot => ({
        court_id: selectedCourt,
        date: date.toISOString().split('T')[0],
        start_at: slot.startTime + ':00',
        end_at: slot.endTime + ':00',
        price: parseFloat(slot.price)
      }))
    );

    // Use direct slot insertion instead of court update
    const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        "x-hasura-role": "seller",
      },
      body: JSON.stringify({
        query: `
          mutation InsertSlots($slots: [slots_insert_input!]!) {
            insert_slots(objects: $slots) {
              affected_rows
            }
          }
        `,
        variables: {
          slots: slotObjects
        }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    if (result.data?.insert_slots?.affected_rows > 0) {
      alert('Slots created successfully!');
      setSlots([{ startTime: "01:00", endTime: "02:00", price: "" }]);
      setSelectedDates([]);
    }
  } catch (error) {
    console.error('Error creating slots:', error);
    alert('Failed to create slots: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Sequential Slots</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Venue and Court Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Venue</label>
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map(venue => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Select Court</label>
                <Select 
                  value={selectedCourt} 
                  onValueChange={setSelectedCourt}
                  disabled={!selectedVenue}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a court" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map(court => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Select Dates</label>
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  className="rounded-md border"
                />
              </div>
            </div>

            {/* Slots Management */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Sequential Time Slots</h3>
                <Button type="button" onClick={addSlot} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Next Hour
                </Button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {slots.map((slot, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Slot {index + 1}</span>
                      {slots.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeSlot(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          <Clock className="inline-block w-4 h-4 mr-1" />
                          Start Time
                        </label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          <Clock className="inline-block w-4 h-4 mr-1" />
                          End Time
                        </label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <Input
                        type="number"
                        value={slot.price}
                        onChange={(e) => {
                          const newSlots = [...slots];
                          newSlots[index].price = e.target.value;
                          setSlots(newSlots);
                        }}
                        placeholder="Enter price"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={!selectedVenue || !selectedCourt || selectedDates.length === 0 || isLoading}
          >
            {isLoading ? 'Creating Slots...' : 'Create Slots'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SlotManagement;