import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children, title, breadcrumbs }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={isMobileSidebarOpen} onClose={closeSidebar} />
      <div className="app-main">
        <Navbar title={title} breadcrumbs={breadcrumbs} onToggleSidebar={toggleSidebar} />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
