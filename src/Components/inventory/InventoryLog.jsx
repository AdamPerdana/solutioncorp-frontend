import React, { useState } from "react";

export default function InventoryLog() {
  const [logMutasi, setLogMutasi] = useState([
    {
      id: 1,
      tanggal: "2026-06-08 15:30",
      sku: "STR-001",
      namaProduk: "Sterno Kaleng Original Pxton",
      jenis: "KELUAR",
      jumlah: 500,
      referensi: "POS-20260608-001",
    },
    {
      id: 2,
      tanggal: "2026-06-05 10:15",
      sku: "STR-001",
      namaProduk: "Sterno Kaleng Original Pxton",
      jenis: "MASUK",
      jumlah: 2000,
      referensi: "PO-20260602-001",
    },
    {
      id: 3,
      tanggal: "2026-06-02 09:00",
      sku: "STR-002",
      namaProduk: "Sterno Gel Refill 1kg Pxton",
      jenis: "KELUAR",
      jumlah: 2,
      referensi: "POS-20260602-005",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState("Semua Mutasi");

  // PROSES PENYARINGAN DATA (SEARCH DAN DROPDOWN)
  const processedData = React.useMemo(() => {
    let filteredResults = logMutasi.filter(
      (item) =>
        item.namaProduk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referensi.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (filterJenis !== "Semua Mutasi") {
      const keyword = filterJenis === "Stok Masuk" ? "MASUK" : "KELUAR";
      filteredResults = filteredResults.filter(
        (item) => item.jenis === keyword,
      );
    }
    return filteredResults;
  }, [logMutasi, searchTerm, filterJenis]);

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Jurnal Mutasi Stok (Log)
        </h2>
      </div>

      {/* FILTER SEARCH BAR & DROPDOWN STATUS KANAN */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        {/* Input Search Kiri */}
        <div className="relative w-full flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari berdasarkan SKU, nama sterno, atau nomor dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c23] border border-emerald-500/30 rounded-lg pl-9 pr-4 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Dropdown Pilihan Kanan Jenis Mutasi */}
        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          className="w-full sm:w-44 bg-[#1a1c23] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-amber-500/90 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="Semua Mutasi">Semua Mutasi</option>
          <option value="Stok Masuk">Stok Masuk (+)</option>
          <option value="Stok Keluar">Stok Keluar (-)</option>
        </select>
      </div>

      <div className="bg-[#1a1c23]/40 border border-gray-800/80 rounded-xl p-2 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed min-w-[950px]">
            <thead>
              <tr className="border-b border-gray-800/60 text-[#4285f4] select-none">
                <th className="p-4 pl-6 font-semibold tracking-wide w-[18%]">
                  Waktu Transaksi
                </th>
                <th className="p-4 font-semibold tracking-wide w-[12%]">SKU</th>
                <th className="p-4 font-semibold tracking-wide w-[28%]">
                  Varian Produk
                </th>
                <th className="p-4 font-semibold tracking-wide text-center w-[12%]">
                  Jenis Mutasi
                </th>

                <th className="p-4 font-semibold tracking-wide text-center w-[13%]">
                  Jumlah Qty
                </th>

                <th className="p-4 font-semibold tracking-wide w-[17%] pl-8">
                  No. Referensi Dokumen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300 font-medium">
              {processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-gray-500 font-semibold"
                  >
                    ❌ Histori mutasi stok tidak ditemukan.
                  </td>
                </tr>
              ) : (
                processedData.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[#1d2029]/30 transition-colors"
                  >
                    {/* Waktu Mutasi */}
                    <td className="p-4 pl-6 text-gray-400 font-mono tracking-wide">
                      {log.tanggal}
                    </td>

                    {/* SKU */}
                    <td className="p-4 font-mono font-bold text-blue-500/90 tracking-wide cursor-pointer hover:underline">
                      {log.sku}
                    </td>

                    {/* Nama Barang */}
                    <td className="p-4 text-gray-200 font-bold tracking-wide">
                      {log.namaProduk}
                    </td>

                    {/* Badge Jenis Mutasi */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center font-bold text-[9px] px-2 py-1 rounded border tracking-wider bg-black/30 ${
                          log.jenis === "MASUK"
                            ? "text-emerald-400 border-emerald-950/80"
                            : "text-red-400 border-red-950/80"
                        }`}
                      >
                        <span className="mr-1 text-[7px]">
                          {log.jenis === "MASUK" ? "🚢" : "📦"}
                        </span>{" "}
                        {log.jenis}
                      </span>
                    </td>

                    <td
                      className={`p-4 text-center font-bold text-sm tracking-wide ${
                        log.jenis === "MASUK"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {log.jenis === "MASUK"
                        ? `+${log.jumlah.toLocaleString()}`
                        : `-${log.jumlah.toLocaleString()}`}
                    </td>

                    {/* Referensi Dokumen */}
                    <td className="p-4 pl-8 font-mono font-medium text-gray-400 tracking-wide">
                      {log.referensi}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
