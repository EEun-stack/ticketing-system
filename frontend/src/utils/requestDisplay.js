function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getRequestTitle(request) {
  return (
    cleanText(request?.subject) ||
    cleanText(request?.requestSubType) ||
    cleanText(request?.requestType) ||
    "Untitled request"
  );
}

export function getRequestTypeLabel(request) {
  const requestType = cleanText(request?.requestType);
  const requestSubType = cleanText(request?.requestSubType);

  if (requestType && requestSubType) return `${requestType} - ${requestSubType}`;
  return requestType || requestSubType || "No request type";
}

export function getRequestDescription(request) {
  return cleanText(request?.description) || "No description provided.";
}
