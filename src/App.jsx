import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Impor Komponen Layout & Gerbang Utama
import Sidebar from "./components/layout/Sidebar";
import Login from "./components/layout/Login";
import Dashboard from "./components/dashboard/Dashboard";

// Impor Komponen Grup: Sales
import Customer from "./components/sales/Customer";
import InvoiceProforma from "./components/sales/InvoiceProforma";
import Pos from "./components/sales/Pos";

// Impor Komponen Grup: Finance
import Piutang from "./components/finance/Piutang";
import Hutang from "./components/finance/Hutang";
import Biaya from "./components/finance/Biaya";
import Hpp from "./components/finance/Hpp";

// Impor Komponen Grup: Inventory (Sudah Diperbaiki Huruf Kecil & Nama Filenya)
import InventoryLog from "./components/inventory/InventoryLog";
import Produk from "./components/inventory/Produk";
import PurchaseOrder from "./components/inventory/PurchaseOrder";
import Supplier from "./components/inventory/Supplier";

function App() {
  // Status autentikasi global
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  // Fungsi transisi saat berhasil login
  const handleLoginSuccess = () => {
    setShowSplash(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setShowSplash(false);
    }, 500);
  };

  // 1. Tampilan Efek Loading / Splash Screen
  if (showSplash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1c23] text-white animate-pulse">
        <h1 className="text-3xl font-bold text-emerald-500">Akses Diterima!</h1>
      </div>
    );
  }

  // 2. Proteksi Gerbang Login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <div className="flex bg-[#15171c] min-h-screen text-gray-200">
        {/* Sidebar nempel permanen di kiri & menerima fungsi logout */}
        <Sidebar onLogout={() => setIsLoggedIn(false)} />

        {/* 3. Sistem Routing Otomatis Berdasarkan URL Browser Localhost */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          <Routes>
            {/* Jika mengetik url utama/kosong, otomatis lempar ke dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Halaman Utama Analitik */}
            <Route
              path="/dashboard"
              element={<Dashboard onLogout={() => setIsLoggedIn(false)} />}
            />

            {/* Kelompok Modul Bisnis: Sales */}
            <Route path="/sales/customer" element={<Customer />} />
            <Route
              path="/sales/invoice-proforma"
              element={<InvoiceProforma />}
            />
            <Route path="/sales/pos" element={<Pos />} />

            {/* Kelompok Modul Bisnis: Finance */}
            <Route path="/finance/piutang" element={<Piutang />} />
            <Route path="/finance/hutang" element={<Hutang />} />
            <Route path="/finance/biaya" element={<Biaya />} />
            <Route path="/finance/hpp" element={<Hpp />} />

            {/* Kelompok Modul Bisnis: Inventory */}
            <Route path="/inventory/stok" element={<InventoryLog />} />
            <Route path="/inventory/produk" element={<Produk />} />
            <Route
              path="/inventory/purchase-order"
              element={<PurchaseOrder />}
            />
            <Route path="/inventory/supplier" element={<Supplier />} />

            {/* Kelompok Modul: Laporan Penjualan */}
            <Route
              path="/laporan/laba-rugi"
              element={
                <div className="p-8 text-sm text-gray-400">
                  Halaman Laporan Laba Rugi
                </div>
              }
            />
            <Route
              path="/laporan/penjualan"
              element={
                <div className="p-8 text-sm text-gray-400">
                  Halaman Laporan Penjualan
                </div>
              }
            />
            <Route
              path="/laporan/pengeluaran"
              element={
                <div className="p-8 text-sm text-gray-400">
                  Halaman Laporan Pengeluaran
                </div>
              }
            />
            <Route
              path="/laporan/hutang"
              element={
                <div className="p-8 text-sm text-gray-400">
                  Halaman Laporan Hutang
                </div>
              }
            />
            <Route
              path="/laporan/piutang"
              element={
                <div className="p-8 text-sm text-gray-400">
                  Halaman Laporan Piutang
                </div>
              }
            />

            {/* Proteksi url typo / tidak terdaftar (404 Page) */}
            <Route
              path="*"
              element={
                <div className="p-8 text-sm text-gray-400">
                  Halaman Tidak Ditemukan.
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
