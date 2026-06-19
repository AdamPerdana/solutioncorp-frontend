import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ==========================================================
// [ GLOBAL LAYOUT & AUTHENTICATION COMPONENTS ]
// ==========================================================
import DashboardLayout from "./Admin/layout/DashboardLayout";
import Login from "./Admin/layout/Login";
import Dashboard from "./Admin/dashboard/Dashboard";

// ==========================================================
// [ CORE SUB-MODULES: SALES MODULE ]
// ==========================================================
import Customer from "./Admin/sales/Customer";
import InvoiceProforma from "./Admin/sales/InvoiceProforma";
import Pos from "./Admin/sales/Pos";
import LaporanSales from "./Admin/sales/LaporanSales";
import Marketplace from "./Admin/sales/Marketplace";

// ==========================================================
// [ CORE SUB-MODULES: FINANCE MODULE ]
// ==========================================================
import Piutang from "./Admin/finance/Piutang";
import Hutang from "./Admin/finance/Hutang";
import Biaya from "./Admin/finance/Biaya";

// ==========================================================
// [ CORE SUB-MODULES: INVENTORY MODULE ]
// ==========================================================
import InventoryLog from "./Admin/inventory/InventoryLog";
import Produk from "./Admin/inventory/Produk";
import PurchaseOrder from "./Admin/inventory/PurchaseOrder";
import Supplier from "./Admin/inventory/Supplier";
import Stock from "./Admin/inventory/Stock";
import PoReport from "./Admin/inventory/PoReport";

// ==========================================================
// [ CORE SUB-MODULES: FINANCIAL REPORT MODULE ]
// ==========================================================
import LabaRugi from "./Admin/Laporan/LabaRugi";
import LaporanPenjualan from "./Admin/Laporan/LaporanPenjualan";
import LaporanPengeluaran from "./Admin/Laporan/LaporanPengeluaran";

// ==========================================================
// [ CENTRAL NAVIGATION GUARD / PROTECTED ROUTE ]
// ==========================================================
function ProtectedRoute({ isLoggedIn, children }) {
  const token = localStorage.getItem("accessToken");
  if (!isLoggedIn || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ==========================================================
// [ MAIN APPLICATION ENGINE ]
// ==========================================================
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("accessToken");
  });

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        {/* GATEWAY KONTROL GATE LOGIN */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* WORKSPACE AREA (TERKUNCI PENUH) */}
        <Route
          path="/"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <DashboardLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          {/* DEFAULT REDIRECT */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* MAIN DASHBOARD */}
          <Route
            path="dashboard"
            element={<Dashboard onLogout={handleLogout} />}
          />

          {/* SECTION JALUR DATA: SALES */}
          <Route path="sales/customer" element={<Customer />} />
          <Route path="sales/invoice-proforma" element={<InvoiceProforma />} />
          <Route path="sales/pos" element={<Pos />} />
          <Route path="sales/marketplace" element={<Marketplace />} />
          <Route path="sales/laporan-sales" element={<LaporanSales />} />

          {/* SECTION JALUR DATA: FINANCE */}
          <Route path="finance/piutang" element={<Piutang />} />
          <Route path="finance/hutang" element={<Hutang />} />
          <Route path="finance/biaya" element={<Biaya />} />

          {/* SECTION JALUR DATA: INVENTORY */}
          <Route path="inventory/inventorylog" element={<InventoryLog />} />
          <Route path="inventory/produk" element={<Produk />} />
          <Route path="inventory/purchase-order" element={<PurchaseOrder />} />
          <Route path="inventory/supplier" element={<Supplier />} />
          <Route path="inventory/stock" element={<Stock />} />
          <Route path="inventory/PoReport" element={<PoReport />} />

          {/* SECTION JALUR DATA: LAPORAN AKUNTANSI */}
          <Route path="Laporan/laba-rugi" element={<LabaRugi />} />
          <Route
            path="Laporan/LaporanPenjualan"
            element={<LaporanPenjualan />}
          />
          <Route path="laporan/pengeluaran" element={<LaporanPengeluaran />} />

          {/* SECTION JALUR DATA: CATCH-ALL 404 ROUTE */}
          <Route
            path="*"
            element={
              <div className="p-8 text-sm text-gray-400">
                Halaman Tidak Ditemukan.
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
