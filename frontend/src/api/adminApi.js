import { api } from "./config";

export async function adminFetch(path, options = {}) {
  try {
    const { body, data, ...rest } = options;

    const { data: responseData } = await api.request({
      url: path,
      ...rest,
      data: data ?? body,
      headers: {
        "Content-Type": "application/json",
        ...rest.headers,
      },
    });

    return responseData;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Request failed.";

    throw new Error(message);
  }
}
