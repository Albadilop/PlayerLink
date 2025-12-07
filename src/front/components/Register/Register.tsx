import { useNavigate } from "react-router-dom";
import "./Register.css";
import { useState, useEffect } from "react";
import React from "react";
import userServices from "../../services/userServices";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { AuthForm, AuthFormData } from "../Forms/AuthForm";

interface RegisterProps {
  onSwitch: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitch }) => {
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();
  const [errorEmailRegistered, setErrorEmailRegistered] = useState<string>("");
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  // Escuchar el evento de términos aceptados
  useEffect(() => {
    const handleTermsAccepted = (_e: CustomEvent) => {
      console.log("📢 Terms accepted event received in Register");
      setIsTermsAccepted(true);
    };

    window.addEventListener("termsAccepted", handleTermsAccepted as unknown as (e: Event) => void);

    return () => {
      window.removeEventListener(
        "termsAccepted",
        handleTermsAccepted as unknown as (e: Event) => void
      );
    };
  }, []);

  const showTermsModal = () => {
    // Usar setTimeout para asegurar que el componente Terms se haya renderizado
    setTimeout(() => {
      const modalElement = document.getElementById("TermsAndConditionsModal");
      if (modalElement && window.bootstrap?.Modal) {
        // @ts-ignore - Bootstrap modal type not available
        const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement, {
          backdrop: true,
          keyboard: true,
          focus: true,
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
        localStorage.setItem("token", data.token);

        // Esperar un momento para asegurar que el usuario esté completamente creado
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Intentar obtener la información del usuario con forceRefresh
        // y con retry en caso de rate limiting
        let userInfo = await userServices.getUserInfo(0, true);

        // Si falla, esperar un poco más y reintentar
        if (userInfo instanceof Error) {
          console.warn("Primer intento falló, esperando y reintentando...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          userInfo = await userServices.getUserInfo(0, true);
        }

        if (userInfo && !(userInfo instanceof Error) && userInfo.user) {
          // Guardar el usuario en localStorage si getUserInfo lo hizo
          const userStr = localStorage.getItem("user");
          if (userStr) {
            try {
              const userObj = JSON.parse(userStr);
              await dispatch({ type: "getUserInfo", payload: userObj });
              navigate("/private/onboarding");
            } catch (parseError) {
              console.error("Error parsing user data:", parseError);
              // Si falla el parse, usar directamente userInfo
              await dispatch({ type: "getUserInfo", payload: userInfo.user });
              navigate("/private/onboarding");
            }
          } else {
            // Si no está en localStorage, usar directamente userInfo
            await dispatch({ type: "getUserInfo", payload: userInfo.user });
            navigate("/private/onboarding");
          }
        } else {
          const errorMsg =
            userInfo instanceof Error ? userInfo.message : "Error getting user information";
          setErrorEmailRegistered(errorMsg);
          console.error("Error getting user information:", userInfo);
        }
      } else {
        const errorMsg = data instanceof Error ? data.message : "Email already registered";
        setErrorEmailRegistered(errorMsg);
      }
    } catch (err) {
      console.error("Error en registro:", err);
      const errorMsg = err instanceof Error ? err.message : "Error inesperado. Intenta de nuevo.";
      setErrorEmailRegistered(errorMsg);
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
