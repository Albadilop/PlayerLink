import './ResetPassword.css';
import { emailServices } from "../../services/emailServices";
import { useState } from "react";

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!email) return;

    emailServices.sendResetEmail(email)
      .then(() => {
        setEmailSent(true);
      })
      .catch((err) => {
        console.error("Error sending email:", err);
        setEmailSent(false);
      });
  };

  return (
    <>
      <div>
        <div className='d-flex justify-content-center'>
          <div className='card reset-card mt-5'>
            <div className="card-body">
              <div className="d-flex">
                <button 
                  type="button" 
                  className="btn-close btn-close-modal" 
                  data-bs-dismiss="modal" 
                  aria-label="Close" 
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                ></button>
              </div>
              <h2 className="card-title text-center mb-3">Recover password </h2>

              <h6 className="card-subtitle d-flex justify-content-center mb-2 reset-card-subtitle text-end pe-2 mb-3">
                Enter your PlayerLink account email
              </h6>

              <div>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                  <div className="mx-4">
                    <div>
                      <label htmlFor="reset-password-email" className="form-label mb-0 mt-2">Email</label>
                    </div>
                    <input 
                      type="email" 
                      id="reset-password-email"
                      name="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="email address" 
                      className='w-100 border-0 rounded-2 btn-reset-card-border'
                      autoComplete="email"
                    />
                    <br />

                    {emailSent && (
                      <h6 className="text-success mt-3 reset-message-errors">
                        Email sent! Check your inbox.
                      </h6>
                    )}

                    <input 
                      type="submit" 
                      value="Send Reset Link" 
                      className='w-100 rounded-2 mt-5 text-white bg-black btn-reset-card-border' 
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


