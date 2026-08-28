import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "../api/adminApi";
import { getRequestTitle } from "../utils/requestDisplay";

const viewedRequestsKey = "ticketing_viewed_request_ids";
const knownRequestsKey = "ticketing_known_request_ids";

function readStoredIds(key) {
  if (typeof localStorage === "undefined") return new Set();

  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}

function saveStoredIds(key, ids) {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(key, JSON.stringify([...ids]));
}

function hasStoredIds(key) {
  return typeof localStorage !== "undefined" && localStorage.getItem(key) !== null;
}

function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function showDesktopNotifications(requests) {
  if (
    getNotificationPermission() !== "granted" ||
    localStorage.getItem("desktopNotificationsEnabled") === "false"
  ) return;

  requests.slice(0, 3).forEach((request) => {
    new Notification("New support request", {
      body: `${request.employeeName}: ${getRequestTitle(request)}`,
      tag: `support-request-${request.id}`,
    });
  });
}

function showNotificationTest() {
  if (getNotificationPermission() !== "granted") return false;

  new Notification("Desktop notifications enabled", {
    body: "You will be notified when a new support request arrives.",
    tag: "support-request-notification-test",
  });
  return true;
}

function useRequestNotifications(enabled) {
  const [requests, setRequests] = useState([]);
  const [viewedIds, setViewedIds] = useState(() =>
    readStoredIds(viewedRequestsKey)
  );
  const [permission, setPermission] = useState(getNotificationPermission);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("desktopNotificationsEnabled") !== "false"
  );
  const knownIdsRef = useRef(readStoredIds(knownRequestsKey));
  const hasKnownIdsRef = useRef(hasStoredIds(knownRequestsKey));

  const loadRequests = useCallback(async () => {
    if (!enabled) return;

    const nextRequests = await adminFetch("/api/admin/requests");
    const nextIds = new Set(nextRequests.map((request) => request.id));
    const newRequests = hasKnownIdsRef.current
      ? nextRequests.filter((request) => !knownIdsRef.current.has(request.id))
      : [];

    setRequests(nextRequests);
    knownIdsRef.current = nextIds;
    hasKnownIdsRef.current = true;
    saveStoredIds(knownRequestsKey, nextIds);
    if (notificationsEnabled) showDesktopNotifications(newRequests);
  }, [enabled, notificationsEnabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    loadRequests().catch(() => {});
    const interval = window.setInterval(() => {
      loadRequests().catch(() => {});
    }, 10000);

    return () => window.clearInterval(interval);
  }, [enabled, loadRequests]);

  const markAsViewed = useCallback((requestId) => {
    setViewedIds((current) => {
      const next = new Set(current);
      next.add(requestId);
      saveStoredIds(viewedRequestsKey, next);
      return next;
    });
  }, []);

  const markAllAsViewed = useCallback(() => {
    setViewedIds((current) => {
      const next = new Set(current);
      requests.forEach((request) => next.add(request.id));
      saveStoredIds(viewedRequestsKey, next);
      return next;
    });
  }, [requests]);

  const requestPermission = useCallback(async () => {
    if (getNotificationPermission() === "unsupported") {
      setPermission("unsupported");
      return "unsupported";
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    return nextPermission;
  }, []);

  const enableDesktopNotifications = useCallback(async () => {
    const nextPermission = await requestPermission();
    if (nextPermission === "granted") showNotificationTest();
    return nextPermission;
  }, [requestPermission]);

  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled((current) => {
      const next = !current;
      localStorage.setItem("desktopNotificationsEnabled", String(next));
      return next;
    });
  }, []);

  const unreadRequests = useMemo(
    () => requests.filter((request) => !viewedIds.has(request.id)),
    [requests, viewedIds]
  );

  const unreadRequestIds = useMemo(
    () => new Set(unreadRequests.map((request) => request.id)),
    [unreadRequests]
  );

  return {
    loadRequests,
    enableDesktopNotifications,
    notificationsEnabled,
    toggleNotifications,
    markAllAsViewed,
    markAsViewed,
    permission,
    requestPermission,
    requests,
    unreadCount: unreadRequests.length,
    unreadRequestIds,
    unreadRequests,
  };
}

export default useRequestNotifications;
