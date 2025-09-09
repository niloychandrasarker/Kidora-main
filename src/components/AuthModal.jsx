import { useState, useEffect } from "react";
import { X } from "lucide-react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

const AuthModal = ({ isOpen, onClose, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Disable overlay click-to-close to avoid accidental closes during signup/login
  const handleOverlayClick = () => {
    /* intentionally disabled overlay close */
  };

  return (
    <div 
      className="fixed inset-0 bg-black/10 backdrop-blur-sm md:backdrop-blur flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {mode === "login" ? (
            <LoginPage 
              onClose={onClose}
              switchToRegister={() => setMode("register")}
            />
          ) : (
            <RegisterPage 
              onClose={onClose}
              switchToLogin={() => setMode("login")}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
