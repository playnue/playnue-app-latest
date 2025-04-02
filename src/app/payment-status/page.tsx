"use client"
import dynamic from 'next/dynamic';

// Import the component with no SSR
const PaymentStatus = dynamic(() => import('../components/PaymentStatus'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading payment status...</p>
    </div>
  )
});

export default function PaymentStatusPage() {
  return <PaymentStatus />;
}