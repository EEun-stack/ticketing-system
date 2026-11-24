import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import useSystemStatus from "../hooks/useSystemStatus";
import "../styles/admin.css";
import Dashboard from "./dashboard";
import ActivityLogs from "./activityLogs";
import Requests from "./request";
import Settings from "./settings";
import Users from "./users";
import EmployeeDirectory from "./employeeDirectory";
import AccountSettings from "./accountSettings";
import BoardCalendar from "./boardcalendar";
import BoardRoomBookings from "./boardRoomBookings";
import { getStoredActiveTab, saveActiveTab } from "../services/authStorage";

function SuperadminHome({
  canEditResolved,
  currentUserId,
  mobileSidebarOpen,
  notificationTargetRequestId,
  onNotificationTargetHandled,
  onRequestSelect,
  onMobileMenuClose,
  requestNotifications,
  sidebarCollapsed,
}) {
  const allowedTabs = ["dashboard", "calendar", "board-room-bookings", "requests", "users", "settings", "admin-users", "activity-logs", "account-settings"];
  const [activeTab, setActiveTab] = useState(() =>
    getStoredActiveTab("superadmin", allowedTabs)
  );
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]));
  const [requestView, setRequestView] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const { databaseStatus, isOnline, systemRuntimeMs, overallSystemRuntimeMs } = useSystemStatus();
  const refresh = () => setRefreshKey((value) => value + 1);
  const selectTab = (tab) => {
    setVisitedTabs((current) => current.has(tab) ? current : new Set(current).add(tab));
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeTab !== "account-settings") {
      saveActiveTab("superadmin", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (notificationTargetRequestId) {
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
    }
  }, [notificationTargetRequestId, onNotificationTargetHandled]);

  return (
    <main className={`admin-home ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        activeTab={activeTab}
        isOnline={isOnline}
        mobileMenuOpen={mobileSidebarOpen}
        onMobileMenuClose={onMobileMenuClose}
        onTabChange={selectTab}
        requestView={requestView}
        onRequestViewChange={setRequestView}
        showSuperadminTabs
        unreadRequestCount={requestNotifications?.unreadRequestCount || 0}
        unreadBoardRoomCount={requestNotifications?.unreadBoardRoomCount || 0}
      />
      {visitedTabs.has("dashboard") && (
        <div style={{ display: activeTab === "dashboard" ? "contents" : "none" }}>
          <Dashboard
            currentUserRole="SUPERADMIN"
            currentUserId={currentUserId}
            requestView={requestView}
            databaseStatus={databaseStatus}
            isOnline={isOnline}
            systemRuntimeMs={systemRuntimeMs}
            overallSystemRuntimeMs={overallSystemRuntimeMs}
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
            canEditResolved={canEditResolved}
            currentUserRole="SUPERADMIN"
            currentUserId={currentUserId}
            onNotificationTargetHandled={onNotificationTargetHandled}
            onRequestViewed={requestNotifications?.markAsViewed}
            selectedRequestId={notificationTargetRequestId}
            requestView={requestView}
            unreadRequestIds={requestNotifications?.unreadRequestIds}
          />
        </div>
      )}
      {visitedTabs.has("settings") && (
        <div style={{ display: activeTab === "settings" ? "contents" : "none" }}>
          <Settings requestNotifications={requestNotifications} />
        </div>
      )}
      {visitedTabs.has("users") && (
        <div style={{ display: activeTab === "users" ? "contents" : "none" }}>
          <EmployeeDirectory />
        </div>
      )}
      {visitedTabs.has("admin-users") && (
        <div style={{ display: activeTab === "admin-users" ? "contents" : "none" }}>
          <Users />
        </div>
      )}
      {visitedTabs.has("activity-logs") && (
        <div style={{ display: activeTab === "activity-logs" ? "contents" : "none" }}>
          <ActivityLogs />
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

export default SuperadminHome;
