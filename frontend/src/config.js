const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = url.endsWith('/') ? url.slice(0, -1) : url;
