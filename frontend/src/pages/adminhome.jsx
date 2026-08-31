import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import { getStoredActiveTab, saveActiveTab } from "../services/authStorage";
import useSystemStatus from "../hooks/useSystemStatus";
import "../styles/admin.css";
import Dashboard from "./dashboard";
import Requests from "./request";
import AccountSettings from "./accountSettings";

function AdminHome({
  canEditResolved,
  currentUserRole,
  mobileSidebarOpen,
  notificationTargetRequestId,
  onNotificationTargetHandled,
  onRequestSelect,
  onMobileMenuClose,
  requestNotifications,
  sidebarCollapsed,
}) {
  const allowedTabs = ["dashboard", "requests", "account-settings"];
  const [activeTab, setActiveTab] = useState(() =>
    getStoredActiveTab("admin", allowedTabs)
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const { databaseStatus, isOnline } = useSystemStatus();
  const refresh = () => setRefreshKey((value) => value + 1);

  useEffect(() => {
    if (!notificationTargetRequestId) return;

    setActiveTab(
      notificationTargetRequestId === "account-settings" ? "account-settings" : "requests"
    );

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
        onTabChange={setActiveTab}
        unreadRequestCount={requestNotifications?.unreadCount || 0}
      />
      {activeTab === "dashboard" && (
        <Dashboard
          currentUserRole={currentUserRole}
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
      {activeTab === "account-settings" && <AccountSettings />}
    </main>
  );
}

export default AdminHome;
