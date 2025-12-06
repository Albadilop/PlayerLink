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
    console.log('🟢 SignIn handleSubmit called', formData);
    setErrorLogin("");
    setIsLoading(true);

    try {
      console.log('🟡 Calling userServices.login...');
      const data = await userServices.login(formData);
      console.log('🟡 Login response:', data);
      
      if (data instanceof Error) {
        console.error('❌ Login returned Error:', data.message);
        setErrorLogin(data.message);
        return;
      }

      if (data && data.token) {
        console.log('✅ Token received, storing in localStorage');
        localStorage.setItem('token', data.token);
        
        // El backend puede devolver success como string 'true' o boolean true
        const success = data.success === true || data.success === 'true';
        console.log('🟡 Success value:', data.success, 'parsed as:', success);
        
        if (success) {
          console.log('🟡 Fetching user info...');
          // Obtener información del usuario
          const userInfo = await userServices.getUserInfo();
          console.log('🟡 getUserInfo response:', userInfo);
          
          if (userInfo instanceof Error) {
            console.error('❌ getUserInfo failed:', userInfo.message);
            setErrorLogin(userInfo.message);
            return;
          }

          if (userInfo && userInfo.user) {
            // El user ya está guardado en localStorage por getUserInfo
            const userStr = localStorage.getItem('user');
            console.log('🟡 User from localStorage:', userStr);
            
            if (userStr) {
              try {
                const userObj = JSON.parse(userStr);
                console.log('✅ Parsed user object, dispatching and navigating...');
                dispatch({ type: 'getUserInfo', payload: userObj });
                navigate(ROUTES.PROFILE);
              } catch (parseError) {
                console.error('❌ Error parsing user data:', parseError);
                setErrorLogin(ERROR_MESSAGES.GENERIC_ERROR);
              }
            } else {
              console.error('❌ No user found in localStorage');
              setErrorLogin(ERROR_MESSAGES.GENERIC_ERROR);
            }
          } else {
            console.error('❌ Invalid userInfo format:', userInfo);
            setErrorLogin('Error al obtener información del usuario');
          }
        } else {
          console.error('❌ Login failed - success is false');
          setErrorLogin(ERROR_MESSAGES.LOGIN_FAILED);
        }
      } else {
        console.error('❌ No token in response:', data);
        setErrorLogin("Incorrect email or password");
      }
    } catch (error) {
      console.error('❌ Login exception:', error);
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
