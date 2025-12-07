import { useEffect, useState } from "react";

export const useAppAnimations = () => {
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("appAnimations");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("appAnimations", animationsEnabled.toString());

    // Apply or remove animations class to body
    const body = document.body;
    if (animationsEnabled) {
      body.classList.remove("no-animations");
      body.classList.add("animations-enabled");
    } else {
      body.classList.remove("animations-enabled");
      body.classList.add("no-animations");
    }

    // Cleanup on unmount
    return () => {
      body.classList.remove("no-animations", "animations-enabled");
    };
  }, [animationsEnabled]);

  return {
    animationsEnabled,
    setAnimationsEnabled,
  };
};
