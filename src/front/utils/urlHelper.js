// Helper function to normalize URL (remove trailing slash and add single slash)
export const normalizeUrl = (baseUrl, path) => {
  const base = baseUrl?.replace(/\/+$/, '') || ''; // Remove trailing slashes
  const cleanPath = path?.replace(/^\/+/, '') || ''; // Remove leading slashes
  return `${base}/${cleanPath}`;
};

