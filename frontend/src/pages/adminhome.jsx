import { useState } from "react";
import Sidebar from "../components/sidebar";
import useSystemStatus from "../hooks/useSystemStatus";
import "../styles/dashboard.css";
import Dashboard from "./dashboard";
import Requests from "./request";

function AdminHome({ requestNotifications, sidebarCollapsed }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const { databaseStatus, isOnline } = useSystemStatus();
  const refresh = () => setRefreshKey((value) => value + 1);

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
          onRequestViewed={requestNotifications?.markAsViewed}
          unreadRequestIds={requestNotifications?.unreadRequestIds}
        />
      )}
    </main>
  );
}

export default AdminHome;
