export const emptyRequestFilters = {
  dateFrom: "",
  dateTo: "",
  name: "",
  requestType: "",
  status: "",
  unit: "",
};

export function getRequestQuery(filters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    const text = String(value || "").trim();
    if (text) params.set(key, text);
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}
