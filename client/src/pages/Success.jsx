import React from "react";
import Loader from "../components/Loader";

const Success = ({ transaction, loading, onBack }) => {
  if (loading || !transaction) {
    return <Loader />;
  }

  const fields = [
    { label: "Transaction ID", value: transaction.transaction_uuid },
    { label: "Status", value: transaction.status },
    { label: "Total Amount", value: `Rs. ${transaction.total_amount}` },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful</h1>
        <p className="text-gray-500 mb-6">Your transaction has been completed successfully.</p>
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 text-left space-y-4">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="text-sm text-gray-500 mb-1">{field.label}</p>
              <p className="text-base font-semibold text-gray-800 break-all">{field.value}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onBack}
          className="mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition duration-300 cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Success;
