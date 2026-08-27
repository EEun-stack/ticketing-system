import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import useSystemStatus from "../hooks/useSystemStatus";
import "../styles/dashboard.css";
import Dashboard from "./dashboard";
import Requests from "./request";
import Settings from "./settings";
import Users from "./users";

function SuperadminHome({
  notificationTargetRequestId,
  onNotificationTargetHandled,
  requestNotifications,
  sidebarCollapsed,
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const { databaseStatus, isOnline } = useSystemStatus();
  const refresh = () => setRefreshKey((value) => value + 1);

  useEffect(() => {
    if (notificationTargetRequestId) {
      setActiveTab("requests");
    }
  }, [notificationTargetRequestId]);

  return (
    <main className={`admin-home ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        activeTab={activeTab}
        isOnline={isOnline}
        onTabChange={setActiveTab}
        showSuperadminTabs
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
          onNotificationTargetHandled={onNotificationTargetHandled}
          onRequestViewed={requestNotifications?.markAsViewed}
          selectedRequestId={notificationTargetRequestId}
          unreadRequestIds={requestNotifications?.unreadRequestIds}
        />
      )}
      {activeTab === "settings" && <Settings />}
      {activeTab === "admin-users" && <Users />}
    </main>
  );
}

export default SuperadminHome;
