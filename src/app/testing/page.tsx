"use client";

import { Button } from "@/components/ui/button";
import { useAccessToken } from "@nhost/nextjs";

const page = () => {
  const accessToken = useAccessToken();
  const slotIds = [
    "5d7b8c34-6b00-4588-81b3-b5a5fe549324",
    "e972bf16-bd82-48c3-98e3-63cf893f44c6",
  ];
  const isPartialPayment = 1;
  const handleBookNowPhonepe = async () => {
    try {
      // Create order via your backend
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_FUNCTIONS}/phonepe/order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount: 1, // Backend will multiply by 100
            slot_ids: slotIds,
            payment_type: isPartialPayment ? 1 : 2,
          }),
        }
      );

      // Parse the JSON response
      const responseData = await orderResponse.json();
      localStorage.setItem("phonepe_transaction_id", responseData.merchantOrderId);
      // Store additional information needed for booking
      localStorage.setItem("phonepe_slot_ids", JSON.stringify(slotIds));
      localStorage.setItem("phonepe_payment_type", isPartialPayment ? 1 : 2);

      console.log(responseData);

      // Store the merchantOrderId in localStorage before redirecting
      if (responseData.merchantOrderId) {
        localStorage.setItem(
          "phonepe_transaction_id",
          responseData.merchantOrderId
        );
      }

      // Redirect to payment URL if available
      if (responseData.url) {
        window.location.href = responseData.url;
      }
    } catch (error) {
      console.error("Booking Error:", error);
    }
  };
  return (
    <Button
      onClick={handleBookNowPhonepe}
      className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600"
    >
      {"book now"}
    </Button>
  );
};

export default page;
