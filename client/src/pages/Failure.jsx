import React from "react";
import Swal from "sweetalert2";
import { useSearchParams, useNavigate } from "react-router-dom";

const Failure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get("reason") || "Your transaction could not be completed. Please try again.";

  React.useEffect(() => {
    Swal.fire({
      title: "Payment Failed",
      text: reason,
      icon: "error",
      confirmButtonText: "Back to Home",
      confirmButtonColor: "#2563eb",
    }).then(() => {
      navigate("/");
    });
  }, [navigate, reason]);

  return null;
};

export default Failure;
