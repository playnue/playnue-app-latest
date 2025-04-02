"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccessToken, useUserData } from '@nhost/nextjs';

const PaymentStatus = () => {
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const accessToken = useAccessToken();
  const userData = useUserData();
  const id = userData?.id;

  useEffect(() => {
    // Wait for all dependencies to be available
    if (accessToken && userData) {
      const transactionId = localStorage.getItem('phonepe_transaction_id');
      const slotIdsString = localStorage.getItem('phonepe_slot_ids');
      const paymentTypeString = localStorage.getItem('phonepe_payment_type');
      
      if (transactionId && slotIdsString && paymentTypeString) {
        setIsReady(true);
      } else {
        setPaymentStatus("error");
        console.error("Missing payment data in localStorage");
      }
    }
  }, [accessToken, userData]);

  useEffect(() => {
    if (!isReady) return;

    const checkPaymentStatus = async () => {
      try {
        const transactionId = localStorage.getItem('phonepe_transaction_id');
        const slotIds = JSON.parse(localStorage.getItem('phonepe_slot_ids') || '[]');
        const paymentType = parseInt(localStorage.getItem('phonepe_payment_type') || '2');
        
        const statusResponse = await fetch(
          `${process.env.NEXT_PUBLIC_FUNCTIONS}/phonepe/payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              merchantTransactionId: transactionId,
              slot_ids: slotIds,
              payment_type: paymentType,
              user_id: id
            })
          }
        );

        const statusData = await statusResponse.json();
        console.log(statusData);
        
        if (statusData.success === true) {
          // Handle successful payment
          setPaymentStatus("success");
          // Clean up localStorage
          localStorage.removeItem('phonepe_transaction_id');
          localStorage.removeItem('phonepe_slot_ids');
          localStorage.removeItem('phonepe_payment_type');
          
          // Redirect to booking confirmation page
          setTimeout(() => {
            router.push("/user-bookings");
          }, 2000);
        } else {
          // Handle failed payment
          setPaymentStatus("failed");
        }
      } catch (error) {
        console.error("Payment Status Check Error:", error);
        setPaymentStatus("error");
      }
    };

    checkPaymentStatus();
  }, [isReady, accessToken, id, router]);

  return (
    <div className="payment-status-container">
      {paymentStatus === 'checking' && <p>Checking payment status...</p>}
      {paymentStatus === 'success' && <p>Payment successful! Redirecting to your bookings...</p>}
      {paymentStatus === 'failed' && <p>Payment failed or incomplete. Please try again.</p>}
      {paymentStatus === 'error' && <p>Error checking payment status.</p>}
    </div>
  );
};

export default PaymentStatus;