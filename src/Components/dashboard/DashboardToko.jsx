import React from "react";

export default function DashboardToko() {
  // Data metrik statis toko online Shopee
  const ringkasanToko = [
    { id: 1, judul: "Omzet Shopee", nilai: "Rp 0", warna: "text-orange-400" },
    { id: 2, judul: "Pesanan Baru", nilai: "0 Order", warna: "text-sky-400" },
    {
      id: 3,
      judul: "Marketplace Fee (7.5%)",
      nilai: "Rp 0",
      warna: "text-red-400",
    },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#15171c]">
      {/* Header Modul */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">
          🏪 Dashboard Toko & Marketplace
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Integrasi analitik penjualan toko online Shopee
          (solutiondistribution).
        </p>
      </div>

      {/* Grid Kartu KPI Metrik */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ringkasanToko.map((data) => (
          <div
            key={data.id}
            className="rounded-xl bg-[#1a1c23] p-6 border border-gray-800 shadow-lg hover:border-gray-700 transition-all flex flex-col justify-between min-h-[130px]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {data.judul}
              </p>
              <span className="text-gray-600 text-xs cursor-help">ⓘ</span>
            </div>
            <p
              className={`text-2xl font-bold mt-4 font-mono tracking-tight ${data.warna}`}
            >
              {data.nilai}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder Informasi */}
      <div className="rounded-xl bg-[#1a1c23] p-6 border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-white uppercase tracking-wider mb-2">
          💡 Status Sinkronisasi
        </p>
        Modul ini disiapkan untuk penarikan data transaksi produk sterno gel
        branded Pxton dari toko online secara real-time.
      </div>
    </div>
  );
}
