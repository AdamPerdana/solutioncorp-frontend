import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    /* 🌟 PERBAIKAN 1: Ganti min-h-screen menjadi h-screen, dan kunci dengan overflow-hidden agar browser tidak bisa scroll global */
    <div className="h-screen bg-[#15171c] flex text-gray-300 relative overflow-hidden">
      {/* Backdrop Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Container Sidebar */}
      {/* 🌟 PERBAIKAN 2: Tambahkan h-full agar tinggi pembungkus sidebar ini konsisten setinggi layar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          onLogout={onLogout}
          closeMobileMenu={() => setSidebarOpen(false)}
        />
      </div>

      {/* Sisi Kanan (Header + Konten Utama) */}
      {/* 🌟 PERBAIKAN 3: Beri h-full dan overflow-hidden agar area kanan membatasi diri se-tinggi layar monitor */}
      <div className="flex-1 flex flex-col min-w-0 w-full h-full overflow-hidden">
        {/* Header Mobile */}
        <div className="md:hidden bg-[#1a1c23] border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-1 text-xl focus:outline-none hover:text-emerald-400 active:scale-95 transition-all"
          >
            ☰
          </button>
          <span className="text-xs font-black text-white tracking-widest uppercase">
            Solution <span className="text-emerald-500">Corp</span>
          </span>
          <div className="w-6"></div>
        </div>

        {/* 🌟 PERBAIKAN KUNCI: Pindahkan scrollbar ke sini (overflow-y-auto) khusus untuk halaman dashboard */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
