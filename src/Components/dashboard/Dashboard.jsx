import React from "react";

function Dashboard({ onLogout }) {
  const ringkasanData = [
    {
      id: 1,
      judul: "Total Omzet",
      nilai: "Rp 27.985.023",
      warna: "text-blue-400",
    },
    {
      id: 2,
      judul: "Laba Kotor",
      nilai: "Rp 9.540.254",
      warna: "text-emerald-400",
    },
    {
      id: 3,
      judul: "Laba Bersih",
      nilai: "Rp 9.540.254",
      warna: "text-emerald-400",
    },
    {
      id: 4,
      judul: "Pengeluaran",
      nilai: "Rp 18.444.769",
      warna: "text-red-400",
    },
    { id: 5, judul: "% Laba Kotor", nilai: "34.1%", warna: "text-emerald-400" },
    {
      id: 6,
      judul: "% Laba Bersih",
      nilai: "34.1%",
      warna: "text-emerald-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#15171c] text-white font-sans p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Analitik Global
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Indikator kinerja keuangan utama dari seluruh proyek berjalan.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button
            onClick={() => alert("Fitur Kalender Date-Picker (Coming Soon)")}
            className="flex items-center space-x-2 bg-[#1a1c23] border border-gray-800 px-4 py-2 rounded-lg text-white text-sm font-medium hover:bg-[#262932] transition-all"
          >
            <span>📅</span>
            <span>Pilih tanggal</span>
          </button>

          <button
            onClick={onLogout} // Memanggil fungsi logout yang dikirim dari parent (App.js)
            className="rounded-lg bg-red-950/40 border border-red-800 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/50 transition-all"
          >
            Keluar Sistem
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ringkasanData.map((data) => (
          <div
            key={data.id}
            className="rounded-xl bg-[#1a1c23] p-6 shadow-lg border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between min-h-[130px]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {data.judul}
              </p>
              <span className="text-gray-600 text-xs cursor-help">ⓘ</span>
            </div>
            <p
              className={`text-2xl font-bold mt-4 tracking-tight ${data.warna}`}
            >
              {data.nilai}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-[#1a1c23] p-8 text-center border border-dashed border-gray-800 text-gray-500 text-sm">
        Menu Manajemen Produk & Laporan Penjualan Terintegrasi Django API
        (Coming Soon)
      </div>
    </div>
  );
}

export default Dashboard;
