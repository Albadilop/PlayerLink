// Helper function to normalize URL (remove trailing slash and add single slash)
export const normalizeUrl = (baseUrl: string | undefined, path: string | undefined): string => {
  const base = baseUrl?.replace(/\/+$/, "") || ""; // Remove trailing slashes
  const cleanPath = path?.replace(/^\/+/, "") || ""; // Remove leading slashes
  return `${base}/${cleanPath}`;
};
