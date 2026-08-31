import { api } from "./config";

export async function adminFetch(path, options = {}) {
  try {
    const { data } = await api.request({
      url: path,
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Request failed.";

    throw new Error(message);
  }
}
