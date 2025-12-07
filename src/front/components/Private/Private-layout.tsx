import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Private-sidebar";
import { PrivateNavbar } from "./Private-navbar";
import { useProfileCompletion } from "../../hooks/useProfileCompletion";
import "../Private/private-layout.css";

export const PrivateLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isComplete } = useProfileCompletion();

  useEffect(() => {
    const currentPath = location.pathname;

    // If profile is incomplete, only allow access to onboarding
    if (!isComplete) {
      if (currentPath !== "/private/onboarding") {
        navigate("/private/onboarding", { replace: true });
      }
    }
    // Removed automatic redirect when profile is complete - user must click "Continue" button
  }, [isComplete, location.pathname, navigate]);

  return (
    <div className="private-layout">
      <PrivateNavbar />
      <div className="private-layout-body">
        <Sidebar activePath={location.pathname} />
        <main className="private-content backgorundPrivateLayout">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
