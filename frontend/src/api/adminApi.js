import { getAuthToken } from "../services/authStorage";
import { apiUrl } from "./config";

export async function adminFetch(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const result = isJson ? await response.json() : await response.text();

  if (!isJson) {
    throw new Error(
      `Expected JSON from ${path}, but the server returned ${response.status}.`
    );
  }

  if (!response.ok) throw new Error(result.message || "Request failed.");
  return result;
}
