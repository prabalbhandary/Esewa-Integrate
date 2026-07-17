import React from "react";
import Swal from "sweetalert2";
import { useSearchParams, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sale, setSale] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const saleId = searchParams.get("sale_id");

  React.useEffect(() => {
    if (!saleId) {
      setError("Missing sale ID");
      setLoading(false);
      return;
    }

    const pollSale = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/sales/${saleId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch sale");
        }
        const data = await response.json();
        setSale(data);

        if (data.status === "paid") {
          setLoading(false);
          const latestPayment = data.payment_attempts?.[0];
          Swal.fire({
            title: "Payment Successful",
            text: `Sale #${data.id} has been paid successfully.`,
            icon: "success",
            confirmButtonText: "Back to Home",
            confirmButtonColor: "#2563eb",
          }).then(() => {
            navigate("/");
          });
        } else if (data.status === "failed") {
          setLoading(false);
          Swal.fire({
            title: "Payment Failed",
            text: "The payment could not be completed.",
            icon: "error",
            confirmButtonText: "Back to Home",
            confirmButtonColor: "#2563eb",
          }).then(() => {
            navigate("/");
          });
        } else {
          setTimeout(pollSale, 2000);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
        Swal.fire({
          title: "Error",
          text: err.message,
          icon: "error",
          confirmButtonText: "Back to Home",
          confirmButtonColor: "#2563eb",
        }).then(() => {
          navigate("/");
        });
      }
    };

    pollSale();
  }, [saleId, navigate]);

  if (loading) {
    return <Loader />;
  }

  return null;
};

export default Success;
