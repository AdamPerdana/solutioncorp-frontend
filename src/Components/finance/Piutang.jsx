import React, { useState } from "react";

export default function Piutang() {
  // 1. Data Piutang otomatis dari POS
  const [daftarPiutang, setDaftarPiutang] = useState([
    {
      id: 1,
      nomorInvoice: "POS-20260608-001",
      pelanggan: "CV. Victoria Indo Pratama",
      tanggalTransaksi: "2026-06-08",
      jatuhTempo: "2026-06-22",
      totalTagihan: 28000000,
      sisaPiutang: 28000000,
      statusPiutang: "Belum Lunas",
    },
    {
      id: 2,
      nomorInvoice: "POS-20260605-012",
      pelanggan: "PT. Jaya Sukses Mandiri",
      tanggalTransaksi: "2026-06-05",
      jatuhTempo: "2026-06-19",
      totalTagihan: 15400000,
      sisaPiutang: 15400000,
      statusPiutang: "Belum Lunas",
    },
    {
      id: 3,
      nomorInvoice: "POS-20260520-045",
      pelanggan: "Hotel Nusantara Jakarta",
      tanggalTransaksi: "2026-05-20",
      jatuhTempo: "2026-06-03", // Sudah lewat tanggal, otomatis masuk alarm penagihan
      totalTagihan: 8500000,
      sisaPiutang: 8500000,
      statusPiutang: "Jatuh Tempo",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  const [piutangAkanDilunasi, setPiutangAkanDilunasi] = useState(null);

  const handleEksekusiPelunasanFull = () => {
    if (!piutangAkanDilunasi) return;

    setDaftarPiutang((prevList) =>
      prevList.map((item) => {
        if (item.id === piutangAkanDilunasi.id) {
          return {
            ...item,
            sisaPiutang: 0, // Langsung habis terbayar full
            statusPiutang: "Lunas", // Status berganti mutlak jadi Lunas
          };
        }
        return item;
      }),
    );

    setPiutangAkanDilunasi(null);
  };

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
      {/* HEADER HALAMAN */}
      <div className="pb-4 border-b border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Buku Piutang Usaha
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Mencatat tagihan tempo dari kasir. Sistem pembayaran mutlak lunas full
          tanpa cicilan.
        </p>
      </div>

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
            Macet / Jatuh Tempo
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
              <tr className="bg-[#15171c] text-gray-400 border-b border-gray-800 uppercase tracking-wider font-semibold">
                <th className="p-4">No. Invoice</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Tgl Nota</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-right">Total Tagihan</th>
                <th className="p-4 text-right">Sisa Piutang</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi Pembaruan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="p-8 text-center text-gray-500 font-medium"
                  >
                    Tidak ada data transaksi piutang usaha yang cocok.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#20232c] transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-white">
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
                    <td className="p-4 text-right text-gray-300 font-semibold">
                      Rp {item.totalTagihan.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-amber-400">
                      Rp {item.sisaPiutang.toLocaleString()}
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
                    <td className="p-4 text-center">
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
                          Lunas Terbayar
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {piutangAkanDilunasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1c23] border border-amber-500/30 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            {/* Ikon dan Judul Perhatian */}
            <div className="flex items-center space-x-2 text-amber-500">
              <span className="text-xl">⚠️</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Perhatian Sebelum Menyimpan!
              </h3>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed border-b border-gray-800 pb-3">
              Anda akan merubah status nota{" "}
              <span className="font-mono font-bold text-white">
                {piutangAkanDilunasi.nomorInvoice}
              </span>{" "}
              milik
              <span className="text-white font-bold">
                {" "}
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

            {/* Warning */}
            <p className="text-[10px] text-gray-500 italic">
              * Pastikan dana transfer bank atau kas fisik tunai sudah
              benar-benar masuk ke rekening PT Solution Corp Indonesia sebelum
              menekan tombol simpan. Tindakan ini tidak dapat dibatalkan secara
              sepihak.
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
