import React from "react";
import { v4 as uuid } from "uuid";
import Loader from "./components/Loader";
import Success from "./pages/Success";
import Failure from "./pages/Failure";

const App = () => {
  const [amount, setAmount] = React.useState(100);
  const [loading, setLoading] = React.useState(false);
  const [view, setView] = React.useState("payment");
  const [transaction, setTransaction] = React.useState(null);
  const [failureReason, setFailureReason] = React.useState("");

  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === "/success") {
      setView("success");
      const verify = async () => {
        const params = new URLSearchParams(window.location.search);
        const dataQuery = params.get("data");
        if (!dataQuery) {
          setFailureReason("Missing transaction data");
          setView("failure");
          return;
        }
        try {
          setLoading(true);
          const data = JSON.parse(atob(dataQuery));
          const response = await fetch("http://localhost:3000/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              total_amount: data.total_amount,
              transaction_uuid: data.transaction_uuid,
              product_code: data.product_code,
            }),
          });
          const { success, result } = await response.json();
          if (success) {
            setTransaction(result);
          } else {
            setFailureReason("Transaction not completed");
            setView("failure");
          }
        } catch (error) {
          console.error(error);
          setFailureReason("Error verifying transaction");
          setView("failure");
        } finally {
          setLoading(false);
        }
      };
      verify();
    } else if (path === "/failure") {
      setView("failure");
    }
  }, []);

  const incrementAmount = () => {
    setAmount((prev) => prev + 50);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      const new_uuid = uuid();
      const totalAmount = Number(amount).toFixed(2);
      const form_data = {
        amount: totalAmount,
        failure_url: "http://localhost:5173/failure",
        product_delivery_charge: "0",
        product_service_charge: "0",
        product_code: "EPAYTEST",
        signature: "",
        signed_field_names: "total_amount,transaction_uuid,product_code",
        success_url: "http://localhost:5173/success",
        tax_amount: "0",
        total_amount: totalAmount,
        transaction_uuid: new_uuid,
      };
      const response = await fetch(`http://localhost:3000/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_amount: form_data.total_amount,
          transaction_uuid: form_data.transaction_uuid,
          product_code: form_data.product_code,
        }),
      });
      const { signature } = await response.json();
      form_data.signature = signature;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
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
      alert("Payment Failed");
      console.error(error);
      setFailureReason("Error initiating payment");
      setView("failure");
    } finally {
      setLoading(false);
    }
  };

  if (view === "success")
    return <Success transaction={transaction} loading={loading} onBack={() => { setView("payment"); setTransaction(null); }} />;
  if (view === "failure") return <Failure reason={failureReason} onBack={() => { setView("payment"); setFailureReason(""); }} />;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Payment Demo with Esewa
        </h1>
        <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
          <p className="text-gray-500 mb-3">Amount to Pay</p>
          <h2 className="text-5xl font-bold text-green-600">Rs. {amount}</h2>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={incrementAmount}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full shadow-md transition duration-300 cursor-pointer"
          >
            Increment Amount
          </button>
          <button
            disabled={loading}
            onClick={handlePayment}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full shadow-md transition duration-300 cursor-pointer"
          >
            Pay with Esewa
          </button>
        </div>
      </div>
      {loading && <Loader />}
    </div>
  );
};

export default App;
