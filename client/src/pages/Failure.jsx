import React from "react";

const Failure = ({ reason, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Failed</h1>
        <p className="text-gray-500 mb-6">
          {reason || "Your transaction could not be completed. Please try again."}
        </p>
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Transaction Status</p>
          <p className="text-lg font-semibold text-red-600">Failed</p>
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

export default Failure;
