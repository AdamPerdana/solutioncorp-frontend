import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { apiRequest } from "../../api";
import "react-toastify/dist/ReactToastify.css";

export default function Piutang() {
  // ==========================================================
  // [ COMPONENT STATE MANAGEMENT & INITIALIZATION ]
  // ==========================================================

  const [daftarPiutang, setDaftarPiutang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [piutangAkanDilunasi, setPiutangAkanDilunasi] = useState(null);
  const [invoiceDitinjau, setInvoiceDitinjau] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ==========================================================
  // [ DATA FETCHING (INTEGRASI DJANGO API WITH JWT AUTHORIZATION) ]
  // ==========================================================

  useEffect(() => {
    fetchPiutangDariBackend();
  }, []);

  const fetchPiutangDariBackend = async () => {
    try {
      const data = await apiRequest("/api/finance/piutang/");
      if (data) {
        const dataDipetakan = data.map((item) => ({
          id: item.id,
          nomorInvoice: item.nomor_invoice,
          pelanggan: item.pelanggan,
          tanggalTransaksi: item.tanggal_transaksi,
          jatuhTempo: item.jatuh_tempo,
          totalTagihan: item.total_tagihan,
          sisaPiutang: item.sisa_piutang,
          statusPiutang: item.status_piutang,
        }));
        setDaftarPiutang(dataDipetakan);
      }
    } catch (error) {
      console.error("Error Fetching Piutang:", error);
      alert("Koneksi data piutang ke server Django terputus!");
    } finally {
      setLoading(false);
    }
  };

  const handleBukaRincianDokumen = async (id) => {
    setLoadingDetail(true);
    try {
      const data = await apiRequest(`/api/finance/piutang/${id}/`);
      if (data) {
        setInvoiceDitinjau(data);
      }
    } catch (error) {
      console.error("Error detail piutang:", error);
      alert("Gagal memuat rincian item dari server");
    } finally {
      setLoadingDetail(false);
    }
  };

  // ==========================================================
  // [ MUTATION (PERUBAHAN PELUNASAN WITH JWT AUTHORIZATION) ]
  // ==========================================================

  const handleEksekusiPelunasanFull = async () => {
    if (!piutangAkanDilunasi) return;

    const payload = {
      nomor_invoice: piutangAkanDilunasi.nomorInvoice,
      pelanggan: piutangAkanDilunasi.pelanggan,
      tanggal_transaksi: piutangAkanDilunasi.tanggalTransaksi,
      jatuh_tempo: piutangAkanDilunasi.jatuhTempo,
      total_tagihan: piutangAkanDilunasi.totalTagihan,
      sisa_piutang: 0,
      status_piutang: "Lunas",
    };

    try {
      const dataTerupdate = await apiRequest(
        `/api/finance/piutang/${piutangAkanDilunasi.id}/`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      if (dataTerupdate) {
        setDaftarPiutang((prevList) =>
          prevList.map((item) =>
            item.id === piutangAkanDilunasi.id
              ? {
                  ...item,
                  sisaPiutang: dataTerupdate.sisa_piutang,
                  statusPiutang: dataTerupdate.status_piutang,
                }
              : item,
          ),
        );
        setPiutangAkanDilunasi(null);
      }
    } catch (error) {
      console.error("Error Pelunasan Piutang:", error);
      alert("Gagal memproses pelunasan di server");
    }
  };

  // ==========================================================
  // [ CALCULATION & FILTERING ]
  // ==========================================================

  const totalPiutangBeredar = daftarPiutang.reduce(
    (sum, item) =>
      sum + (item.statusPiutang !== "Lunas" ? item.sisaPiutang : 0),
    0,
  );

  const totalOverdue = daftarPiutang.reduce(
    (sum, item) =>
      sum + (item.statusPiutang === "Jatuh Tempo" ? item.sisaPiutang : 0),
    0,
  );

  const filteredData = daftarPiutang.filter((item) => {
    const cocokNama =
      item.pelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nomorInvoice.toLowerCase().includes(searchTerm.toLowerCase());

    const cocokStatus =
      filterStatus === "Semua" || item.statusPiutang === filterStatus;

    return cocokNama && cocokStatus;
  });

  return (
    <div className="p-6 min-h-screen bg-[#15171c] text-gray-300 flex flex-col">
      <ToastContainer theme="dark" />

      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Piutang Dagang Usaha
        </h2>
      </div>

      {/* METRIK SUMMARY BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Piutang Aktif
          </p>
          <p className="text-xl font-black text-amber-400 mt-1">
            Rp {totalPiutangBeredar.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Jatuh Tempo
          </p>
          <p className="text-xl font-black text-red-500 mt-1">
            Rp {totalOverdue.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Total Invoice Pending
          </p>
          <p className="text-xl font-black text-white mt-1">
            {daftarPiutang.filter((i) => i.statusPiutang !== "Lunas").length}{" "}
            Dokumen
          </p>
        </div>
      </div>

      {/* FILTER PENCARIAN */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari Invoice atau Nama Toko/Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#15171c] border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2 text-xs">
          {["Semua", "Belum Lunas", "Jatuh Tempo", "Lunas"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                filterStatus === status
                  ? "bg-amber-950/20 border-amber-500 text-amber-400"
                  : "bg-[#15171c] border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABEL DATA PIUTANG */}
      <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 uppercase tracking-wider font-semibold select-none">
                <th className="p-4">No. Invoice</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Tgl Nota</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-center">Total Tagihan</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-amber-400 font-semibold bg-[#1a1c23]"
                  >
                    🔄 Menyelaraskan sisa piutang usaha dengan server Django...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-gray-500 font-medium"
                  >
                    Tidak ada data transaksi piutang usaha yang cocok.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#20232c] transition-colors cursor-pointer"
                    onClick={() => handleBukaRincianDokumen(item.id)}
                  >
                    <td className="p-4 font-mono font-bold text-amber-500">
                      {item.nomorInvoice}
                    </td>
                    <td className="p-4 font-semibold text-gray-200">
                      {item.pelanggan}
                    </td>
                    <td className="p-4 text-gray-400">
                      {item.tanggalTransaksi}
                    </td>
                    <td
                      className={`p-4 font-medium ${item.statusPiutang === "Jatuh Tempo" ? "text-red-400" : "text-gray-400"}`}
                    >
                      {item.jatuhTempo}
                    </td>
                    <td className="p-4 text-center text-gray-300 font-semibold">
                      Rp {item.totalTagihan.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.statusPiutang === "Lunas"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                            : item.statusPiutang === "Jatuh Tempo"
                              ? "bg-red-950 text-red-400 border border-red-900"
                              : "bg-amber-950 text-amber-400 border border-amber-900"
                        }`}
                      >
                        {item.statusPiutang === "Lunas"
                          ? "✅ Lunas"
                          : item.statusPiutang}
                      </span>
                    </td>
                    <td
                      className="p-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-3">
                        {item.statusPiutang !== "Lunas" ? (
                          <button
                            type="button"
                            onClick={() => setPiutangAkanDilunasi(item)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[11px] transition-all active:scale-95 shadow-md shadow-emerald-950/20"
                          >
                            💸 Set lunas
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[11px] font-medium">
                            Lunas
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="text-amber-400 font-bold text-xs">
            🔄 Memuat rincian berkas dari gudang...
          </div>
        </div>
      )}

      {/* MODAL POPUP RINCIAN */}
      {invoiceDitinjau && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl w-full max-w-2xl p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => setInvoiceDitinjau(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors font-bold text-sm"
            >
              ✕
            </button>
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">
                Rincian Dokumen Item Invoice Jual
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                No Ref: {invoiceDitinjau.nomor_invoice} | Tanggal:{" "}
                {invoiceDitinjau.tanggal_transaksi}
              </p>
            </div>
            <div className="bg-[#15171c]/60 border border-gray-800/80 rounded-xl p-3.5 text-xs space-y-2">
              <div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Customer / Toko Pembeli:
                </p>
                <p className="text-white font-black text-sm mt-0.5">
                  {invoiceDitinjau.pelanggan}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/40">
                <p className="text-[10px] text-gray-500 font-medium">
                  Alamat Tujuan Pengiriman:
                </p>
                <p className="text-gray-300 font-bold mt-0.5">
                  {invoiceDitinjau.alamat || "Jakarta"}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800/40 flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-gray-500">Metode Jual:</span>
                  <span className="text-amber-400 font-black ml-1.5">
                    {invoiceDitinjau.status_piutang === "Lunas"
                      ? "LUNAS"
                      : "TEMPO / KREDIT (Belum Lunas)"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Biaya Kirim:</span>
                  <span className="text-emerald-400 font-mono font-bold ml-1.5">
                    Rp 0
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-800/50 max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 text-[10px] font-bold">
                    <th className="p-3 pl-4 w-[15%]">SKU</th>
                    <th className="p-3 w-[45%]">
                      Deskripsi Varian Produk Terjual
                    </th>
                    <th className="p-3 text-right w-[15%]">Harga Jual</th>
                    <th className="p-3 text-center w-[10%]">Qty</th>
                    <th className="p-3 text-right pr-4 w-[15%]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 font-medium text-xs">
                  {invoiceDitinjau.items && invoiceDitinjau.items.length > 0 ? (
                    invoiceDitinjau.items.map((item, idx) => (
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
                          Rp {item.harga.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-bold text-white font-mono">
                          {item.qty}
                        </td>
                        <td className="p-3 text-right pr-4 text-sky-400 font-bold font-mono">
                          Rp {item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        Item tidak ditemukan atau nota lama.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-[#15171c]/80 text-xs font-black text-white">
                    <td colSpan="4" className="p-2.5 text-right text-gray-400">
                      GRAND TOTAL NOTA MASUK:
                    </td>
                    <td className="p-2.5 text-right pr-4 font-mono text-sm text-sky-400">
                      Rp{" "}
                      {invoiceDitinjau.total_tagihan
                        ? invoiceDitinjau.total_tagihan.toLocaleString()
                        : (
                            invoiceDitinjau.total_merchandise || 0
                          ).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceDitinjau(null)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                Tutup Peninjauan Berkas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION: PELUNASAN */}
      {piutangAkanDilunasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-amber-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-500">
              <span className="text-xl">⚠️</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Perhatian Sebelum Menyimpan!
              </h3>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Anda akan merubah status nota{" "}
              <span className="font-mono font-bold text-white">
                "{piutangAkanDilunasi.nomorInvoice}"
              </span>{" "}
              milik{" "}
              <span className="text-white font-bold">
                {piutangAkanDilunasi.pelanggan}
              </span>{" "}
              menjadi <span className="text-emerald-400 font-bold">LUNAS</span>{" "}
              secara penuh.
            </div>
            <div className="bg-[#15171c] p-3.5 rounded-lg space-y-2 text-xs border border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">Nilai Tagihan Hutang:</span>
                <span className="text-gray-300 font-bold">
                  Rp {piutangAkanDilunasi.totalTagihan.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800/60 pt-2 font-bold">
                <span className="text-gray-500">Jumlah Uang Diterima:</span>
                <span className="text-emerald-400 text-sm">
                  Rp {piutangAkanDilunasi.sisaPiutang.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 italic">
              * Pastikan dana transfer bank atau kas fisik tunai sudah
              benar-benar masuk ke rekening PT Solution Corp Indonesia sebelum
              menekan tombol simpan.
            </p>
            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setPiutangAkanDilunasi(null)}
                className="flex-1 bg-[#242731] hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-bold transition-all"
              >
                Kembali / Batal
              </button>
              <button
                type="button"
                onClick={handleEksekusiPelunasanFull}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-emerald-950/20"
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
