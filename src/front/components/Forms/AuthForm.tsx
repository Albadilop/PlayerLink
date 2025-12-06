import React, { useState } from 'react';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
import { validateEmail, validatePasswordMatch } from '../../utils/validators';
import '../SignIn/SignIn.css';
import '../Register/Register.css';
import './AuthForm.css';

export interface AuthFormData {
  email: string;
  password: string;
  repeatPassword?: string;
}

export interface AuthFormProps {
  mode: 'signin' | 'register';
  initialData?: Partial<AuthFormData>;
  onSubmit: (data: AuthFormData) => Promise<void> | void;
  onSwitch: () => void;
  error?: string;
  isLoading?: boolean;
  showTermsModal?: () => void;
  isTermsAccepted?: boolean;
  onClose?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  initialData = {},
  onSubmit,
  onSwitch,
  error,
  isLoading = false,
  showTermsModal,
  isTermsAccepted = true,
  onClose,
}) => {
  const [formData, setFormData] = useState<AuthFormData>({
    email: initialData.email || '',
    password: initialData.password || '',
    repeatPassword: initialData.repeatPassword || '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const { validatePassword } = usePasswordValidation();

  const isRegister = mode === 'register';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
    setEmailError('');

    if (name === 'password') {
      setFormData(prev => ({ ...prev, password: value }));
      // Validar contraseña solo en modo registro
      if (isRegister) {
        const result = validatePassword(value);
        setPasswordErrors(result.errors);
      } else {
        // En signin, limpiar errores de contraseña
        setPasswordErrors([]);
      }
    }

    if (name === 'email') {
      if (!validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }

    if (name === 'repeatPassword' && isRegister) {
      if (value !== formData.password) {
        setFormError('Passwords do not match');
      } else {
        setFormError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('🔵 Form submit triggered', { mode, formData, isRegister });
    setFormError('');
    setEmailError('');

    // Validar email
    if (!formData.email || !formData.email.trim()) {
      setEmailError('Email is required');
      console.log('❌ Email is empty');
      return;
    }

    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      console.log('❌ Email validation failed');
      return;
    }

    // Validar que la contraseña no esté vacía
    if (!formData.password || !formData.password.trim()) {
      setFormError('Password is required');
      console.log('❌ Password is empty');
      return;
    }

    // Validar contraseña solo en modo registro
    if (isRegister) {
      if (passwordErrors.length > 0) {
        setFormError('Password does not meet the requirements');
        console.log('❌ Password validation failed', passwordErrors);
        return;
      }
      
      // Validar match de contraseñas
      if (!validatePasswordMatch(formData.password, formData.repeatPassword || '')) {
        setFormError('Passwords do not match');
        console.log('❌ Passwords do not match');
        return;
      }

      // Mostrar modal de términos si no están aceptados
      if (!isTermsAccepted && showTermsModal) {
        showTermsModal();
        console.log('⚠️ Terms not accepted');
        return;
      }
    }

    console.log('✅ All validations passed, calling onSubmit');
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('❌ Error in onSubmit:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setFormError(errorMessage);
    }
  };

  const displayError = error || formError;

  return (
    <div className='d-flex justify-content-center'>
      <div className={`card ${mode === 'signin' ? 'sign-in-card' : 'register-card'} mt-5`}>
        <div className="card-body">
          <div className="d-flex mb-1">
            {onClose && (
              <button
                type="button"
                className="btn-close btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={onClose}
              />
            )}
          </div>
          <h2 className="card-title text-center">
            {isRegister ? 'Create an account' : 'Sign In'}
          </h2>
          <h6 className={`card-subtitle mb-2 ${mode === 'signin' ? 'sign-in-card-subtitle' : 'register-card-subtitle'} text-end me-4 pe-2 mb-3`}>
            {isRegister ? (
              <>
                Already have an account?{' '}
                <button type="button" onClick={onSwitch} className="btn btn-link register-card-subtitle ps-1">
                  Sign In
                </button>
              </>
            ) : (
              <>
                Need an account{' '}
                <button type="button" onClick={onSwitch} className="btn btn-link sign-in-card-subtitle ps-1">
                  Register
                </button>
              </>
            )}
          </h6>

          <form onSubmit={handleSubmit}>
            <div className="mx-4">
              <div>
                <label htmlFor={`${mode}-email`} className="form-label mb-0 mt-2">Email</label>
              </div>
              <input 
                type="email" 
                id={`${mode}-email`}
                name="email" 
                placeholder="email" 
                value={formData.email} 
                onChange={handleChange} 
                className={`w-100 border-0 rounded-2 border-1 ${isRegister ? 'btn-register-card-border' : 'btn-sign-in-card-border'}`}
                autoComplete="email"
                required
              />
              {emailError && <h5 className={`text-danger mt-2 ${isRegister ? 'register-message-errors' : 'sign-in-message-errors'}`}>{emailError}</h5>}

              <div className="mt-3">
                <label htmlFor={`${mode}-password`} className="form-label mb-0">
                  Password
                </label>
                <div className={`d-flex ${isRegister ? 'btn-register-card-border' : 'btn-sign-in-card-border'} rounded-2`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id={`${mode}-password`}
                    name="password"
                    placeholder="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-100 border-0"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    required
                  />
                  <span
                    className="input-group-text border-0 bg-white"
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </span>
                </div>
                {passwordErrors.length > 0 && (
                  <h5 className={`mt-2 ${isRegister ? 'register-message-errors' : 'sign-in-message-errors'} ${isRegister ? 'text-warning' : 'text-danger'}`}>
                    Password must contain {passwordErrors.join(", ")}.
                  </h5>
                )}
              </div>

              {isRegister && (
                <>
                  <div className="mt-2">
                    <label htmlFor={`${mode}-repeat-password`} className="form-label mb-0">
                      Repeat Password
                    </label>
                    <div className={`d-flex ${isRegister ? 'btn-register-card-border' : 'btn-sign-in-card-border'} rounded-2`}>
                      <input
                        type={showRepeatPassword ? "text" : "password"}
                        id={`${mode}-repeat-password`}
                        name="repeatPassword"
                        placeholder="password"
                        value={formData.repeatPassword || ''}
                        onChange={handleChange}
                        className="w-100 border-0 rounded-2"
                        autoComplete="new-password"
                        required
                      />
                      <span
                        className="input-group-text border-0 bg-white"
                        onClick={() => setShowRepeatPassword(prev => !prev)}
                        style={{ cursor: 'pointer' }}
                      >
                        <i className={`fa-solid ${showRepeatPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </span>
                    </div>
                  </div>
                </>
              )}

              {!isRegister && (
                <div className={`form-text ${isRegister ? 'register-password-subtitle' : 'sign-in-password-subtitle'} mt-2`} id="basic-addon4">
                  Forgot your password? It's ok{' '}
                  <a
                    href="#"
                    data-bs-toggle="modal"
                    data-bs-target="#forgotPasswordModal"
                    data-bs-dismiss="modal"
                  >
                    click here
                  </a>
                </div>
              )}

              {displayError && (
                <h5 className={`text-danger mt-2 ${isRegister ? 'register-message-errors' : 'sign-in-message-errors'}`}>
                  {displayError}
                </h5>
              )}

              <input 
                type="submit" 
                value="Continue" 
                className={`w-100 rounded-2 mt-4 text-white bg-black ${isRegister ? 'btn-register-card-border' : 'btn-sign-in-card-border'}`}
                disabled={isLoading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

