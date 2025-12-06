import { useNavigate } from 'react-router-dom';
import './Register.css';
import { useState, useEffect } from 'react';
import React from 'react';
import userServices from '../../services/userServices';
import useGlobalReducer from '../../hooks/useGlobalReducer';

interface RegisterProps {
  onSwitch: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitch }) => {
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();

  // Escuchar el evento de términos aceptados
  React.useEffect(() => {
    const handleTermsAccepted = (e: CustomEvent) => {
      console.log('📢 Terms accepted event received in Register');
      setIsTermsAccepted(true);
    };

    window.addEventListener('termsAccepted', handleTermsAccepted as EventListener);
    
    return () => {
      window.removeEventListener('termsAccepted', handleTermsAccepted as EventListener);
    };
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    repeatPassword: "",
  });

  const [errorPassword, setErrorPassword] = useState<string>(""); // estado para error si la contraseña no es la misma
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]); //estado para condiciones de la contraseña
  const [errorEmailRegistered, setErrorEmailRegistered] = useState<string>(""); // estado para el error de email ya registrado
  const [showTerms, setShowTerms] = useState<boolean>(false); // estado que muestra el modal de T&C
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(false); // estado para verificar si se acaptó o no los T&C
  const [showPassword, setShowPassword] = useState<boolean>(false); // estado para ver/ocultar la contraseña

  // Función para validar la contraseña y devolver qué condiciones faltan
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
    if (!/[0-9]/.test(password)) errors.push("a number");
    if (!/[@$!%*?&.]/.test(password)) errors.push("a special character (@$!%*?&.)");
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
      if (errors.length === 0) setErrorPassword("");
    }

    if (name === "repeatPassword") {
      if (value !== formData.password) {
        setErrorPassword("Passwords do not match");
      } else if (passwordErrors.length === 0) {
        setErrorPassword("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorPassword(""); // limpia error de contraseña
    setErrorEmailRegistered(""); // limpia error del email

    // Validar contraseña antes de enviar
    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      setErrorPassword("Password does not meet the requirements.");
      return;
    }

    if (formData.password !== formData.repeatPassword) { //comprueba que la contraseña sea igual
      setErrorPassword("Passwords do not match");
      return;
    }

    // Muestra los T&C si aún no han sido aceptados
    if (!isTermsAccepted) {
      setShowTerms(true);
      // Usar setTimeout para asegurar que el componente Terms se haya renderizado
      setTimeout(() => {
        const modalElement = document.getElementById('TermsAndConditionsModal');
        if (modalElement && window.bootstrap?.Modal) {
          // @ts-ignore - Bootstrap modal type not available
          // Usar getOrCreateInstance para evitar crear múltiples instancias
          const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
          });
          modal.show();
        }
      }, 150);
      return;
    }

    userServices.register(formData).then(async (data) => {
      if (data && data.success) {
        localStorage.setItem('token', data.token);
        const user = await userServices.getUserInfo();
        await dispatch({ type: 'getUserInfo', payload: user });
        navigate('/private/profile');
      } else {
        setErrorEmailRegistered("Email already registered");
      }
    }).catch((err) => {
      console.error("Error en registro:", err);
      setErrorEmailRegistered("Error inesperado. Intenta de nuevo.");
    });
  };

  const handleTermsAccepted = () => {
    console.log('✅ Terms accepted in Register');
    setIsTermsAccepted(true);
    // No navegar aquí, dejar que el usuario continúe con el registro
  };

  return (
    <div className='d-flex justify-content-center'>
      <div className='card register-card mt-5'>
        <div className="card-body">
          <div className="d-flex mb-1">
            <button type="button" className="btn-close btn-close-modal" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <h2 className="card-title text-center">Create an account</h2>
          <h6 className="card-subtitle mb-2 register-card-subtitle text-end me-4 pe-2 mb-3">
            Already have an account?
            <button type="button" onClick={onSwitch} className="btn btn-link register-card-subtitle ps-1">Sign In</button>
          </h6>

          <form onSubmit={handleSubmit}>
            <div className="mx-4">
              <div>
                <label htmlFor="register-email" className="form-label mb-0 mt-2">Email</label>
              </div>

              <input 
                type="email" 
                id="register-email"
                name="email" 
                placeholder="email" 
                value={formData.email} 
                onChange={handleChange} 
                className='w-100 border-0 rounded-2 btn-register-card-border'
                autoComplete="email"
              />

              {errorEmailRegistered && <h5 className="text-danger mt-2 register-message-errors">{errorEmailRegistered}</h5>}
              <div>
                <label htmlFor="register-password" className="form-label mt-2 mb-0">Password</label>
              </div>
              <div className="d-flex btn-register-card-border rounded-2">
                <input
                  type={showPassword ? "text" : "password"}
                  id="register-password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-100 border-0"
                  autoComplete="new-password"
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
                <h5 className="text-warning mt-2 register-message-errors">
                  Password must contain {passwordErrors.join(", ")}. 
                </h5>
              )}

              <div>
                <label htmlFor="register-repeat-password" className="form-label mb-0 mt-2">Repeat Password</label>
              </div>
              <div>
                <input 
                  type="password" 
                  id="register-repeat-password"
                  name="repeatPassword" 
                  placeholder="password" 
                  value={formData.repeatPassword} 
                  onChange={handleChange} 
                  className="w-100 rounded-2 btn-register-card-border"
                  autoComplete="new-password"
                />
              </div>
              {/* Mensaje si la contraseña no es la misma */}
              {errorPassword && <h5 className="text-danger mt-2 register-message-errors">{errorPassword}</h5>}
              <input type="submit" value="Continue" className='w-100 rounded-2 mt-4 text-white bg-black btn-register-card-border' />
            </div>
          </form>
        </div>
      </div>

      {/* Terms ahora se renderiza en NavbarHome para evitar desmontajes */}
    </div>
  );
};


