import React, { useState, useMemo } from "react";

export default function PoReport() {
  const [databasePO] = useState([
    {
      id: 1,
      noPO: "PO-2026-001",
      supplier: "PT Kimia Industri Utama",
      tgl: "2026-06-01",
      tglDisplay: "1 Juni 2026",
      statusBayar: "LUNAS",
      grandTotal: 1635000,
      items: [
        {
          sku: "STR-002",
          nama: "Sterno Gel Refill 1kg Pxton",
          qty: 50,
          hargaBeli: 17500,
          total: 875000,
        },
        {
          sku: "STR-001",
          nama: "Sterno Kaleng Original Pxton",
          qty: 160,
          hargaBeli: 3800,
          total: 610000,
        },
      ],
    },
    {
      id: 2,
      noPO: "PO-2026-002",
      supplier: "Pabrik Kaleng Logam Jaya",
      tgl: "2026-06-04",
      tglDisplay: "4 Juni 2026",
      statusBayar: "TEMPO",
      grandTotal: 4000000,
      items: [
        {
          sku: "STR-001",
          nama: "Sterno Kaleng Original Pxton",
          qty: 1000,
          hargaBeli: 3800,
          total: 3800000,
        },
      ],
    },
    {
      id: 3,
      noPO: "PO-2026-003",
      supplier: "CV Distribusi Solusi Kimia",
      tgl: "2026-06-08",
      tglDisplay: "8 Juni 2026",
      statusBayar: "LUNAS",
      grandTotal: 1900000,
      items: [
        {
          sku: "STR-003",
          nama: "Sterno Cair Eco Liquid 1L",
          qty: 100,
          hargaBeli: 19000,
          total: 1900000,
        },
      ],
    },
  ]);

  // STATE FILTERING
  const [filterTglMulai, setFilterTglMulai] = useState("2026-06-01");
  const [filterTglSelesai, setFilterTglSelesai] = useState("2026-06-30");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatusBayar, setFilterStatusBayar] = useState("Semua Status");

  const [poTerpilih, setPoTerpilih] = useState(null);

  // FILTERING DATA REAL-TIME
  const dataLaporanDisaring = useMemo(() => {
    return databasePO.filter((po) => {
      const cocokTanggal =
        po.tgl >= filterTglMulai && po.tgl <= filterTglSelesai;
      const cocokSearch =
        po.noPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const cocokStatus =
        filterStatusBayar === "Semua Status" ||
        po.statusBayar.toUpperCase() === filterStatusBayar.toUpperCase();

      return cocokTanggal && cocokSearch && cocokStatus;
    });
  }, [
    databasePO,
    filterTglMulai,
    filterTglSelesai,
    searchTerm,
    filterStatusBayar,
  ]);

  // 4. METRIK SUMMARY CARDS
  const ringkasanMetrik = useMemo(() => {
    let totalBelanja = 0;
    let totalUtangTempo = 0;
    let totalDokumenTerbit = dataLaporanDisaring.length;

    dataLaporanDisaring.forEach((po) => {
      totalBelanja += po.grandTotal;
      if (po.statusBayar === "TEMPO") {
        totalUtangTempo += po.grandTotal;
      }
    });

    return { totalBelanja, totalUtangTempo, totalDokumenTerbit };
  }, [dataLaporanDisaring]);

  const handleCetakPO = (e, nomorPO) => {
    e.stopPropagation();
    alert(
      `Mengirim perintah cetak untuk berkas dokumen "${nomorPO}" ke printer...`,
    );
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Laporan Pembelian & Restok (PO Report)
        </h2>
      </div>

      {/* METRIK SUMMARY CARDS CONTROLLER  */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            TOTAL PENGELUARAN MODAL (PO)
          </p>
          <h3 className="text-xl font-black text-white font-mono mt-1">
            Rp {ringkasanMetrik.totalBelanja.toLocaleString("id-ID")}
          </h3>
          <p className="text-[9px] text-gray-600 mt-0.5">
            Akumulasi dana belanja bahan baku berjalan
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            TOTAL UTANG DAGANG (TEMPO)
          </p>
          <h3 className="text-xl font-black text-amber-500 font-mono mt-1">
            Rp {ringkasanMetrik.totalUtangTempo.toLocaleString("id-ID")}
          </h3>
          <p className="text-[9px] text-amber-500/40 mt-0.5">
            Sisa kewajiban pembayaran belum lunas ke vendor
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            JUMLAH DOKUMEN PO TERBIT
          </p>
          <h3 className="text-xl font-black text-sky-400 font-mono mt-1">
            {ringkasanMetrik.totalDokumenTerbit} Berkas
          </h3>
          <p className="text-[9px] text-gray-600 mt-0.5">
            Kuantitas berkas restok supplier terfilter
          </p>
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
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:outline-none text-[11px]"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={filterTglSelesai}
            onChange={(e) => setFilterTglSelesai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:outline-none text-[11px]"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">
            Cari Supplier / Nomor PO
          </label>
          <input
            type="text"
            placeholder="Ketik kode PO atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#15171c] border border-emerald-500/30 rounded-lg p-2 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none text-[11px]"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Status Keuangan</label>
          <select
            value={filterStatusBayar}
            onChange={(e) => setFilterStatusBayar(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white focus:outline-none text-[11px] cursor-pointer"
          >
            <option value="Semua Status">-- Semua Status --</option>
            <option value="Lunas">LUNAS</option>
            <option value="Tempo">TEMPO</option>
          </select>
        </div>
      </div>

      {/* PO REPORT */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl">
        <div className="overflow-x-auto rounded-lg border border-gray-800/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15171c]/50 text-gray-400 border-b border-gray-800 font-semibold select-none text-[11px]">
                <th className="p-3.5 pl-5">Nomor PO</th>
                <th className="p-3.5">Tanggal Berkas</th>
                <th className="p-3.5">Nama Vendor Supplier</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Nominal Pengeluaran</th>
                <th className="p-3.5 text-center pr-5">Berkas Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
              {dataLaporanDisaring.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                  >
                    ❌ Data transaksi belanja dengan status tersebut tidak
                    ditemukan.
                  </td>
                </tr>
              ) : (
                dataLaporanDisaring.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => setPoTerpilih(po)}
                    className="hover:bg-[#1d2029]/80 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 pl-5 font-mono text-blue-400 font-bold group-hover:underline">
                      {po.noPO}
                    </td>
                    <td className="p-3.5 text-gray-500 font-mono">
                      {po.tglDisplay}
                    </td>
                    <td className="p-3.5 text-white font-bold">
                      {po.supplier}
                    </td>
                    <td className="p-3.5 text-center select-none">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black border tracking-wide ${
                          po.statusBayar === "LUNAS"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-900/60"
                            : "bg-amber-950 text-amber-400 border-amber-900/60"
                        }`}
                      >
                        {po.statusBayar}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-sky-400 font-mono text-[13px]">
                      Rp {po.grandTotal.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <button
                        type="button"
                        onClick={(e) => handleCetakPO(e, po.noPO)}
                        className="bg-sky-950/40 border border-sky-800/60 hover:bg-sky-900/60 text-sky-400 font-bold px-2 py-1 rounded text-[10px] uppercase transition-all active:scale-95 shadow-sm font-sans"
                      >
                        PO
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {poTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Rincian Dokumen Item Belanja
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  No Ref: {poTerpilih.noPO} | Nota: {poTerpilih.tglDisplay}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPoTerpilih(null)}
                className="text-gray-500 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="bg-[#15171c] p-2.5 rounded-lg border border-gray-800 text-xs">
              <span className="text-gray-500 block text-[10px]">
                Pemasok / Supplier Partner:
              </span>
              <span className="text-white font-bold block mt-0.5">
                {poTerpilih.supplier}
              </span>
            </div>

            <div className="overflow-hidden border border-gray-800/80 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 text-[10px] border-b border-gray-800 font-bold select-none">
                    <th className="p-2 pl-4">SKU</th>
                    <th className="p-2">Deskripsi Barang Bahan Baku</th>
                    <th className="p-2 text-right">Harga Beli</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right pr-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-[11px] font-medium">
                  {poTerpilih.items.map((it, idx) => (
                    <tr key={idx} className="text-gray-300">
                      <td className="p-2 pl-4 font-mono text-blue-400">
                        {it.sku}
                      </td>
                      <td className="p-2 text-white font-bold">{it.nama}</td>
                      <td className="p-2 text-right text-gray-400">
                        Rp {it.hargaBeli.toLocaleString("id-ID")}
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
                      GRAND TOTAL KELUAR:
                    </td>
                    <td className="p-2.5 text-right pr-4 font-mono text-sm text-sky-400">
                      Rp {poTerpilih.grandTotal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setPoTerpilih(null)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all"
            >
              Tutup Peninjauan Berkas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
