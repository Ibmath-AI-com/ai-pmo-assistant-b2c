import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { SubHeader } from './SubHeader'
import { Sidebar } from './Sidebar'
import { RightSidebar } from './RightSidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F5F9' }}>
      {/* Top navbar — 56px */}
      <Navbar />

      {/* White sub-header bar — 48px, sits at top: 56px */}
      <SubHeader />

      {/* Left sidebar — starts at top: 104px */}
      <Sidebar />

      {/* Right sidebar — starts at top: 104px */}
      <RightSidebar />

      {/* Main content — offset for both sidebars + navbar + sub-header */}
      <main
        style={{
          marginLeft: '240px',
          marginRight: '240px',
          marginTop: '114px',
          minHeight: 'calc(100vh - 114px)',
          padding: '0 10px',
          backgroundColor: '#F1F5F9',
        }}
      >
        <Outlet />
      </main>
    </div>
  )
}
