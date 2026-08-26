import Sidebar from '../components/sidebar'
import '../styles/dashboard.css'

function AdminHome({ sidebarCollapsed }) {
  return (
    <main className={`admin-home ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} />
      <section className="home-content">
        <p className="home-eyebrow">Administrator</p>
        <h1>Admin Home</h1>
      </section>
    </main>
  )
}

export default AdminHome
