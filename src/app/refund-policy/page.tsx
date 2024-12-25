"use client"
import React from 'react';

const CancellationAndRefundPolicy = () => {
  return (
    <div className="flex flex-col items-center p-6 md:p-12">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold mb-6">Cancellation and Refund Policy</h1>

        <section className="mb-6">
          <p className="text-lg leading-relaxed">
            Cancellations are subject to the policy as set by the respective merchant partner. You can view the cancellation policies of the respective merchant partner on their information page prior to making a booking or purchase. The cancellation policy is also included in your booking ticket in your order history.
          </p>
        </section>

        <section className="mb-6">
          <p className="text-lg leading-relaxed">
            Cancellations can be initiated by the users themselves on your booking ticket. The refund amount due will be displayed prior to seeking confirmation of the cancellation. The refund amount will be credited back into the user’s account, to the same source through which the payment was made, within 5-7 working days, post initiating the cancellation.
          </p>
        </section>

      </div>
    </div>
  );
};

export default CancellationAndRefundPolicy;
