import Sidebar from '../components/sidebar'
import '../styles/dashboard.css'

function SuperadminHome({ sidebarCollapsed }) {
  return (
    <main className={`admin-home ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} />
      <section className="home-content">
        <p className="home-eyebrow">System Owner</p>
        <h1>Superadmin Home</h1>
      </section>
    </main>
  )
}

export default SuperadminHome
