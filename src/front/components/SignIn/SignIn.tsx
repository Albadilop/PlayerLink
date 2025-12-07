import React from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import { useState } from "react";
import userServices from "../../services/userServices";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { ERROR_MESSAGES, ROUTES } from "../../constants";
import { AuthForm, AuthFormData } from "../Forms/AuthForm";

interface SignInProps {
  onSwitch: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSwitch }) => {
  const { dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const [errorLogin, setErrorLogin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: AuthFormData) => {
    console.log("🟢 SignIn handleSubmit called", formData);
    setErrorLogin("");
    setIsLoading(true);

    try {
      console.log("🟡 Calling userServices.login...");
      const data = await userServices.login(formData);
      console.log("🟡 Login response:", data);

      if (data instanceof Error) {
        console.error("❌ Login returned Error:", data.message);
        setErrorLogin(data.message);
        return;
      }

      if (data && data.token) {
        console.log("✅ Token received, storing in localStorage");
        localStorage.setItem("token", data.token);

        // El backend puede devolver success como string 'true' o boolean true
        const success = data.success === true || data.success === "true";
        console.log("🟡 Success value:", data.success, "parsed as:", success);

        if (success) {
          console.log("🟡 Fetching user info...");

          // Esperar un momento para evitar rate limiting inmediato
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Intentar obtener información del usuario
          // Primero intentar sin forceRefresh para usar caché si está disponible
          let userInfo = await userServices.getUserInfo(0, false);
          console.log("🟡 getUserInfo response:", userInfo);

          // Si falla, esperar más tiempo y reintentar con forceRefresh
          if (userInfo instanceof Error) {
            console.warn(
              "⚠️ Primer intento falló, esperando 3 segundos y reintentando...",
              userInfo.message
            );
            await new Promise((resolve) => setTimeout(resolve, 3000));
            userInfo = await userServices.getUserInfo(0, true);
            console.log("🟡 getUserInfo retry response:", userInfo);
          }

          // Si aún falla, intentar usar datos del localStorage si están disponibles
          if (userInfo instanceof Error) {
            console.warn("⚠️ Segundo intento también falló, verificando localStorage...");
            const cachedUserStr = localStorage.getItem("user");
            if (cachedUserStr) {
              try {
                const cachedUser = JSON.parse(cachedUserStr);
                console.log("✅ Usando usuario del localStorage como fallback");
                dispatch({ type: "getUserInfo", payload: cachedUser });
                navigate(ROUTES.PROFILE);
                return;
              } catch (parseError) {
                console.error("❌ Error parsing cached user:", parseError);
              }
            }

            console.error("❌ getUserInfo failed after all retries:", userInfo.message);
            // If the error is rate limiting, show a friendlier message
            if (
              userInfo.message.includes("Too many requests") ||
              userInfo.message.includes("Demasiadas solicitudes")
            ) {
              setErrorLogin(
                "The server is busy. Please wait a few seconds and try logging in again."
              );
            } else {
              setErrorLogin(userInfo.message);
            }
            return;
          }

          if (userInfo && userInfo.user) {
            // The user is already saved in localStorage by getUserInfo
            const userStr = localStorage.getItem("user");
            console.log("🟡 User from localStorage:", userStr);

            if (userStr) {
              try {
                const userObj = JSON.parse(userStr);
                console.log("✅ Parsed user object, dispatching and navigating...");
                dispatch({ type: "getUserInfo", payload: userObj });
                navigate(ROUTES.PROFILE);
              } catch (parseError) {
                console.error("❌ Error parsing user data:", parseError);
                // If parse fails, use userInfo directly
                dispatch({ type: "getUserInfo", payload: userInfo.user });
                navigate(ROUTES.PROFILE);
              }
            } else {
              console.warn("⚠️ No user in localStorage, using userInfo directly");
              // If not in localStorage, use userInfo directly
              dispatch({ type: "getUserInfo", payload: userInfo.user });
              navigate(ROUTES.PROFILE);
            }
          } else {
            console.error("❌ Invalid userInfo format:", userInfo);
            setErrorLogin("Error getting user information");
          }
        } else {
          console.error("❌ Login failed - success is false");
          setErrorLogin(ERROR_MESSAGES.LOGIN_FAILED);
        }
      } else {
        console.error("❌ No token in response:", data);
        setErrorLogin("Incorrect email or password");
      }
    } catch (error) {
      console.error("❌ Login exception:", error);
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
