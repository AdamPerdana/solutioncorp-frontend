import React from "react";

export default function DashboardToko() {
  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          🏪 Dashboard Toko & Marketplace
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Integrasi analitik penjualan toko (solutiondistribution).
        </p>
      </div>

      {/* BOX PLACEHOLDER UTAMA */}
      <div className="bg-[#1a1c23] border border-dashed border-gray-700 rounded-2xl p-12 text-center shadow-xl max-w-2xl mx-auto mt-10">
        <div className="text-4xl mb-3">🛠️</div>
        <h3 className="text-base font-bold text-white tracking-wide">
          Dashboard Toko Sedang Dikembangkan
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
          Bagian ini nantinya akan memuat Jumlah toko yang ada
        </p>
      </div>
    </div>
  );
}
