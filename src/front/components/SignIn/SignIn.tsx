import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import { useState } from 'react';
import userServices from '../../services/userServices';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import { PASSWORD_RULES, ERROR_MESSAGES, ROUTES } from '../../constants';

interface SignInProps {
  onSwitch: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSwitch }) => {
  const { dispatch } = useGlobalReducer();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorLogin, setErrorLogin] = useState<string>(""); //estado para el error de email/contraseña no válido
  const [showPassword, setShowPassword] = useState<boolean>(false); // estado pra enseñar/esconder contraseña
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]); //estado para condiciones de la contraseña

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < PASSWORD_RULES.MIN_LENGTH) {
      errors.push(`at least ${PASSWORD_RULES.MIN_LENGTH} characters`);
    }
    if (PASSWORD_RULES.REQUIRES_UPPERCASE && !PASSWORD_RULES.VALIDATION_PATTERNS.UPPERCASE.test(password)) {
      errors.push("an uppercase letter");
    }
    if (PASSWORD_RULES.REQUIRES_NUMBER && !PASSWORD_RULES.VALIDATION_PATTERNS.NUMBER.test(password)) {
      errors.push("a number");
    }
    if (PASSWORD_RULES.REQUIRES_SPECIAL_CHAR && !PASSWORD_RULES.VALIDATION_PATTERNS.SPECIAL.test(password)) {
      errors.push(`a special character (${PASSWORD_RULES.SPECIAL_CHARS})`);
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorLogin(""); //quita errores previos

    try {
      const data = await userServices.login(formData);
      if (data && !(data instanceof Error) && data.token) {
        localStorage.setItem('token', data.token);
        if (data.success) {
          // Obtener información del usuario
          const userInfo = await userServices.getUserInfo();
          if (userInfo && !(userInfo instanceof Error)) {
            // El user ya está guardado en localStorage por getUserInfo
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const userObj = JSON.parse(userStr);
                dispatch({ type: 'getUserInfo', payload: userObj });
                navigate(ROUTES.PROFILE);
              } catch (parseError) {
                console.error('Error parsing user data:', parseError);
                setErrorLogin(ERROR_MESSAGES.GENERIC_ERROR);
              }
            } else {
              setErrorLogin(ERROR_MESSAGES.GENERIC_ERROR);
            }
          } else {
            // Si getUserInfo falla, mostrar el mensaje de error específico
            const errorMessage = userInfo instanceof Error 
              ? userInfo.message 
              : 'Error al obtener información del usuario';
            console.error('getUserInfo failed:', errorMessage);
            // No limpiar el token inmediatamente, podría ser un error temporal
            setErrorLogin(errorMessage);
          }
        } else {
          setErrorLogin(ERROR_MESSAGES.LOGIN_FAILED);
        }
      } else {
        setErrorLogin("Incorrect email or password");
      }
    } catch (error) {
      console.error('Login failed', error);
      setErrorLogin(ERROR_MESSAGES.GENERIC_ERROR);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
  };

  return (
    <>
      <div className='d-flex justify-content-center'>
        <div className='card sign-in-card mt-5'>
          <div className="card-body">
            <div className="d-flex">
              <button
                type="button"
                className="btn-close btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setErrorLogin("");
                  setPasswordErrors([]);
                  setFormData({ email: "", password: "" });
                  setShowPassword(false);
                }}
              ></button>
            </div>
            <h2 className="card-title text-center">Sign In</h2>
            <h6 className="card-subtitle mb-2 sign-in-card-subtitle text-end me-4 pe-2 mb-3">
              Need an account
              <button type="button" onClick={onSwitch} className="btn btn-link sign-in-card-subtitle ps-1">Register</button>
            </h6>

            <form onSubmit={handleSubmit}>
              <div className="mx-4">
                <div>
                  <label htmlFor="basic-url" className="form-label mb-0 mt-2">Email</label>
                </div>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  className='w-100 border-0 rounded-2 border-1 btn-sign-in-card-border'
                  autoComplete="email"
                />
                <div>
                  <label htmlFor="basic-url" className="form-label mt-3 mb-0">Password</label>
                </div>
                <div>
                  <div className="d-flex btn-register-card-border rounded-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-100 border-0 "
                      autoComplete="current-password"
                    />
                    <span
                      className="input-group-text border-0 bg-white"
                      onClick={() => setShowPassword(prev => !prev)}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </span>
                  </div>
                  {/* Mensaje con las condiciones contraseña que faltan */}
                  {passwordErrors.length > 0 && (
                    <h5 className="text-danger mt-2 register-message-errors">
                      Password must contain {passwordErrors.join(", ")}.
                    </h5>
                  )}

                  <div className="form-text sign-in-password-subtitle" id="basic-addon4">
                    Forgot your password? It's ok{" "}
                    <a
                      href="#"
                      data-bs-toggle="modal"
                      data-bs-target="#forgotPasswordModal"
                      data-bs-dismiss="modal"
                    >
                      click here
                    </a>
                  </div>

                  {errorLogin && <h5 className="text-danger mt-2 sign-in-message-errors">{errorLogin}</h5>}
                </div>
                <input type="submit" value="Continue" className='w-100 rounded-2 mt-5 text-white bg-black btn-sign-in-card-border' />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

