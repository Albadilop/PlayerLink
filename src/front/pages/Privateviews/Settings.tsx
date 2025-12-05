import React, { useEffect, useState } from 'react';
import './Settings.css';
import userServices from "../../services/userServices";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useNavigate } from 'react-router-dom';
// import { ProfileConditions } from '../../components/ProfileConditions/ProfileConditions';
// import { ResetPassword } from '../../components/ResetPassword/ResetPassword';

interface EmailForm {
  actualEmail: string;
  email: string;
  confirmedEmail: string;
}

interface PasswordForm {
  actualPassword: string;
  password: string;
  confirmedPassword: string;
}

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  // const [showBreakModal, setShowBreakModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [email, setEmail] = useState<EmailForm>({
    actualEmail: '',
    email: '',
    confirmedEmail: ''
  });
  const [password, setPassword] = useState<PasswordForm>({
    actualPassword: '',
    password: '',
    confirmedPassword: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false); // estado para ver/ocultar la contraseña actual
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false); // estado para ver/ocultar la contraseña nueva
  const [errorPassword, setErrorPassword] = useState<string>(""); // estado para error si la contraseña no es la misma
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]); //estado para condiciones de la contraseña

  const [correctPassword, setCorrectPassword] = useState<string>(""); //estado para mensaje si la conrtaseña se cambió correctamente
  // const [emailVerification, setEmailVerification] = useState<string>(""); //estado para mensaje de verificación enviado
  const [sameEmail, setSameEmail] = useState<string>(""); // estado para mensaje de que el email sea el mismo
  const [emailChanged, setEmailChanged] = useState<string>(""); //estado para mensaje email cambiado correctamente
  const [errorEmailChange, setErrorEmailChange] = useState<string>(""); //estado mensaje error en el cambio de contraseña

  const { store, dispatch } = useGlobalReducer();

  useEffect(() => {
    if (!store.user) {
      navigate('/');
    }
  }, [navigate, store.user]);

  const submitEmailChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSameEmail("");
    setEmailChanged("");
    setErrorEmailChange("");

    if (email.email !== email.confirmedEmail) {
      setSameEmail("Emails must be the same");
      return;
    }

    if (email.actualEmail !== (store.user?.email || "")) {
      setSameEmail("Your current email is incorrect");
      return;
    }

    if (!store.user?.id) {
      setErrorEmailChange("User not found");
      return;
    }

    try {
      const resp = await userServices.changeUserEmail(store.user.id, email.email);

      if (!resp.ok) {
        setErrorEmailChange("Something happened, looks like this email already exists");
        return;
      }

      setSameEmail("");
      setErrorEmailChange("");
      setEmailChanged("Email updated successfully");

      setTimeout(() => {
        setShowEmailModal(false);
        setEmail({ actualEmail: '', email: "", confirmedEmail: "" });
        setEmailChanged("");
        dispatch({ type: 'logout' });
        navigate('/');
      }, 3000);

    } catch (error) {
      setErrorEmailChange("Failed to change the email. Please try again");
    }
  };

  const closeChangeEmailModal = () => {
    setShowEmailModal(false);
    setEmail({ actualEmail: '', email: "", confirmedEmail: "" });
    setSameEmail("");
    setEmailChanged("");
  };

  const deleteAccount = async (userId: string | number | undefined) => {
    if (!userId) return;
    
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(userIdNum)) return;
    
    const resp = await userServices.deleteAccount(userIdNum);

    if (!resp.ok) {
      alert(resp.error || "Failed to delete account");
      return;
    }

    alert("Account deleted successfully");

    setTimeout(() => {
      setShowDeleteModal(false);
      dispatch({ type: 'logout' });
      navigate('/');
    }, 3000);
  };

  const submitPasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorPassword("");
    setCorrectPassword("");
    if (password.actualPassword === password.password) {
      setErrorPassword("Passwords are the same");
      return;
    }
    if (password.password.length <= 0) {
      setErrorPassword("Passwords must contain data");
      return;
    }
    if (password.password !== password.confirmedPassword) {
      setErrorPassword("Passwords do not match");
      return;
    }

    try {
      if (!store.user?.id) {
        setErrorPassword("User not found");
        return;
      }
      
      const resp = await userServices.changeUserPassword(
        store.user.id,
        password.password,
        password.actualPassword
      );

      if (!resp.ok) {
        setErrorPassword(resp.error || "Error changing password");
        return;
      }

      setCorrectPassword("Password changed successfully");

      // Esperar 3 segundos para que el usuario vea el mensaje
      setTimeout(() => {
        closeChangePasswordModal();
        dispatch({ type: 'logout' });
        navigate('/');
      }, 3000);

    } catch (error) {
      setErrorPassword("Failed to change password. Please try again.");
    }
  };

  const closeChangePasswordModal = () => {
    setShowPasswordModal(false);
    setShowPassword(false); // ojo cerrado
    setShowNewPassword(false);
    setPassword({ actualPassword: "", password: "", confirmedPassword: "" }); // limpia inputs
    setErrorPassword(""); // limpia error
    setCorrectPassword(""); // limpia mensaje éxito
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name in email) {
      setEmail({
        ...email,
        [name]: value
      });
    }
    if (name in password) {
      setPassword({
        ...password,
        [name]: value
      });
    }
  };

  useEffect(() => {
    const errors: string[] = [];
    const pwd = password.password;

    if (pwd.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("an uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("a lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("a number");
    if (!/[^A-Za-z0-9]/.test(pwd)) errors.push("a special character");

    setPasswordErrors(errors);
  }, [password.password]);

  return (
    <div className="settings-container">
      <h2 className="settings-title">Settings</h2>

      <div className="settings-section">
        <button className="settings-btn" onClick={() => setShowEmailModal(true)}>Change Email</button>
        <button className="settings-btn" onClick={() => setShowPasswordModal(true)}>Change Password</button>
      </div>

      <div className="settings-warning">
        <h3>Delete Account</h3>
        <p>If you delete your account, all your data will be permanently erased after 30 days.</p>
        <div className="warning-buttons">
          <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>Delete Account</button>
        </div>
      </div>

      {/* Modales */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Change Email</h3>
            <form onSubmit={submitEmailChange}>
              <input type="email" placeholder="Current Email" name="actualEmail" value={email.actualEmail} onChange={handleChange} />
              <input type="email" placeholder="New Email" name="email" value={email.email} onChange={handleChange} />
              <input type="email" placeholder="Confirm New Email" name="confirmedEmail" value={email.confirmedEmail} onChange={handleChange} />
              {sameEmail && <h6 className="text-danger mt-1">{sameEmail}</h6>}
              {emailChanged && <h6 className="text-success mt-1">{emailChanged}</h6>}
              {errorEmailChange && <h6 className="text-danger mt-1">{errorEmailChange}</h6>}
              <div className="modal-actions">
                <button type="button" onClick={closeChangeEmailModal}>Cancel</button>
                <button type="submit" className="confirm-btn">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Change Password</h3>
            <form onSubmit={submitPasswordChange}>
              <div className='d-flex'>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Actual Password"
                    name="actualPassword"
                    value={password.actualPassword}
                    className='settings-change-password-input'
                    onChange={handleChange}
                  />
                  <i
                    onClick={() => setShowPassword(prev => !prev)}
                    className={`fa-solid setting-change-password-eye-icon ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    style={{ cursor: 'pointer' }}
                  ></i>
                </div>
              </div>
              <div className='d-flex'>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    name="password"
                    value={password.password}
                    className="settings-change-password-input"
                    onChange={handleChange}
                  />
                  <i
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className={`fa-solid setting-change-password-eye-icon ${showNewPassword ? "fa-eye-slash" : "fa-eye"}`}
                    style={{ cursor: 'pointer' }}
                  ></i>
                </div>
              </div>

              {/* Mensaje con las condiciones contraseña que faltan */}
              {passwordErrors.length > 0 && (
                <h5 className="text-warning mt-2 register-message-errors">
                  Password must contain {passwordErrors.join(", ")}.
                </h5>
              )}

              <input type="password" placeholder="Confirm New Password" name="confirmedPassword" value={password.confirmedPassword} onChange={handleChange} />
              {errorPassword && <h6 className="text-danger mt-1">{errorPassword}</h6>}
              {correctPassword && <h6 className="text-success mt-1">{correctPassword}</h6>}

              <div className="modal-actions">
                <button type="button" onClick={closeChangePasswordModal}>Cancel</button>
                <button type="submit" className="confirm-btn">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <h3>Are you sure?</h3>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)}>No</button>
              <button className="confirm-btn" onClick={() => deleteAccount(store.user?.id)}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;

