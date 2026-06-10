import React, { useState, useMemo } from "react";

export default function LaporanSales() {
  // 1. DATABASE TRANSAKSI SALES
  const [dataSales] = useState([
    {
      id: 1,
      nomorInvoice: "54/SCI/6/2026",
      pelanggan: "CV. Victoria Indo Pratama",
      tanggal: "2026-06-06",
      tanggalDisplay: "6 Juni 2026",
      status: "LUNAS",
      nominal: 28000000,
      items: [
        {
          sku: "STR-01",
          nama: "Sterno Kaleng Original",
          qty: 5000,
          harga: 5600,
          total: 28000000,
        },
      ],
    },
    {
      id: 2,
      nomorInvoice: "27/SCI/6/2025",
      pelanggan: "Lily Catering",
      tanggal: "2026-06-04",
      tanggalDisplay: "4 Juni 2026",
      status: "LUNAS",
      nominal: 2830000,
      items: [
        {
          sku: "STR-01",
          nama: "Sterno Kaleng Original",
          qty: 500,
          harga: 5660,
          total: 2830000,
        },
      ],
    },
    {
      id: 3,
      nomorInvoice: "26/SCI/6/2025",
      pelanggan: "Bpk Yakub",
      tanggal: "2026-06-01",
      tanggalDisplay: "1 Juni 2026",
      status: "BELUM LUNAS",
      nominal: 3350000,
      items: [
        {
          sku: "STR-01",
          nama: "Sterno Kaleng Original",
          qty: 600,
          harga: 5583,
          total: 3350000,
        },
      ],
    },
  ]);

  // 2. STATE FILTERING (Pencarian Laporan Identik PO Report)
  const [filterTglMulai, setFilterTglMulai] = useState("2026-06-01");
  const [filterTglSelesai, setFilterTglSelesai] = useState("2026-06-30");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");

  // State pemicu modal pop-up detail rincian barang
  const [salesTerpilih, setSalesTerpilih] = useState(null);

  // 3. LOGIKA RUMUSAN FILTERING UTAMA (REAL-TIME)
  const dataLaporanDisaring = useMemo(() => {
    return dataSales.filter((row) => {
      // Filter Jangkauan Tanggal
      const cocokTanggal =
        row.tanggal >= filterTglMulai && row.tanggal <= filterTglSelesai;

      // Filter Search Text (Nomor Invoice / Nama Pelanggan)
      const cocokSearch =
        row.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.pelanggan.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter Status Keuangan
      const cocokStatus =
        filterStatus === "Semua Status" ||
        row.status.toUpperCase() === filterStatus.toUpperCase();

      return cocokTanggal && cocokSearch && cocokStatus;
    });
  }, [dataSales, filterTglMulai, filterTglSelesai, searchTerm, filterStatus]);

  // 4. METRIK KEUANGAN GLOBAL PENJUALAN (KOTAK RANGKUMAN ATAS)
  const ringkasanMetrik = useMemo(() => {
    let totalOmset = 0;
    let totalPiutangBelumLunas = 0;
    let totalNotaInvoice = dataLaporanDisaring.length;

    dataLaporanDisaring.forEach((row) => {
      totalOmset += row.nominal;
      if (row.status === "BELUM LUNAS") {
        totalPiutangBelumLunas += row.nominal;
      }
    });

    return { totalOmset, totalPiutangBelumLunas, totalNotaInvoice };
  }, [dataLaporanDisaring]);

  // Cetak Berkas Dokumen PDF
  const handleCetakDokumen = (e, tipe, nomorInv) => {
    e.stopPropagation();
    alert(
      `Mengirim perintah cetak [${tipe}] untuk Nomor Invoice: ${nomorInv} ke mesin printer...`,
    );
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Laporan Penjualan (Sales Report)
        </h2>
      </div>

      {/* METRIK SUMMARY CARDS CONTROLLER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Total Nilai Penjualan (Omset)
          </p>
          <h3 className="text-xl font-black text-white font-mono mt-1">
            Rp {ringkasanMetrik.totalOmset.toLocaleString("id-ID")}
          </h3>
          <p className="text-[9px] text-gray-600 mt-0.5">
            Akumulasi pendapatan kotor berjalan
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Total Piutang Berjalan (Belum Lunas)
          </p>
          <h3 className="text-xl font-black text-amber-500 font-mono mt-1">
            Rp {ringkasanMetrik.totalPiutangBelumLunas.toLocaleString("id-ID")}
          </h3>
          <p className="text-[9px] text-amber-500/40 mt-0.5">
            Sisa dana invoice tempo yang harus ditagih
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Jumlah Invoice Terbit
          </p>
          <h3 className="text-xl font-black text-sky-400 font-mono mt-1">
            {ringkasanMetrik.totalNotaInvoice} Dokumen
          </h3>
        </div>
      </div>

      {/* BARIS PENGENDALIAN FILTER */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-gray-500 mb-1">Mulai Tanggal</label>
          <input
            type="date"
            value={filterTglMulai}
            onChange={(e) => setFilterTglMulai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none text-[11px]"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={filterTglSelesai}
            onChange={(e) => setFilterTglSelesai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none text-[11px]"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">
            Cari Pelanggan / Nomor
          </label>
          <input
            type="text"
            placeholder="Ketik invoice atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#15171c] border border-emerald-500/30 rounded-lg p-2 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none text-[11px]"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-[11px] cursor-pointer"
          >
            <option value="Semua Status">-- Semua Status --</option>
            <option value="Lunas">LUNAS</option>
            <option value="Belum Lunas">BELUM LUNAS</option>
          </select>
        </div>
      </div>

      {/* TABEL CORE JURNAL PENJUALAN UTAMA */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl">
        <div className="overflow-x-auto rounded-lg border border-gray-800/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 font-semibold select-none text-[11px]">
                <th className="p-3.5 pl-5">Nomor Invoice</th>
                <th className="p-3.5">Tanggal Nota</th>
                <th className="p-3.5">Nama Pelanggan / Toko</th>
                <th className="p-3.5">Muatan Ringkas</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Nominal Omset</th>
                <th className="p-3.5 text-center pr-5">Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
              {dataLaporanDisaring.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                  >
                    ❌ Tidak ada arsip invoice penjualan yang cocok dengan
                    parameter filter.
                  </td>
                </tr>
              ) : (
                dataLaporanDisaring.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSalesTerpilih(row)}
                    className="hover:bg-[#1d2029]/80 transition-colors cursor-pointer group"
                    title="Klik untuk meninjau rincian item varian sterno"
                  >
                    <td className="p-3.5 pl-5 font-mono text-blue-400 font-bold group-hover:underline">
                      {row.nomorInvoice}
                    </td>
                    <td className="p-3.5 text-gray-500 font-mono">
                      {row.tanggalDisplay}
                    </td>
                    <td className="p-3.5 text-white font-bold">
                      {row.pelanggan}
                    </td>
                    <td className="p-3.5 text-gray-400">
                      {row.items
                        .reduce((sum, item) => sum + item.qty, 0)
                        .toLocaleString("id-ID")}{" "}
                      Pcs Sterno
                    </td>
                    <td className="p-3.5 text-center select-none">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black border tracking-wide ${
                          row.status === "LUNAS"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-900/60"
                            : "bg-amber-950 text-amber-400 border-amber-900/60"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-sky-400 font-mono text-[13px]">
                      Rp {row.nominal.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCetakDokumen(e, "INVOICE", row.nomorInvoice)
                          }
                          className="bg-sky-950/40 border border-sky-800/60 hover:bg-sky-900/60 text-sky-400 font-bold px-2 py-1 rounded text-[10px] uppercase transition-all active:scale-95 shadow-sm"
                        >
                          INV
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCetakDokumen(
                              e,
                              "SURAT JALAN",
                              row.nomorInvoice,
                            )
                          }
                          className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 font-bold px-2 py-1 rounded text-[10px] uppercase transition-all active:scale-95 shadow-sm"
                        >
                          SJ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP MODAL PENINJAU RINCIAN BARANG SALES */}
      {salesTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            {/* Header Modal */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Rincian Dokumen Item Invoice Jual
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  No Ref: {salesTerpilih.nomorInvoice} | Nota:{" "}
                  {salesTerpilih.tanggalDisplay}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSalesTerpilih(null)}
                className="text-gray-500 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Sub-Header Pelanggan */}
            <div className="bg-[#15171c] p-2.5 rounded-lg border border-gray-800 text-xs">
              <span className="text-gray-500 block text-[10px]">
                Identitas Instansi Pembeli / Customer:
              </span>
              <span className="text-white font-bold block mt-0.5">
                {salesTerpilih.pelanggan}
              </span>
            </div>

            {/* Tabel Detail Multi-Item di dalam Invoice */}
            <div className="overflow-hidden border border-gray-800/80 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] border-b border-gray-800 font-bold select-none">
                    <th className="p-2 pl-4">SKU</th>
                    <th className="p-2">Deskripsi Varian Produk Terjual</th>
                    <th className="p-2 text-right">Harga Jual</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right pr-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-[11px] font-medium">
                  {salesTerpilih.items.map((it, idx) => (
                    <tr key={idx} className="text-gray-300">
                      <td className="p-2 pl-4 font-mono text-blue-400">
                        {it.sku}
                      </td>
                      <td className="p-2 text-white font-bold">{it.nama}</td>
                      <td className="p-2 text-right text-gray-400">
                        Rp {it.harga.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-center text-white font-mono font-bold">
                        {it.qty.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-right pr-4 font-bold text-sky-400 font-mono">
                        Rp {it.total.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#15171c]/80 text-xs font-black text-white">
                    <td colSpan="4" className="p-2.5 text-right text-gray-400">
                      GRAND TOTAL NOTA MASUK:
                    </td>
                    <td className="p-2.5 text-right pr-4 font-mono text-sm text-sky-400">
                      Rp {salesTerpilih.nominal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tombol Closing */}
            <button
              type="button"
              onClick={() => setSalesTerpilih(null)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all"
            >
              Tutup Peninjauan Berkas Pen penjualan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
