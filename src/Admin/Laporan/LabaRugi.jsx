import React, { useState, useMemo } from "react";

export default function LabaRugi() {
  // 1. DATA MASTER LINKING LINTAS MODUL
  const [databaseHpp] = useState([
    { sku: "STR-001", hargaBeli: 3800 },
    { sku: "STR-002", hargaBeli: 17500 },
    { sku: "STR-003", hargaBeli: 19000 },
  ]);

  const [transaksiPOS] = useState([
    {
      id: 201,
      sku: "STR-001",
      qtyTerjual: 1200,
      totalOmset: 7200000,
      tanggal: "2026-06-02",
    },
    {
      id: 202,
      sku: "STR-002",
      qtyTerjual: 150,
      totalOmset: 3750000,
      tanggal: "2026-06-05",
    },
  ]);

  const [catatanBiaya] = useState([
    {
      id: 1,
      kategori: "Bensin & Transport",
      nominal: 150000,
      tanggal: "2026-06-08",
    },
    {
      id: 2,
      kategori: "Utilitas Kantor",
      nominal: 1250000,
      tanggal: "2026-06-05",
    },
    {
      id: 3,
      kategori: "Keperluan Gudang / Packing",
      nominal: 350000,
      tanggal: "2026-06-02",
    },
  ]);

  // 2. STATE CONTROLLER
  const [filterTglMulai, setFilterTglMulai] = useState("2026-06-01");
  const [filterTglSelesai, setFilterTglSelesai] = useState("2026-06-30");

  // 3. FILTER BERDASARKAN RENTANG TANGGAL
  const hitungKeuangan = useMemo(() => {
    let omsetPenjualanPOS = 0;
    let totalHppAkumulasi = 0;
    let totalBebanOperasional = 0;

    // Filter & Hitung Transaksi POS (Omset & HPP)
    const posTersaring = transaksiPOS.filter(
      (pos) => pos.tanggal >= filterTglMulai && pos.tanggal <= filterTglSelesai,
    );

    posTersaring.forEach((pos) => {
      omsetPenjualanPOS += pos.totalOmset;
      const dataHpp = databaseHpp.find((h) => h.sku === pos.sku);
      const modalBeliSatuan = dataHpp ? dataHpp.hargaBeli : 0;
      totalHppAkumulasi += pos.qtyTerjual * modalBeliSatuan;
    });

    // Filter & Hitung Buku Catatan Biaya
    const biayaTersaring = catatanBiaya.filter(
      (b) => b.tanggal >= filterTglMulai && b.tanggal <= filterTglSelesai,
    );

    totalBebanOperasional = biayaTersaring.reduce(
      (sum, b) => sum + b.nominal,
      0,
    );

    const labaKotor = omsetPenjualanPOS - totalHppAkumulasi;
    const labaBersih = labaKotor - totalBebanOperasional;

    return {
      omsetPenjualanPOS,
      totalHppAkumulasi,
      labaKotor,
      totalBebanOperasional,
      labaBersih,
      biayaList: biayaTersaring,
    };
  }, [
    transaksiPOS,
    databaseHpp,
    catatanBiaya,
    filterTglMulai,
    filterTglSelesai,
  ]);

  const handleCetakLaporan = () => {
    alert(
      `Mengekspor draf resmi Laporan Laba Rugi periode ${filterTglMulai} s/d ${filterTglSelesai} ke printer...`,
    );
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          📊 Laporan Laba Rugi (P&L Statement)
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Otomatisasi rekapan dari sirkulasi transaksi Kasir POS, database
          master HPP, dan buku biaya operasional.
        </p>
      </div>

      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-full sm:w-auto">
            <label className="block text-gray-500 mb-1">Mulai Tanggal</label>
            <input
              type="date"
              value={filterTglMulai}
              onChange={(e) => setFilterTglMulai(e.target.value)}
              className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:outline-none text-[11px]"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-gray-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filterTglSelesai}
              onChange={(e) => setFilterTglSelesai(e.target.value)}
              className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:outline-none text-[11px]"
            />
          </div>
        </div>

        {/* Tombol Cetak Dokumen Finansial */}
        <button
          type="button"
          onClick={handleCetakLaporan}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition-all active:scale-95 text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
        >
          🖨️ Cetak Laporan
        </button>
      </div>

      {/* LAPORAN LABA RUGI  */}
      <div className="max-w-2xl mx-auto bg-[#1a1c23] border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* KOP NOTA BERKAS */}
        <div className="text-center border-b border-gray-800 pb-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            PT. Solution Corp Indonesia
          </h3>
          <p className="text-xs text-emerald-400 font-semibold mt-0.5">
            Laporan Keuangan Laba Rugi Operasional
          </p>
          <p className="text-[10px] text-gray-500 font-mono mt-1">
            Periode: {filterTglMulai} s/d {filterTglSelesai}
          </p>
        </div>

        {/* ALUR MATRIKS KEUANGAN */}
        <div className="space-y-5 text-xs">
          {/* SEKTOR 1: PENDAPATAN */}
          <div>
            <h4 className="font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-800/40 pb-1 text-[11px]">
              I. PENDAPATAN USAHA
            </h4>
            <div className="flex justify-between items-center py-1.5 px-2">
              <span className="text-gray-300">
                Pendapatan Omset Bersih Kasir (POS)
              </span>
              <span className="font-mono text-white font-semibold">
                Rp {hitungKeuangan.omsetPenjualanPOS.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-2 bg-[#15171c] rounded font-bold text-emerald-400">
              <span>TOTAL PENDAPATAN BERSIH</span>
              <span className="font-mono">
                Rp {hitungKeuangan.omsetPenjualanPOS.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* SEKTOR 2: HPP */}
          <div>
            <h4 className="font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-800/40 pb-1 text-[11px]">
              II. HARGA POKOK PENJUALAN (HPP)
            </h4>
            <div className="flex justify-between items-center py-1.5 px-2">
              <span className="text-gray-300">
                Akumulasi Beban Pokok Pembelian Bahan Baku
              </span>
              <span className="font-mono text-rose-400">
                Rp {hitungKeuangan.totalHppAkumulasi.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-2 bg-[#15171c] rounded font-bold text-white">
              <span>TOTAL HARGA POKOK PENJUALAN</span>
              <span className="font-mono">
                Rp {hitungKeuangan.totalHppAkumulasi.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* SEKTOR 3: LABA KOTOR */}
          <div className="pt-1">
            <div className="flex justify-between items-center p-3 bg-[#202430]/50 border border-gray-800 rounded-xl font-black text-[13px]">
              <span className="text-white uppercase tracking-wider">
                LABA KOTOR (GROSS PROFIT)
              </span>
              <span className="font-mono text-sky-400">
                Rp {hitungKeuangan.labaKotor.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* SEKTOR 4: BIAYA OPERASIONAL */}
          <div>
            <h4 className="font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-800/40 pb-1 text-[11px]">
              III. BEBAN BIAYA OPERASIONAL
            </h4>
            <div className="space-y-0.5">
              {hitungKeuangan.biayaList.length === 0 ? (
                <div className="text-gray-600 text-center py-2 italic">
                  Tidak ada pengeluaran kas pada periode ini.
                </div>
              ) : (
                hitungKeuangan.biayaList.map((b) => (
                  <div
                    key={b.id}
                    className="flex justify-between items-center py-1 px-2 text-gray-400 hover:bg-[#15171c]/20"
                  >
                    <span>Beban Pengeluaran {b.kategori}</span>
                    <span className="font-mono">
                      Rp {b.nominal.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between items-center mt-2.5 py-1.5 px-2 bg-[#15171c] rounded font-bold text-rose-400">
              <span>TOTAL BEBAN OPERASIONAL</span>
              <span className="font-mono">
                Rp{" "}
                {hitungKeuangan.totalBebanOperasional.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* SEKTOR 5: LABA BERSIH OPERASIONAL FINAL */}
          <div className="pt-2 border-t border-gray-800">
            <div className="flex justify-between items-center p-3.5 bg-emerald-950/40 border border-emerald-900/60 rounded-xl font-black text-sm">
              <span className="text-emerald-400 uppercase tracking-wide">
                LABA BERSIH BERJALAN (NET PROFIT)
              </span>
              <span className="font-mono text-emerald-400 text-base">
                Rp {hitungKeuangan.labaBersih.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER INFORMASI DOKUMEN */}
        <div className="text-center text-[9px] text-gray-600 border-t border-gray-800/60 pt-4 italic font-medium">
          Laporan keuangan ini dihasilkan secara otomatis dan terintegrasi penuh
          berdasarkan hitungan real-time rentang tanggal terfilter.
        </div>
      </div>
    </div>
  );
}
