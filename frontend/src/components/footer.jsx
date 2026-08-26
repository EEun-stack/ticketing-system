import '../styles/footer.css'

function Footer({ isAdmin = false, sidebarCollapsed = false }) {
  return (
    <footer className={`site-footer ${isAdmin ? 'admin-footer' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div>
        <strong>Food Terminal Incorporated</strong>
        <span>IT Support Request System</span>
      </div>
      <div className="footer-contact">
        <a href="mailto:info@fti.gov.ph">info@fti.gov.ph</a>
        <span>FTI Administration Building, Taguig City</span>
      </div>
      <span className="footer-copyright">© 2025 FTI. All Rights Reserved.</span>
    </footer>
  )
}

export default Footer
