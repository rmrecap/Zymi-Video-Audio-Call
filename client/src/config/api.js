// Centralized API base URL — reads from Vite env var, falls back to localhost:5001 (dev server port)
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
