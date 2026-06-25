import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ onLogout, closeMobileMenu }) {
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);

  const linkStyle = ({ isActive }) =>
    `w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all ${
      isActive
        ? "text-emerald-400 bg-emerald-950/20 border-l-2 border-emerald-500"
        : "text-gray-400 hover:text-white hover:bg-[#262932]"
    }`;

  const handleMobileClick = () => {
    if (closeMobileMenu) closeMobileMenu();
  };

  return (
    <div className="w-64 h-screen bg-[#1a1c23] border-r border-gray-800 flex flex-col justify-between font-sans text-gray-300 select-none flex-shrink-0 sticky top-0">
      <div className="overflow-y-auto flex-1 min-h-0">
        <div className="p-6 border-b border-gray-800/50 bg-[#15171c]/30">
          <h1 className="text-sm font-bold text-white tracking-wide uppercase">
            SOLUTION CORP
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
            Management Suite
          </p>
        </div>

        <div className="px-4 pt-4 pb-2 space-y-1">
          <NavLink
            to="/dashboard"
            end
            className={linkStyle}
            onClick={handleMobileClick}
          >
            <span className="mr-2.5 text-sm">🏠</span> Dashboard Global
          </NavLink>
        </div>

        {/* SECTION: SALES */}
        <div className="px-4 py-2">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Sales
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard/sales/customer"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Customer
            </NavLink>
            <NavLink
              to="/dashboard/sales/invoice-proforma"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Invoice Proforma
            </NavLink>
            <NavLink
              to="/dashboard/sales/pos"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Point Of Sales (POS)
            </NavLink>
            <NavLink
              to="/dashboard/sales/marketplace"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Marketplace
            </NavLink>
            <NavLink
              to="/dashboard/sales/laporan-sales"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Laporan Sales
            </NavLink>
          </nav>
        </div>

        {/* SECTION: FINANCE */}
        <div className="px-4 py-4">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Finance
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard/finance/piutang"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Piutang
            </NavLink>
            <NavLink
              to="/dashboard/finance/hutang"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Hutang
            </NavLink>
            <NavLink
              to="/dashboard/finance/biaya"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Catatan Biaya
            </NavLink>
          </nav>
        </div>

        {/* SECTION: INVENTORY */}
        <div className="px-4 py-2">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Inventory
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard/inventory/inventorylog"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Inventory Log
            </NavLink>
            <NavLink
              to="/dashboard/inventory/stock"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Stock
            </NavLink>
            <NavLink
              to="/dashboard/inventory/produk"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Produk
            </NavLink>
            <NavLink
              to="/dashboard/inventory/purchase-order"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Purchase Order
            </NavLink>
            <NavLink
              to="/dashboard/inventory/PoReport"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> PO Report
            </NavLink>
            <NavLink
              to="/dashboard/inventory/supplier"
              className={linkStyle}
              onClick={handleMobileClick}
            >
              <span className="mr-2.5 text-sm">⚪</span> Supplier
            </NavLink>
          </nav>
        </div>

        {/* SECTION: ACCOUNTING REPORT */}
        <div className="px-4 py-2 border-t border-gray-800/40 pt-4 mb-4">
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
                className={`text-[11px] text-gray-500 transition-transform duration-200 ${isLaporanOpen ? "rotate-90" : ""}`}
              >
                ❯
              </span>
            </button>

            {isLaporanOpen && (
              <div className="pl-6 mt-1 space-y-1 border-l border-gray-800 ml-5">
                <NavLink
                  to="/dashboard/Laporan/laba-rugi"
                  className={linkStyle}
                  onClick={handleMobileClick}
                >
                  Laporan laba rugi
                </NavLink>
                <NavLink
                  to="/dashboard/Laporan/LaporanPenjualan"
                  className={linkStyle}
                  onClick={handleMobileClick}
                >
                  Laporan penjualan
                </NavLink>
                <NavLink
                  to="/dashboard/Laporan/Pengeluaran"
                  className={linkStyle}
                  onClick={handleMobileClick}
                >
                  Laporan pengeluaran
                </NavLink>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* FOOTER SIDEBAR */}
      <div className="p-4 border-t border-gray-800 bg-[#15171c] h-16 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden min-w-0 flex-1 mr-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0 uppercase">
            O
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate block w-full">
              Operator
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium truncate block w-full">
              STAFF
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 cursor-pointer"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
