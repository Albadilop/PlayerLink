import type { StylesConfig } from "react-select";

type StringOption = { value: string; label: string };

/** Estilos del desplegable Gender/Zodiac del perfil (react-select), reutilizables en Onboarding. */
export const profileInfoSelectStyles: StylesConfig<StringOption, false> = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({
    ...base,
    background: "linear-gradient(145deg, #0e0e1a, #1a1a2f)",
    border: "2px solid #7f00ff",
    borderRadius: "10px",
    boxShadow:
      "0 10px 30px rgba(127, 0, 255, 0.4), 0 0 20px rgba(0, 240, 255, 0.2), inset 0 0 20px rgba(127, 0, 255, 0.1)",
    marginTop: "0.5rem",
    overflow: "hidden",
  }),
  menuList: (base) => ({
    ...base,
    padding: "0.5rem",
    maxHeight: "300px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "rgba(127, 0, 255, 0.3)"
      : state.isFocused
        ? "rgba(0, 240, 255, 0.15)"
        : "transparent",
    background: state.isSelected
      ? "linear-gradient(90deg, rgba(127, 0, 255, 0.3), rgba(0, 240, 255, 0.3))"
      : undefined,
    color: state.isSelected || state.isFocused ? "#00f0ff" : "#ffffff",
    padding: "0.75rem 1rem",
    cursor: "pointer",
    borderRadius: "6px",
    margin: "0.25rem 0",
    fontWeight: state.isSelected ? 600 : 400,
    textShadow: state.isFocused ? "0 0 5px rgba(0, 240, 255, 0.5)" : "none",
    "&:hover": {
      backgroundColor: "rgba(0, 240, 255, 0.1)",
      color: "#00f0ff",
    },
  }),
  control: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.4)",
    border: "2px solid",
    borderColor: state.isFocused
      ? "#00f0ff"
      : (state as { isHovered?: boolean }).isHovered
        ? "#8f00ff"
        : "rgba(0, 240, 255, 0.3)",
    borderRadius: "10px",
    boxShadow: state.isFocused
      ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 240, 255, 0.3), 0 0 25px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.05)"
      : (state as { isHovered?: boolean }).isHovered
        ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 15px rgba(143, 0, 255, 0.3)"
        : "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 240, 255, 0.2)",
    minHeight: "40px",
    cursor: "pointer",
  }),
  placeholder: (base) => ({
    ...base,
    color: "rgba(255, 255, 255, 0.4)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#ffffff",
    fontWeight: 500,
  }),
  input: (base) => ({
    ...base,
    color: "#ffffff",
    caretColor: "#00f0ff",
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "rgba(127, 0, 255, 0.3)",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#7f00ff",
    "&:hover": {
      color: "#00f0ff",
    },
  }),
};
