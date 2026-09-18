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
    const isBoardRoom = request.type === "board-room"
    new Notification(isBoardRoom ? "New board room request" : "New support request", {
      body: isBoardRoom
        ? `${request.name}: ${new Date(request.date).toLocaleDateString()} at ${request.startTime}`
        : `${request.employeeName}: ${getRequestTitle(request)}`,
      tag: `${isBoardRoom ? "board-room" : "support-request"}-${request.id}`,
    });
  });
}

function notificationId(item) {
  return item.type === "board-room" ? `board-room-${item.id}` : item.id
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
  const [bookings, setBookings] = useState([]);
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

    const [nextRequests, nextBookings] = await Promise.all([
      adminFetch("/api/admin/requests"),
      adminFetch("/api/admin/board-room-bookings"),
    ]);
    const normalizedBookings = nextBookings.map((booking) => ({ ...booking, type: "board-room" }));
    const nextItems = [...nextRequests, ...normalizedBookings];
    const nextIds = new Set(nextItems.map(notificationId));
    const newRequests = hasKnownIdsRef.current
      ? nextItems.filter((item) => !knownIdsRef.current.has(notificationId(item)))
      : [];

    setRequests(nextRequests);
    setBookings(normalizedBookings);
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

  const markAsViewed = useCallback((requestOrId) => {
    const viewedId = typeof requestOrId === "object" ? notificationId(requestOrId) : requestOrId;
    setViewedIds((current) => {
      const next = new Set(current);
      next.add(viewedId);
      saveStoredIds(viewedRequestsKey, next);
      return next;
    });
  }, []);

  const markAllAsViewed = useCallback(() => {
    setViewedIds((current) => {
      const next = new Set(current);
      requests.forEach((request) => next.add(request.id));
      bookings.forEach((booking) => next.add(notificationId(booking)));
      saveStoredIds(viewedRequestsKey, next);
      return next;
    });
  }, [bookings, requests]);

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

  const unreadBookings = useMemo(
    () => bookings.filter((booking) => !viewedIds.has(notificationId(booking))),
    [bookings, viewedIds]
  );

  const unreadNotifications = useMemo(
    () => [...unreadRequests, ...unreadBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [bookings, unreadBookings, unreadRequests]
  );

  const unreadRequestIds = useMemo(
    () => new Set(unreadRequests.map((request) => request.id)),
    [unreadRequests]
  );

  const unreadBoardRoomIds = useMemo(
    () => new Set(unreadBookings.map((booking) => booking.id)),
    [unreadBookings]
  );

  const updateTabNotificationIndicator = useCallback(() => {
    if (typeof document === "undefined") return;

    const baseTitle = "Ticketing System";
    const nextTitle = unreadNotifications.length > 0 ? `(${unreadNotifications.length}) ${baseTitle}` : baseTitle;
    document.title = nextTitle;
  }, [unreadNotifications.length]);

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
    bookings,
    unreadBookings,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    unreadRequestCount: unreadRequests.length,
    unreadBoardRoomCount: unreadBookings.length,
    unreadRequestIds,
    unreadBoardRoomIds,
    unreadRequests,
    updateTabNotificationIndicator,
  };
}

export default useRequestNotifications;
