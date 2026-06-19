import React, { useState, useMemo, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function LaporanPenjualan() {
  const [jurnalPenjualan, setJurnalPenjualan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tglMulai, setTglMulai] = useState("2026-06-01");
  const [tglSelesai, setTglSelesai] = useState("2026-06-30");

  useEffect(() => {
    const fetchPenjualanData = async () => {
      try {
        setLoading(true);
        const data = await apiRequest("/api/sales/pos-transactions/?all=true");
        if (data) {
          setJurnalPenjualan(data);
          setError(null);
        }
      } catch (err) {
        console.error("Gagal mengambil data penjualan:", err);
        setError("Koneksi gagal atau server backend Django belum aktif.");
      } finally {
        setLoading(false);
      }
    };

    fetchPenjualanData();
  }, []);

  // =========================================================
  //  REKAP & KOMPILASI DATA
  // =========================================================
  const analisisPenjualan = useMemo(() => {
    let totalOmset = 0;
    let totalTunai = 0;
    let totalTempo = 0;
    let totalQtyProduk = 0;

    const rangkumanProduk = {};
    const kelompokMetode = {
      Tunai: [],
      "Tempo / Piutang": [],
    };

    const dataDisaring = jurnalPenjualan.filter((tx) => {
      return tx.tanggal >= tglMulai && tx.tanggal <= tglSelesai;
    });

    dataDisaring.forEach((tx) => {
      totalOmset += tx.grand_total;

      if (
        tx.metode_pembayaran === "Tempo" ||
        tx.status_pembayaran === "Belum Lunas" ||
        tx.status === "Tempo" ||
        tx.status === "BELUM LUNAS"
      ) {
        totalTempo += tx.grand_total;
        kelompokMetode["Tempo / Piutang"].push(tx);
      } else {
        totalTunai += tx.grand_total;
        kelompokMetode["Tunai"].push(tx);
      }

      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach((item) => {
          totalQtyProduk += item.qty;
          if (!rangkumanProduk[item.sku]) {
            rangkumanProduk[item.sku] = {
              sku: item.sku,
              namaProduk: item.nama_produk || item.nama || "Produk",
              qty: 0,
              totalOmset: 0,
            };
          }
          rangkumanProduk[item.sku].qty += item.qty;
          rangkumanProduk[item.sku].totalOmset += item.total;
        });
      }
    });

    return {
      totalOmset,
      totalTunai,
      totalTempo,
      totalQtyProduk,
      daftarProdukTerlaris: Object.values(rangkumanProduk).sort(
        (a, b) => b.qty - a.qty,
      ),
      grupPenjualan: Object.keys(kelompokMetode).map((key) => ({
        metode: key,
        listInvoice: kelompokMetode[key],
        subtotal: kelompokMetode[key].reduce(
          (sum, item) => sum + item.grand_total,
          0,
        ),
      })),
    };
  }, [jurnalPenjualan, tglMulai, tglSelesai]);

  const handleCetak = () => {
    window.print();
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 font-sans">
      <ToastContainer theme="dark" />

      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          📊 Laporan Jurnal Penjualan (Sales)
        </h2>
      </div>

      {/* FILTER PANEL */}
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

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500 animate-pulse">
          Menghitung akumulasi penjualan riil...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-xs text-rose-400 bg-[#1a1c23] border border-gray-800 rounded-xl">
          {error}
        </div>
      ) : (
        <>
          {/* KPI MINI DASHBOARD CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Total Omset Penjualan
              </p>
              <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                Rp {analisisPenjualan.totalOmset.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Penerimaan Kas (Tunai)
              </p>
              <p className="text-xl font-bold text-white mt-1 font-mono">
                Rp {analisisPenjualan.totalTunai.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Piutang Berjalan (Tempo)
              </p>
              <p className="text-xl font-bold text-amber-500 mt-1 font-mono">
                Rp {analisisPenjualan.totalTempo.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-[#1a1c23] border border-gray-800 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Volume Barang Keluar
              </p>
              <p className="text-xl font-bold text-blue-400 mt-1 font-mono">
                {analisisPenjualan.totalQtyProduk.toLocaleString("id-ID")}{" "}
                Produk
              </p>
            </div>
          </div>

          {/* DRAF FORM FORMAL CETAK (PUTIH) */}
          <div className="max-w-3xl mx-auto bg-white text-gray-800 rounded-2xl p-8 shadow-2xl space-y-6 border border-gray-200">
            {/* KOP LAPORAN */}
            <div className="text-center border-b-2 border-gray-200 pb-4">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">
                PT. Solution Corp Indonesia
              </h3>
              <p className="text-xs text-emerald-600 font-bold mt-0.5">
                Laporan Rekapitulasi & Jurnal Omset Penjualan
              </p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">
                Periode: {tglMulai} s/d {tglSelesai}
              </p>
            </div>

            {/* TABEL 1: BREAKDOWN PRODUK TERJUAL */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-gray-900 uppercase tracking-wide text-[11px] border-b border-gray-200 pb-1">
                I. DISTRIBUSI VOLUME PRODUK TERJUAL
              </h4>
              <table className="w-full text-[11px] text-left text-gray-600">
                <thead>
                  <tr className="border-b border-gray-200 font-bold text-gray-900 bg-gray-50">
                    <th className="py-1.5 px-2">SKU</th>
                    <th className="py-1.5 px-2">Nama Produk</th>
                    <th className="py-1.5 px-2 text-center">Qty</th>
                    <th className="py-1.5 px-2 text-right">Kumulatif Omset</th>
                  </tr>
                </thead>
                <tbody>
                  {analisisPenjualan.daftarProdukTerlaris.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 italic text-gray-400"
                      >
                        Belum ada sirkulasi produk keluar.
                      </td>
                    </tr>
                  ) : (
                    analisisPenjualan.daftarProdukTerlaris.map((p, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-1 px-2 font-mono text-gray-400">
                          {p.sku}
                        </td>
                        <td className="py-1 px-2 font-medium text-gray-800">
                          {p.namaProduk}
                        </td>
                        <td className="py-1 px-2 text-center font-mono">
                          {p.qty}
                        </td>
                        <td className="py-1 px-2 text-right font-mono text-gray-900">
                          Rp {p.totalOmset.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABEL 2: DETAIL JURNAL PENJUALAN PER KELOMPOK BAYAR */}
            <div className="space-y-5 pt-2">
              <h4 className="font-extrabold text-gray-900 uppercase tracking-wide text-[11px]">
                II. RINCIAN INVOICE BERDASARKAN ALIRAN DANA
              </h4>

              {analisisPenjualan.grupPenjualan.every(
                (g) => g.listInvoice.length === 0,
              ) ? (
                <div className="text-center text-gray-400 italic py-4 text-xs">
                  Tidak ada transaksi penjualan terdaftar pada periode ini.
                </div>
              ) : (
                analisisPenjualan.grupPenjualan.map(
                  (grup, idx) =>
                    grup.listInvoice.length > 0 && (
                      <div key={idx} className="space-y-1.5">
                        <div className="font-bold text-gray-900 text-[11px] bg-gray-100 px-2 py-1 rounded uppercase tracking-wider">
                          Metode Transaksi: {grup.metode}
                        </div>

                        <div className="space-y-1 pl-1">
                          {grup.listInvoice.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex justify-between items-start text-[11px] text-gray-600 border-b border-gray-50 py-1 hover:text-gray-900"
                            >
                              <div>
                                <span className="font-mono text-gray-400 mr-2">
                                  [{inv.tanggal}]
                                </span>
                                <span className="font-bold text-gray-800 mr-2">
                                  {inv.nomor_invoice}
                                </span>
                                <span className="text-gray-500">
                                  ({inv.pelanggan || "Cash Customer"})
                                </span>
                                <div className="text-[10px] text-gray-400 pl-14 italic">
                                  {inv.items
                                    ?.map(
                                      (it) =>
                                        `${it.nama_produk || it.nama || "Produk"} x${it.qty}`,
                                    )
                                    .join(", ")}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-gray-900">
                                Rp {inv.grand_total.toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center py-1.5 px-2 bg-gray-50 rounded font-bold text-gray-800 text-[11px] border-t border-gray-200">
                          <span>
                            SUBTOTAL OMSET {grup.metode.toUpperCase()}
                          </span>
                          <span className="font-mono">
                            Rp {grup.subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ),
                )
              )}
            </div>

            {/* GRAND TOTAL AKHIR OMSET */}
            <div className="pt-3 border-t-2 border-gray-900">
              <div className="flex justify-between items-center p-3 bg-gray-900 rounded-xl font-black text-xs text-white">
                <span className="uppercase tracking-wide">
                  GRAND TOTAL OMSET KOTOR (GROSS REVENUE)
                </span>
                <span className="font-mono text-sm text-emerald-400">
                  Rp {analisisPenjualan.totalOmset.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* FOOTER */}
            <div className="text-center text-[9px] text-gray-400 border-t border-gray-100 pt-4 italic font-medium">
              Data transaksi di atas ditarik otomatis secara real-time langsung
              dari modul point-of-sales (POS) server utama Solution Corp.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
