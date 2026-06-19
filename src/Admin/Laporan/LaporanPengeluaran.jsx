import React, { useState, useMemo, useEffect } from "react";
import { apiRequest } from "../../api";

export default function LaporanPengeluaran() {
  // =========================================================
  // 1. STATE MANAGEMENT
  // =========================================================
  const [jurnalBiaya, setJurnalBiaya] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tglMulai, setTglMulai] = useState("2026-06-01");
  const [tglSelesai, setTglSelesai] = useState("2026-06-30");

  useEffect(() => {
    const fetchPengeluaranData = async () => {
      try {
        setLoading(true);
        const data = await apiRequest(
          `/api/finance/biaya/biaya-operational/?start_date=${tglMulai}&end_date=${tglSelesai}`,
        );
        if (data) {
          setJurnalBiaya(data);
          setError(null);
        }
      } catch (err) {
        console.error("Gagal mengambil data beban biaya:", err);
        setError("Koneksi gagal atau server backend Django belum aktif.");
      } finally {
        setLoading(false);
      }
    };

    fetchPengeluaranData();
  }, [tglMulai, tglSelesai]);

  // =========================================================
  // 2. REKAP DAN KELOMPOK BEBAN
  // =========================================================
  const analisisPengeluaran = useMemo(() => {
    let grandTotalPengeluaran = 0;
    const kelompokBeban = {};

    jurnalBiaya.forEach((item) => {
      grandTotalPengeluaran += item.nominal;

      if (!kelompokBeban[item.kategori]) {
        kelompokBeban[item.kategori] = {
          namaKategori: item.kategori,
          totalNominal: 0,
          listTransaksi: [],
        };
      }

      kelompokBeban[item.kategori].totalNominal += item.nominal;
      kelompokBeban[item.kategori].listTransaksi.push(item);
    });

    return {
      grandTotalPengeluaran,
      daftarKategoriBeban: Object.values(kelompokBeban),
      jumlahTransaksi: jurnalBiaya.length,
    };
  }, [jurnalBiaya]);

  const handleCetak = () => {
    window.print();
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 font-sans">
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          📊 Laporan Pengeluaran Beban
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Analisis alokasi dana keluar dan klasifikasi pos beban operasional
          berkala perusahaan.
        </p>
      </div>

      {/* PANEL FILTER TANGGAL & BUTTON CETAK */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div>
            <label className="block text-gray-500 mb-1 font-semibold">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={tglMulai}
              onChange={(e) => setTglMulai(e.target.value)}
              className="bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:outline-none text-[11px] [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-gray-500 mb-1 font-semibold">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={tglSelesai}
              onChange={(e) => setTglSelesai(e.target.value)}
              className="bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:outline-none text-[11px] [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* BLOCK RENDER UNTUK LOADING DAN ERROR HANDLING */}
      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500 animate-pulse">
          Memuat database kas keuangan...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-xs text-rose-400 bg-[#1a1c23] border border-gray-800 rounded-xl">
          {error}
        </div>
      ) : (
        <>
          {/* MINI CARD KPI OVERVIEW RINGKASAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Akumulasi Beban Operasional
              </p>
              <p className="text-xl font-bold text-rose-400 mt-1 font-mono">
                Rp{" "}
                {analisisPengeluaran.grandTotalPengeluaran.toLocaleString(
                  "id-ID",
                )}
              </p>
            </div>
            <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Jumlah Alokasi Kegiatan
              </p>
              <p className="text-xl font-bold text-white mt-1">
                {analisisPengeluaran.jumlahTransaksi} Pengeluaran Kas
              </p>
            </div>
          </div>

          {/* TAMPILAN (DRAF AUDIT DOKUMEN AKUNTANSI PUTIH) */}
          <div className="max-w-2xl mx-auto bg-white text-gray-800 rounded-2xl p-8 shadow-2xl space-y-6 border border-gray-200">
            {/* KOP NOTA DOKUMEN */}
            <div className="text-center border-b-2 border-gray-200 pb-4">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">
                PT. Solution Corp Indonesia
              </h3>
              <p className="text-xs text-rose-600 font-bold mt-0.5">
                Laporan Rincian Beban Biaya Operasional
              </p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">
                Periode: {tglMulai} s/d {tglSelesai}
              </p>
            </div>

            {/* ALUR REKAP KLASIFIKASI BEBAN AKUNTANSI */}
            <div className="space-y-5 text-xs">
              {analisisPengeluaran.daftarKategoriBeban.length === 0 ? (
                <div className="text-center text-gray-400 italic py-6">
                  Tidak ada catatan pengeluaran kas pada rentang tanggal ini.
                </div>
              ) : (
                analisisPengeluaran.daftarKategoriBeban.map((grup, idx) => (
                  <div key={idx} className="space-y-1.5">
                    {/* Judul Kelompok Beban */}
                    <h4 className="font-extrabold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 text-[11px]">
                      Beban {grup.namaKategori}
                    </h4>

                    {/* Detail Baris di Dalam Kelompok */}
                    <div className="space-y-1 pl-2">
                      {grup.listTransaksi.map((t) => (
                        <div
                          key={t.id}
                          className="flex justify-between items-start text-[11px] text-gray-600 py-0.5"
                        >
                          <div className="max-w-md">
                            <span className="font-mono text-gray-400 mr-2">
                              [{t.tanggal}]
                            </span>
                            <span>
                              {t.keterangan ||
                                `Alokasi kas operasional via ${t.metode}`}
                            </span>
                          </div>
                          <span className="font-mono flex-shrink-0">
                            Rp {t.nominal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal Per Akun Kategori Beban */}
                    <div className="flex justify-between items-center py-1.5 px-2 bg-gray-50 rounded font-bold text-gray-800 text-[11px] border-t border-gray-100">
                      <span>
                        SUBTOTAL BEBAN {grup.namaKategori.toUpperCase()}
                      </span>
                      <span className="font-mono">
                        Rp {grup.totalNominal.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* TOTAL AKHIR BEBAN OPERASIONAL */}
              <div className="pt-3 border-t-2 border-gray-900">
                <div className="flex justify-between items-center p-3 bg-gray-900 border border-gray-900 rounded-xl font-black text-xs text-white">
                  <span className="uppercase tracking-wide">
                    GRAND TOTAL BEBAN OPERASIONAL
                  </span>
                  <span className="font-mono text-sm text-rose-400">
                    Rp{" "}
                    {analisisPengeluaran.grandTotalPengeluaran.toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER SAH DOKUMEN */}
            <div className="text-center text-[9px] text-gray-400 border-t border-gray-100 pt-4 italic font-medium">
              Laporan beban kas operasional ini dicetak otomatis secara
              real-time dari srikulasi buku jurnal pengeluaran internal.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
