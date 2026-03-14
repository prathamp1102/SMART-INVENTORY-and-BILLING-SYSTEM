import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <style>{`
        .main-layout {
          display: flex;
          width: 100vw;
          min-height: 100vh;
          background: #f5f3ee;
          font-family: 'Figtree', sans-serif;
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }
        .page-main {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 28px;
          height: 0; /* flex trick: forces overflow-y to work inside flex column */
        }
        @media (min-width: 768px) {
          .main-content { margin-left: 248px; }
        }
        @media (max-width: 767px) {
          .page-main { padding: 16px; }
        }
      `}</style>

      <div className="main-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="page-main">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
