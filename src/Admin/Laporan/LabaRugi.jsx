import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function LabaRugi() {
  // ==========================================================
  // [ STATE MANAGEMENT FROM LIVE DJANGO ENDPOINT ]
  // ==========================================================
  const [dataPenjualan, setDataPenjualan] = useState([]);
  const [dataBiaya, setDataBiaya] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterTglMulai, setFilterTglMulai] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 2)
      .toISOString()
      .split("T")[0];
  });
  const [filterTglSelesai, setFilterTglSelesai] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    fetchDataFinansialServer();
  }, [filterTglMulai, filterTglSelesai]);

  const fetchDataFinansialServer = async () => {
    setLoading(true);
    try {
      const salesPayload = await apiRequest(
        `/api/sales/pos-transactions/laba-rugi-data/?start_date=${filterTglMulai}&end_date=${filterTglSelesai}`,
      );

      const biayaPayload = await apiRequest(
        `/api/finance/biaya/biaya-operational/?start_date=${filterTglMulai}&end_date=${filterTglSelesai}`,
      );

      if (salesPayload) setDataPenjualan(salesPayload.transactions || []);
      if (biayaPayload) setDataBiaya(biayaPayload || []);
    } catch (error) {
      console.error("Eror Laba Rugi:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // [ REAL-TIME FINANCIAL MATHEMATICS CALCULATION ]
  // ==========================================================
  const hitungKeuangan = useMemo(() => {
    let omsetPenjualanPOS = 0;
    let totalHppAkumulasi = 0;

    dataPenjualan.forEach((tx) => {
      omsetPenjualanPOS += tx.grand_total || 0;
      totalHppAkumulasi += tx.total_hpp || 0;
    });

    const totalBebanOperasional = dataBiaya.reduce(
      (sum, b) => sum + (parseInt(b.nominal) || parseInt(b.jumlah) || 0),
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
    };
  }, [dataPenjualan, dataBiaya]);

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 font-sans flex flex-col">
      <ToastContainer theme="dark" />

      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-black text-white tracking-wide">
          📊 Laporan Laba Rugi (P&L Statement)
        </h2>
      </div>

      {/* FILTER BAR PANEL RAPI */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl p-4 shadow-xl mb-6 flex flex-col sm:flex-row items-center gap-4 text-xs select-none">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div>
            <label className="block text-gray-500 mb-1 font-bold">
              Mulai Tanggal
            </label>
            <input
              type="date"
              value={filterTglMulai}
              onChange={(e) => setFilterTglMulai(e.target.value)}
              className="bg-[#15171c] border border-gray-800 rounded-xl p-2 text-white font-mono focus:outline-none text-[11px] font-bold [color-scheme:dark]"
            />
          </div>
          <span className="text-gray-700 mt-4 font-bold">s/d</span>
          <div>
            <label className="block text-gray-500 mb-1 font-bold">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filterTglSelesai}
              onChange={(e) => setFilterTglSelesai(e.target.value)}
              className="bg-[#15171c] border border-gray-800 rounded-xl p-2 text-white font-mono focus:outline-none text-[11px] font-bold [color-scheme:dark]"
            />
          </div>
        </div>
        {loading && (
          <span className="text-xs text-amber-500 font-bold animate-pulse sm:ml-auto">
            Menyinkronkan data server...
          </span>
        )}
      </div>

      {/* TAMPILAN NOTA LABA RUGI OPERASIONAL */}
      <div className="max-w-2xl mx-auto w-full bg-[#1a1c23] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* KOP DOKUMEN */}
        <div className="text-center border-b border-gray-800/60 pb-4 select-none">
          <h3 className="text-base font-black text-white uppercase tracking-wider">
            PT. Solution Corp Indonesia
          </h3>
          <p className="text-xs text-emerald-400 font-bold mt-0.5">
            Laporan Rekapitulasi Laba Rugi Operasional
          </p>
          <p className="text-[10px] text-gray-500 font-mono mt-1 font-bold">
            Periode: {filterTglMulai} s/d {filterTglSelesai}
          </p>
        </div>

        {/* AKUMULASI VALUE JURNAL */}
        <div className="space-y-5 text-xs">
          {/* I. PENDAPATAN */}
          <div>
            <h4 className="font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-800/40 pb-1 text-[10px] select-none">
              I. PENDAPATAN USAHA
            </h4>
            <div className="flex justify-between items-center py-2 px-2 hover:bg-[#15171c]/30 rounded-lg transition-colors">
              <span className="text-gray-300 font-medium">
                Total Pendapatan Omset Bersih (POS Loket & Settle MP)
              </span>
              <span className="font-mono text-white font-bold">
                Rp {hitungKeuangan.omsetPenjualanPOS.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 px-2 bg-[#15171c] rounded-xl font-black text-emerald-400 border border-emerald-950/20 shadow-inner">
              <span className="uppercase tracking-wider select-none">
                TOTAL PENDAPATAN USAHA (A)
              </span>
              <span className="font-mono">
                Rp {hitungKeuangan.omsetPenjualanPOS.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* II. HPP MODAL */}
          <div>
            <h4 className="font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-800/40 pb-1 text-[10px] select-none">
              II. HARGA POKOK PENJUALAN (HPP)
            </h4>
            <div className="flex justify-between items-center py-2 px-2 hover:bg-[#15171c]/30 rounded-lg transition-colors">
              <span className="text-gray-300 font-medium">
                Akumulasi Beban Pokok Pembelian Modal Awal Terjual
              </span>
              <span className="font-mono text-rose-400 font-bold">
                Rp {hitungKeuangan.totalHppAkumulasi.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 px-2 bg-[#15171c] rounded-xl font-black text-white border border-gray-800/40 shadow-inner">
              <span className="uppercase tracking-wider select-none">
                TOTAL HARGA POKOK PENJUALAN (B)
              </span>
              <span className="font-mono">
                Rp {hitungKeuangan.totalHppAkumulasi.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* TOTAL LABA KOTOR */}
          <div className="pt-1 select-none">
            <div className="flex justify-between items-center p-3.5 bg-[#202430]/50 border border-gray-800 rounded-xl font-black text-[12px] shadow-sm">
              <span className="text-white uppercase tracking-wider">
                LABA KOTOR / GROSS PROFIT (A - B)
              </span>
              <span className="font-mono text-sky-400 font-black">
                Rp {hitungKeuangan.labaKotor.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* III. BIAYA OPERASIONAL */}
          <div>
            <h4 className="font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-800/40 pb-1 text-[10px] select-none">
              III. BEBAN BIAYA / PENGELUARAN OPERASIONAL
            </h4>
            <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
              {dataBiaya.length === 0 ? (
                <div className="text-gray-600 text-center py-3 italic font-medium select-none">
                  Tidak ada log pengeluaran operasional kas periode ini.
                </div>
              ) : (
                dataBiaya.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="flex justify-between items-center py-1.5 px-2 text-gray-400 hover:bg-[#15171c]/20 rounded-lg font-medium"
                  >
                    <span>
                      Log Pengeluaran:{" "}
                      {b.kategori || b.keterangan || "Biaya Umum"}
                    </span>
                    <span className="font-mono font-bold text-gray-300">
                      Rp{" "}
                      {(
                        parseInt(b.nominal) ||
                        parseInt(b.jumlah) ||
                        0
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between items-center mt-3 py-2 px-2 bg-[#15171c] rounded-xl font-black text-rose-400 border border-rose-950/20 shadow-inner">
              <span className="uppercase tracking-wider select-none">
                TOTAL BEBAN OPERASIONAL (C)
              </span>
              <span className="font-mono">
                Rp{" "}
                {hitungKeuangan.totalBebanOperasional.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* IV. NET PROFIT / LABA BERSIH FINAL */}
          <div className="pt-2 border-t border-gray-800/80">
            <div className="flex justify-between items-center p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-xl font-black text-xs md:text-sm shadow-xl shadow-emerald-950/10">
              <span className="text-emerald-400 uppercase tracking-widest">
                LABA BERSIH OPERASIONAL (NET PROFIT)
              </span>
              <span className="font-mono text-emerald-400 text-base md:text-lg tracking-wide">
                Rp {hitungKeuangan.labaBersih.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER INFORMASI */}
        <div className="text-center text-[9px] text-gray-600 border-t border-gray-800/40 pt-4 italic font-medium select-none">
          Data ditarik secara terintegrasi otomatis berdasarkan sinkronisasi
          riwayat transaksi Solution Indonesia.
        </div>
      </div>
    </div>
  );
}
