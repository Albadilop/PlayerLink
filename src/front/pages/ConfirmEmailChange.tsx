import { useEffect, useState, type FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import userServices from "../services/userServices";

/**
 * Completa el cambio de email tras el enlace enviado al nuevo buzón.
 * Ruta: /confirm-email-change?token=...
 */
export const ConfirmEmailChange: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");
  const [message, setMessage] = useState<string>("Confirming your new email…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsError(true);
      setMessage("Missing confirmation link. Request a new email change from Settings.");
      return;
    }

    let cancelled = false;
    (async () => {
      const resp = await userServices.confirmEmailChange(token);
      if (cancelled) return;
      if (resp.ok && resp.data?.email) {
        setIsError(false);
        setMessage(
          `Your sign-in email is now ${resp.data.email}. You can close this tab and log in with the new address.`
        );
        setTimeout(() => navigate("/"), 4000);
      } else {
        setIsError(true);
        setMessage(resp.error || "This link is invalid or has expired.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <div className="d-flex min-vh-100 justify-content-center align-items-center bg-black text-white px-3">
      <div
        className="card border-0 p-4"
        style={{
          maxWidth: "28rem",
          background: "#0f1024",
          border: "2px solid #00e5ff",
          borderRadius: "16px",
        }}
      >
        <h1 className="h5 mb-3" style={{ color: "#00e5ff" }}>
          PlayerLink
        </h1>
        <p className={`mb-0 ${isError ? "text-danger" : "text-light"}`}>{message}</p>
        {!token && (
          <button type="button" className="btn btn-outline-info mt-4" onClick={() => navigate("/")}>
            Home
          </button>
        )}
      </div>
    </div>
  );
};
