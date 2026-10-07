import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import { getStoredActiveTab, saveActiveTab } from "../services/authStorage";
import useSystemStatus from "../hooks/useSystemStatus";
import "../styles/admin.css";
import Dashboard from "./dashboard";
import Requests from "./request";
import AccountSettings from "./accountSettings";
import BoardCalendar from "./boardcalendar";
import BoardRoomBookings from "./boardRoomBookings";

function AdminHome({
  canEditResolved,
  currentUserId,
  currentUserRole,
  mobileSidebarOpen,
  notificationTargetRequestId,
  onNotificationTargetHandled,
  onRequestSelect,
  onMobileMenuClose,
  requestNotifications,
  sidebarCollapsed,
}) {
  const allowedTabs = ["dashboard", "calendar", "board-room-bookings", "requests", "account-settings"];
  const [activeTab, setActiveTab] = useState(() =>
    getStoredActiveTab("admin", allowedTabs)
  );
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]));
  const [requestView, setRequestView] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const { databaseStatus, isOnline } = useSystemStatus();
  const refresh = () => setRefreshKey((value) => value + 1);
  const selectTab = (tab) => {
    setVisitedTabs((current) => current.has(tab) ? current : new Set(current).add(tab));
    setActiveTab(tab);
  };

  useEffect(() => {
    if (!notificationTargetRequestId) return;

    const targetTab = notificationTargetRequestId === "account-settings"
      ? "account-settings"
      : notificationTargetRequestId === "board-room-bookings"
        ? "board-room-bookings"
        : "requests";
    setVisitedTabs((current) => current.has(targetTab) ? current : new Set(current).add(targetTab));
    setActiveTab(targetTab);

    if (notificationTargetRequestId === "account-settings") {
      onNotificationTargetHandled?.();
    }
  }, [notificationTargetRequestId, onNotificationTargetHandled]);

  useEffect(() => {
    if (activeTab !== "account-settings") {
      saveActiveTab("admin", activeTab);
    }
  }, [activeTab]);

  return (
    <main className={`admin-home ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        activeTab={activeTab}
        collapsed={sidebarCollapsed}
        isOnline={isOnline}
        mobileMenuOpen={mobileSidebarOpen}
        onMobileMenuClose={onMobileMenuClose}
        onTabChange={selectTab}
        requestView={requestView}
        onRequestViewChange={setRequestView}
        unreadRequestCount={requestNotifications?.unreadRequestCount || 0}
        unreadBoardRoomCount={requestNotifications?.unreadBoardRoomCount || 0}
      />
      {visitedTabs.has("dashboard") && (
        <div style={{ display: activeTab === "dashboard" ? "contents" : "none" }}>
          <Dashboard
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            requestView={requestView}
            databaseStatus={databaseStatus}
            isOnline={isOnline}
            onRequestSelect={onRequestSelect}
            refreshKey={refreshKey}
            unreadRequestIds={requestNotifications?.unreadRequestIds}
          />
        </div>
      )}
      {visitedTabs.has("calendar") && (
        <div style={{ display: activeTab === "calendar" ? "contents" : "none" }}>
          <BoardCalendar />
        </div>
      )}
      {visitedTabs.has("board-room-bookings") && (
        <div style={{ display: activeTab === "board-room-bookings" ? "contents" : "none" }}>
          <BoardRoomBookings
            onBookingViewed={requestNotifications?.markAsViewed}
            unreadBoardRoomIds={requestNotifications?.unreadBoardRoomIds}
          />
        </div>
      )}
      {visitedTabs.has("requests") && (
        <div style={{ display: activeTab === "requests" ? "contents" : "none" }}>
          <Requests
            onChange={refresh}
            canEditResolved={false}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onNotificationTargetHandled={onNotificationTargetHandled}
            onRequestViewed={requestNotifications?.markAsViewed}
            selectedRequestId={notificationTargetRequestId}
            requestView={requestView}
            unreadRequestIds={requestNotifications?.unreadRequestIds}
          />
        </div>
      )}
      {visitedTabs.has("account-settings") && (
        <div style={{ display: activeTab === "account-settings" ? "contents" : "none" }}>
          <AccountSettings />
        </div>
      )}
    </main>
  );
}

export default AdminHome;
