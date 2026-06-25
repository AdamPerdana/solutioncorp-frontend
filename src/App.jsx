import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation, // 🎯 Tambahkan import ini untuk melacak posisi rute
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CartProvider } from "./Marketplace/context/CartContext";

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
// [ 🌟 NEW SUB-MODULES: MARKETPLACE PUBLIK ]
// ==========================================================
import Home from "./Marketplace/pages/Home";
import AboutUs from "./Marketplace/pages/AboutUs";
import Checkout from "./Marketplace/pages/Checkout";
import ProductDetail from "./Marketplace/pages/Product";

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
// [ SUB-ENGINE: ROUTE ANIMATION HANDLER ]
// ==========================================================
function AppRoutes({ isLoggedIn, handleLoginSuccess, handleLogout }) {
  const location = useLocation(); // 🎯 Tangkap lokasi URL saat ini

  return (
    <AnimatePresence mode="wait">
      {/* 🎯 Pasangkan location & key unik berbasis pathname agar Framer Motion tahu rute berganti */}
      <Routes location={location} key={location.pathname}>
        {/* ==========================================================
            [ 🌟 JALUR DATA PUBLIK: MINI MARKETPLACE ]
            ========================================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* 🎯 TERPERBAKI: Menggunakan :slug agar klop dengan ProductDetail.jsx */}
        <Route path="/product/:slug" element={<ProductDetail />} />

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

        {/* ==========================================================
            [ WORKSPACE AREA INTERNAL KANTOR (TERKUNCI PENUH) ]
            ========================================================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <DashboardLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          {/* DEFAULT UTAMA */}
          <Route index element={<Dashboard onLogout={handleLogout} />} />

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

          {/* CATCH-ALL INTERN PANEL ADMIN */}
          <Route
            path="*"
            element={
              <div className="p-8 text-sm text-gray-400">
                Halaman Tidak Ditemukan di Panel Admin.
              </div>
            }
          />
        </Route>

        {/* GLOBAL CATCH-ALL 404 GLOBAL */}
        <Route
          path="*"
          element={
            <div className="p-8 text-sm text-gray-400 text-center min-h-screen bg-[#111215] flex items-center justify-center">
              Halaman Tidak Ditemukan.
            </div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
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
    <CartProvider>
      <Router>
        <AppRoutes
          isLoggedIn={isLoggedIn}
          handleLoginSuccess={handleLoginSuccess}
          handleLogout={handleLogout}
        />
      </Router>
    </CartProvider>
  );
}

export default App;
