import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Private-sidebar";
import { PrivateNavbar } from "./Private-navbar";
import "../Private/private-layout.css";

export const PrivateLayout: React.FC = () => {
  const location = useLocation();

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


