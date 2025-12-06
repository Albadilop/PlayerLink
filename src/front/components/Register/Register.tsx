import { useNavigate } from 'react-router-dom';
import './Register.css';
import { useState, useEffect } from 'react';
import React from 'react';
import userServices from '../../services/userServices';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import { AuthForm, AuthFormData } from '../Forms/AuthForm';

interface RegisterProps {
  onSwitch: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitch }) => {
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();
  const [errorEmailRegistered, setErrorEmailRegistered] = useState<string>("");
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  // Escuchar el evento de términos aceptados
  useEffect(() => {
    const handleTermsAccepted = (e: CustomEvent) => {
      console.log('📢 Terms accepted event received in Register');
      setIsTermsAccepted(true);
    };

    window.addEventListener('termsAccepted', handleTermsAccepted as EventListener);
    
    return () => {
      window.removeEventListener('termsAccepted', handleTermsAccepted as EventListener);
    };
  }, []);

  const showTermsModal = () => {
    setShowTerms(true);
    // Usar setTimeout para asegurar que el componente Terms se haya renderizado
    setTimeout(() => {
      const modalElement = document.getElementById('TermsAndConditionsModal');
      if (modalElement && window.bootstrap?.Modal) {
        // @ts-ignore - Bootstrap modal type not available
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement, {
          backdrop: true,
          keyboard: true,
          focus: true
        });
        modal.show();
      }
    }, 150);
  };

  const handleSubmit = async (formData: AuthFormData) => {
    setErrorEmailRegistered("");
    setIsLoading(true);

    try {
      const data = await userServices.register(formData);
      if (data && !(data instanceof Error) && data.success) {
        localStorage.setItem('token', data.token);
        const userInfo = await userServices.getUserInfo();
        if (userInfo && !(userInfo instanceof Error)) {
          await dispatch({ type: 'getUserInfo', payload: userInfo });
          navigate('/private/profile');
        } else {
          setErrorEmailRegistered("Error al obtener información del usuario");
        }
      } else {
        setErrorEmailRegistered("Email already registered");
      }
    } catch (err) {
      console.error("Error en registro:", err);
      setErrorEmailRegistered("Error inesperado. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrorEmailRegistered("");
  };

  return (
    <AuthForm
      mode="register"
      onSubmit={handleSubmit}
      onSwitch={onSwitch}
      error={errorEmailRegistered}
      isLoading={isLoading}
      showTermsModal={showTermsModal}
      isTermsAccepted={isTermsAccepted}
      onClose={handleClose}
    />
  );
};
