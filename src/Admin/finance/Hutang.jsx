import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function Hutang() {
  // ==========================================================
  // [STATE MANAGEMENT & INITIALIZATION]
  // ==========================================================

  const [daftarHutang, setDaftarHutang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [hutangAkanDiproses, setHutangAkanDiproses] = useState(null);
  const [hutangAkanDilunasi, setHutangAkanDilunasi] = useState(null);
  const [hutangDitinjau, setHutangDitinjau] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ==========================================================
  // [ DATA FETCHING DARI BACKEND WITH JWT AUTHORIZATION ]
  // ==========================================================

  useEffect(() => {
    fetchHutangDariBackend();
  }, []);

  const fetchHutangDariBackend = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/finance/hutang/");
      if (data) {
        const dataDipetakan = data.map((item) => ({
          id: item.id,
          nomorPO: item.nomor_po,
          supplier: item.supplier,
          tanggalPO: item.tanggal_po,
          deskripsiBarang: item.deskripsi_barang || "Pembelian Bahan Baku Stok",
          totalTagihan: item.total_tagihan,
          sisaHutang: item.sisa_hutang,
          statusHutang: item.status_hutang,
        }));
        setDaftarHutang(dataDipetakan);
      }
    } catch (error) {
      console.error("Error Fetching Hutang:", error);
      toast.error("Koneksi data ledger hutang ke server Django terputus!");
    } finally {
      setLoading(false);
    }
  };

  const handleBukaRincianDokumen = async (id) => {
    setLoadingDetail(true);
    try {
      const data = await apiRequest(`/api/finance/hutang/${id}/`);
      if (data) {
        setHutangDitinjau(data);
      }
    } catch (error) {
      console.error("Error detail hutang:", error);
      toast.error("Gagal memuat rincian item belanja dari server.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // ==========================================================
  // [MUTATION & DATABASE INTEGRATION WITH JWT AUTHORIZATION]
  // ==========================================================

  const handleEksekusiProcess = async () => {
    if (!hutangAkanDiproses) return;

    const payload = { status_hutang: "On Process" };
    const idToast = toast.loading(
      `Mendaftarkan antrean dana PO ${hutangAkanDiproses.nomorPO}...`,
    );

    try {
      const data = await apiRequest(
        `/api/finance/hutang/${hutangAkanDiproses.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      if (data) {
        setDaftarHutang((prevList) =>
          prevList.map((item) =>
            item.id === hutangAkanDiproses.id
              ? { ...item, statusHutang: "On Process" }
              : item,
          ),
        );

        toast.update(idToast, {
          render: `Sukses! PO ${hutangAkanDiproses.nomorPO} masuk antrean kas keluar.`,
          type: "info",
          isLoading: false,
          autoClose: 2500,
        });
        setHutangAkanDiproses(null);
      }
    } catch (error) {
      toast.update(idToast, {
        render: "Server gagal mengonfirmasi perubahan status.",
        type: "error",
        isLoading: false,
        autoClose: 3500,
      });
    }
  };

  const handleEksekusiPelunasanFull = async () => {
    if (!hutangAkanDilunasi) return;

    const payload = {
      sisa_hutang: 0,
      status_hutang: "Lunas",
    };
    const idToast = toast.loading(
      `Membukukan pelunasan faktur vendor ${hutangAkanDilunasi.nomorPO}...`,
    );

    try {
      const data = await apiRequest(
        `/api/finance/hutang/${hutangAkanDilunasi.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      if (data) {
        setDaftarHutang((prevList) =>
          prevList.map((item) =>
            item.id === hutangAkanDilunasi.id
              ? { ...item, sisaHutang: 0, statusHutang: "Lunas" }
              : item,
          ),
        );

        toast.update(idToast, {
          render: `Sukses! Hutang kepada ${hutangAkanDilunasi.supplier} telah Lunas Mutlak.`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        setHutangAkanDilunasi(null);
        setHutangDitinjau(null);
      }
    } catch (error) {
      toast.update(idToast, {
        render: "Gagal mengunci pelunasan keuangan di database.",
        type: "error",
        isLoading: false,
        autoClose: 3500,
      });
    }
  };

  // ==========================================================
  // [FILTER & SORT]
  // ==========================================================

  const hitungHariCounter = (tanggalPO, statusHutang) => {
    if (statusHutang === "Lunas") return "-";
    const tglAwal = new Date(tanggalPO);
    const tglSekarang = new Date();
    const selisihWaktu = tglSekarang.getTime() - tglAwal.getTime();
    const selisihHari = Math.floor(selisihWaktu / (1000 * 3600 * 24));
    return selisihHari < 0 ? 0 : selisihHari;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let filteredResults = daftarHutang.filter(
      (item) =>
        item.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (filterStatus !== "Semua Status") {
      filteredResults = filteredResults.filter(
        (item) =>
          item.statusHutang.toUpperCase() === filterStatus.toUpperCase(),
      );
    }

    if (sortConfig.key !== null) {
      filteredResults.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filteredResults;
  }, [daftarHutang, searchTerm, filterStatus, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return " ↕";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  const totalHutangAktif = useMemo(() => {
    return daftarHutang.reduce(
      (sum, item) =>
        sum + (item.statusHutang !== "Lunas" ? item.sisaHutang : 0),
      0,
    );
  }, [daftarHutang]);

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col font-sans">
      <ToastContainer theme="dark" />

      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Hutang Dagang Perusahaan (A/P)
        </h2>
        <button
          onClick={fetchHutangDariBackend}
          className="bg-[#242731] hover:bg-gray-700 text-xs text-white px-3 py-1.5 rounded-lg border border-gray-800 transition-all font-semibold active:scale-95"
        >
          🔄 Synchronize Accounts Payable
        </button>
      </div>

      {/* PANEL RINGKASAN METRIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 select-none">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Hutang Berjalan
          </p>
          <p className="text-xl font-black text-rose-400 mt-1 font-mono">
            Rp {totalHutangAktif.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 shadow-md">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Invoice PO Pending
          </p>
          <p className="text-xl font-black text-white mt-1">
            {daftarHutang.filter((i) => i.statusHutang !== "Lunas").length} PO
            Supplier
          </p>
        </div>
      </div>

      {/* FILTER CONTROLLER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <div className="relative w-full flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari berdasarkan nomor PO atau nama supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c23] border border-emerald-500/30 rounded-lg pl-9 pr-4 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-44 bg-[#1a1c23] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-amber-500/90 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="Semua Status">Semua Status</option>
          <option value="Belum Lunas">Belum Lunas</option>
          <option value="On Process">On Process</option>
          <option value="Lunas">Lunas</option>
        </select>
      </div>

      {/* GRID TABEL DATA HUTANG */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800/80 bg-[#15171c]/50 text-gray-400 select-none text-[11px]">
                <th
                  onClick={() => handleSort("nomorPO")}
                  className="p-4 font-bold text-blue-500 cursor-pointer hover:bg-[#1d2029]"
                >
                  Nomor PO{getSortIcon("nomorPO")}
                </th>
                <th
                  onClick={() => handleSort("supplier")}
                  className="p-4 font-bold text-blue-500 cursor-pointer hover:bg-[#1d2029]"
                >
                  Supplier{getSortIcon("supplier")}
                </th>
                <th
                  onClick={() => handleSort("tanggalPO")}
                  className="p-4 font-bold text-blue-500 cursor-pointer hover:bg-[#1d2029]"
                >
                  Tgl PO{getSortIcon("tanggalPO")}
                </th>
                <th className="p-4 font-bold text-blue-500">
                  Isi Deskripsi Barang
                </th>
                <th className="p-4 font-bold text-blue-500 text-center">
                  Umur Nota
                </th>
                <th className="p-4 font-bold text-blue-500 text-center">
                  Status
                </th>
                <th
                  onClick={() => handleSort("totalTagihan")}
                  className="p-4 font-bold text-blue-500 text-right cursor-pointer hover:bg-[#1d2029]"
                >
                  Total Tagihan{getSortIcon("totalTagihan")}
                </th>
                <th className="p-4 font-bold text-blue-500 text-center">
                  Aksi Kerja
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium text-gray-300">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="p-12 text-center text-amber-400 font-bold bg-[#1a1c23]"
                  >
                    ⏳ Menyelaraskan ambang batas kewajiban saldo A/P dengan
                    Django...
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="p-8 text-center text-gray-500 font-semibold bg-[#1a1c23]"
                  >
                    ❌ Tidak ada catatan hutang dagang yang terdaftar.
                  </td>
                </tr>
              ) : (
                processedData.map((item) => {
                  const hariBerjalan = hitungHariCounter(
                    item.tanggalPO,
                    item.statusHutang,
                  );

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleBukaRincianDokumen(item.id)}
                      className="hover:bg-[#1d2029]/80 transition-colors cursor-pointer group"
                      title="Klik untuk meninjau rincian item PO"
                    >
                      <td className="p-4 font-mono font-bold text-blue-400 group-hover:underline">
                        {item.nomorPO}
                      </td>
                      <td className="p-4 font-bold text-gray-200">
                        {item.supplier}
                      </td>
                      <td className="p-4 text-gray-500 font-mono">
                        {item.tanggalPO}
                      </td>
                      <td className="p-4 text-gray-400 max-w-xs truncate">
                        {item.deskripsiBarang}
                      </td>
                      <td className="p-4 text-center font-bold tracking-wide">
                        {item.statusHutang === "Lunas" ? (
                          <span className="text-gray-600">-</span>
                        ) : (
                          <span
                            className={
                              hariBerjalan > 30
                                ? "text-red-500 animate-pulse font-black"
                                : "text-amber-400"
                            }
                          >
                            {hariBerjalan} Hari
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center select-none">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wide border uppercase ${
                            item.statusHutang === "Lunas"
                              ? "bg-emerald-950 text-emerald-400 border-emerald-900/60"
                              : item.statusHutang === "On Process"
                                ? "bg-sky-950 text-sky-400 border-sky-900/60"
                                : "bg-amber-950 text-amber-400 border-amber-900/60"
                          }`}
                        >
                          {item.statusHutang === "Lunas"
                            ? "✅ LUNAS"
                            : item.statusHutang}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-sky-400 font-mono text-[13px]">
                        Rp {item.totalTagihan.toLocaleString("id-ID")}
                      </td>
                      <td
                        className="p-4 text-center select-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.statusHutang === "Belum Lunas" ? (
                          <button
                            type="button"
                            onClick={() => setHutangAkanDiproses(item)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded text-[11px] transition-all active:scale-95 shadow-sm"
                          >
                            ⚡ Process
                          </button>
                        ) : item.statusHutang === "On Process" ? (
                          <button
                            type="button"
                            onClick={() => setHutangAkanDilunasi(item)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition-all active:scale-95 shadow-sm"
                          >
                            💸 Set Lunas
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[11px] font-medium italic">
                            Selesai Terbayar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="text-amber-400 font-bold text-xs bg-[#1a1c23] border border-gray-800 px-4 py-2.5 rounded-xl shadow-xl">
            🔄 Memuat manifes item PO dari server...
          </div>
        </div>
      )}

      {/* POP-UP RINCIAN ITEM */}
      {hutangDitinjau && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-2xl w-full max-w-2xl p-5 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setHutangDitinjau(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors font-bold text-sm"
            >
              ✕
            </button>
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">
                Rincian Dokumen Item Invoice Beli (PO)
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                No Ref: {hutangDitinjau.nomor_po} | Tanggal PO:{" "}
                {hutangDitinjau.tanggal_po}
              </p>
            </div>

            <div className="bg-[#15171c]/60 border border-gray-800/80 rounded-xl p-3.5 text-xs space-y-2">
              <div>
                <span className="text-gray-500 text-[10px] block">
                  Pemasok / Supplier Partner:
                </span>
                <span className="text-white font-black text-sm mt-0.5">
                  {hutangDitinjau.supplier}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-800/40 flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-gray-500">Status Keuangan:</span>
                  <span
                    className={`font-black ml-1.5 ${hutangDitinjau.status_hutang === "Lunas" ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    {hutangDitinjau.status_hutang.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Sisa Hutang Dagang:</span>
                  <span className="text-rose-400 font-mono font-bold ml-1.5">
                    Rp{" "}
                    {(hutangDitinjau.sisa_hutang || 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-800/50 max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 text-[10px] font-bold">
                    <th className="p-3 pl-4 w-[15%]">SKU</th>
                    <th className="p-3 w-[45%]">Deskripsi Varian Bahan Baku</th>
                    <th className="p-3 text-right w-[15%]">Harga Beli</th>
                    <th className="p-3 text-center w-[10%]">Qty</th>
                    <th className="p-3 text-right pr-4 w-[15%]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 font-medium text-xs">
                  {hutangDitinjau.items && hutangDitinjau.items.length > 0 ? (
                    hutangDitinjau.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#20232c]/40 text-gray-300"
                      >
                        <td className="p-3 pl-4 font-mono text-blue-400">
                          {item.sku}
                        </td>
                        <td className="p-3 text-white font-bold">
                          {item.nama_produk}
                        </td>
                        <td className="p-3 text-right text-gray-400 font-mono">
                          Rp {item.harga_beli.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 text-center font-bold text-white font-mono">
                          {item.qty}
                        </td>
                        <td className="p-3 text-right pr-4 text-sky-400 font-bold font-mono">
                          Rp {item.total.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        Manifes item belanja tidak ditemukan atau log PO lama.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-[#15171c]/80 text-xs font-black text-white">
                    <td colSpan="4" className="p-2.5 text-right text-gray-400">
                      GRAND TOTAL TAGIHAN VENDOR:
                    </td>
                    <td className="p-2.5 text-right pr-4 font-mono text-sm text-sky-400">
                      Rp{" "}
                      {(hutangDitinjau.total_tagihan || 0).toLocaleString(
                        "id-ID",
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              {hutangDitinjau.status_hutang !== "Lunas" && (
                <button
                  type="button"
                  onClick={() =>
                    setHutangAkanDilunasi({
                      id: hutangDitinjau.id,
                      nomorPO: hutangDitinjau.nomor_po,
                      supplier: hutangDitinjau.supplier,
                      totalTagihan: hutangDitinjau.total_tagihan,
                    })
                  }
                  className="w-1/3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-400 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
                >
                  💸 Bayar Lunas
                </button>
              )}
              <button
                type="button"
                onClick={() => setHutangDitinjau(null)}
                className={`bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm ${hutangDitinjau.status_hutang === "Lunas" ? "w-full" : "w-2/3"}`}
              >
                Tutup Peninjauan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ANTREAN PROSES */}
      {hutangAkanDiproses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-blue-500/30 rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Ajukan Antrean Kas Keluar?
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Tagihan dokumen{" "}
              <span className="font-mono text-blue-400 font-bold">
                "{hutangAkanDiproses.nomorPO}"
              </span>{" "}
              akan ditandai sedang dalam antrean proses verifikasi/pengeluaran
              dana akunting perusahaan Solution Indonesia.
            </p>
            <div className="flex gap-2 pt-2 text-xs select-none">
              <button
                type="button"
                onClick={() => setHutangAkanDiproses(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2 rounded-lg font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEksekusiProcess}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold shadow-lg transition-all"
              >
                Ya, Proses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIMPAN LUNAS */}
      {hutangAkanDilunasi && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1c23] border border-amber-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-2 text-amber-500">
              <span className="text-xl">⚠️</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Perhatian Pembayaran Hutang!
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Anda akan mengunci transaksi pembelian{" "}
              <span className="font-mono font-bold text-white">
                "{hutangAkanDilunasi.nomorPO}"
              </span>{" "}
              kepada supplier{" "}
              <span className="text-white font-bold">
                {hutangAkanDilunasi.supplier}
              </span>{" "}
              menjadi{" "}
              <span className="text-emerald-400 font-bold">LUNAS MUTLAK</span>.
            </div>

            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800 font-medium">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Tagihan Supplier:</span>
                <span className="text-gray-300 font-bold">
                  Rp {hutangAkanDilunasi.totalTagihan.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800/60 pt-2 font-bold">
                <span className="text-gray-500">Uang Keluar Terbayar:</span>
                <span className="text-emerald-400 font-mono text-[13px] font-black">
                  Rp {hutangAkanDilunasi.totalTagihan.toLocaleString("id-ID")}{" "}
                  (Full)
                </span>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 italic leading-relaxed">
              * Pastikan bukti transfer bank atau slip pencatatan kas keluar
              perusahaan sudah sukses divalidasi ke pihak supplier sebelum
              menekan tombol simpan lunas.
            </p>

            <div className="flex gap-3 pt-2 text-xs select-none">
              <button
                type="button"
                onClick={() => setHutangAkanDilunasi(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Batal / Cek Kembali
              </button>
              <button
                type="button"
                onClick={handleEksekusiPelunasanFull}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold shadow-lg transition-all"
              >
                Ya, Simpan Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
