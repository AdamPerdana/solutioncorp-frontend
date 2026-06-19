import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function LaporanSales() {
  const [dataSales, setDataSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterTglMulai, setFilterTglMulai] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const [filterTglSelesai, setFilterTglSelesai] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${lastDay}`;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [salesTerpilih, setSalesTerpilih] = useState(null);
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // ==========================================================
  // [DATA FETCHING WITH JWT AUTHORIZATION]
  // ==========================================================

  useEffect(() => {
    fetchSeluruhArsipSales();
  }, []);

  const fetchSeluruhArsipSales = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/sales/pos-transactions/?all=true");
      if (data) {
        const dataDipetakan = data.map((item) => ({
          id: item.id,
          nomorInvoice: item.nomor_invoice,
          pelanggan: item.pelanggan,
          tanggal: item.tanggal,
          status: item.status === "Lunas" ? "LUNAS" : "BELUM LUNAS",
          nominal: item.omset_murni,
          metodeBayar: item.metode_bayar,
          ongkir: item.ongkir,
          alamat: item.alamat || "Pickup",
          items: item.items.map((it) => ({
            sku: it.sku,
            nama: it.nama_produk,
            qty: it.qty,
            harga: it.harga,
            total: it.total,
          })),
        }));
        setDataSales(dataDipetakan);
      }
    } catch (error) {
      console.error("Gagal menyinkronkan data laporan sales:", error);
      toast.error("Gagal memuat arsip transaksi dari server.");
    } finally {
      setLoading(false);
    }
  };

  const dataLaporanDisaring = useMemo(() => {
    return dataSales.filter((row) => {
      const cocokTanggal =
        row.tanggal >= filterTglMulai && row.tanggal <= filterTglSelesai;

      const cocokSearch =
        row.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.pelanggan.toLowerCase().includes(searchTerm.toLowerCase());

      const cocokStatus =
        filterStatus === "Semua Status" ||
        row.status.toUpperCase() === filterStatus.toUpperCase();

      return cocokTanggal && cocokSearch && cocokStatus;
    });
  }, [dataSales, filterTglMulai, filterTglSelesai, searchTerm, filterStatus]);

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

  // ==========================================================
  // [ CORE ENGINE: REPRINT INVOICE OR SURAT JALAN PDF]
  // ==========================================================

  const handleCetakDokumen = async (e, tipe, nomorInv, namaCust, tglNota) => {
    e.stopPropagation();

    const namaAman = namaCust.replace(/[/\\?%*:|"<>]/g, "-");
    const endpointPath =
      tipe === "INVOICE" ? "reprint-invoice" : "print-surat-jalan";
    const idToastReport = toast.loading(
      `Sedang menggambar berkas biner ${tipe} dari server...`,
    );

    try {
      const nomorInvoiceAman = encodeURIComponent(nomorInv);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `http://127.0.0.1:8000/api/sales/pos-transactions/${endpointPath}/?invoice=${nomorInvoiceAman}`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!response.ok)
        throw new Error(`Gagal meregenerasi PDF ${tipe} dari database.`);

      const buffer = await response.arrayBuffer();
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(pdfBlob);

      const linkDownload = document.createElement("a");
      linkDownload.href = fileUrl;

      if (tipe === "INVOICE") {
        linkDownload.download = `Invoice ${namaAman} ${tglNota}.pdf`;
      } else {
        linkDownload.download = `Surat Jalan ${namaAman} ${tglNota}.pdf`;
      }

      linkDownload.style.display = "none";
      document.body.appendChild(linkDownload);
      linkDownload.click();

      document.body.removeChild(linkDownload);
      window.URL.revokeObjectURL(fileUrl);

      toast.update(idToastReport, {
        render: `Sukses! Dokumen ${tipe} berhasil diunduh otomatis.`,
        type: "success",
        isLoading: false,
        autoClose: 2500,
      });
    } catch (error) {
      toast.update(idToastReport, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // ==========================================================
  // [ DATABASE MUTATION]
  // ==========================================================

  const handleEksekusiHapus = async () => {
    if (!dataAkanDihapus) return;

    const idToastDelete = toast.loading(
      `Sedang memproses pembatalan massal faktur ${dataAkanDihapus.nomorInvoice}...`,
    );

    try {
      const data = await apiRequest(
        "/api/sales/pos-transactions/delete-by-invoice/",
        {
          method: "DELETE",
          body: JSON.stringify({ invoice: dataAkanDihapus.nomorInvoice }),
        },
      );

      toast.update(idToastDelete, {
        render: `Sukses! Faktur ${dataAkanDihapus.nomorInvoice} beserta seluruh catatan piutang finance berhasil dibersihkan.`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setDataAkanDihapus(null);
      setSalesTerpilih(null);
      fetchSeluruhArsipSales();
    } catch (error) {
      toast.update(idToastDelete, {
        render: "Gagal menghapus arsip transaksi dari server database pusat.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      <div className="pb-4 border-b border-gray-800 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Laporan Penjualan (Sales Report)
        </h2>
        <button
          onClick={fetchSeluruhArsipSales}
          className="bg-[#242731] hover:bg-gray-700 text-xs text-white px-3 py-1.5 rounded-lg border border-gray-800 transition-all font-semibold active:scale-95"
        >
          🔄 Refresh Data
        </button>
      </div>

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
          <p className="text-[9px] text-gray-600 mt-0.5">
            Banyak arsip faktur transaksi yang lolos saringan
          </p>
        </div>
      </div>

      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-gray-500 mb-1">Mulai Tanggal</label>
          <input
            type="date"
            value={filterTglMulai}
            onChange={(e) => setFilterTglMulai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none text-[11px] [color-scheme:dark] font-bold"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={filterTglSelesai}
            onChange={(e) => setFilterTglSelesai(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none text-[11px] [color-scheme:dark] font-bold"
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
            className="w-full bg-[#15171c] border border-emerald-500/30 rounded-lg p-2 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none text-[11px] font-bold"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Status Keuangan</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px] cursor-pointer"
          >
            <option value="Semua Status">-- Semua Status --</option>
            <option value="Lunas">LUNAS</option>
            <option value="Belum Lunas">BELUM LUNAS</option>
          </select>
        </div>
      </div>

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
                <th className="p-3.5 text-center pr-5">Cetak Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-medium text-xs">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-12 text-center text-gray-400 font-bold bg-[#1a1c23]"
                  >
                    ⏳ Sedang memuat seluruh riwayat database POS Solution
                    Indonesia...
                  </td>
                </tr>
              ) : dataLaporanDisaring.length === 0 ? (
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
                    title="Klik untuk meninjau rincian item & opsi hapus"
                  >
                    <td className="p-3.5 pl-5 font-mono text-blue-400 font-bold group-hover:underline">
                      {row.nomorInvoice}
                    </td>
                    <td className="p-3.5 text-gray-500 font-mono">
                      {row.tanggal}
                    </td>
                    <td className="p-3.5 text-white font-bold">
                      {row.pelanggan}
                    </td>
                    <td className="p-3.5 text-gray-400">
                      {row.items
                        .reduce((sum, item) => sum + item.qty, 0)
                        .toLocaleString("id-ID")}{" "}
                      Pcs
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
                    <td
                      className="p-3.5 text-center pr-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) =>
                            handleCetakDokumen(
                              e,
                              "INVOICE",
                              row.nomorInvoice,
                              row.pelanggan,
                              row.tanggal,
                            )
                          }
                          className="bg-sky-950/40 border border-sky-800/60 hover:bg-sky-900/60 text-sky-400 font-bold px-2.5 py-1 rounded text-[10px] uppercase transition-all active:scale-95 shadow-sm"
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
                              row.pelanggan,
                              row.tanggal,
                            )
                          }
                          className="bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-400 font-bold px-2.5 py-1 rounded text-[10px] uppercase transition-all active:scale-95 shadow-sm"
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

      {salesTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Rincian Dokumen Item Invoice Jual
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  No Ref: {salesTerpilih.nomorInvoice} | Tanggal:{" "}
                  {salesTerpilih.tanggal}
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

            <div className="bg-[#15171c] p-3 rounded-lg border border-gray-800 text-xs space-y-1">
              <div>
                <span className="text-gray-500 text-[10px] block">
                  Customer / Toko Pembeli:
                </span>
                <span className="text-white font-bold text-sm">
                  {salesTerpilih.pelanggan}
                </span>
              </div>
              <div className="pt-1 border-t border-gray-800/60">
                <span className="text-gray-500 text-[10px] block">
                  Alamat Tujuan Pengiriman:
                </span>
                <span className="text-gray-400 font-medium">
                  {salesTerpilih.alamat}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-gray-800/60 text-[11px]">
                <p>
                  <span className="text-gray-500">Metode Jual:</span>{" "}
                  <span className="text-white font-bold">
                    {salesTerpilih.metodeBayar}
                  </span>
                </p>
                <p className="text-right">
                  <span className="text-gray-500">Biaya Kirim:</span>{" "}
                  <span className="text-emerald-400 font-bold font-mono">
                    Rp {salesTerpilih.ongkir.toLocaleString("id-ID")}
                  </span>
                </p>
              </div>
            </div>

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

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(salesTerpilih)}
                className="w-1/3 bg-red-950/30 hover:bg-red-900/60 border border-red-800/50 text-red-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                🗑️ Hapus
              </button>
              <button
                type="button"
                onClick={() => setSalesTerpilih(null)}
                className="w-2/3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                Tutup Peninjauan
              </button>
            </div>
          </div>
        </div>
      )}

      {dataAkanDihapus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Hapus Faktur Penjualan?
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda benar-benar yakin ingin menghapus permanen faktur
              <span className="text-red-400 font-bold">
                {" "}
                {dataAkanDihapus.nomorInvoice}{" "}
              </span>
              beserta seluruh rincian barangnya? Tindakan ini tidak dapat
              breattalkan.
            </div>

            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal / Kembali
              </button>
              <button
                type="button"
                onClick={handleEksekusiHapus}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
