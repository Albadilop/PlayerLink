import { useNavigate } from "react-router-dom";
import "./Register.css";
import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import userServices from "../../services/userServices";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { AuthForm, AuthFormData } from "../Forms/AuthForm";

interface RegisterProps {
  onSwitch: () => void;
  onFormDataReady?: (
    formData: AuthFormData,
    submitHandler: (formData: AuthFormData) => Promise<void>
  ) => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitch, onFormDataReady }) => {
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();
  const [errorEmailRegistered, setErrorEmailRegistered] = useState<string>("");
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const pendingFormDataRef = useRef<AuthFormData | null>(null);

  const handleSubmit = useCallback(
    async (formData: AuthFormData) => {
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
                navigate("/private/profile");
              } catch (parseError) {
                console.error("Error parsing user data:", parseError);
                // Si falla el parse, usar directamente userInfo
                await dispatch({ type: "getUserInfo", payload: userInfo.user });
                navigate("/private/profile");
              }
            } else {
              // Si no está en localStorage, usar directamente userInfo
              await dispatch({ type: "getUserInfo", payload: userInfo.user });
              navigate("/private/profile");
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
    },
    [navigate, dispatch]
  );

  // Escuchar el evento de términos aceptados (solo para actualizar el estado local)
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

  const showTermsModal = useCallback(
    (formData?: AuthFormData) => {
      // Guardar los datos del formulario si se proporcionan
      if (formData) {
        console.log("💾 Saving form data before showing terms modal:", formData);
        pendingFormDataRef.current = formData;

        // Notificar al componente padre (NavbarHome) sobre los datos y el handler
        if (onFormDataReady) {
          onFormDataReady(formData, handleSubmit);
        }
      } else {
        console.warn("⚠️ No form data provided to showTermsModal");
      }

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
          console.log("📋 Showing terms modal");
          modal.show();
        } else {
          console.error("❌ Terms modal element not found");
        }
      }, 150);
    },
    [onFormDataReady, handleSubmit]
  );

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
