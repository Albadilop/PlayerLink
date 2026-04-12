import "./ResetPassword.css";
import { emailServices } from "../../services/emailServices";
import { useState, type FC, type FormEvent } from "react";

export const ResetPassword: FC = () => {
  const [email, setEmail] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setIsSending(true);
    try {
      const result = await emailServices.sendResetEmail(email);
      if (result.ok) {
        setEmailSent(true);
      } else {
        setEmailSent(false);
        setError(result.error);
      }
    } catch (err) {
      console.error("Error sending email:", err);
      setEmailSent(false);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div>
        <div className="d-flex justify-content-center">
          <div className="card reset-card mt-5">
            <div className="card-body">
              <div className="d-flex">
                <button
                  type="button"
                  className="btn-close btn-close-modal"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                    setError("");
                  }}
                ></button>
              </div>
              <h2 className="card-title mb-3 text-center">Recover password </h2>

              <h6 className="card-subtitle reset-card-subtitle mb-2 mb-3 d-flex justify-content-center pe-2 text-end">
                Enter your PlayerLink account email
              </h6>

              <div>
                <form onSubmit={handleSubmit}>
                  <div className="mx-4">
                    <div>
                      <label htmlFor="reset-password-email" className="form-label mb-0 mt-2">
                        Email
                      </label>
                    </div>
                    <input
                      type="email"
                      id="reset-password-email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="email address"
                      className="btn-reset-card-border w-100 rounded-2 border-0"
                      autoComplete="email"
                      disabled={isSending}
                    />
                    <br />

                    {emailSent && (
                      <h6 className="reset-message-errors mt-3 text-success">
                        If an account exists for that email, check your inbox (and spam) for a reset
                        link.
                      </h6>
                    )}
                    {error && (
                      <h6 className="reset-message-errors mt-3 text-danger" role="alert">
                        {error}
                      </h6>
                    )}

                    <input
                      type="submit"
                      value={isSending ? "Sending…" : "Send Reset Link"}
                      className="btn-reset-card-border mt-5 w-100 rounded-2 bg-black text-white"
                      disabled={isSending}
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
