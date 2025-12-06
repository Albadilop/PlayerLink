import './Terms.css';
import React, { useState, useEffect, useRef, useCallback } from "react";

interface TermsProps {
  onAccept: () => void;
}

const TermsComponent: React.FC<TermsProps> = ({ onAccept }) => {
  const [accepted, setAccepted] = useState<boolean>(false);
  const declineButtonRef = useRef<HTMLButtonElement>(null);



  // Función para el botón Guardar que solo funciona si está aceptado
  const handleSave = () => {
    if (accepted && onAccept) {
      // Disparar evento personalizado para que Register lo escuche
      const event = new CustomEvent('termsAccepted', { detail: { accepted: true } });
      window.dispatchEvent(event);
      
      onAccept();  // Avisa de que se aceptaron los T&C
      const modalElement = document.getElementById("TermsAndConditionsModal");
      if (modalElement) {
        // @ts-ignore - Bootstrap modal type not available
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide(); // cierra el modal porque si se aceptó
        }
      }
    }
  };

  // Resetear el estado cuando el modal se muestra
  useEffect(() => {
    const modalElement = document.getElementById("TermsAndConditionsModal");
    
    if (!modalElement) {
      console.warn('TermsAndConditionsModal not found in DOM');
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
        if (document.activeElement === modalElement || modalElement.contains(document.activeElement)) {
          document.body.focus();
        }
      }
    };

    // Agregar listeners
    modalElement.addEventListener('show.bs.modal', handleShow);
    modalElement.addEventListener('hide.bs.modal', handleHide);
    modalElement.addEventListener('hidden.bs.modal', handleHidden);
    
    return () => {
      modalElement.removeEventListener('show.bs.modal', handleShow);
      modalElement.removeEventListener('hide.bs.modal', handleHide);
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
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
          <div className="modal-content terms-border " style={{ position: 'relative', zIndex: 1056 }}>
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="TermsAndConditionsModalLabel">Terms and Conditions</h1>
              <button type="button" className="btn-close terms-close-modal me-1" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body ms-2 ">
              <p>
                Welcome to PlayerLInk, our platform for connecting gamers. By registering, you agree to the following terms and conditions. Please read them carefully before using our services.
              </p>

              <h5>1. Service Description</h5>
              <p>
                Our platform helps users discover and connect with other gamers based on shared interests, using details such as Steam ID, Discord username, language, zodiac sign, play style, and approximate location.
              </p>

              <h5>2. Privacy and Data Protection</h5>
              <p>
                All information provided will be handled according to our Privacy Policy. We will never share your Steam or Discord credentials with third parties without your consent.
              </p>

              <h5>3. User Conduct</h5>
              <p>
                Using the platform to harass, deceive, or harm other users is strictly prohibited. Any toxic, racist, offensive, or fraudulent behavior may result in your account being suspended or permanently banned.
              </p>

              <h5>4. Third-Party Integration</h5>
              <p>
                By connecting your Steam and Discord accounts, you authorize the app to access basic profile data to enhance the matchmaking experience.
              </p>

              <h5>5. Changes to the Service</h5>
              <p>
                We reserve the right to modify or discontinue the service at any time, with or without notice.
              </p>

              <h5>6. Account Deletion</h5>
              <p>
                You may delete your account at any time from your settings. We also reserve the right to suspend your access if you violate these terms.
              </p>

              <h5>7. Limitation of Liability</h5>
              <p>
                We are not responsible for any interactions that occur outside of the app, nor for disputes between users. Use the service at your own risk.
              </p>

              <p className="mt-4">If you have any questions, feel free to contact us at support@playerlink.com.</p>
              
              {/* Checkbox movido al modal-body para evitar problemas con modal-footer */}
              <div className="mt-4 pt-3 border-top">
                <div 
                  className="form-check d-flex align-items-center"
                  onClick={() => {
                    setAccepted(!accepted);
                  }}
                  style={{ cursor: 'pointer' }}
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
                      cursor: 'pointer',
                      width: '20px',
                      height: '20px',
                      flexShrink: 0
                    }}
                  />
                  <label 
                    className="form-check-label" 
                    htmlFor="acceptTermsCheckbox"
                    style={{ 
                      cursor: 'pointer',
                      userSelect: 'none',
                      flex: 1
                    }}
                  >
                    I have read and accept the Terms and Conditions
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              
              {/* Botones */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
                  className={`btn terms-accept-btn ${!accepted ? 'disabled' : ''}`}
                  disabled={!accepted}
                  onClick={handleSave}
                  aria-label="Accept terms and conditions"
                  aria-disabled={!accepted}
                  style={{ 
                    opacity: accepted ? 1 : 0.6,
                    cursor: accepted ? 'pointer' : 'not-allowed'
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


