"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccessToken, useUserData } from '@nhost/nextjs';

const PaymentStatus = () => {
  const [status, setStatus] = useState('initializing');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const accessToken = useAccessToken();
  const userData = useUserData();

  useEffect(() => {
    // Only run this code in the browser
    if (typeof window === 'undefined') return;
    
    const checkPayment = async () => {
      try {
        // Wait for auth
        if (!accessToken || !userData?.id) {
          setStatus('waiting-auth');
          return;
        }
        
        setStatus('checking');
        
        // Get data from localStorage
        const transactionId = localStorage.getItem('phonepe_transaction_id') || 
                              localStorage.getItem('phonepe_merchantTransactionId');
                              
        if (!transactionId) {
          throw new Error('No transaction ID found');
        }
        
        // Parse slot IDs
        let slotIds = [];
        try {
          const slotIdsStr = localStorage.getItem('phonepe_slot_ids');
          if (slotIdsStr) {
            slotIds = JSON.parse(slotIdsStr);
          }
        } catch (err) {
          console.error('Error parsing slot IDs:', err);
        }
        
        // Get payment type
        const paymentType = parseInt(localStorage.getItem('phonepe_payment_type') || '2');
        
        // API URL fallback
        const apiUrl = process.env.NEXT_PUBLIC_FUNCTIONS || 'http://localhost:3000/api';
        
        console.log('Verifying payment:', {
          transactionId,
          slotIds,
          paymentType,
          userId: userData.id,
          apiUrl
        });
        
        // Make API request
        const response = await fetch(`${apiUrl}/phonepe/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            merchantTransactionId: transactionId,
            slot_ids: slotIds,
            payment_type: paymentType,
            user_id: userData.id
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Payment verification response:', data);
        
        if (data.success) {
          setStatus('success');
          
          // Clear localStorage
          localStorage.removeItem('phonepe_transaction_id');
          localStorage.removeItem('phonepe_merchantTransactionId');
          localStorage.removeItem('phonepe_slot_ids');
          localStorage.removeItem('phonepe_payment_type');
          
          // Redirect after delay
          setTimeout(() => {
            router.push('/user-bookings');
          }, 2000);
        } else {
          setStatus('failed');
          setErrorMessage(data.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('error');
        setErrorMessage(err.message);
      }
    };
    
    checkPayment();
  }, [accessToken, userData, router]);
  
  // Handle retry
  const handleRetry = () => {
    setStatus('initializing');
    window.location.reload();
  };
  
  // Handle return to payment
  const handleReturnToPayment = () => {
    router.push('/payment');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {status === 'initializing' && (
        <div className="text-center">
          <p className="text-lg">Initializing payment verification...</p>
          <div className="mt-4 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {status === 'waiting-auth' && (
        <div className="text-center">
          <p className="text-lg">Waiting for authentication...</p>
          <div className="mt-4 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {status === 'checking' && (
        <div className="text-center">
          <p className="text-lg">Verifying your payment...</p>
          <div className="mt-4 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-center">
          <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <h2 className="text-2xl font-bold text-green-600 mt-4">Payment Successful!</h2>
          <p className="mt-2">Redirecting to your bookings...</p>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <h2 className="text-2xl font-bold text-red-600 mt-4">Payment Failed</h2>
          <p className="mt-2">{errorMessage}</p>
          <button 
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handleReturnToPayment}
          >
            Try Again
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-red-600 mt-4">Error</h2>
          <p className="mt-2">{errorMessage}</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
            <button 
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              onClick={handleRetry}
            >
              Retry
            </button>
            <button 
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={handleReturnToPayment}
            >
              Return to Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;