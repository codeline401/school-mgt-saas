import axios from "axios";

const envBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

if (import.meta.env.PROD && !envBaseUrl) {
  throw new Error("VITE_API_URL must be defined in production");
}

export const api = axios.create({
  baseURL: envBaseUrl ?? "http://localhost:5000",
  timeout: 10_000, // 10 secondes
});
