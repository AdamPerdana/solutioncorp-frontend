import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Impor Komponen Layout, Login dan Dashboard
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./components/layout/Login";
import Dashboard from "./components/dashboard/Dashboard";
import DashboardToko from "./components/dashboard/DashboardToko";

// Impor Komponen Grup: Sales
import Customer from "./components/sales/Customer";
import InvoiceProforma from "./components/sales/InvoiceProforma";
import Pos from "./components/sales/Pos";
import LaporanSales from "./components/sales/LaporanSales";

// Impor Komponen Grup: Finance
import Piutang from "./components/finance/Piutang";
import Hutang from "./components/finance/Hutang";
import Biaya from "./components/finance/Biaya";
import Hpp from "./components/finance/Hpp";

// Impor Komponen Grup: Inventory
import InventoryLog from "./components/inventory/InventoryLog";
import Produk from "./components/inventory/Produk";
import PurchaseOrder from "./components/inventory/PurchaseOrder";
import Supplier from "./components/inventory/Supplier";
import Stock from "./Components/inventory/Stock";
import PoReport from "./Components/inventory/PoReport";

// Impor Komponen Grup: Laporan
import LabaRugi from "./components/Laporan/LabaRugi";
import LaporanPenjualan from "./components/Laporan/LaporanPenjualan";
import LaporanPengeluaran from "./components/Laporan/LaporanPengeluaran";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  // transisi berhasil login
  const handleLoginSuccess = () => {
    setShowSplash(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setShowSplash(false);
    }, 500);
  };

  // Efek Loading
  if (showSplash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1c23] text-white animate-pulse">
        <h1 className="text-3xl font-bold text-emerald-500">Akses Diterima!</h1>
      </div>
    );
  }

  // 2. Proteksi Login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <Routes>
        {/* DashboardLayout */}
        <Route
          path="/"
          element={<DashboardLayout onLogout={() => setIsLoggedIn(false)} />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Halaman Utama Analitik Global */}
          <Route
            path="dashboard"
            element={<Dashboard onLogout={() => setIsLoggedIn(false)} />}
          />

          {/*Dashboard Toko */}
          <Route path="dashboard-toko" element={<DashboardToko />} />

          {/* Modul: Sales  */}
          <Route path="sales/customer" element={<Customer />} />
          <Route path="sales/invoice-proforma" element={<InvoiceProforma />} />
          <Route path="sales/pos" element={<Pos />} />
          <Route path="sales/laporan-sales" element={<LaporanSales />} />

          {/* Modul: Finance */}
          <Route path="finance/piutang" element={<Piutang />} />
          <Route path="finance/hutang" element={<Hutang />} />
          <Route path="finance/biaya" element={<Biaya />} />
          <Route path="finance/hpp" element={<Hpp />} />

          {/* Modul: Inventory */}
          <Route path="inventory/inventorylog" element={<InventoryLog />} />
          <Route path="inventory/produk" element={<Produk />} />
          <Route path="inventory/purchase-order" element={<PurchaseOrder />} />
          <Route path="inventory/supplier" element={<Supplier />} />
          <Route path="inventory/stock" element={<Stock />} />
          <Route path="inventory/PoReport" element={<PoReport />} />

          {/* Modul: Laporan Penjualan */}
          <Route path="Laporan/laba-rugi" element={<LabaRugi />} />
          <Route
            path="Laporan/LaporanPenjualan"
            element={<LaporanPenjualan />}
          />
          <Route path="laporan/pengeluaran" element={<LaporanPengeluaran />} />

          {/* (404 Page) */}
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
