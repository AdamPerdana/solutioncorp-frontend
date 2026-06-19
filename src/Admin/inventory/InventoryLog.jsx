import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function InventoryLog() {
  // ==========================================================
  // [STATE MANAGEMENT & INITIALIZATION]
  // ==========================================================

  const [logMutasi, setLogMutasi] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterStatus] = useState("Semua Mutasi");
  const [logTerpilih, setLogTerpilih] = useState(null);

  // ==========================================================
  // [DATA AGGREGATION WITH JWT AUTHORIZATION]
  // ==========================================================

  useEffect(() => {
    fetchGabunganMutasiStok();
  }, []);

  const fetchGabunganMutasiStok = async () => {
    setLoading(true);
    try {
      // 🔒 Menggabungkan dua request secure menggunakan apiRequest dalam Promise.all
      const [dataSales, dataHutangPO] = await Promise.all([
        apiRequest("/api/sales/pos-transactions/?all=true"),
        apiRequest("/api/finance/hutang/"),
      ]);

      if (dataSales && dataHutangPO) {
        const logAgregasi = [];
        let globalCounterId = 1;

        // 1. PACKING DATA KELUAR (DARI TRANSAKSI SALES / POS)
        dataSales.forEach((notaJual) => {
          (notaJual.items || []).forEach((item) => {
            logAgregasi.push({
              id: `sales-${globalCounterId++}`,
              tanggalRaw: notaJual.tanggal,
              tanggalDisplay: notaJual.tanggal,
              sku: item.sku,
              namaProduk: item.nama_produk || item.nama,
              jenis: "KELUAR",
              jumlah: item.qty,
              referensi: notaJual.nomor_invoice,
              rawDataInduk: notaJual,
            });
          });
        });

        // 2. PACKING DATA MASUK (DARI HUTANG PO REPORT FINANCE)
        dataHutangPO.forEach((berkasPO) => {
          (berkasPO.items || []).forEach((item) => {
            logAgregasi.push({
              id: `po-${globalCounterId++}`,
              tanggalRaw: berkasPO.tanggal_po,
              tanggalDisplay: berkasPO.tanggal_po,
              sku: item.sku,
              namaProduk: item.nama_produk || item.nama,
              jenis: "MASUK",
              jumlah: item.qty,
              referensi: berkasPO.nomor_po,
              rawDataInduk: berkasPO,
            });
          });
        });

        // 3. Urutkan dari tanggal kalender terbaru
        logAgregasi.sort(
          (a, b) => new Date(b.tanggalRaw) - new Date(a.tanggalRaw),
        );

        setLogMutasi(logAgregasi);
      }
    } catch (error) {
      console.error("Gagal memetakan jurnal mutasi stok:", error);
      toast.error("Gagal memuat sinkronisasi mutasi stok dari cloud database.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // [FILTERING]
  // ==========================================================
  const processedData = useMemo(() => {
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
      <ToastContainer theme="dark" />

      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Jurnal Mutasi Stok (Log)
        </h2>
        <button
          onClick={fetchGabunganMutasiStok}
          className="bg-[#242731] hover:bg-gray-700 text-xs text-white px-3 py-1.5 rounded-lg border border-gray-800 transition-all font-semibold active:scale-95"
        >
          🔄 Refresh Jurnal Mutasi
        </button>
      </div>

      {/* FILTER CONTROLLERS */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <div className="relative w-full flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari berdasarkan SKU, nama sterno, atau nomor dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c23] border border-emerald-500/30 rounded-lg pl-9 pr-4 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
          />
        </div>

        <select
          value={filterJenis}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-44 bg-[#1a1c23] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-amber-500/90 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="Semua Mutasi">Semua Mutasi</option>
          <option value="Stok Masuk">Stok Masuk (+)</option>
          <option value="Stok Keluar">Stok Keluar (-)</option>
        </select>
      </div>

      {/* CORE TABEL LOG */}
      <div className="bg-[#1a1c23]/40 border border-gray-800/80 rounded-xl p-2 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed min-w-[950px] border-collapse">
            <thead>
              <tr className="border-b border-gray-800/60 text-[#4285f4] select-none text-[11px]">
                <th className="p-4 pl-6 font-bold tracking-wide w-[18%]">
                  Waktu Transaksi
                </th>
                <th className="p-4 font-bold tracking-wide w-[12%]">SKU</th>
                <th className="p-4 font-bold tracking-wide w-[28%]">
                  Varian Produk
                </th>
                <th className="p-4 font-bold tracking-wide text-center w-[12%]">
                  Jenis Mutasi
                </th>
                <th className="p-4 font-bold tracking-wide text-center w-[13%]">
                  Jumlah Qty
                </th>
                <th className="p-4 font-bold tracking-wide w-[17%] pl-8">
                  No. Referensi Dokumen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300 font-medium">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-gray-400 font-bold"
                  >
                    ⏳ Sedang merangkum log mutasi keluar-masuk barang Solution
                    Indonesia...
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
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
                    onClick={() => setLogTerpilih(log)}
                    className="hover:bg-[#1d2029]/60 transition-colors cursor-pointer group"
                    title="Klik untuk meninjau rincian manifes lengkap dari transaksi ini"
                  >
                    <td className="p-4 pl-6 text-gray-400 font-mono tracking-wide">
                      {log.tanggalDisplay}
                    </td>
                    <td className="p-4 font-mono font-bold text-blue-500/90 tracking-wide group-hover:underline">
                      {log.sku}
                    </td>
                    <td className="p-4 text-white font-bold tracking-wide">
                      {log.namaProduk}
                    </td>
                    <td className="p-4 text-center select-none">
                      <span
                        className={`inline-flex items-center justify-center font-black text-[9px] px-2 py-1 rounded border tracking-wider bg-black/30 ${log.jenis === "MASUK" ? "text-emerald-400 border-emerald-950/80" : "text-red-400 border-red-950/80"}`}
                      >
                        <span className="mr-1 text-[7px]">
                          {log.jenis === "MASUK" ? "🚢" : "📦"}
                        </span>{" "}
                        {log.jenis}
                      </span>
                    </td>
                    <td
                      className={`p-4 text-center font-black font-mono text-sm tracking-wide ${log.jenis === "MASUK" ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {log.jenis === "MASUK"
                        ? `+${log.jumlah.toLocaleString("id-ID")}`
                        : `-${log.jumlah.toLocaleString("id-ID")}`}
                    </td>
                    <td className="p-4 pl-8 font-mono font-bold text-gray-400 tracking-wide text-[11px]">
                      {log.referensi}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {logTerpilih && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>📄</span> Rincian Manifes Jurnal Mutasi
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  No Ref Dokumen: {logTerpilih.referensi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLogTerpilih(null)}
                className="text-gray-500 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#15171c] p-3 rounded-xl border border-gray-800 text-xs font-medium">
              <div>
                <span className="text-gray-500 text-[10px] block uppercase">
                  Jenis Aliran Berkas:
                </span>
                <span
                  className={`font-bold ${logTerpilih.jenis === "MASUK" ? "text-emerald-400" : "text-red-400"}`}
                >
                  {logTerpilih.jenis === "MASUK"
                    ? "🚢 STOK MASUK (PENGADAAN)"
                    : "📦 STOK KELUAR (PENJUALAN)"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block uppercase">
                  Waktu Pembukuan:
                </span>
                <span className="text-white font-mono font-bold">
                  {logTerpilih.tanggalDisplay}
                </span>
              </div>
            </div>

            <div className="bg-[#15171c] rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-2 bg-[#1b1e26] border-b border-gray-800 text-[10px] font-black text-gray-400 tracking-wider uppercase select-none">
                📦 Daftar Muatan Item Barang Riil:
              </div>
              <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-800/40">
                {(logTerpilih.rawDataInduk?.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex justify-between items-center text-xs text-gray-300 hover:bg-gray-900/10"
                  >
                    <div className="space-y-0.5">
                      <span className="font-mono text-blue-400 block text-[10px] font-bold">
                        {it.sku}
                      </span>
                      <span className="text-white font-bold">
                        {it.nama_produk || it.nama}
                      </span>
                    </div>
                    <div className="text-right font-mono font-black text-sm text-sky-400">
                      {it.qty.toLocaleString("id-ID")} Pcs
                    </div>
                  </div>
                ))}
                {(logTerpilih.rawDataInduk?.items || []).length === 0 && (
                  <div className="p-4 text-center text-gray-600 font-bold italic">
                    Manifes item kosong / tidak terdeteksi.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setLogTerpilih(null)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-xs uppercase tracking-wide font-bold transition-all shadow-sm active:scale-98"
              >
                Tutup Peninjauan Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
