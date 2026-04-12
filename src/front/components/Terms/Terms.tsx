import "./Terms.css";
import React, { useState, useEffect, useRef } from "react";

interface TermsProps {
  onAccept: () => void;
}

const TermsComponent: React.FC<TermsProps> = ({ onAccept }) => {
  const [accepted, setAccepted] = useState<boolean>(false);
  const declineButtonRef = useRef<HTMLButtonElement>(null);

  // Función para el botón Guardar que solo funciona si está aceptado
  const handleSave = () => {
    console.log("🔘 Accept button clicked, accepted:", accepted);
    if (accepted && onAccept) {
      console.log("✅ Terms accepted, dispatching event");

      // Cerrar el modal primero
      const modalElement = document.getElementById("TermsAndConditionsModal");
      if (modalElement) {
        // @ts-ignore - Bootstrap modal type not available
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          console.log("🔒 Closing terms modal");
          modal.hide(); // cierra el modal porque si se aceptó
        }
      }

      // Esperar un poco antes de disparar el evento para que el modal se cierre
      setTimeout(() => {
        // Disparar evento personalizado para que Register lo escuche
        const event = new CustomEvent("termsAccepted", { detail: { accepted: true } });
        console.log("📢 Dispatching termsAccepted event");
        window.dispatchEvent(event);

        onAccept(); // Avisa de que se aceptaron los T&C
      }, 100);
    } else {
      console.warn("⚠️ Terms not accepted or onAccept not available");
    }
  };

  // Resetear el estado cuando el modal se muestra
  useEffect(() => {
    const modalElement = document.getElementById("TermsAndConditionsModal");

    if (!modalElement) {
      console.warn("TermsAndConditionsModal not found in DOM");
      return;
    }

    const handleShow = () => {
      // Resetear el estado cuando el modal se muestra
      setAccepted(false);
    };

    const handleHide = () => {
      // Antes de que el modal se oculte completamente, quitar el foco de cualquier elemento dentro
      if (modalElement) {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && modalElement.contains(activeElement)) {
          activeElement.blur();
        }
      }
    };

    const handleHidden = () => {
      // Después de que el modal se oculta, resetear el estado y asegurarse de que ningún elemento dentro tenga foco
      setAccepted(false);
      if (modalElement) {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && modalElement.contains(activeElement)) {
          activeElement.blur();
        }
        // Mover el foco al body si es necesario
        if (
          document.activeElement === modalElement ||
          modalElement.contains(document.activeElement)
        ) {
          document.body.focus();
        }
      }
    };

    // Agregar listeners
    modalElement.addEventListener("show.bs.modal", handleShow);
    modalElement.addEventListener("hide.bs.modal", handleHide);
    modalElement.addEventListener("hidden.bs.modal", handleHidden);

    return () => {
      modalElement.removeEventListener("show.bs.modal", handleShow);
      modalElement.removeEventListener("hide.bs.modal", handleHide);
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, []); // Solo ejecutar una vez al montar

  return (
    <>
      {/* <!-- Modal --> */}
      <div
        className="modal fade"
        id="TermsAndConditionsModal"
        tabIndex={-1}
        aria-labelledby="TermsAndConditionsModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content terms-border "
            style={{ position: "relative", zIndex: 1056 }}
          >
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="TermsAndConditionsModalLabel">
                Terms and Conditions
              </h1>
              <button
                type="button"
                className="btn-close terms-close-modal me-1"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body ms-2 ">
              <p>
                Welcome to PlayerLink, our platform for connecting gamers. By registering, you agree
                to the following terms and conditions. Please read them carefully before using our
                services.
              </p>

              <h5>1. Service Description</h5>
              <p>
                Our platform helps users discover and connect with other gamers based on shared
                interests, using details such as Steam ID, Discord username, language, zodiac sign,
                play style, and approximate location.
              </p>

              <h5>2. Privacy and Data Protection</h5>
              <p>
                All information provided will be handled according to our Privacy Policy and
                applicable data protection laws, including the General Data Protection Regulation
                (GDPR) where applicable. We will never share your Steam or Discord credentials with
                third parties without your explicit consent. You have the right to access, modify,
                or delete your personal data at any time through your account settings. We process
                your data solely for the purpose of providing and improving our matchmaking
                services.
              </p>

              <h5>3. User Conduct</h5>
              <p>
                Using the platform to harass, deceive, threaten, or harm other users is strictly
                prohibited. Prohibited behaviors include, but are not limited to: toxic behavior,
                racism, discrimination, hate speech, offensive language, fraudulent activities,
                impersonation, spamming, sharing inappropriate content, or any form of abuse. Users
                can report violations through the platform&apos;s reporting system. Any violation of
                these rules may result in warnings, temporary suspension, or permanent ban of your
                account, at our sole discretion.
              </p>

              <h5>4. Third-Party Integration</h5>
              <p>
                By connecting your Steam and Discord accounts, you authorize the app to access basic
                profile data to enhance the matchmaking experience.
              </p>

              <h5>5. Changes to the Service</h5>
              <p>
                We reserve the right to modify or discontinue the service at any time, with or
                without notice.
              </p>

              <h5>6. Account Deletion</h5>
              <p>
                You may delete your account at any time from your settings. We also reserve the
                right to suspend your access if you violate these terms.
              </p>

              <h5>7. Limitation of Liability</h5>
              <p>
                We are not responsible for any interactions that occur outside of the app, nor for
                disputes between users. Use the service at your own risk. To the maximum extent
                permitted by law, PlayerLink shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, or any loss of profits or revenues,
                whether incurred directly or indirectly, or any loss of data, use, goodwill, or
                other intangible losses resulting from your use of the service. This limitation does
                not apply to damages caused by our gross negligence or willful misconduct.
              </p>

              <h5>8. Age Requirement</h5>
              <p>
                You must be at least 18 years old to use PlayerLink. By registering, you represent
                and warrant that you are 18 years of age or older. If we discover that a user is
                under 18, we will immediately terminate their account and delete all associated
                data. We reserve the right to request proof of age at any time.
              </p>

              <h5>9. Intellectual Property</h5>
              <p>
                All content, features, and functionality of the PlayerLink platform, including but
                not limited to text, graphics, logos, icons, images, and software, are the exclusive
                property of PlayerLink and are protected by international copyright, trademark, and
                other intellectual property laws. You retain ownership of any content you upload to
                the platform, but by uploading content, you grant PlayerLink a worldwide,
                non-exclusive, royalty-free license to use, display, and distribute your content
                solely for the purpose of operating and promoting the service.
              </p>

              <h5>10. User-Generated Content</h5>
              <p>
                You are solely responsible for any content you post, upload, or share on the
                platform. You represent that you have all necessary rights to the content you submit
                and that it does not violate any third-party rights. We reserve the right to review,
                moderate, edit, or remove any user-generated content that violates these terms or is
                otherwise objectionable, without prior notice. We are not obligated to monitor user
                content but may do so at our discretion.
              </p>

              <h5>11. Cookie Policy</h5>
              <p>
                PlayerLink uses cookies and similar tracking technologies to enhance your
                experience, analyze usage patterns, and provide personalized content. We use
                essential cookies for authentication and security, functional cookies to remember
                your preferences, and analytics cookies to understand how you use our service. You
                can manage your cookie preferences through your browser settings, though disabling
                certain cookies may affect the functionality of the platform.
              </p>

              <h5>12. Governing Law and Jurisdiction</h5>
              <p>
                These Terms and Conditions shall be governed by and construed in accordance with the
                laws of the jurisdiction in which PlayerLink operates, without regard to its
                conflict of law provisions. Any disputes arising from or relating to these terms or
                the service shall be subject to the exclusive jurisdiction of the courts in that
                jurisdiction. If you are located in the European Union, you may also have the right
                to file a complaint with your local data protection authority.
              </p>

              <h5>13. Changes to Terms</h5>
              <p>
                We reserve the right to modify these Terms and Conditions at any time. Material
                changes will be notified to you via email or through a prominent notice on the
                platform at least 30 days before they take effect. Your continued use of the service
                after such changes constitutes your acceptance of the new terms. If you do not agree
                to the modified terms, you must stop using the service and may delete your account.
              </p>

              <p className="mt-4">
                If you have any questions, feel free to contact us at support@playerlink.com.
              </p>

              {/* Checkbox movido al modal-body para evitar problemas con modal-footer */}
              <div className="mt-4 pt-3 border-top">
                <div
                  className="form-check d-flex align-items-center"
                  onClick={() => {
                    setAccepted(!accepted);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <input
                    className="form-check-input me-2"
                    type="checkbox"
                    id="acceptTermsCheckbox"
                    checked={accepted}
                    onChange={(e) => {
                      setAccepted(e.target.checked);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      cursor: "pointer",
                      width: "20px",
                      height: "20px",
                      flexShrink: 0,
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="acceptTermsCheckbox"
                    style={{
                      cursor: "pointer",
                      userSelect: "none",
                      flex: 1,
                    }}
                  >
                    I have read and accept the Terms and Conditions
                  </label>
                </div>
              </div>
            </div>
            <div
              className="modal-footer"
              style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
            >
              {/* Botones */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn terms-decline-btn"
                  data-bs-dismiss="modal"
                  ref={declineButtonRef}
                  aria-label="Decline terms and conditions"
                >
                  Decline
                </button>
                <button
                  type="button"
                  className={`btn terms-accept-btn ${!accepted ? "disabled" : ""}`}
                  disabled={!accepted}
                  onClick={handleSave}
                  aria-label="Accept terms and conditions"
                  aria-disabled={!accepted}
                  style={{
                    opacity: accepted ? 1 : 0.6,
                    cursor: accepted ? "pointer" : "not-allowed",
                  }}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Memoizar el componente para evitar desmontajes innecesarios
export const Terms = React.memo(TermsComponent, (prevProps, nextProps) => {
  // Solo re-renderizar si onAccept cambia (aunque en la práctica no debería)
  return prevProps.onAccept === nextProps.onAccept;
});
