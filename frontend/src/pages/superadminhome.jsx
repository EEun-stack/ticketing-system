import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import useSystemStatus from "../hooks/useSystemStatus";
import "../styles/admin.css";
import Dashboard from "./dashboard";
import ActivityLogs from "./activityLogs";
import Requests from "./request";
import Settings from "./settings";
import Users from "./users";
import AccountSettings from "./accountSettings";
import { getStoredActiveTab, saveActiveTab } from "../services/authStorage";

function SuperadminHome({
  canEditResolved,
  mobileSidebarOpen,
  notificationTargetRequestId,
  onNotificationTargetHandled,
  onRequestSelect,
  onMobileMenuClose,
  requestNotifications,
  sidebarCollapsed,
}) {
  const allowedTabs = ["dashboard", "requests", "settings", "admin-users", "activity-logs", "account-settings"];
  const [activeTab, setActiveTab] = useState(() =>
    getStoredActiveTab("superadmin", allowedTabs)
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const { databaseStatus, isOnline } = useSystemStatus();
  const refresh = () => setRefreshKey((value) => value + 1);

  useEffect(() => {
    if (activeTab !== "account-settings") {
      saveActiveTab("superadmin", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (notificationTargetRequestId) {
      setActiveTab(notificationTargetRequestId === "account-settings" ? "account-settings" : "requests");
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
        onTabChange={setActiveTab}
        showSuperadminTabs
        unreadRequestCount={requestNotifications?.unreadCount || 0}
      />
      {activeTab === "dashboard" && (
        <Dashboard
          currentUserRole="SUPERADMIN"
          databaseStatus={databaseStatus}
          isOnline={isOnline}
          onRequestSelect={onRequestSelect}
          refreshKey={refreshKey}
          unreadRequestIds={requestNotifications?.unreadRequestIds}
        />
      )}
      {activeTab === "requests" && (
        <Requests
          onChange={refresh}
          canEditResolved={canEditResolved}
          onNotificationTargetHandled={onNotificationTargetHandled}
          onRequestViewed={requestNotifications?.markAsViewed}
          selectedRequestId={notificationTargetRequestId}
          unreadRequestIds={requestNotifications?.unreadRequestIds}
        />
      )}
      {activeTab === "settings" && <Settings requestNotifications={requestNotifications} />}
      {activeTab === "admin-users" && <Users />}
      {activeTab === "activity-logs" && <ActivityLogs />}
      {activeTab === "account-settings" && <AccountSettings />}
    </main>
  );
}

export default SuperadminHome;
