import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Private_page: React.FC = () => {
  const navigate = useNavigate();
  const { store } = useGlobalReducer();

  useEffect(() => {
    if (!store.user) {
      navigate("/");
    } else {
      navigate("/private/profile");
    }
  }, [navigate, store.user]);

  return <div></div>;
};
