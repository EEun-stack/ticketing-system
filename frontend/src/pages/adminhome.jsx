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
  notificationTargetRequestId,
  onNotificationTargetHandled,
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
    if (notificationTargetRequestId === "account-settings") {
      setActiveTab("account-settings");
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
        onTabChange={setActiveTab}
        unreadRequestCount={requestNotifications?.unreadCount || 0}
      />
      {activeTab === "dashboard" && (
        <Dashboard
          databaseStatus={databaseStatus}
          isOnline={isOnline}
          refreshKey={refreshKey}
          unreadRequestIds={requestNotifications?.unreadRequestIds}
        />
      )}
      {activeTab === "requests" && (
        <Requests
          onChange={refresh}
          canEditResolved={canEditResolved}
          onRequestViewed={requestNotifications?.markAsViewed}
          unreadRequestIds={requestNotifications?.unreadRequestIds}
        />
      )}
      {activeTab === "account-settings" && <AccountSettings />}
    </main>
  );
}

export default AdminHome;
