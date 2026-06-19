import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function PoReport() {
  // ==========================================================
  // [STATE MANAGEMENT & INITIALIZATION]
  // ==========================================================

  const [databasePO, setDatabasePO] = useState([]);
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
  const [filterStatusBayar, setFilterStatusBayar] = useState("Semua Status");
  const [poTerpilih, setPoTerpilih] = useState(null);
  const [dataAkanDihapus, setDataAkanDihapus] = useState(null);

  // ==========================================================
  // [DATA FETCHING WITH JWT AUTHORIZATION]
  // ==========================================================

  useEffect(() => {
    fetchSeluruhArsipPO();
  }, []);

  const fetchSeluruhArsipPO = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/inventory/purchase-orders/?all=true");
      if (data) {
        const dataDipetakan = data.map((item) => {
          const statusKeuangan =
            item.status_hutang === "Lunas" ? "LUNAS" : "TEMPO";

          return {
            id: item.id,
            noPO: item.nomor_po,
            supplier: item.supplier,
            tgl: item.tanggal,
            tglDisplay: new Date(item.tanggal).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            statusBayar: statusKeuangan,
            grandTotal: item.grand_total,
            items: (item.items || []).map((it) => ({
              sku: it.sku,
              nama: it.nama_produk,
              qty: it.qty,
              hargaBeli: it.harga_beli,
              total: it.total,
            })),
          };
        });
        setDatabasePO(dataDipetakan);
      }
    } catch (error) {
      console.error("Gagal menyinkronkan laporan PO:", error);
      toast.error("Gagal memuat arsip Purchase Order dari server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // [FILTERING]
  // ==========================================================
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

  // ==========================================================
  // [SUMMARY CARDS CALCULATOR]
  // ==========================================================
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

  // ==========================================================
  // [REPRINT PURCHASE ORDER PDF WITH JWT AUTHORIZATION]
  // ==========================================================
  const handleCetakPO = async (e, nomorPO, namaSupplier) => {
    e.stopPropagation();

    const namaAman = namaSupplier.replace(/[/\\?%*:|"<>]/g, "-");
    const idToastPO = toast.loading(
      `Sedang mengunduh dokumen resmi ${nomorPO}...`,
    );

    try {
      const nomorPOAman = encodeURIComponent(nomorPO);
      // Menggunakan fetch bawaan karena perlu mengambil arrayBuffer blob berkas PDF, tetapi headers disesuaikan token
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://127.0.0.1:8000/api/inventory/purchase-orders/reprint-po?po=${nomorPOAman}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || "Gagal meregenerasi file PDF PO resmi dari server.",
        );
      }

      const buffer = await response.arrayBuffer();
      const pdfBlob = new Blob([buffer], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(pdfBlob);

      const linkDownload = document.createElement("a");
      linkDownload.href = fileUrl;
      linkDownload.download = `PO_${nomorPO.replace(/\//g, "-")}_${namaAman}.pdf`;
      linkDownload.style.display = "none";
      document.body.appendChild(linkDownload);
      linkDownload.click();

      document.body.removeChild(linkDownload);
      window.URL.revokeObjectURL(fileUrl);

      toast.update(idToastPO, {
        render: `Sukses! Berkas PDF ${nomorPO} berhasil diunduh otomatis.`,
        type: "success",
        isLoading: false,
        autoClose: 2500,
      });
    } catch (error) {
      toast.update(idToastPO, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // ==========================================================
  // [DATABASE MUTATION WITH JWT AUTHORIZATION]
  // ==========================================================
  const handleEksekusiHapus = async () => {
    if (!dataAkanDihapus) return;

    const idToastDelete = toast.loading(
      `Membatalkan dokumen pengadaan ${dataAkanDihapus.noPO}...`,
    );

    try {
      const data = await apiRequest(
        "/api/inventory/purchase-orders/delete-by-po/",
        {
          method: "DELETE",
          body: JSON.stringify({ po: dataAkanDihapus.noPO }),
        },
      );

      if (data) {
        toast.update(idToastDelete, {
          render: `Sukses! Dokumen PO ${dataAkanDihapus.noPO} beserta ledger hutang terkait terhapus.`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setDataAkanDihapus(null);
        setPoTerpilih(null);
        fetchSeluruhArsipPO();
      }
    } catch (error) {
      toast.update(idToastDelete, {
        render: "Gagal menghapus dokumen PO dari server database.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Laporan Pembelian & Restok (PO Report)
        </h2>
        <button
          onClick={fetchSeluruhArsipPO}
          className="bg-[#242731] hover:bg-gray-700 text-xs text-white px-3 py-1.5 rounded-lg border border-gray-800 transition-all font-semibold active:scale-95"
        >
          🔄 Refresh Data PO
        </button>
      </div>

      {/* METRIK SUMMARY CARDS */}
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

      {/* FILTER CONTROLLER */}
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
            Cari Supplier / Nomor PO
          </label>
          <input
            type="text"
            placeholder="Ketik kode PO atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#15171c] border border-emerald-500/30 rounded-lg p-2 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none text-[11px] font-bold"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Status Keuangan</label>
          <select
            value={filterStatusBayar}
            onChange={(e) => setFilterStatusBayar(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg p-2 text-white font-bold focus:border-blue-500 focus:outline-none text-[11px] cursor-pointer"
          >
            <option value="Semua Status">-- Semua Status --</option>
            <option value="Lunas">LUNAS</option>
            <option value="Tempo">TEMPO</option>
          </select>
        </div>
      </div>

      {/* CORE TABEL */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-xl">
        <div className="overflow-x-auto rounded-lg border border-gray-800/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 font-semibold select-none text-[11px]">
                <th className="p-3.5 pl-5">Nomor PO</th>
                <th className="p-3.5">Tanggal Berkas</th>
                <th className="p-3.5">Nama Vendor Supplier</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Nominal Pengeluaran</th>
                <th className="p-3.5 text-center pr-5">Berkas Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-xs font-medium">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-gray-400 font-bold bg-[#1a1c23]"
                  >
                    ⏳ Menyinkronkan daftar riwayat Purchase Order Solution
                    Indonesia...
                  </td>
                </tr>
              ) : dataLaporanDisaring.length === 0 ? (
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
                        className={`px-2 py-0.5 rounded text-[9px] font-black border tracking-wide uppercase ${po.statusBayar === "LUNAS" ? "bg-emerald-950 text-emerald-400 border-emerald-900/60" : "bg-amber-950 text-amber-400 border-amber-900/60"}`}
                      >
                        {po.statusBayar}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-sky-400 font-mono text-[13px]">
                      Rp {po.grandTotal.toLocaleString("id-ID")}
                    </td>
                    <td
                      className="p-3.5 text-center pr-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleCetakPO(e, po.noPO, po.supplier)}
                        className="bg-sky-950/40 border border-sky-800/60 hover:bg-sky-900/60 text-sky-400 font-bold px-2.5 py-1 rounded text-[10px] uppercase transition-all active:scale-95 shadow-sm"
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

      {/* MODAL DETIL ITEM PO */}
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
                        Rp {(it.hargaBeli || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-center text-white font-mono font-bold">
                        {(it.qty || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-right pr-4 font-bold text-sky-400 font-mono">
                        Rp {(it.total || 0).toLocaleString("id-ID")}
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
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDataAkanDihapus(poTerpilih)}
                className="w-1/3 bg-red-950/30 hover:bg-red-900/60 border border-red-800/50 text-red-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                🗑️ Batalkan PO
              </button>
              <button
                type="button"
                onClick={() => setPoTerpilih(null)}
                className="w-2/3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                Tutup Peninjauan Berkas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE */}
      {dataAkanDihapus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-red-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Batalkan & Hapus Berkas PO?
              </h3>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Apakah Anda benar-benar yakin ingin menghapus permanen dokumen
              Purchase Order{" "}
              <span className="text-red-400 font-mono font-bold">
                "{dataAkanDihapus.noPO}"
              </span>{" "}
              terhadap supplier{" "}
              <span className="text-white font-bold">
                {dataAkanDihapus.supplier}
              </span>
              ? Tindakan ini akan mengeliminasi log pembelian dari server and
              bersifat permanen.
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
