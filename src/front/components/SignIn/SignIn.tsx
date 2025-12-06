import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import { useState } from 'react';
import userServices from '../../services/userServices';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import { ERROR_MESSAGES, ROUTES } from '../../constants';
import { AuthForm, AuthFormData } from '../Forms/AuthForm';

interface SignInProps {
  onSwitch: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSwitch }) => {
  const { dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const [errorLogin, setErrorLogin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: AuthFormData) => {
    setErrorLogin("");
    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrorLogin("");
  };

  return (
    <AuthForm
      mode="signin"
      onSubmit={handleSubmit}
      onSwitch={onSwitch}
      error={errorLogin}
      isLoading={isLoading}
      onClose={handleClose}
    />
  );
};
