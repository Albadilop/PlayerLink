import React from "react";
import logoApp from "../assets/img/logos/logo-app.png";
import "./navbarHome.css";
import "../components/ResetPassword/ResetPassword.css";
import { Register } from "./Register/Register";
import { SignIn } from "./SignIn/SignIn";
import { ResetPassword } from "../components/ResetPassword/ResetPassword";
import { Terms } from "./Terms/Terms";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { AuthFormData } from "./Forms/AuthForm";

export const NavbarHome: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState<boolean>(true);
  const navigate = useNavigate();
  const { store } = useGlobalReducer();
  const pendingFormDataRef = useRef<AuthFormData | null>(null);
  const registerSubmitRef = useRef<((formData: AuthFormData) => Promise<void>) | null>(null);

  // Para que siempre se muestre Sing-In el primero
  useEffect(() => {
    const modalElement = document.getElementById("startModal");

    const handleShow = () => {
      setShowSignIn(true);
    };

    if (modalElement) {
      modalElement.addEventListener("show.bs.modal", handleShow);
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener("show.bs.modal", handleShow);
      }
    };
  }, []);

  // Escuchar el evento de términos aceptados a nivel global
  useEffect(() => {
    const handleTermsAccepted = (_e: CustomEvent) => {
      console.log("📢 Terms accepted event received in NavbarHome");

      // Esperar un poco para que el modal de términos se cierre completamente
      setTimeout(() => {
        const formData = pendingFormDataRef.current;
        const submitHandler = registerSubmitRef.current;

        console.log("🔍 Checking for pending form data and submit handler:", {
          formData,
          hasHandler: !!submitHandler,
        });

        if (formData && submitHandler) {
          console.log("🚀 Auto-submitting form after terms acceptance");

          // Cerrar el modal de register
          const registerModalElement = document.getElementById("startModal");
          if (registerModalElement && window.bootstrap?.Modal) {
            // @ts-ignore - Bootstrap modal type not available
            const registerModal = window.bootstrap.Modal.getInstance(registerModalElement);
            if (registerModal) {
              console.log("🔒 Closing register modal");
              registerModal.hide();
            }
          }

          // Esperar un poco más para que el modal se cierre antes de hacer el submit
          setTimeout(() => {
            console.log("✅ Submitting form with data:", formData);
            submitHandler(formData);
            pendingFormDataRef.current = null;
            registerSubmitRef.current = null;
          }, 300);
        } else {
          console.warn("⚠️ No pending form data or submit handler found");
        }
      }, 200);
    };

    window.addEventListener("termsAccepted", handleTermsAccepted as unknown as (e: Event) => void);

    return () => {
      window.removeEventListener(
        "termsAccepted",
        handleTermsAccepted as unknown as (e: Event) => void
      );
    };
  }, []);

  const handleStartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Si el usuario ya está autenticado, navegar directamente sin abrir el modal
    if (store.user && store.user !== "undefined") {
      e.preventDefault();
      e.stopPropagation();
      // Cerrar el modal si está abierto
      const modalElement = document.getElementById("startModal");
      if (modalElement && window.bootstrap?.Modal) {
        // @ts-ignore - Bootstrap modal type not available
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
      navigate("/private/profile");
      return;
    }
    // Si no hay usuario, dejar que Bootstrap abra el modal normalmente
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-black navbar-home-font border-bottom ">
        <div className="container-fluid">
          {/* Logo y nombre de la app */}
          <div className="d-flex align-items-center">
            <a className="navbar-brand" href="#" />
            <img
              src={logoApp}
              alt="App Logo"
              className="d-inline-block align-text-top logo-navbar-home"
            ></img>
            <a className="navbar-brand navbar-home-font navbar-home-font-shadow " href="#">
              PLAYERLINK
            </a>
          </div>
          {/* boton fuera del collapse */}
          <button
            className="navbar-toggler border-2 navbar-home-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          {/*collapse del navbar */}
          <div
            className="collapse navbar-collapse navbar-home-collapse border-2 navbar-home-toggler"
            id="navbarNav"
          >
            <div className="d-flex align-items-center justify-content-around ms-5">
              <ul className="navbar-nav">
                <div className="d-flex justify-content-around align-self-center">
                  <li className="nav-item">
                    <a className="nav-link navbar-home-font me-5" href="#howitworks">
                      How It Works
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link active navbar-home-font me-5"
                      aria-current="page"
                      href="#bestpractices"
                    >
                      Best Practices
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link navbar-home-font me-5" href="#aboutus">
                      About Us
                    </a>
                  </li>
                </div>
                <li className="nav-item">
                  <div className="navbar-home-start-container">
                    {/* Modal button */}
                    <button
                      type="button"
                      className="btn navbar-home-font navbar-home-btn pulsate-bck"
                      {...(store.user && store.user !== "undefined"
                        ? {}
                        : { "data-bs-toggle": "modal", "data-bs-target": "#startModal" })}
                      onClick={handleStartClick}
                    >
                      START
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* modal START body */}
      <div
        className="modal fade"
        id="startModal"
        tabIndex={-1}
        aria-labelledby="startModalLabel"
        aria-hidden="true"
        data-bs-backdrop="false"
      >
        <div className="modal-dialog ">
          <div className="modal-content modal-home ">
            <div className="modal-header border-0 mt-2">
              <div className="modal-body d-flex">
                <div>
                  {showSignIn ? (
                    <SignIn onSwitch={() => setShowSignIn(false)} />
                  ) : (
                    <Register
                      onSwitch={() => setShowSignIn(true)}
                      onFormDataReady={(formData, submitHandler) => {
                        pendingFormDataRef.current = formData;
                        registerSubmitRef.current = submitHandler;
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* modal RESET password body */}
      <div>
        <div
          className="modal fade"
          id="forgotPasswordModal"
          tabIndex={-1}
          aria-labelledby="forgotPasswordModal"
          aria-hidden="true"
          data-bs-backdrop="false"
        >
          <div className="modal-dialog ">
            <div className="modal-content modal-home ">
              <div className="modal-header border-0 mt-2">
                <div className="modal-body d-flex">
                  <ResetPassword />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Componente Terms renderizado aquí para que no se desmonte */}
      <Terms
        onAccept={() => {
          // Este callback se manejará desde Register usando eventos o estado global
          console.log("Terms accepted from NavbarHome");
        }}
      />
    </>
  );
};
