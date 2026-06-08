import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ onLogout }) {
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);

  // Style dasar tombol menu biar kodenya rapi dan seragam
  const linkStyle = ({ isActive }) =>
    `w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all ${
      isActive
        ? "text-emerald-400 bg-emerald-950/20 border-l-2 border-emerald-500"
        : "text-gray-400 hover:text-white hover:bg-[#262932]"
    }`;

  return (
    <div className="w-64 min-h-screen bg-[#1a1c23] border-r border-gray-800 flex flex-col justify-between font-sans text-gray-300 select-none flex-shrink-0">
      <div className="overflow-y-auto flex-1">
        {/* Header Branding */}
        <div className="p-6 border-b border-gray-800/50 bg-[#15171c]/30">
          <h1 className="text-sm font-bold text-white tracking-wide uppercase">
            SOLUTION CORP
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
            Management Suite
          </p>
        </div>

        {/* Dashboard */}
        <div className="px-4 py-4">
          <NavLink to="/dashboard" className={linkStyle}>
            <span className="mr-2.5 text-sm">🏠</span> Dashboard
          </NavLink>
        </div>

        {/* 1. Group: Sales */}
        <div className="px-4 py-2">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Sales
          </p>
          <nav className="space-y-1">
            <NavLink to="/sales/customer" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Customer
            </NavLink>
            <NavLink to="/sales/invoice-proforma" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Invoice Proforma
            </NavLink>
            <NavLink to="/sales/pos" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Point Of Sales (POS)
            </NavLink>
          </nav>
        </div>

        {/* 2. Group: Finance */}
        <div className="px-4 py-4">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Finance
          </p>
          <nav className="space-y-1">
            <NavLink to="/finance/piutang" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Piutang
            </NavLink>
            <NavLink to="/finance/hutang" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Hutang
            </NavLink>
            <NavLink to="/finance/biaya" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Catatan Biaya
            </NavLink>
            <NavLink to="/finance/hpp" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Master Hpp
            </NavLink>
          </nav>
        </div>

        {/* 3. Group: Inventory */}
        <div className="px-4 py-2">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Inventory
          </p>
          <nav className="space-y-1">
            <NavLink to="/inventory/stok" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Inventory
            </NavLink>
            <NavLink to="/inventory/produk" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Produk
            </NavLink>
            <NavLink to="/inventory/purchase-order" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Purchase Order
            </NavLink>
            <NavLink to="/inventory/supplier" className={linkStyle}>
              <span className="mr-2.5 text-sm">⚪</span> Supplier
            </NavLink>
          </nav>
        </div>

        {/* Laporan Penjualan (Dropdown) */}
        <div className="px-4 py-2 border-t border-gray-800/40 pt-4">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Laporan Penjualan
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => setIsLaporanOpen(!isLaporanOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#262932] rounded-lg transition-all focus:outline-none"
            >
              <div className="flex items-center">
                <span className="mr-2.5 text-sm">📁</span>
                <span>Laporan</span>
              </div>
              <span
                className={`text-[10px] transition-transform duration-200 ${isLaporanOpen ? "rotate-90" : ""}`}
              >
                ▶
              </span>
            </button>

            {isLaporanOpen && (
              <div className="pl-6 mt-1 space-y-1 border-l border-gray-800 ml-5">
                <NavLink to="/laporan/laba-rugi" className={linkStyle}>
                  Laporan laba rugi
                </NavLink>
                <NavLink to="/laporan/penjualan" className={linkStyle}>
                  Laporan penjualan
                </NavLink>
                <NavLink to="/laporan/pengeluaran" className={linkStyle}>
                  Laporan pengeluaran
                </NavLink>
                <NavLink to="/laporan/hutang" className={linkStyle}>
                  Laporan hutang
                </NavLink>
                <NavLink to="/laporan/piutang" className={linkStyle}>
                  Laporan piutang
                </NavLink>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Profile Footer */}
      <div className="p-4 border-t border-gray-800 bg-[#15171c]">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              A
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                Adam Perdana
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                Owner
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
