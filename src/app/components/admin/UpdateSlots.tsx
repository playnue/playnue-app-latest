import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToastContainer, toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { useAccessToken } from "@nhost/nextjs";

const SlotPriceEditor = () => {
  // Multi-slot state
  const [slotIds, setSlotIds] = useState("");
  const [multiPrice, setMultiPrice] = useState("");

  // Single-slot state
  const [singleSlotId, setSingleSlotId] = useState("");
  const [singlePrice, setSinglePrice] = useState("");

  // Common state
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const accessToken = useAccessToken();

  const validateUUID = (id) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const validatePrice = (price) => {
    const priceNum = parseFloat(price);
    return !isNaN(priceNum) && priceNum >= 0;
  };

  const updateSlotPrice = async (slotId, price) => {
    const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation UpdateSlotPrice($slotId: uuid!, $price: money!) {
            update_slots_by_pk(
              pk_columns: { id: $slotId }
              _set: { price: $price }
            ) {
              id
              price
            }
          }
        `,
        variables: {
          slotId: slotId,
          price: price,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL operation failed");
    }

    return result.data.update_slots_by_pk;
  };

  const handleSingleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      if (!validateUUID(singleSlotId)) {
        throw new Error("Invalid UUID format");
      }

      if (!validatePrice(singlePrice)) {
        throw new Error("Please enter a valid positive price");
      }

      const result = await updateSlotPrice(singleSlotId, singlePrice);

      setStatus({
        type: "success",
        message: `Successfully updated slot ${singleSlotId} to price ${singlePrice}`,
      });
      setSingleSlotId("");
      setSinglePrice("");
    } catch (error) {
      console.error("Update failed:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to update price. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const slots = slotIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      if (slots.length === 0) {
        throw new Error("Please enter at least one slot ID");
      }

      const invalidIds = slots.filter((id) => !validateUUID(id));
      if (invalidIds.length > 0) {
        throw new Error(`Invalid UUID format for: ${invalidIds.join(", ")}`);
      }

      if (!validatePrice(multiPrice)) {
        throw new Error("Please enter a valid positive price");
      }

      const updatePromises = slots.map((slotId) =>
        updateSlotPrice(slotId, multiPrice)
      );

      await Promise.all(updatePromises);

      setStatus({
        type: "success",
        message: `Successfully updated ${slots.length} slot${
          slots.length > 1 ? "s" : ""
        }`,
      });
      
      setSlotIds("");
      setMultiPrice("");
    } catch (error) {
      console.error("Update failed:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to update prices. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Update Slot Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Slot</TabsTrigger>
              <TabsTrigger value="multi">Multiple Slots</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <form onSubmit={handleSingleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slot ID</label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={singleSlotId}
                    onChange={(e) => setSingleSlotId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter new price"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Price"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="multi">
              <form onSubmit={handleMultiUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slot IDs</label>
                  <Input
                    placeholder="Enter comma-separated UUIDs"
                    value={slotIds}
                    onChange={(e) => setSlotIds(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Separate multiple UUIDs with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter new price"
                    value={multiPrice}
                    onChange={(e) => setMultiPrice(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Prices"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {status.message && (
            <Alert
              variant={status.type === "error" ? "destructive" : status.type}
              className="mt-4"
            >
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default SlotPriceEditor;
