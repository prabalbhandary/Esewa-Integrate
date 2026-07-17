import React from "react";
import { v4 as uuid } from "uuid";
import { Routes, Route, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Success from "./pages/Success";
import Failure from "./pages/Failure";

const Checkout = () => {
  const [amount, setAmount] = React.useState(100);
  const navigate = useNavigate();

  const incrementAmount = () => {
    setAmount((prev) => prev + 50);
  };

  const handleProcessPayment = async () => {
    try {
      const saleResponse = await fetch("http://localhost:3000/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_amount: Number(amount).toFixed(2) }),
      });

      if (!saleResponse.ok) {
        throw new Error("Failed to create sale");
      }

      const sale = await saleResponse.json();

      const paymentResponse = await fetch(`http://localhost:3000/api/sales/${sale.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_code: "EPAYTEST" }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Failed to initiate payment");
      }

      const { form_data, esewa_url } = await paymentResponse.json();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = esewa_url;
      form.target = "_self";

      Object.entries(form_data).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      Swal.fire({
        title: "Payment Failed",
        text: error.message,
        icon: "error",
        confirmButtonText: "Back to Home",
        confirmButtonColor: "#2563eb",
      }).then(() => {
        navigate("/");
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          POS Checkout
        </h1>
        <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
          <p className="text-gray-500 mb-3">Total Amount</p>
          <h2 className="text-5xl font-bold text-green-600">Rs. {Number(amount).toFixed(2)}</h2>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={incrementAmount}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full shadow-md transition duration-300 cursor-pointer"
          >
            Increment Amount
          </button>
          <button
            onClick={handleProcessPayment}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full shadow-md transition duration-300 cursor-pointer"
          >
            Pay with eSewa
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Checkout />} />
      <Route path="/success" element={<Success />} />
      <Route path="/failure" element={<Failure />} />
    </Routes>
  );
};

export default App;
