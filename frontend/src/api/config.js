import axios from "axios";

export const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const api = axios.create({
  baseURL: apiUrl || undefined,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});