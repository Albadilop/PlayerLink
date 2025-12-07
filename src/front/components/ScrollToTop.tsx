import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

// This component allows the scroll to go to the beginning when changing the view,
// otherwise it would remain in the position of the previous view.

interface ScrollToTopProps {
  children: ReactNode;
}

const ScrollToTop = ({ children }: ScrollToTopProps) => {
  const location = useLocation();
  const prevLocation = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevLocation.current) {
      window.scrollTo(0, 0);
    }
    prevLocation.current = location.pathname;
  }, [location.pathname]);

  return <>{children}</>;
};

export default ScrollToTop;
