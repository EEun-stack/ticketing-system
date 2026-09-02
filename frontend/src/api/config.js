import axios from "axios";

const defaultApiUrl = import.meta.env.DEV ? "http://localhost:5001" : "";

export const apiUrl = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, "");

export const api = axios.create({
  baseURL: apiUrl || undefined,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});